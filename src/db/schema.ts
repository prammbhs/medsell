import { pgTable, uuid, varchar, text, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";

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
