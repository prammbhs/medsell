import { db } from '@/db';
import { products, orders, users, orderItems } from '@/db/schema';
import { sql, desc, eq } from 'drizzle-orm';
import { formatINR } from '@/lib/conversions';
import Link from 'next/link';
import { 
  Package, 
  ShoppingCart, 
  TrendingUp, 
  AlertTriangle, 
  ArrowUpRight,
  Plus,
  RefreshCw,
  DollarSign,
  BarChart3,
  ChevronRight
} from 'lucide-react';
import { RevenueChart } from './revenue-chart'; // kept for future use

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Query top selling products
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

  // Order status counts
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

  const formatRevenueLakhs = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    return formatINR(val);
  };

  // Colors for top-selling progress bars
  const barColors = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-violet-500', 'bg-rose-500'];

  return (
    <div className="space-y-6">
      {/* Top 3 Stat Cards */}
      <div className="grid gap-6 sm:grid-cols-3">
        {/* Total Revenue */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 flex flex-col justify-between hover:shadow-lg transition shadow-black/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+12.4%</span>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{formatRevenueLakhs(totalRevenue)}</h3>
            <p className="text-xs text-zinc-500 font-semibold mt-1">Total Revenue (MTD)</p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 flex flex-col justify-between hover:shadow-lg transition shadow-black/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-500/15 border border-blue-500/20 px-2 py-0.5 text-xs font-bold text-blue-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+8.1%</span>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{ordersCount}</h3>
            <p className="text-xs text-zinc-500 font-semibold mt-1">Total Orders (MTD)</p>
          </div>
        </div>

        {/* Active Products */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 flex flex-col justify-between hover:shadow-lg transition shadow-black/50 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400">
              <Package className="h-5 w-5" />
            </div>
            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500/15 border border-orange-500/20 px-2 py-0.5 text-xs font-bold text-orange-400">
              <ArrowUpRight className="h-3 w-3" />
              <span>+1.5%</span>
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-extrabold text-white tracking-tight">{productsCount}</h3>
            <p className="text-xs text-zinc-500 font-semibold mt-1">Active Products</p>
          </div>
        </div>
      </div>

      {/* Row 2: Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/products" className="flex items-center gap-3 rounded-2xl border border-[#1f1f23] bg-[#141417] p-5 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500/20 transition shrink-0">
            <Plus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-white">Add Product</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Create new catalogue entry</p>
          </div>
        </Link>

        <Link href="/admin/products" className="flex items-center gap-3 rounded-2xl border border-[#1f1f23] bg-[#141417] p-5 hover:border-blue-500/30 hover:bg-blue-500/5 transition group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 group-hover:bg-blue-500/20 transition shrink-0">
            <RefreshCw className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-white">Update Stock</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Adjust inventory quantities</p>
          </div>
        </Link>

        <Link href="/admin/products" className="flex items-center gap-3 rounded-2xl border border-[#1f1f23] bg-[#141417] p-5 hover:border-orange-500/30 hover:bg-orange-500/5 transition group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-400 group-hover:bg-orange-500/20 transition shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-white">Manage Pricing</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">Edit MRP and wholesale rates</p>
          </div>
        </Link>

        <Link href="/dashboard/orders" className="flex items-center gap-3 rounded-2xl border border-[#1f1f23] bg-[#141417] p-5 hover:border-violet-500/30 hover:bg-violet-500/5 transition group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-400 group-hover:bg-violet-500/20 transition shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-extrabold text-white">View Orders</p>
            <p className="text-[10px] text-zinc-500 mt-0.5">All pending and completed</p>
          </div>
        </Link>
      </div>

      {/* Row 3: Recent Orders & Low Stock */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-extrabold text-white">Recent Orders</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Latest purchase orders from buyers and sellers</p>
              </div>
              <Link href="/dashboard/orders" className="flex items-center gap-1 text-xs font-bold text-zinc-400 hover:text-white transition">
                <span>View All</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            </div>

            {recentOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                <ShoppingCart className="h-8 w-8 mb-2 opacity-50" />
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
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                              : order.status === 'CANCELLED'
                              ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                              : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
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
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 border border-rose-500/25 px-2 py-0.5 text-[10px] font-bold text-rose-400">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>{lowStockCount} Items</span>
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[220px] pr-1">
            {lowStockItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-zinc-500">
                <Package className="h-7 w-7 mb-1.5 opacity-55" />
                <p className="text-xs">All items adequately stocked.</p>
              </div>
            ) : (
              lowStockItems.map((item) => {
                const isOutOfStock = parseFloat(item.totalQuantity) <= 0;
                const qty = parseFloat(item.totalQuantity);
                const unit = item.dimensionType === 'WEIGHT' ? 'g' : item.dimensionType === 'VOLUME' ? 'mL' : 'items';
                return (
                  <div key={item.id} className="flex items-start justify-between border-b border-[#141417] pb-3 last:border-0 last:pb-0">
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[10px] text-zinc-500 mt-0.5">SKU: {item.sku}</p>
                    </div>
                    <span className={`shrink-0 text-xs font-bold px-2 py-1 rounded-lg ${
                      isOutOfStock
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                        : 'bg-orange-500/15 text-orange-400 border border-orange-500/25'
                    }`}>
                      {isOutOfStock ? '0' : qty} {unit} left
                    </span>
                  </div>
                );
              })
            )}
          </div>
          
          <Link href="/admin/products" className="flex items-center justify-center w-full rounded-xl bg-[#141417] border border-[#1f1f23] py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-800 hover:text-white transition cursor-pointer">
            Manage Inventory
          </Link>
        </div>
      </div>

      {/* Row 4: Order Status Donut & Top Selling */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order Status Donut */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 space-y-4 flex flex-col justify-between">
          <h3 className="font-extrabold text-white">Order Status</h3>
          <div className="flex items-center justify-center py-4">
            <div className="relative h-32 w-32">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                {/* Completed — green */}
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3.2"
                  strokeDasharray={`${completedPercent} ${100 - completedPercent}`} strokeDashoffset="0" />
                {/* Pending — orange */}
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f97316" strokeWidth="3.2"
                  strokeDasharray={`${pendingPercent} ${100 - pendingPercent}`} strokeDashoffset={`${-(completedPercent)}`} />
                {/* Cancelled — red */}
                <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#ef4444" strokeWidth="3.2"
                  strokeDasharray={`${cancelledPercent} ${100 - cancelledPercent}`} strokeDashoffset={`${-(completedPercent + pendingPercent)}`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-lg font-black text-white">{ordersCount}</span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider leading-none mt-0.5">Orders</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold text-zinc-400">
            <div className="flex flex-col items-center">
              <span className="h-2 w-2 rounded-full bg-emerald-500 mb-1" />
              <span>Done ({completedPercent}%)</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="h-2 w-2 rounded-full bg-orange-500 mb-1" />
              <span>Pending ({pendingPercent}%)</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="h-2 w-2 rounded-full bg-rose-500 mb-1" />
              <span>Cancelled ({cancelledPercent}%)</span>
            </div>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="rounded-2xl border border-[#1f1f23] bg-[#09090b] p-6 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
            <h3 className="font-extrabold text-white">Top Selling Products</h3>
            <p className="text-[10px] text-zinc-500">By revenue this month</p>
          </div>

          <div className="space-y-4 pt-1 select-none">
            {topSelling.map((prod, idx) => {
              const maxAmt = Math.max(...topSelling.map(p => p.salesAmount), 1);
              const progressWidth = Math.max(8, Math.round((prod.salesAmount / maxAmt) * 100));

              return (
                <div key={prod.sku} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-bold text-zinc-500">0{idx + 1}</span>
                      <p className="font-bold text-white truncate">{prod.name}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 text-[10px]">
                      <span className="font-black text-white">{formatRevenueLakhs(prod.salesAmount)}</span>
                      <span className="font-bold text-emerald-400">{prod.change}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className={`h-full ${barColors[idx % barColors.length]} rounded-full`} style={{ width: `${progressWidth}%` }} />
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
