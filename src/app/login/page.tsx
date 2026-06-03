"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";
import { Activity, AlertTriangle } from "lucide-react";

export default function LoginPage() {
  const [errorMessage, formAction, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-[#09090b] relative overflow-hidden font-sans">
      {/* Decorative Monochrome Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-zinc-850/50 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-[#09090b] border border-[#1f1f23] rounded-2xl shadow-2xl shadow-black/80 overflow-hidden relative z-10 animate-scale-in">
        {/* Logo and Brand */}
        <div className="flex flex-col items-center pt-8 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-700 text-white shadow-md mb-3">
            <Activity className="h-5.5 w-5.5" />
          </div>
          <span className="text-xl font-black tracking-wider text-white">Medsell</span>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest leading-none mt-1">Pharma Platform</p>
        </div>

        <div className="px-8 pb-3 text-center">
          <h2 className="text-base font-bold text-white">Welcome Back</h2>
          <p className="text-[11px] text-zinc-500 mt-1">Access your inventory and catalog metrics dashboard</p>
        </div>

        <form action={formAction} className="px-8 pb-8 pt-4 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-450 font-bold flex items-center gap-2">
              <AlertTriangle className="h-4.5 w-4.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="admin@example.com"
              className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 transition text-zinc-200 text-xs"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              Account Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 bg-[#141417] border border-[#1f1f23] rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-500 transition text-zinc-200 text-xs"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center bg-white hover:bg-zinc-200 disabled:bg-[#141417] disabled:border-[#1f1f23] disabled:text-zinc-650 text-black rounded-xl py-2.5 text-xs font-black transition cursor-pointer disabled:cursor-not-allowed shadow-md"
            >
              {isPending ? "Authenticating..." : "Sign In to Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
