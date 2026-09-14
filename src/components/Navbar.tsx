'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, Cpu, Target, ArrowUpRight, Zap, RefreshCw } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useFinanceStore();

  const totalEarmarked = user.earmarkedExpenses.reduce((acc, c) => acc + c.amount, 0);
  const buffer = user.totalBalance - totalEarmarked;

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Shield },
    { href: '/simulator', label: 'What-If Simulator', icon: Cpu, badge: 'MOST IMPORTANT' },
    { href: '/goals', label: 'Goals', icon: Target },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-emerald-200 to-teal-300">
                  PREVISE
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  AA Linked
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Know Before You Decide</p>
            </div>
          </Link>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800/80 shadow-inner">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'text-emerald-400 bg-slate-800 shadow-md shadow-emerald-950/40 border border-emerald-500/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
                {link.badge && (
                  <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Account / Buffer Status Badge */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
              <span>Safe Buffer</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            </div>
            <div className="font-bold text-sm text-slate-100 font-mono">
              ₹{(buffer / 1000).toFixed(1)}k <span className="text-slate-500 text-xs font-normal">/ ₹{(user.totalBalance / 1000).toFixed(0)}k</span>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 p-1.5 rounded-xl">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-xs text-white shadow-inner">
              AA
            </div>
            <div className="hidden xl:block text-left text-xs pr-1">
              <p className="font-semibold text-slate-200 leading-tight">RBI Account Aggregator</p>
              <p className="text-[10px] text-emerald-400 font-mono">Synced 2m ago</p>
            </div>
          </div>
        </div>

      </div>
    </header>
  );
}
