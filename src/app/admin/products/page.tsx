import { db } from '@/db';
import { products } from '@/db/schema';
import { desc } from 'drizzle-orm';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { ProductManager } from '@/components/product-manager';

export default async function AdminProductsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Load all products ordered by creation date
  const allProducts = await db.select().from(products).orderBy(desc(products.createdAt));

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Manage Products
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Add, edit, or delete inventory products and set unit pricing.
        </p>
      </div>

      <ProductManager initialProducts={allProducts} />
    </div>
  );
}
