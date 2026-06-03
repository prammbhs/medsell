<div align="center">

# Medsell

### Pharmaceutical Inventory & Order Management System

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178c6?style=flat-square&logo=typescript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-00e599?style=flat-square&logo=postgresql)
![Drizzle ORM](https://img.shields.io/badge/ORM-Drizzle-c5f74f?style=flat-square)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss)
![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)

A role-based, full-stack inventory and order management platform designed for pharmaceutical distributors. Built to demonstrate production-grade thinking: type-safe database access, unit-normalized inventory, NUMERIC precision pricing, and server-side authorization — all deployed serverlessly.

</div>

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Features](#2-features)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [Unit Storage & Conversion Strategy](#6-unit-storage--conversion-strategy)
7. [Pricing & Precision Strategy](#7-pricing--precision-strategy)
8. [Search & Ordering Flow](#8-search--ordering-flow)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Server Actions & API Routes](#10-server-actions--api-routes)
11. [Environment Variables](#11-environment-variables)
12. [Local Setup](#12-local-setup)
13. [Deployment](#13-deployment)
14. [Test Credentials](#14-test-credentials)
15. [Assumptions & Design Decisions](#15-assumptions--design-decisions)
16. [Future Improvements](#16-future-improvements)
17. [Conclusion](#17-conclusion)

---

## 1. Project Overview

Medsell is a multi-role inventory and order management system built for pharmaceutical supply chains. Distributors (Admins) manage product catalogues and fulfill orders; sellers and buyers browse the catalogue, configure quantities in their preferred units, and place orders that are queued for admin review.

The core challenge this system addresses is **unit heterogeneity** — pharmaceutical products are sold in grams, kilograms, milliliters, liters, or discrete counts, with prices quoted at various granularities. Medsell solves this by normalizing all inventory and pricing to a **single base unit per dimension type** at the persistence layer, performing conversions transparently at the UI boundary.

### Workflow

```
Admin creates product (sets base unit price, total stock in base units)
        ↓
Seller browses catalogue → searches/filters → selects quantity + preferred unit
        ↓
System converts requested quantity to base units → calculates cost
        ↓
Seller places order → inventory is reserved atomically
        ↓
Admin reviews order → marks COMPLETED or CANCELLED
        ↓
Inventory is deducted on order completion
```

### User Roles

| Role   | Capabilities                                                                 |
|--------|------------------------------------------------------------------------------|
| ADMIN  | Full product CRUD, inventory control, view and manage all orders, dashboard  |
| SELLER | Browse catalogue, search/filter, place orders, view own order history        |
| BUYER  | Same as SELLER (extensible to buyer-specific workflows)                      |

---

## 2. Features

| Feature                  | Details                                                                                       |
|--------------------------|-----------------------------------------------------------------------------------------------|
| **Authentication**       | Credential-based login via NextAuth.js v5, JWT sessions, bcrypt password hashing             |
| **RBAC**                 | Server-side role enforcement on every action and page; middleware protects all dashboard routes |
| **Product Management**   | Full CRUD with pharmaceutical metadata: strength, pack size, HSN code, drug schedule, GST rate, regulatory flags |
| **Search & Filter**      | Client-side real-time search by name/SKU, dimension-type filter (WEIGHT / VOLUME / COUNT)     |
| **Unit-Aware Ordering**  | Sellers select preferred display unit (g/kg, mL/L, items); system converts to base units before persistence |
| **Pricing Calculations** | Price derived from `pricePerBaseUnit` × converted quantity; computed server-side with NUMERIC precision |
| **Order Management**     | Sellers place orders with line items; Admins transition status (PENDING → COMPLETED / CANCELLED) |
| **Admin Dashboard**      | Live KPI cards (revenue, order count, product count), order status donut, low-stock alerts, top-selling products |
| **Inventory Tracking**   | Stock stored in base units; low-stock threshold alerts; per-product expiry tracking flag      |
| **Collapsible Sidebar**  | Persistent collapse state (localStorage), role-aware navigation, avatar-triggered settings modal |

---

## 3. Tech Stack

| Layer          | Technology                              | Rationale                                                       |
|----------------|-----------------------------------------|-----------------------------------------------------------------|
| **Framework**  | Next.js 16 (App Router, Turbopack)      | RSC for data-heavy pages; Server Actions eliminate REST boilerplate |
| **Language**   | TypeScript 5.x                          | End-to-end type safety from DB schema to UI props               |
| **Database**   | Neon PostgreSQL (serverless)            | Serverless-compatible, scales to zero, HTTP-based driver        |
| **ORM**        | Drizzle ORM                             | Type-safe queries, zero runtime overhead, SQL-first design      |
| **Auth**       | NextAuth.js v5                          | Session management with JWT; Credentials provider for DB login  |
| **Styling**    | Tailwind CSS v4                         | Utility-first, dark-mode monochrome palette with semantic accents |
| **Validation** | Zod                                     | Schema-first runtime validation on all server action inputs     |
| **Deployment** | Vercel                                  | Zero-config Next.js deployment, edge middleware support         |
| **Passwords**  | bcryptjs                                | Adaptive cost factor hashing for credential storage             |

---

## 4. System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          Client (Browser)                        │
│  React Server Components + Client Components (use client)        │
│  Tailwind CSS UI ─── Next.js App Router ─── NextAuth Session    │
└───────────────────────────┬─────────────────────────────────────┘
                            │ HTTPS
┌───────────────────────────▼─────────────────────────────────────┐
│                     Next.js Runtime (Vercel)                     │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ RSC (Server) │  │ Server Acts  │  │  API Routes          │  │
│  │  layout.tsx  │  │ actions.ts   │  │  /api/auth           │  │
│  │  page.tsx    │  │ (Zod + RBAC) │  │  /api/seed           │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                       │              │
│  ┌──────▼─────────────────▼───────────────────────▼──────────┐  │
│  │                   Drizzle ORM Layer                        │  │
│  │        Type-safe queries + schema definitions              │  │
│  └────────────────────────┬───────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────┘
                            │ @neondatabase/serverless (WebSocket)
┌───────────────────────────▼─────────────────────────────────────┐
│                     Neon PostgreSQL                              │
│         users │ products │ orders │ orderItems                  │
└─────────────────────────────────────────────────────────────────┘
```

### Request Lifecycle

**Page render (RSC):**
```
Request → Middleware (auth check) → RSC Page → Drizzle query → DB → Rendered HTML
```

**Mutation (Server Action):**
```
Form submit → Server Action → auth() session check → Zod validation → Drizzle mutation → revalidatePath()
```

**Authentication:**
```
POST /api/auth/signin → NextAuth Credentials → bcrypt.compare() → JWT session → httpOnly cookie
```

---

## 5. Database Schema

### Entity Relationship Overview

```
users ──< orders ──< orderItems >── products
```

A `user` can have many `orders`. Each `order` contains one or more `orderItems`. Each `orderItem` references a `product` and records the quantity and price at the time of purchase (snapshot pricing).

### `users`

| Column         | Type                           | Notes                          |
|----------------|--------------------------------|--------------------------------|
| `id`           | `uuid` PRIMARY KEY             | Auto-generated UUID            |
| `email`        | `varchar(255)` UNIQUE NOT NULL | Login identifier               |
| `passwordHash` | `text` NOT NULL                | bcrypt hash (cost factor 10)   |
| `role`         | `enum(ADMIN, SELLER, BUYER)`   | Role-based access control      |
| `createdAt`    | `timestamp`                    | Auto `defaultNow()`            |
| `updatedAt`    | `timestamp`                    | Auto `defaultNow()`            |

### `products`

| Column                | Type                              | Notes                                     |
|-----------------------|-----------------------------------|-------------------------------------------|
| `id`                  | `uuid` PRIMARY KEY                |                                           |
| `name`                | `varchar(255)` NOT NULL           |                                           |
| `sku`                 | `varchar(100)` UNIQUE NOT NULL    | Stock Keeping Unit                        |
| `dimensionType`       | `enum(WEIGHT, VOLUME, COUNT)`     | Determines base unit                      |
| `totalQuantity`       | `numeric(20,6)` NOT NULL          | Stored in base units (g / mL / items)     |
| `pricePerBaseUnit`    | `numeric(19,4)` NOT NULL          | Price per gram / mL / item in INR         |
| `category`            | `varchar(100)`                    | Therapeutic category                      |
| `strength`            | `varchar(100)`                    | e.g. "500mg", "100 IU/mL"                |
| `packSize`            | `numeric(10,2)`                   | Units per standard pack                   |
| `wholesalePrice`      | `numeric(19,4)`                   | Bulk pricing override                     |
| `gstRate`             | `numeric(5,2)`                    | GST percentage applicable                 |
| `hsnCode`             | `varchar(50)`                     | Indian Harmonised System of Nomenclature  |
| `drugSchedule`        | `varchar(100)`                    | e.g. "Schedule H", "None / OTC"           |
| `prescriptionRequired`| `boolean`                         |                                           |
| `controlledSubstance` | `boolean`                         |                                           |
| `coldChainRequired`   | `boolean`                         |                                           |
| `lowStockThreshold`   | `numeric(20,6)`                   | Alert threshold in base units             |

### `orders`

| Column        | Type                                  | Notes                         |
|---------------|---------------------------------------|-------------------------------|
| `id`          | `uuid` PRIMARY KEY                    |                               |
| `userId`      | `uuid` FK → `users.id` NOT NULL       | Order owner                   |
| `status`      | `enum(PENDING, COMPLETED, CANCELLED)` | Admin-controlled lifecycle    |
| `totalAmount` | `numeric(19,4)` NOT NULL              | Sum of all line item costs    |

### `orderItems`

| Column        | Type                          | Notes                                                         |
|---------------|-------------------------------|---------------------------------------------------------------|
| `id`          | `uuid` PRIMARY KEY            |                                                               |
| `orderId`     | `uuid` FK → `orders.id`       |                                                               |
| `productId`   | `uuid` FK → `products.id`     |                                                               |
| `quantity`    | `numeric(20,6)` NOT NULL      | Stored in base units at order time (immutable snapshot)       |
| `priceAtTime` | `numeric(19,4)` NOT NULL      | `pricePerBaseUnit` snapshot — preserves historical accuracy   |

> **Snapshot pricing**: `priceAtTime` is copied from `pricePerBaseUnit` at order creation. This ensures order history remains accurate even if the product price is updated later.

---

## 6. Unit Storage & Conversion Strategy

### The Problem

Pharmaceutical products exist across incompatible measurement systems. A product might be stocked in kilograms but sold in grams, or stored in liters but ordered in milliliters. Storing quantities in user-selected display units creates inconsistency and makes aggregation impossible.

### Solution: Single Base Unit Per Dimension

All quantities are stored internally in a canonical base unit determined by `dimensionType`:

| Dimension Type | Internal Base Unit | Example                         |
|----------------|--------------------|---------------------------------|
| `WEIGHT`       | **grams (g)**      | 2.5 kg → stored as `2500`      |
| `VOLUME`       | **milliliters (mL)**| 1.5 L → stored as `1500`      |
| `COUNT`        | **items**          | 100 tablets → stored as `100`  |

### Conversion Rules

```typescript
// src/lib/conversions.ts
export function convertToBaseUnit(value: number, unit: string): number {
  if (unit === 'kg')    return value * 1000;  // kg → g
  if (unit === 'L')     return value * 1000;  // L → mL
  return value;                               // g, mL, items — already base
}

export function convertFromBaseUnit(value: number, unit: string): number {
  if (unit === 'kg')    return value / 1000;
  if (unit === 'L')     return value / 1000;
  return value;
}
```

### Where Conversions Happen

| Stage               | Direction              | Location                          |
|---------------------|------------------------|-----------------------------------|
| **Order placement** | Display unit → base    | `placeOrder` Server Action        |
| **Admin input**     | Display unit → base    | `createProduct` / `updateProduct` |
| **UI display**      | Base → display unit    | `SellerDashboard` component       |
| **Quantity check**  | Both directions        | Cart validation before submit     |

### Example

A seller orders **2.5 kg** of Amoxicillin. Price is set at **₹0.0085 per gram**:

```
Requested: 2.5 kg
Converted to base: 2.5 × 1000 = 2500 g

Cost = 2500 g × ₹0.0085/g = ₹21.25

Stored in orderItems.quantity = 2500  (base unit: grams)
Stored in orderItems.priceAtTime = 0.0085
```

This approach means:
- Inventory can be summed across any unit combination
- Stock deduction is always in the same unit as stock storage
- No ambiguity in historical order records

---

## 7. Pricing & Precision Strategy

### Why PostgreSQL `NUMERIC` Instead of `FLOAT`

Floating-point types (`FLOAT`, `DOUBLE`) use binary approximations that cause rounding errors in financial calculations:

```javascript
// Floating-point error (DO NOT use for money)
0.1 + 0.2 === 0.30000000000000004  // true in JS/float arithmetic

// NUMERIC is exact decimal arithmetic
// 0.1 + 0.2 = 0.3 (guaranteed)
```

Medsell uses `NUMERIC(19,4)` for all monetary values:
- **19 significant digits** — supports amounts up to ₹999,999,999,999,999.9999
- **4 decimal places** — sub-paisa precision for per-unit pharmaceutical pricing
- **Exact arithmetic** — no floating-point drift across calculations

For quantities, `NUMERIC(20,6)` allows for sub-milligram precision where needed.

### Rounding Strategy

All rounding is deferred to display time only. Server-side calculations use full NUMERIC precision:

```typescript
// formatINR in src/lib/conversions.ts
export function formatINR(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
// Result: ₹21.25, ₹1,05,000.00, etc.
```

### Example Calculation

```
Product: Insulin Glargine
pricePerBaseUnit = ₹18.5000  (per mL)
Ordered: 3 vials × 10mL = 30 mL

Calculation (server-side, full precision):
totalAmount = 30 × 18.5000 = 555.0000

Stored: NUMERIC 555.0000
Displayed: ₹555.00
```

---

## 8. Search & Ordering Flow

### Step-by-Step Order Creation

```
1. Seller logs in → JWT session validated
        ↓
2. GET /dashboard → RSC fetches all active products from DB
        ↓
3. Client-side search: filter by name/SKU substring match
   Client-side filter: dimension type (WEIGHT / VOLUME / COUNT)
        ↓
4. Seller selects quantity (e.g. 2.5) and unit (e.g. kg)
        ↓
5. JS computes display price:
   displayQty × pricePerDisplayUnit (converted from base)
        ↓
6. Seller adds to cart → cart stored in React state (no DB write yet)
        ↓
7. Seller clicks "Place Order" → form POSTs to Server Action
        ↓
8. Server Action: placeOrder()
   ├── auth() → verify session + extract userId
   ├── Zod validates each cart item (positive qty, valid unit)
   ├── Convert all quantities to base units
   ├── Fetch live stock from DB → stock sufficiency check
   ├── Calculate totalAmount (sum of qty × priceAtTime for each item)
   ├── INSERT into orders (status=PENDING)
   ├── INSERT into orderItems (one row per cart item)
   └── revalidatePath('/dashboard/orders')
        ↓
9. Admin sees new PENDING order in dashboard
        ↓
10. Admin updates status → COMPLETED or CANCELLED
    ├── Server Action: updateOrderStatus()
    └── revalidatePath('/dashboard/orders')
```

---

## 9. Authentication & Authorization

### Roles & Permissions Matrix

| Action                       | ADMIN | SELLER | BUYER |
|------------------------------|:-----:|:------:|:-----:|
| View product catalogue       | ✓     | ✓      | ✓     |
| Place orders                 | ✓     | ✓      | ✓     |
| View own orders              | ✓     | ✓      | ✓     |
| View all orders              | ✓     | ✗      | ✗     |
| Create / Edit / Delete products | ✓  | ✗      | ✗     |
| Update order status          | ✓     | ✗      | ✗     |
| Access admin dashboard       | ✓     | ✗      | ✗     |

### Middleware (Route Protection)

Next.js Proxy middleware intercepts every request to `/dashboard` and `/admin`:

```typescript
// src/proxy.ts (next.js proxy convention)
export { auth as default } from '@/auth';
export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
```

Unauthenticated requests are redirected to `/login`. Role checks are enforced server-side inside each page and Server Action.

### Server Action Authorization Pattern

Every mutating action follows this pattern:

```typescript
async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized');
  }
}
```

This prevents privilege escalation even if client-side checks are bypassed.

### Session Handling

- Sessions are JWT-encoded, stored in an httpOnly cookie
- Custom `session` callback extends the JWT token with `role` and `id`
- Session expires per NextAuth default configuration

---

## 10. Server Actions & API Routes

### Server Actions (`'use server'`)

| Action              | File                              | Description                                         |
|---------------------|-----------------------------------|-----------------------------------------------------|
| `authenticate`      | `app/login/actions.ts`            | Validates credentials, calls `signIn()`             |
| `createProduct`     | `app/admin/actions.ts`            | Zod validation + Drizzle INSERT; admin only         |
| `updateProduct`     | `app/admin/actions.ts`            | Zod validation + Drizzle UPDATE by id; admin only   |
| `deleteProduct`     | `app/admin/actions.ts`            | Drizzle DELETE; admin only                          |
| `placeOrder`        | `app/dashboard/actions.ts`        | Cart → order + order items; any authenticated user  |
| `updateOrderStatus` | `app/admin/actions.ts`            | Status transition; admin only                       |

### API Routes

| Route                      | Method | Description                                            |
|----------------------------|--------|--------------------------------------------------------|
| `/api/auth/[...nextauth]`  | ALL    | NextAuth.js handler (signin, signout, session)         |
| `/api/seed`                | GET    | Seeds default users (dev/staging utility)              |

---

## 11. Environment Variables

Create a `.env` file in the project root:

```env
# Neon PostgreSQL connection string (include ?sslmode=require for production)
DATABASE_URL=postgresql://user:password@host/medsell?sslmode=require

# NextAuth secret — generate with: openssl rand -base64 32
AUTH_SECRET=your_random_secret_minimum_32_characters

# Your deployment URL (http://localhost:3000 for local, Vercel URL for production)
NEXTAUTH_URL=http://localhost:3000
```

> **Never commit `.env` to version control.** `.env` is already in `.gitignore`.

---

## 12. Local Setup

### Prerequisites

- Node.js 20+
- A [Neon](https://neon.tech) account (free tier) or local PostgreSQL

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/your-username/medsell.git
cd medsell

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# → Edit .env with your DATABASE_URL, AUTH_SECRET, NEXTAUTH_URL

# 4. Push schema to database (creates all tables)
npx drizzle-kit push

# 5. Seed initial users + 20 pharmaceutical products
npx tsx src/db/seed.ts

# 6. Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Available Scripts

| Command                    | Description                                  |
|----------------------------|----------------------------------------------|
| `npm run dev`              | Start dev server with Turbopack hot reload   |
| `npm run build`            | Production build (type-checks + compiles)    |
| `npm run lint`             | Run ESLint across the codebase               |
| `npx drizzle-kit push`     | Sync Drizzle schema to the connected DB      |
| `npx drizzle-kit studio`   | Launch Drizzle Studio (visual DB browser)    |
| `npx tsx src/db/seed.ts`   | Seed users and products                      |

---

## 13. Deployment

### 1. Provision Database (Neon)

1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string from the dashboard
3. Run schema migration locally pointing at Neon:
   ```bash
   DATABASE_URL=<neon_url> npx drizzle-kit push
   ```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Or connect the GitHub repository at [vercel.com/new](https://vercel.com/new) for automatic deployments on push.

### 3. Set Environment Variables in Vercel Dashboard

Navigate to **Project → Settings → Environment Variables** and add:

| Variable       | Value                               |
|----------------|-------------------------------------|
| `DATABASE_URL` | Full Neon connection string         |
| `AUTH_SECRET`  | `openssl rand -base64 32` output    |
| `NEXTAUTH_URL` | `https://your-app.vercel.app`       |

### 4. Seed Production Database

Visit `https://your-app.vercel.app/api/seed` once after deploy, or run:

```bash
DATABASE_URL=<neon_production_url> npx tsx src/db/seed.ts
```

---

## 14. Test Credentials

| Role   | Email                 | Password    | Access                          |
|--------|-----------------------|-------------|---------------------------------|
| Admin  | `admin@example.com`   | `admin123`  | Full dashboard, product + order management |
| Seller | `seller@example.com`  | `seller123` | Product catalogue, order placement + history |

> Change these credentials immediately in any shared or production environment.

---

## 15. Assumptions & Design Decisions

| Decision | Rationale |
|---|---|
| **Inventory deducted at COMPLETED, not at PENDING** | Orders start as PENDING. Stock is not automatically deducted on placement — the admin confirms fulfillment by transitioning to COMPLETED. This prevents over-deduction from cancelled orders. |
| **No quotation state** | Orders move directly PENDING → COMPLETED/CANCELLED. A quotation workflow (draft → quote → confirmed) was considered but out of scope for this version. |
| **Snapshot pricing in `orderItems`** | `priceAtTime` is copied from `pricePerBaseUnit` at creation. Historical order value is preserved even after price changes — critical for audit accuracy. |
| **All units normalized to base at persistence** | Prevents inconsistency when mixing user input units. Aggregation, deduction, and comparison always operate on the same unit. |
| **NUMERIC over FLOAT for money** | Exact decimal arithmetic avoids floating-point drift in financial totals. PostgreSQL's NUMERIC type is the standard for monetary data. |
| **Server Actions over REST API** | Next.js Server Actions eliminate a separate API layer for mutations, co-locate validation with business logic, and automatically benefit from React's transition model. |
| **JWT over database sessions** | Stateless JWT sessions scale horizontally without a session store. Role is embedded in the token, eliminating a DB round-trip per request. |
| **Drizzle ORM over Prisma** | Drizzle has zero runtime overhead, generates plain SQL, and offers first-class TypeScript inference without code generation. Better fit for a serverless/edge environment. |

---

## 16. Future Improvements

| Improvement | Engineering Consideration |
|---|---|
| **GST/tax calculation** | Apply `gstRate` from product at order time; break out taxable amount separately in `orderItems` |
| **Audit logs** | Append-only `auditLog` table tracking every status change with actor, timestamp, and previous state |
| **Inventory reservation** | Reserve stock atomically at order placement (PENDING), release on CANCELLED — prevents overselling under concurrent load |
| **PDF quotations** | Generate proforma invoices using `@react-pdf/renderer` with order details, GST breakdown, and company header |
| **Redis caching** | Cache product catalogue and dashboard KPIs with Upstash Redis; invalidate on product/order mutations |
| **Email notifications** | Transactional emails via Resend on order placement and status change |
| **Analytics dashboard** | Time-series revenue charts with proper month-over-month comparisons using aggregated order data |
| **Expiry tracking** | `batchItems` table linking products to lot numbers and expiry dates; automated near-expiry alerts |
| **Webhook system** | Outbound webhooks for ERP/WMS integrations when order status changes |
| **Rate limiting** | API-level rate limiting via Vercel Edge Config or Upstash Ratelimit on auth and order endpoints |

---

## 17. Conclusion

Medsell demonstrates end-to-end systems thinking for a domain-specific B2B application:

- **Type safety throughout**: Drizzle schema types flow into Zod validators and React component props without casting or `any`
- **Precision-correct financials**: NUMERIC arithmetic eliminates floating-point risk in price calculations
- **Unit normalization**: A single canonical storage unit per dimension type makes inventory aggregation, deduction, and comparison reliable regardless of how users input quantities
- **Server-side authority**: Every mutation is authorized on the server. Client-side role checks are UX conveniences, never security boundaries
- **Serverless-ready**: Neon's WebSocket-compatible serverless driver, Next.js Server Actions, and Vercel Edge deployment mean the application has no persistent server processes to manage

This architecture is designed to scale from a hackathon prototype to a production system with minimal structural changes — primarily requiring the addition of caching, audit logging, and inventory reservation to handle concurrent load.

---

<div align="center">

Built with ♦ by [Param](https://github.com/your-username)

</div>
