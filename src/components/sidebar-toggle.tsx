"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Settings as SettingsIcon, 
  LogOut, 
  User, 
  Activity 
} from 'lucide-react';

interface SidebarToggleProps {
  role: string;
  email: string | null;
  pendingCount: number;
}

export function SidebarToggle({ role, email, pendingCount }: SidebarToggleProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex lg:hidden items-center justify-center p-2 rounded-xl border border-[#1f1f23] bg-[#141417] hover:bg-[#1f1f23] transition text-zinc-400 hover:text-white cursor-pointer"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Slide-out Mobile Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-sm animate-fade-in">
          {/* Drawer Panel */}
          <div className="relative w-80 bg-[#09090b] border-r border-[#1f1f23] p-6 flex flex-col justify-between animate-slide-in">
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/40 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="space-y-8 mt-2">
              {/* Brand Header */}
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-white shadow-md">
                  <Activity className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-lg font-black tracking-wider text-white">Medsell</span>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-0.5">Pharma Platform</p>
                </div>
              </div>

              {/* Profile info card */}
              <div className="flex items-center gap-3 rounded-2xl bg-[#141417] border border-[#1f1f23] p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-zinc-450 border border-zinc-700">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider leading-none">
                    {role === 'ADMIN' ? 'Administrator' : role}
                  </p>
                  <p className="text-xs font-bold text-white truncate mt-1">{email}</p>
                </div>
              </div>

              {/* Main Menu Nav Links */}
              <div className="space-y-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-650">Main Menu</span>
                <div className="space-y-1.5">
                  <Link
                    href="/dashboard"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#141417] hover:text-white text-zinc-400"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="h-4.5 w-4.5 text-zinc-500" />
                      <span>{role === 'ADMIN' ? 'Admin Dashboard' : 'Product Catalog'}</span>
                    </div>
                  </Link>

                  {role === 'ADMIN' && (
                    <Link
                      href="/admin/products"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#141417] hover:text-white text-zinc-400"
                    >
                      <div className="flex items-center gap-3">
                        <Package className="h-4.5 w-4.5 text-zinc-500" />
                        <span>Product Management</span>
                      </div>
                    </Link>
                  )}

                  <Link
                    href="/dashboard/orders"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-semibold transition hover:bg-[#141417] hover:text-white text-zinc-400"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-4.5 w-4.5 text-zinc-500" />
                      <span>{role === 'ADMIN' ? 'Orders Management' : 'My Orders'}</span>
                    </div>
                    {pendingCount > 0 && (
                      <span className="rounded-full bg-zinc-850 border border-zinc-700 px-2 py-0.5 text-xs font-bold text-zinc-300">
                        {pendingCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>

            {/* Footer: user profile + settings + sign out */}
            <div className="space-y-4 pt-6 border-t border-[#1f1f23]">
              {/* User Profile Block */}
              <div className="flex items-center gap-3 rounded-xl bg-[#141417] border border-[#1f1f23] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-white font-extrabold text-sm">
                  {email ? email[0].toUpperCase() : 'U'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider leading-none">
                    {role === 'ADMIN' ? 'Admin' : 'Seller'}
                  </p>
                  <p className="text-xs font-bold text-white truncate mt-1">{email}</p>
                </div>
              </div>

              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition"
              >
                <User className="h-4.5 w-4.5 text-zinc-650" />
                <span>Profile Settings</span>
              </Link>
              <Link
                href="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-400 hover:text-white transition"
              >
                <SettingsIcon className="h-4.5 w-4.5 text-zinc-650" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut className="h-4.5 w-4.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
