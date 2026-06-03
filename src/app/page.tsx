import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Package, ShoppingBag, ArrowRight } from 'lucide-react';

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950 font-sans">
      <main className="flex-1 flex flex-col items-center justify-center max-w-4xl mx-auto px-6 py-20 text-center space-y-12">
        {/* Hero Section */}
        <div className="space-y-6">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            AasaMedChem Assignment
          </span>
          <h1 className="text-5xl sm:text-6xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 leading-tight">
            Seamless B2B Inventory &{' '}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
              Order Management
            </span>
          </h1>
          <p className="max-w-2xl mx-auto text-base sm:text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed">
            High-precision, multi-unit catalog system for pharmaceutical raw materials. Handle weights, volumes, and unit items with zero rounding errors.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid gap-6 sm:grid-cols-3 max-w-3xl w-full">
          <div className="p-5 border border-zinc-200/60 bg-white rounded-2xl text-left space-y-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <Package className="h-6 w-6 text-emerald-500" />
            <h4 className="font-bold text-zinc-800 dark:text-zinc-200">Precise Inventory</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Stores raw material quantities in base units (g, mL) with high-precision decimals.
            </p>
          </div>
          <div className="p-5 border border-zinc-200/60 bg-white rounded-2xl text-left space-y-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
            <h4 className="font-bold text-zinc-800 dark:text-zinc-200">Role-Based Access</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Strict access levels for Admin (CRUD products, manage orders) and Sellers/Buyers.
            </p>
          </div>
          <div className="p-5 border border-zinc-200/60 bg-white rounded-2xl text-left space-y-2 dark:border-zinc-800 dark:bg-zinc-900/50">
            <ShoppingBag className="h-6 w-6 text-emerald-500" />
            <h4 className="font-bold text-zinc-800 dark:text-zinc-200">Seamless Checkout</h4>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Interactive cart allowing purchase in custom units (e.g. kg) with auto-conversions.
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-550 hover:to-teal-550 px-6 py-3.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition cursor-pointer"
          >
            Access System
            <ArrowRight className="h-4.5 w-4.5" />
          </Link>
        </div>
      </main>

      <footer className="py-6 border-t border-zinc-200/50 dark:border-zinc-800 text-center text-xs text-zinc-400 dark:text-zinc-500">
        Medsell &copy; {new Date().getFullYear()} AasaMedChem Assignment.
      </footer>
    </div>
  );
}
