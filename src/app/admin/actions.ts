"use server";

import { auth } from '@/auth';
import { db } from '@/db';
import { products, orders } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { productSchema } from '@/lib/validations';
import { convertToBaseUnit, calculatePricePerBaseUnit } from '@/lib/conversions';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized. Admin access required.');
  }
}

export async function createProduct(formData: any) {
  await requireAdmin();

  const validated = productSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { name, sku, description, dimensionType, totalQuantity, pricePerBaseUnit, unit } = validated.data;

  // Convert quantity and price to base units
  const baseQuantity = convertToBaseUnit(totalQuantity, unit).toString();
  const basePrice = calculatePricePerBaseUnit(pricePerBaseUnit, unit).toString();

  try {
    await db.insert(products).values({
      name,
      sku,
      description: description || null,
      dimensionType,
      totalQuantity: baseQuantity,
      pricePerBaseUnit: basePrice,
    });

    revalidatePath('/admin/products');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error(error);
    if (error.code === '23505' || error.message?.includes('sku')) {
      return { error: 'A product with this SKU already exists.' };
    }
    return { error: error.message || 'Failed to create product' };
  }
}

export async function updateProduct(id: string, formData: any) {
  await requireAdmin();

  const validated = productSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { name, sku, description, dimensionType, totalQuantity, pricePerBaseUnit, unit } = validated.data;

  // Convert quantity and price to base units
  const baseQuantity = convertToBaseUnit(totalQuantity, unit).toString();
  const basePrice = calculatePricePerBaseUnit(pricePerBaseUnit, unit).toString();

  try {
    await db.update(products).set({
      name,
      sku,
      description: description || null,
      dimensionType,
      totalQuantity: baseQuantity,
      pricePerBaseUnit: basePrice,
      updatedAt: new Date(),
    }).where(eq(products.id, id));

    revalidatePath('/admin/products');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error(error);
    if (error.code === '23505' || error.message?.includes('sku')) {
      return { error: 'A product with this SKU already exists.' };
    }
    return { error: error.message || 'Failed to update product' };
  }
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  try {
    await db.delete(products).where(eq(products.id, id));

    revalidatePath('/admin/products');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { error: error.message || 'Failed to delete product' };
  }
}

export async function updateOrderStatus(orderId: string, status: 'PENDING' | 'COMPLETED' | 'CANCELLED') {
  await requireAdmin();

  try {
    await db.update(orders).set({
      status,
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId));

    revalidatePath('/dashboard/orders');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: any) {
    console.error(error);
    return { error: error.message || 'Failed to update order status' };
  }
}
