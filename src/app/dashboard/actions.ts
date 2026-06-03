"use server";

import { auth } from '@/auth';
import { db } from '@/db';
import { products, orders, orderItems } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { orderSchema } from '@/lib/validations';
import { convertToBaseUnit } from '@/lib/conversions';
import { revalidatePath } from 'next/cache';

export async function placeOrder(cartData: any) {
  const session = await auth();
  if (!session?.user || !session.user.id) {
    return { error: 'Unauthorized. Please login to place an order.' };
  }

  const userId = session.user.id;

  const validated = orderSchema.safeParse(cartData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { items } = validated.data;

  try {
    // Run order creation in a database transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      let totalAmount = 0;
      const resolvedItems = [];

      for (const item of items) {
        // Fetch product with row lock if possible (or standard select in transaction)
        const productRes = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        
        const product = productRes[0];
        if (!product) {
          throw new Error(`Product not found.`);
        }

        const orderedBaseQty = convertToBaseUnit(item.quantity, item.unit);
        const currentBaseQty = parseFloat(product.totalQuantity);

        if (currentBaseQty < orderedBaseQty) {
          throw new Error(`Insufficient stock for "${product.name}". Available: ${currentBaseQty} base units, requested: ${orderedBaseQty}.`);
        }

        // Deduct stock
        const newBaseQty = (currentBaseQty - orderedBaseQty).toString();
        await tx
          .update(products)
          .set({ totalQuantity: newBaseQty })
          .where(eq(products.id, product.id));

        const pricePerBase = parseFloat(product.pricePerBaseUnit);
        const itemCost = orderedBaseQty * pricePerBase;
        totalAmount += itemCost;

        resolvedItems.push({
          productId: product.id,
          quantity: orderedBaseQty.toString(),
          priceAtTime: product.pricePerBaseUnit, // Save current base unit price
        });
      }

      // Create Order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId,
          status: 'PENDING',
          totalAmount: totalAmount.toString(),
        })
        .returning();

      // Create Order Items
      const orderItemsToInsert = resolvedItems.map((item) => ({
        orderId: newOrder.id,
        productId: item.productId,
        quantity: item.quantity,
        priceAtTime: item.priceAtTime,
      }));

      await tx.insert(orderItems).values(orderItemsToInsert);

      return { orderId: newOrder.id };
    });

    revalidatePath('/dashboard');
    revalidatePath('/admin/products');
    return { success: true, orderId: result.orderId };
  } catch (error: any) {
    console.error(error);
    return { error: error.message || 'Failed to place order.' };
  }
}
