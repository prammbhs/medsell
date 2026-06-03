import { db } from '@/db';
import { products, orders, users } from '@/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import { formatINR } from '@/lib/conversions';
import Link from 'next/link';
import { Package, ShoppingCart, TrendingUp, AlertTriangle, ArrowRight } from 'lucide-react';

export async function AdminDashboard() {
  // Query summary stats
  const productsCountRes = await db.select({ count: sql<number>`count(*)` }).from(products);
  const productsCount = Number(productsCountRes[0]?.count || 0);

  const lowStockRes = await db.select({ count: sql<number>`count(*)` }).from(products).where(sql`"totalQuantity" < 1000`);
  const lowStockCount = Number(lowStockRes[0]?.count || 0);

  const ordersCountRes = await db.select({
    count: sql<number>`count(*)`,
    total: sql<string>`sum("totalAmount")`
  }).from(orders);
  const ordersCount = Number(ordersCountRes[0]?.count || 0);
  const totalRevenue = parseFloat(ordersCountRes[0]?.total || '0');

  // Query recent orders
  const recentOrders = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      userEmail: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(5);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Admin Dashboard
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Overview of Medsell inventory, sales, and order management.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Products */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-2.5 text-emerald-600 dark:text-emerald-400">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Products</p>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{productsCount}</h4>
            </div>
          </div>
        </div>

        {/* Low Stock Warning */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-amber-500/10 p-2.5 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Low Stock Alert</p>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{lowStockCount}</h4>
            </div>
          </div>
          {lowStockCount > 0 && (
            <div className="absolute right-0 bottom-0 top-0 w-1.5 bg-amber-500" />
          )}
        </div>

        {/* Total Orders */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-2.5 text-blue-600 dark:text-blue-400">
              <ShoppingCart className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Orders</p>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{ordersCount}</h4>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-teal-500/10 p-2.5 text-teal-600 dark:text-teal-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Total Revenue</p>
              <h4 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mt-0.5">{formatINR(totalRevenue)}</h4>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Orders List */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Recent Orders</h3>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-zinc-500 dark:text-zinc-400">
              <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">No orders placed yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-4">
                  <div>
                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Placed by: {order.userEmail}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      order.status === 'COMPLETED'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                        : order.status === 'CANCELLED'
                        ? 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                        : 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                      {formatINR(order.totalAmount)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Quick Actions</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Jump straight to critical configurations and stock modifications.
            </p>
            <div className="grid gap-3 pt-2">
              <Link
                href="/admin/products"
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 transition cursor-pointer"
              >
                <Package className="h-4 w-4" />
                Manage Products
              </Link>
              <Link
                href="/dashboard/orders"
                className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-transparent px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 transition cursor-pointer dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                <ShoppingCart className="h-4 w-4" />
                Manage Orders
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminDashboard;
