import React from 'react';
import { auth } from '@/auth';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { 
  ChevronRight, 
  Calendar,
  Download,
  Search
} from 'lucide-react';
import { SidebarToggle } from './sidebar-toggle';
import { Sidebar } from './sidebar';

export async function LayoutShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return <>{children}</>;

  const role = session.user.role;
  const email = session.user.email;
  const userId = session.user.id;

  // Query pending orders count
  let pendingCount = 0;
  try {
    const pendingQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(role === 'ADMIN' 
        ? eq(orders.status, 'PENDING')
        // @ts-ignore
        : and(eq(orders.status, 'PENDING'), eq(orders.userId, userId))
      );
    const res = await pendingQuery;
    pendingCount = Number(res[0]?.count || 0);
  } catch (err) {
    console.error('Failed to query pending orders count:', err);
  }

  // Format today's date
  const todayStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100 flex font-sans antialiased overflow-x-hidden">
      {/* Sidebar Wrapper */}
      <Sidebar role={role} email={email ?? null} pendingCount={pendingCount} />

      {/* Main Panel Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 shrink-0 border-b border-[#1f1f23] bg-[#09090b] px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <SidebarToggle role={role} pendingCount={pendingCount} email={email ?? null} />
            
            {/* Breadcrumb path */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
              <span className="text-zinc-450">Medsell</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-zinc-200">{role === 'ADMIN' ? 'Admin Dashboard' : 'Dashboard'}</span>
            </div>
          </div>
        </header>

        {/* Content Shell */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 space-y-8 bg-[#09090b]">
          {/* Calendar date row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {role === 'ADMIN' ? 'Admin Dashboard' : 'Welcome back'}
              </h2>
              <p className="text-xs text-zinc-500 mt-1">Here&apos;s what&apos;s happening in your catalog today.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-xl border border-[#1f1f23] bg-[#141417] px-3.5 py-2 text-xs font-semibold text-zinc-300">
                <Calendar className="h-4 w-4 text-zinc-550" />
                <span>{todayStr}</span>
              </div>
            </div>
          </div>

          {/* Render Page Content */}
          <div className="animate-fade-in">{children}</div>
        </main>
      </div>
    </div>
  );
}
