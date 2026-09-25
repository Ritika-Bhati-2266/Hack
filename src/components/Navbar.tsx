'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, FlaskConical, PlugZap, Target, List, History, Star, Plus, Trash2 } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import CreateProfileModal from '@/components/CreateProfileModal';

export default function Navbar() {
  const pathname = usePathname();
  const { activeCustomer, customProfiles, liveData } = useFinanceStore();
  const deleteProfile = useFinanceStore((s) => s.deleteProfile);
  const [showCreate, setShowCreate] = useState(false);

  const pillLabel =
    activeCustomer === 'live' && liveData
      ? `Live • ${liveData.source === 'csv' ? 'CSV' : 'AA'}`
      : customProfiles[activeCustomer]?.label || 'No Data';
  // Manual profiles can be deleted from here; live data goes via /connect (DPDP).
  const isCustomProfile = !!customProfiles[activeCustomer];

  const navLinks = [
    { href: '/', label: 'Home', icon: LayoutDashboard },
    { href: '/simulator', label: 'Simulator', icon: FlaskConical },
    { href: '/transactions', label: 'Txns', icon: List },
    { href: '/connect', label: 'Connect', icon: PlugZap },
    { href: '/goals', label: 'Goals', icon: Target },
    { href: '/history', label: 'History', icon: History },
    { href: '/pro', label: 'Pro', icon: Star },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#030712]/80 border-b border-white/[0.08] pt-safe">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex items-center justify-between gap-3 min-w-0">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-400 to-indigo-500 flex items-center justify-center shadow-[0_0_25px_rgba(0,240,255,0.4)] group-hover:scale-105 group-hover:rotate-6 transition-all">
            <span className="font-display font-black text-white text-xl leading-none tracking-tight">P</span>
          </div>
          <div className="leading-none">
            <div className="flex items-center gap-2">
              <span className="font-display font-extrabold text-[20px] tracking-tight text-white">
                PREVISE<span className="text-cyan-400">.</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                AA ENGINE
              </span>
            </div>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Know before you decide</p>
          </div>
        </Link>

        {/* Pill nav */}
        <nav className="hidden md:flex items-center gap-1.5 p-1.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl shadow-inner">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,240,255,0.4)] font-bold'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400/80'}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Profile cluster (right) — matches dashboard PROFILES pill style */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          <div
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white text-xs font-bold border border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            {pillLabel}
          </div>
          {isCustomProfile && (
            <button
              onClick={() => {
                if (window.confirm(`Delete profile "${pillLabel}"? This cannot be undone.`)) {
                  deleteProfile(activeCustomer);
                }
              }}
              title="Delete active profile"
              className="inline-flex items-center p-2 rounded-xl border border-red-400/30 text-red-300 text-xs transition-all active:scale-95 hover:bg-red-500/20"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all active:scale-95 hover:border-cyan-400 hover:bg-cyan-500/10"
          >
            <Plus className="w-3.5 h-3.5" /> Create Profile
          </button>
        </div>
        <CreateProfileModal open={showCreate} onClose={() => setShowCreate(false)} />
      </div>

      {/* Mobile nav */}
      <div className="md:hidden border-t border-white/[0.08] px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar touch-scroll">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3.5 py-2 min-h-[44px] rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
                isActive ? 'bg-cyan-500 text-white shadow-[0_0_12px_rgba(0,240,255,0.4)]' : 'text-gray-300 bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
