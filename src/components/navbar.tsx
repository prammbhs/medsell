import Link from 'next/link';
import { auth, signOut } from '@/auth';
import { LayoutDashboard, Package, ShoppingBag, LogOut, User } from 'lucide-react';

export async function Navbar() {
  const session = await auth();
  if (!session?.user) return null;

  const role = session.user.role;
  const email = session.user.email;

  return (
    <nav className="border-b border-zinc-200 bg-white/80 backdrop-blur-md sticky top-0 z-50 dark:border-zinc-800 dark:bg-black/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/dashboard" className="flex items-center gap-2">
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Medsell
              </span>
            </Link>
            
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <LayoutDashboard className="h-4 w-4" />
                {role === 'ADMIN' ? 'Admin Dashboard' : 'Catalog'}
              </Link>
              
              {role === 'ADMIN' && (
                <Link
                  href="/admin/products"
                  className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
                >
                  <Package className="h-4 w-4" />
                  Manage Products
                </Link>
              )}

              <Link
                href="/dashboard/orders"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition dark:text-zinc-400 dark:hover:text-zinc-100 dark:hover:bg-zinc-900"
              >
                <ShoppingBag className="h-4 w-4" />
                {role === 'ADMIN' ? 'All Orders' : 'My Orders'}
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
              <User className="h-4 w-4 text-zinc-500 dark:text-zinc-400" />
              <div className="flex flex-col text-xs">
                <span className="font-semibold leading-none">{email}</span>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-none mt-0.5">{role}</span>
              </div>
            </div>

            <form
              action={async () => {
                'use server';
                await signOut({ redirectTo: '/login' });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
