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

  const {
    name, sku, description, dimensionType, totalQuantity, pricePerBaseUnit, unit,
    category, manufacturer, strength, packSize, baseUnit, wholesalePrice, gstRate,
    maxDiscount, lowStockThreshold, status, prescriptionRequired, controlledSubstance,
    coldChainRequired, hsnCode, drugSchedule, trackExpiry
  } = validated.data;

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
      
      category: category || null,
      manufacturer: manufacturer || null,
      strength: strength || null,
      packSize: packSize ? packSize.toString() : null,
      baseUnit: baseUnit || null,
      wholesalePrice: wholesalePrice ? wholesalePrice.toString() : null,
      gstRate: gstRate ? gstRate.toString() : null,
      maxDiscount: maxDiscount ? maxDiscount.toString() : null,
      lowStockThreshold: lowStockThreshold ? lowStockThreshold.toString() : null,
      status: status || 'Active',
      prescriptionRequired: prescriptionRequired || false,
      controlledSubstance: controlledSubstance || false,
      coldChainRequired: coldChainRequired || false,
      hsnCode: hsnCode || null,
      drugSchedule: drugSchedule || null,
      trackExpiry: trackExpiry || false,
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

  const {
    name, sku, description, dimensionType, totalQuantity, pricePerBaseUnit, unit,
    category, manufacturer, strength, packSize, baseUnit, wholesalePrice, gstRate,
    maxDiscount, lowStockThreshold, status, prescriptionRequired, controlledSubstance,
    coldChainRequired, hsnCode, drugSchedule, trackExpiry
  } = validated.data;

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
      
      category: category || null,
      manufacturer: manufacturer || null,
      strength: strength || null,
      packSize: packSize ? packSize.toString() : null,
      baseUnit: baseUnit || null,
      wholesalePrice: wholesalePrice ? wholesalePrice.toString() : null,
      gstRate: gstRate ? gstRate.toString() : null,
      maxDiscount: maxDiscount ? maxDiscount.toString() : null,
      lowStockThreshold: lowStockThreshold ? lowStockThreshold.toString() : null,
      status: status || 'Active',
      prescriptionRequired: prescriptionRequired || false,
      controlledSubstance: controlledSubstance || false,
      coldChainRequired: coldChainRequired || false,
      hsnCode: hsnCode || null,
      drugSchedule: drugSchedule || null,
      trackExpiry: trackExpiry || false,
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
