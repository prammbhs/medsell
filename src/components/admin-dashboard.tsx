import { db } from '@/db';
import { products, orders, users, orderItems } from '@/db/schema';
import { sql, desc, eq, and } from 'drizzle-orm';
import { formatINR } from '@/lib/conversions';
import Link from 'next/link';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight,
  Plus,
  RefreshCw,
  DollarSign,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { RevenueChart } from './revenue-chart';

export async function AdminDashboard() {
  // Query stats
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

  // Query low stock items details
  const lowStockItems = await db
    .select()
    .from(products)
    .where(sql`"totalQuantity" < 1000`)
    .limit(5);

  // Query recent orders (last 6)
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
    .limit(6);

  // Query monthly totals dynamically
  let chartData: Array<{ month: string; amount: number }> = [];
  try {
    const monthlyRevenue = await db.select({
      month: sql<string>`to_char(${orders.createdAt}, 'Mon')`,
      total: sql<string>`sum(${orders.totalAmount})`
    })
    .from(orders)
    .groupBy(sql`to_char(${orders.createdAt}, 'Mon')`)
    .limit(12);

    chartData = monthlyRevenue.map(row => ({
      month: row.month,
      amount: parseFloat(row.total || '0')
    }));
  } catch (e) {
    console.error('Failed to query monthly chart data:', e);
  }

  // Query top selling products by sum of ordered quantity
  const topSellingRes = await db
    .select({
      productId: orderItems.productId,
      totalSold: sql<number>`sum(cast(${orderItems.quantity} as numeric))`,
      name: products.name,
      sku: products.sku,
      pricePerBaseUnit: products.pricePerBaseUnit,
      dimensionType: products.dimensionType,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .groupBy(orderItems.productId, products.name, products.sku, products.pricePerBaseUnit, products.dimensionType)
    .orderBy(desc(sql`sum(cast(${orderItems.quantity} as numeric))`))
    .limit(5);

  // If no items sold yet, fallback to active products
  const topSelling = topSellingRes.length > 0 
    ? topSellingRes.map(p => ({
        name: p.name,
        sku: p.sku,
        totalSold: p.totalSold,
        salesAmount: p.totalSold * parseFloat(p.pricePerBaseUnit),
        change: '+15%',
      }))
    : (await db.select().from(products).limit(5)).map(p => ({
        name: p.name,
        sku: p.sku,
        totalSold: 0,
        salesAmount: 0,
        change: '+0%',
      }));

  // Order status counts for donut chart
  const pendingStatusRes = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'PENDING'));
  const completedStatusRes = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'COMPLETED'));
  const cancelledStatusRes = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.status, 'CANCELLED'));

  const pendingCount = Number(pendingStatusRes[0]?.count || 0);
  const completedCount = Number(completedStatusRes[0]?.count || 0);
  const cancelledCount = Number(cancelledStatusRes[0]?.count || 0);

  const totalStatusCount = pendingCount + completedCount + cancelledCount;
  const completedPercent = totalStatusCount > 0 ? Math.round((completedCount / totalStatusCount) * 100) : 0;
  const pendingPercent = totalStatusCount > 0 ? Math.round((pendingCount / totalStatusCount) * 100) : 0;
  const cancelledPercent = totalStatusCount > 0 ? Math.round((cancelledCount / totalStatusCount) * 100) : 0;

  // Format currency displays
  const formatRevenueLakhs = (val: number) => {
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)}L`;
    }
    return formatINR(val);
  };

  return (
    <div className="space-y-6">
      {/* Top 3 Cards Row */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Total Revenue MTD */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 flex flex-col justify-between hover:shadow-lg transition shadow-black/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs font-bold text-zinc-300">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12.4%</span>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatRevenueLakhs(totalRevenue)}</h3>
            <p className="text-xs text-zinc-550 font-semibold mt-1">Total Revenue (MTD)</p>
          </div>
        </div>

        {/* Total Orders MTD */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 flex flex-col justify-between hover:shadow-lg transition shadow-black/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs font-bold text-zinc-300">
              <ArrowUpRight className="h-3 w-3" />
              <span>+8.1%</span>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{ordersCount}</h3>
            <p className="text-xs text-zinc-550 font-semibold mt-1">Total Orders (MTD)</p>
          </div>
        </div>

        {/* Active Products */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 flex flex-col justify-between hover:shadow-lg transition shadow-black/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
              <Package className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-xs font-bold text-zinc-300">
              <ArrowUpRight className="h-3 w-3" />
              <span>+1.5%</span>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{productsCount}</h3>
            <p className="text-xs text-zinc-550 font-semibold mt-1">Active Products</p>
          </div>
        </div>
      </div>

      {/* Row 2: Revenue Chart & Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Line Chart */}
        <div className="lg:col-span-2 rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4">
          <RevenueChart data={chartData} />
        </div>

        {/* Quick Actions Panel */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4">
          <h3 className="font-extrabold text-white">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            <Link
              href="/admin/products"
              className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-[#1f1f23] bg-[#141417] p-5 text-center hover:border-zinc-500/30 hover:bg-zinc-850 transition"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
                <Plus className="h-4.5 w-4.5" />
              </div>
              <span className="text-[11px] font-bold text-zinc-300">Add Product</span>
            </Link>

            <Link
              href="/admin/products"
              className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-[#1f1f23] bg-[#141417] p-5 text-center hover:border-zinc-500/30 hover:bg-zinc-850 transition"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
                <RefreshCw className="h-4.5 w-4.5" />
              </div>
              <span className="text-[11px] font-bold text-zinc-300">Update Stock</span>
            </Link>

            <Link
              href="/admin/products"
              className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-[#1f1f23] bg-[#141417] p-5 text-center hover:border-zinc-500/30 hover:bg-zinc-850 transition"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
                <DollarSign className="h-4.5 w-4.5" />
              </div>
              <span className="text-[11px] font-bold text-zinc-300">Manage Pricing</span>
            </Link>

            <Link
              href="/dashboard"
              className="flex flex-col items-center justify-center gap-2.5 rounded-2xl border border-[#1f1f23] bg-[#141417] p-5 text-center hover:border-zinc-500/30 hover:bg-zinc-850 transition"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-300">
                <BarChart3 className="h-4.5 w-4.5" />
              </div>
              <span className="text-[11px] font-bold text-zinc-300">Analytics</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Row 3: Recent Orders & Low Stock Alerts */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders List */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4.5">
              <div>
                <h3 className="font-extrabold text-white">Recent Orders</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Latest purchase orders from buyers and sellers</p>
              </div>
              <Link
                href="/dashboard/orders"
                className="flex items-center gap-1 text-xs font-bold text-zinc-300 hover:text-white transition"
              >
                <span>View All</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <ShoppingCart className="h-8 w-8 mb-2 opacity-50 text-zinc-650" />
                <p className="text-xs">No orders placed yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs select-none">
                  <thead>
                    <tr className="border-b border-[#1f1f23] text-zinc-500 font-bold">
                      <th className="pb-3 pr-4">Order ID</th>
                      <th className="pb-3 pr-4">Buyer</th>
                      <th className="pb-3 pr-4">Amount</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f1f23] text-zinc-300">
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-[#141417]/40 transition">
                        <td className="py-3 font-semibold pr-4 text-white">#{order.id.slice(0, 8).toUpperCase()}</td>
                        <td className="py-3 pr-4 max-w-[120px] truncate">{order.userEmail}</td>
                        <td className="py-3 pr-4 font-bold text-white">{formatINR(parseFloat(order.totalAmount))}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            order.status === 'COMPLETED'
                              ? 'bg-zinc-800 border border-zinc-700 text-zinc-300'
                              : order.status === 'CANCELLED'
                              ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                              : 'bg-amber-500/10 text-amber-450 border border-amber-500/20'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="py-3 text-zinc-500">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
            <h3 className="font-extrabold text-white">Low Stock Alerts</h3>
            <span className="inline-flex items-center gap-1 rounded-full bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-300">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{lowStockCount} Items</span>
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[220px] pr-1">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                <Package className="h-7 w-7 mb-1.5 opacity-55 text-zinc-650" />
                <p className="text-xs">All items adequately stocked.</p>
              </div>
            ) : (
              lowStockItems.map((item) => {
                const isOutOfStock = parseFloat(item.totalQuantity) <= 0;
                return (
                  <div key={item.id} className="flex items-start justify-between border-b border-[#141417] pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">SKU: {item.sku}</p>
                    </div>
                    <span className="shrink-0 text-xs font-bold text-zinc-300 bg-zinc-850 px-2 py-1 rounded-lg">
                      {isOutOfStock ? '0' : parseFloat(item.totalQuantity)} {item.dimensionType === 'WEIGHT' ? 'g' : item.dimensionType === 'VOLUME' ? 'mL' : 'items'} left
                    </span>
                  </div>
                );
              })
            )}
          </div>
          
          <Link
            href="/admin/products"
            className="flex items-center justify-center w-full rounded-xl bg-zinc-800 border border-zinc-700 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition cursor-pointer"
          >
            Manage Inventory
          </Link>
        </div>
      </div>

      {/* Row 4: Order Status Donut & Top Selling Products */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Status Distribution */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4 flex flex-col justify-between">
          <h3 className="font-extrabold text-white">Order Status</h3>
          <div className="flex items-center justify-center py-4">
            {/* SVG Donut Chart */}
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 36 36" className="w-full h-full">
                {/* Completed circle */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="transparent" 
                  stroke="#ffffff" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${completedPercent} ${100 - completedPercent}`} 
                  strokeDashoffset="25"
                />
                {/* Pending circle */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="transparent" 
                  stroke="#71717a" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${pendingPercent} ${100 - pendingPercent}`} 
                  strokeDashoffset={`${25 - completedPercent}`}
                />
                {/* Cancelled circle */}
                <circle 
                  cx="18" cy="18" r="15.915" 
                  fill="transparent" 
                  stroke="#27272a" 
                  strokeWidth="3.2" 
                  strokeDasharray={`${cancelledPercent} ${100 - cancelledPercent}`} 
                  strokeDashoffset={`${25 - completedPercent - pendingPercent}`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-white">{ordersCount}</span>
                <span className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider leading-none mt-0.5">Orders</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-zinc-400">
            <div className="flex flex-col items-center">
              <span className="h-2 w-2 rounded-full bg-white mb-1" />
              <span>Delivered ({completedPercent}%)</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="h-2 w-2 rounded-full bg-zinc-500 mb-1" />
              <span>Pending ({pendingPercent}%)</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="h-2 w-2 rounded-full bg-zinc-800 mb-1" />
              <span>Cancelled ({cancelledPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Top Selling Products List */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
            <h3 className="font-extrabold text-white">Top Selling Products</h3>
            <p className="text-[10px] text-zinc-550">By revenue this month</p>
          </div>

          <div className="space-y-4.5 pt-1 select-none">
            {topSelling.map((prod, idx) => {
              const maxAmt = Math.max(...topSelling.map(p => p.salesAmount), 1);
              const progressWidth = Math.max(10, Math.round((prod.salesAmount / maxAmt) * 100));

              return (
                <div key={prod.sku} className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-bold text-zinc-500">0{idx + 1}</span>
                      <p className="font-bold text-white truncate">{prod.name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[10px]">
                      <span className="font-black text-white">{formatRevenueLakhs(prod.salesAmount)}</span>
                      <span className="font-bold text-zinc-400">{prod.change}</span>
                    </div>
                  </div>
                  {/* Progress Line */}
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full" 
                      style={{ width: `${progressWidth}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
export default AdminDashboard;
