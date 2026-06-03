# Medsell — Pharma Inventory Platform

A full-stack pharmaceutical inventory and order management system built with **Next.js 16**, **Drizzle ORM**, and **Neon PostgreSQL**. Designed for distributors and pharmacy chains to manage product catalogues, track orders, and enforce role-based access control.

---

## ✨ Features

- **Role-Based Access Control** — Separate dashboards for Admins and Sellers/Buyers
- **Admin Dashboard** — Live KPI cards (revenue, orders, products), order status distribution donut chart, low-stock alerts, and top-selling product rankings
- **Product Management** — Full CRUD with pharmaceutical metadata: strength, pack size, GST rate, HSN code, drug schedule, and regulatory flags (Rx-only, controlled substance, cold chain)
- **Product Catalogue** — Searchable and filterable product catalogue for Sellers with per-product unit selection and add-to-cart
- **Order Management** — Place orders, track status, and admin-controlled status transitions (Pending → Completed/Cancelled)
- **Collapsible Sidebar** — Smooth animated sidebar with icon-only collapsed mode, localStorage persistence, and avatar-triggered profile settings dropdown
- **Account Settings Modal** — Change display name and update password from within the app
- **Monochrome + Accent UI** — Professional dark theme (black/grey/white) with semantic accent colors (green, blue, orange, red) for status badges and stat cards
- **ESLint + TypeScript** — Fully typed and linted codebase with Next.js ESLint config

---

## 🧰 Tech Stack

| Layer        | Technology                          |
|--------------|-------------------------------------|
| Framework    | Next.js 16 (App Router, Turbopack)  |
| Database     | Neon PostgreSQL (serverless)        |
| ORM          | Drizzle ORM                         |
| Auth         | NextAuth.js v5 (Credentials)        |
| Styling      | Tailwind CSS v4                     |
| Icons        | Lucide React                        |
| Validation   | Zod                                 |
| Passwords    | bcryptjs                            |

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/your-username/medsell.git
cd medsell
npm install
```

### 2. Configure Environment

Create a `.env` file in the root:

```env
DATABASE_URL=postgresql://user:password@your-neon-host/medsell
AUTH_SECRET=your-random-secret-string
NEXTAUTH_URL=http://localhost:3000
```

### 3. Push Database Schema

```bash
npx drizzle-kit push
```

### 4. Seed the Database

Seed users only:
```bash
npx tsx src/db/seed.ts
```

Or seed via the API route (useful for cloud deployments):
```
GET /api/seed
```

This creates:
- `admin@example.com` / `admin123` — Admin role
- `seller@example.com` / `seller123` — Seller role

The seed script also inserts **20 pharmaceutical products** across categories including Antibiotics, Analgesics, Cardiovascular, Antivirals, Vitamins/Supplements, and Dermatology.

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🗂️ Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── actions.ts          # Server actions: createProduct, updateProduct, deleteProduct
│   │   └── products/page.tsx   # Admin product management page
│   ├── dashboard/
│   │   ├── actions.ts          # placeOrder server action
│   │   ├── orders/page.tsx     # Orders page (role-aware)
│   │   ├── layout.tsx          # Dashboard layout wrapper
│   │   └── page.tsx            # Role-based dashboard redirect
│   ├── api/
│   │   ├── auth/               # NextAuth route handler
│   │   └── seed/route.ts       # API seed endpoint
│   └── login/
│       ├── page.tsx            # Login page
│       └── actions.ts          # authenticate server action
├── auth.ts                     # NextAuth config (Credentials provider)
├── components/
│   ├── layout-shell.tsx        # Main layout: sidebar + header + content
│   ├── sidebar.tsx             # Collapsible sidebar with settings modal
│   ├── sidebar-toggle.tsx      # Mobile hamburger drawer
│   ├── admin-dashboard.tsx     # Admin KPI dashboard
│   ├── seller-dashboard.tsx    # Product catalogue + cart for sellers
│   ├── product-manager.tsx     # Full CRUD product form (admin)
│   ├── order-list.tsx          # Order list with expand + status change
│   └── revenue-chart.tsx       # SVG revenue line chart
├── db/
│   ├── index.ts                # Drizzle + Neon pool setup
│   ├── schema.ts               # Drizzle schema (users, products, orders)
│   └── seed.ts                 # Database seed script
└── lib/
    ├── conversions.ts          # Unit conversion utilities (g↔kg, mL↔L)
    └── validations.ts          # Zod schemas for product and order forms
```

---

## 👤 Default Credentials

| Role   | Email                 | Password    |
|--------|-----------------------|-------------|
| Admin  | admin@example.com     | admin123    |
| Seller | seller@example.com    | seller123   |

---

## 📦 Seeded Products (20 items)

| Name                                | Category            | Form       | Schedule    |
|-------------------------------------|---------------------|------------|-------------|
| Amoxicillin 500mg Capsules          | Antibiotics         | Capsule    | Schedule H  |
| Paracetamol 650mg Tablets           | Analgesics          | Tablet     | OTC         |
| Metformin 500mg Tablets             | Cardiovascular      | Tablet     | Schedule H  |
| Atorvastatin 10mg Tablets           | Cardiovascular      | Tablet     | Schedule H  |
| Azithromycin 500mg Tablets          | Antibiotics         | Tablet     | Schedule H  |
| Omeprazole 20mg Capsules            | Analgesics          | Capsule    | OTC         |
| Cetirizine 10mg Tablets             | Analgesics          | Tablet     | OTC         |
| Amoxiclav 625mg Tablets             | Antibiotics         | Tablet     | Schedule H  |
| Insulin Glargine 100IU/mL Injection | Cardiovascular      | Injection  | Schedule H  |
| Betamethasone 0.05% Cream           | Dermatology         | Cream      | Schedule H  |
| Amlodipine 5mg Tablets              | Cardiovascular      | Tablet     | Schedule H  |
| Dextromethorphan Syrup 100mL        | Analgesics          | Syrup      | OTC         |
| Ibuprofen 400mg Tablets             | Analgesics          | Tablet     | OTC         |
| Levocetirizine 5mg Tablets          | Analgesics          | Tablet     | OTC         |
| Pantoprazole 40mg Tablets           | Analgesics          | Tablet     | Schedule H  |
| Vitamin D3 60000 IU Capsules        | Vitamins/Supplements| Capsule    | OTC         |
| Clopidogrel 75mg Tablets            | Cardiovascular      | Tablet     | Schedule H  |
| Acyclovir 400mg Tablets             | Antivirals          | Tablet     | Schedule H  |
| Multivitamin + Minerals Tablets     | Vitamins/Supplements| Tablet     | OTC         |
| Salbutamol 100mcg Inhaler           | Analgesics          | Inhaler    | Schedule H  |

---

## 🛠️ Scripts

| Command              | Description                         |
|----------------------|-------------------------------------|
| `npm run dev`        | Start development server (Turbopack)|
| `npm run build`      | Build for production                |
| `npm run lint`       | Run ESLint                          |
| `npx drizzle-kit push` | Push schema to database           |
| `npx tsx src/db/seed.ts` | Seed database with users + products |

---

## 📝 License

MIT — build freely.
