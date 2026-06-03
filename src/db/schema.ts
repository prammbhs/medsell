import { pgTable, uuid, varchar, text, numeric, timestamp, pgEnum, boolean } from "drizzle-orm/pg-core";


export const roleEnum = pgEnum('role', ['ADMIN', 'SELLER', 'BUYER']);
export const dimensionEnum = pgEnum('dimensionType', ['WEIGHT', 'VOLUME', 'COUNT']);
export const orderStatusEnum = pgEnum('status', ['PENDING', 'COMPLETED', 'CANCELLED']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  passwordHash: text('passwordHash').notNull(),
  role: roleEnum('role').default('BUYER').notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const products = pgTable('products', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  sku: varchar('sku', { length: 100 }).unique().notNull(),
  description: text('description'),
  dimensionType: dimensionEnum('dimensionType').notNull(),
  totalQuantity: numeric('totalQuantity', { precision: 20, scale: 6 }).default('0').notNull(),
  pricePerBaseUnit: numeric('pricePerBaseUnit', { precision: 19, scale: 4 }).notNull(),

  category: varchar('category', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 255 }),
  strength: varchar('strength', { length: 100 }),
  packSize: numeric('packSize', { precision: 10, scale: 2 }),
  baseUnit: varchar('baseUnit', { length: 50 }),
  wholesalePrice: numeric('wholesalePrice', { precision: 19, scale: 4 }),
  gstRate: numeric('gstRate', { precision: 5, scale: 2 }),
  maxDiscount: numeric('maxDiscount', { precision: 5, scale: 2 }),
  lowStockThreshold: numeric('lowStockThreshold', { precision: 20, scale: 6 }),
  status: varchar('status', { length: 50 }).default('Active'),
  prescriptionRequired: boolean('prescriptionRequired').default(false),
  controlledSubstance: boolean('controlledSubstance').default(false),
  coldChainRequired: boolean('coldChainRequired').default(false),
  hsnCode: varchar('hsnCode', { length: 50 }),
  drugSchedule: varchar('drugSchedule', { length: 100 }),
  trackExpiry: boolean('trackExpiry').default(false),

  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('userId').references(() => users.id).notNull(),
  status: orderStatusEnum('status').default('PENDING').notNull(),
  totalAmount: numeric('totalAmount', { precision: 19, scale: 4 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow(),
  updatedAt: timestamp('updatedAt').defaultNow(),
});

export const orderItems = pgTable('orderItems', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('orderId').references(() => orders.id).notNull(),
  productId: uuid('productId').references(() => products.id).notNull(),
  quantity: numeric('quantity', { precision: 20, scale: 6 }).notNull(),
  priceAtTime: numeric('priceAtTime', { precision: 19, scale: 4 }).notNull(),
});
