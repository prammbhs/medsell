import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

export const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().min(1, 'SKU is required').max(100).regex(/^[a-zA-Z0-9-_]+$/, 'SKU must contain only letters, numbers, dashes, and underscores'),
  description: z.string().optional().or(z.literal('')),
  dimensionType: z.enum(['WEIGHT', 'VOLUME', 'COUNT']),
  // We accept positive decimal values for quantity and price
  totalQuantity: z.coerce.number().positive('Quantity must be greater than 0'),
  pricePerBaseUnit: z.coerce.number().positive('Price must be greater than 0'),
  unit: z.enum(['g', 'kg', 'mL', 'L', 'items']),
});

export const orderItemSchema = z.object({
  productId: z.string().uuid('Invalid product selected'),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unit: z.enum(['g', 'kg', 'mL', 'L', 'items']),
});

export const orderSchema = z.object({
  items: z.array(orderItemSchema).min(1, 'Order must contain at least one item'),
});
