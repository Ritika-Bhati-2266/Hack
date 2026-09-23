'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FlaskConical, PlugZap, Target } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useFinanceStore();

  const totalEarmarked = user.earmarkedExpenses.reduce((acc, c) => acc + c.amount, 0);
  const buffer = user.totalBalance - totalEarmarked;

  const navLinks = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/simulator', label: 'Simulator', icon: FlaskConical, hot: true },
    { href: '/connect', label: 'Connect', icon: PlugZap },
    { href: '/goals', label: 'Goals', icon: Target },
  ];

  return (
    <header className="sticky top-0 z-50">
      <div className="backdrop-blur-2xl bg-base/80 border-b border-white/15">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-[#10B981] flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.35)] group-hover:rotate-6 transition-transform">
              <span className="font-display font-black text-black text-xl leading-none">P</span>
            </div>
            <div className="leading-none">
              <div className="flex items-center gap-2">
                <span className="font-display font-extrabold text-[19px] tracking-tight">
                  PREVISE<span className="text-[#10B981]">.</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  AA MOCK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">Know before you decide</p>
            </div>
          </Link>

          {/* Pill nav */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/15">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                    isActive
                      ? 'bg-[#10B981] text-black shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                  {link.hot && !isActive && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/20">
                      DEMO
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Buffer pill */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:block text-right leading-none">
              <p className="text-[10px] font-bold tracking-widest text-slate-500">SAFE BUFFER</p>
              <p className="font-mono font-bold text-[15px] mt-1">
                ₹{(buffer / 1000).toFixed(1)}k
              </p>
            </div>
            <Link
              href="/simulator"
              className="md:hidden px-4 py-2.5 rounded-xl bg-[#10B981] text-black text-[13px] font-extrabold"
            >
              Simulate
            </Link>
            <Link
              href="/simulator"
              className="hidden md:inline-flex px-5 py-2.5 rounded-xl bg-[#10B981] text-black text-[13px] font-extrabold hover:brightness-110 hover:shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all"
            >
              Try Simulator →
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="md:hidden border-t border-white/15 px-4 py-2 flex gap-1 overflow-x-auto">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${
                  isActive ? 'bg-[#10B981] text-black' : 'text-slate-400 bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
