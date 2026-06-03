import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import { orders, orderItems, products, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { OrderList } from '@/components/order-list';

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role;
  const userId = session.user.id;

  // Load orders depending on role
  let allOrdersQuery = db
    .select({
      id: orders.id,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      userEmail: users.email,
    })
    .from(orders)
    .innerJoin(users, eq(orders.userId, users.id));

  if (role !== 'ADMIN') {
    // @ts-expect-error -- Drizzle conditional where type mismatch
    allOrdersQuery = allOrdersQuery.where(eq(orders.userId, userId));
  }

  const allOrders = await allOrdersQuery.orderBy(desc(orders.createdAt));

  // Load all order items linked to products
  const allOrderItems = await db
    .select({
      id: orderItems.id,
      orderId: orderItems.orderId,
      productId: orderItems.productId,
      quantity: orderItems.quantity,
      priceAtTime: orderItems.priceAtTime,
      productName: products.name,
      sku: products.sku,
      dimensionType: products.dimensionType,
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          {role === 'ADMIN' ? 'Manage Orders' : 'My Orders'}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          {role === 'ADMIN' 
            ? 'View and manage all orders placed by sellers and buyers.'
            : 'Track the status and details of your placed orders.'}
        </p>
      </div>

      <OrderList initialOrders={allOrders} allItems={allOrderItems} isAdmin={role === 'ADMIN'} />
    </div>
  );
}
