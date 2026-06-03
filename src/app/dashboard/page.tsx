import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { AdminDashboard } from '@/components/admin-dashboard';
import { SellerDashboard } from '@/components/seller-dashboard';
import { db } from '@/db';
import { products } from '@/db/schema';
import { desc } from 'drizzle-orm';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) {
    redirect('/login');
  }

  const role = session.user.role;

  if (role === 'ADMIN') {
    return <AdminDashboard />;
  }

  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));

  return <SellerDashboard initialProducts={allProducts} />;
}
