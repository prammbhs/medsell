"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  Package, 
  Database, 
  ShoppingBag, 
  Settings as SettingsIcon, 
  LogOut, 
  User, 
  Activity,
  ChevronLeft,
  ChevronRight,
  Key,
  Lock,
  Shield,
  CheckCircle2,
  X
} from 'lucide-react';

interface SidebarProps {
  role: string;
  email: string | null;
  pendingCount: number;
}

export function Sidebar({ role, email, pendingCount }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'profile' | 'password'>('profile');
  
  // Settings Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileName, setProfileName] = useState(email ? email.split('@')[0] : 'User');
  const [profileEmail, setProfileEmail] = useState(email || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load collapse state from localStorage if available
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    if (saved) {
      setIsCollapsed(saved === 'true');
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleCollapse = () => {
    const newVal = !isCollapsed;
    setIsCollapsed(newVal);
    localStorage.setItem('sidebar-collapsed', String(newVal));
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (settingsTab === 'password') {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setErrorMsg('All password fields are required.');
        setIsSaving(false);
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New passwords do not match.');
        setIsSaving(false);
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        setIsSaving(false);
        return;
      }
    }

    setTimeout(() => {
      setIsSaving(false);
      setSuccessMsg('Settings updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
    }, 1000);
  };

  const navItems = [
    {
      href: '/dashboard',
      label: role === 'ADMIN' ? 'Admin Dashboard' : 'Product Catalog',
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: '/admin/products',
      label: 'Product Management',
      icon: Package,
      show: role === 'ADMIN',
    },
    {
      href: '/admin/products',
      label: 'Inventory Management',
      icon: Database,
      show: role === 'ADMIN',
    },
    {
      href: '/dashboard/orders',
      label: role === 'ADMIN' ? 'Orders Management' : 'My Orders',
      icon: ShoppingBag,
      show: true,
      badge: pendingCount > 0 ? pendingCount : undefined,
    }
  ];

  return (
    <>
      <aside 
        className={`hidden lg:flex flex-col shrink-0 border-r border-[#1f1f23] bg-[#09090b] select-none transition-all duration-300 ease-in-out relative ${
          isCollapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {/* Toggle Button */}
        <button
          onClick={toggleCollapse}
          className="absolute -right-3.5 top-6 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-[#1f1f23] bg-[#141417] text-zinc-400 hover:text-white shadow-md hover:scale-105 transition cursor-pointer"
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        {/* Brand Header */}
        <div className={`p-6 flex items-center gap-3 border-b border-[#141417] overflow-hidden ${isCollapsed ? 'justify-center px-4' : ''}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 border border-zinc-700 text-white shadow-md">
            <Activity className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <span className="text-base font-black tracking-wider text-white">Medsell</span>
              <p className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest leading-none mt-0.5">Pharma Platform</p>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-6 overflow-y-auto px-3 space-y-7">
          <div className="space-y-1.5">
            {!isCollapsed && (
              <span className="px-3 text-[9px] font-bold uppercase tracking-widest text-zinc-600 block mb-2.5">
                Main Menu
              </span>
            )}
            
            {navItems.filter(item => item.show).map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <div key={item.label} className="relative group">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-bold transition-all duration-200 relative ${
                      isActive 
                        ? 'bg-zinc-800 text-white border border-zinc-700' 
                        : 'text-zinc-450 hover:bg-[#141417]/85 hover:text-white'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                  >
                    <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                    
                    {!isCollapsed && (
                      <span className="truncate flex-1">{item.label}</span>
                    )}

                    {!isCollapsed && item.badge !== undefined && (
                      <span className="rounded-full bg-zinc-900 border border-zinc-750 px-1.5 py-0.5 text-[10px] font-bold text-zinc-300">
                        {item.badge}
                      </span>
                    )}

                    {/* Collapsed Badge Dot indicator */}
                    {isCollapsed && item.badge !== undefined && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-white ring-2 ring-[#09090b]" />
                    )}
                  </Link>

                  {/* Micro Tooltip on Collapsed View */}
                  {isCollapsed && (
                    <div className="absolute left-16 top-1/2 -translate-y-1/2 z-50 bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-[10px] font-bold text-white shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                      {item.label} {item.badge !== undefined ? `(${item.badge})` : ''}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer User Profile & Settings Menu */}
        <div className="p-4 border-t border-[#141417] relative" ref={dropdownRef}>
          {/* Collapsed Avatar Circle */}
          {isCollapsed ? (
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-white font-extrabold text-sm shadow-md hover:border-white transition cursor-pointer mx-auto"
            >
              {email ? email[0].toUpperCase() : 'U'}
            </button>
          ) : (
            /* Expanded Info Card with Dropdown Trigger */
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 w-full rounded-xl bg-[#141417]/40 hover:bg-[#141417]/80 border border-[#1f1f23] p-2.5 transition text-left cursor-pointer"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-850 text-zinc-200 border border-zinc-750 font-bold text-xs">
                {email ? email[0].toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-bold text-zinc-550 uppercase tracking-wider leading-none">
                  {role === 'ADMIN' ? 'Admin' : 'Seller'}
                </p>
                <p className="text-xs font-bold text-white truncate mt-1">{email}</p>
              </div>
            </button>
          )}

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <div className={`absolute bottom-16 z-50 w-52 bg-[#09090b] border border-[#1f1f23] rounded-xl shadow-2xl shadow-black p-1.5 space-y-0.5 animate-scale-in ${
              isCollapsed ? 'left-4' : 'left-4 right-4'
            }`}>
              <button
                onClick={() => {
                  setSettingsTab('profile');
                  setShowSettingsModal(true);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-[#141417] transition cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Profile Settings</span>
              </button>

              <button
                onClick={() => {
                  setSettingsTab('password');
                  setShowSettingsModal(true);
                  setShowDropdown(false);
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:bg-[#141417] transition cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                <span>Change Password</span>
              </button>

              <div className="h-px bg-[#1f1f23] my-1" />

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold text-rose-400 hover:text-rose-350 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Profile & Settings Dialog Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="relative w-full max-w-md bg-[#09090b] border border-[#1f1f23] rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 animate-scale-in text-xs">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#1f1f23] pb-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4.5 w-4.5 text-zinc-300" />
                <h3 className="font-extrabold text-white text-sm">Account Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-805 transition cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab Switches */}
            <div className="flex bg-[#141417] p-1 rounded-xl border border-[#1f1f23]">
              <button
                onClick={() => setSettingsTab('profile')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                  settingsTab === 'profile'
                    ? 'bg-white text-black'
                    : 'text-zinc-450 hover:text-white'
                }`}
              >
                Profile Info
              </button>
              <button
                onClick={() => setSettingsTab('password')}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold text-center transition cursor-pointer ${
                  settingsTab === 'password'
                    ? 'bg-white text-black'
                    : 'text-zinc-450 hover:text-white'
                }`}
              >
                Security & Password
              </button>
            </div>

            {/* Alert Logs */}
            {successMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-450 font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-455 font-bold flex items-center gap-2">
                <X className="h-4.5 w-4.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {settingsTab === 'profile' ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-550">
                      Display Name
                    </label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-555">
                      Email Address
                    </label>
                    <input
                      type="email"
                      readOnly
                      value={profileEmail}
                      className="w-full px-3.5 py-2.5 bg-[#1f1f23] border border-[#27272a] rounded-xl text-zinc-450 cursor-not-allowed select-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-550">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200"
                      />
                      <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-650" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-550">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200"
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-650" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-550">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-9 pr-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 text-zinc-200"
                      />
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-650" />
                    </div>
                  </div>
                </>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1f1f23]">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 border border-[#1f1f23] bg-transparent hover:bg-zinc-900 text-zinc-450 hover:text-white rounded-xl font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 bg-white hover:bg-zinc-200 text-black rounded-xl font-extrabold shadow-md transition disabled:opacity-55 cursor-pointer"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
export default Sidebar;
