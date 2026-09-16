'use client';

import { ShieldCheck, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function FinancialFirewall() {
  const { user } = useFinanceStore();

  const rent = user.earmarkedExpenses.find((e) => e.category === 'rent')?.amount || 35000;
  const sips = user.earmarkedExpenses.find((e) => e.category === 'sip')?.amount || 15000;
  const bills = user.earmarkedExpenses.find((e) => e.category === 'bill')?.amount || 10000;

  const totalEarmarked = rent + sips + bills; // ₹60,000
  const safeBuffer = user.totalBalance - totalEarmarked; // ₹80,000

  const earmarkedPercentage = Math.round((totalEarmarked / user.totalBalance) * 100);
  const safePercentage = 100 - earmarkedPercentage;

  return (
    <div className="relative overflow-hidden rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-2xl backdrop-blur-xl">
      {/* Background glow effects */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-emerald-400 shadow-md">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">Financial Firewall</h2>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Active Protection
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Always earmarks Rent + SIPs + Essential Bills before permitting spend calculations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-2xl border border-slate-800 self-start md:self-auto">
            <Lock className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-semibold text-slate-300">Protected Earmarked:</span>
            <span className="font-mono text-sm font-bold text-amber-400">₹{totalEarmarked.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Visual Multi-layered Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs font-semibold mb-2">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
              Earmarked Obligation Firewall ({earmarkedPercentage}%)
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
              Safe Unlocked Buffer ({safePercentage}%)
            </span>
          </div>

          <div className="h-4 w-full bg-slate-950 rounded-full p-0.5 flex overflow-hidden border border-slate-800 shadow-inner">
            {/* Rent chunk */}
            <div
              style={{ width: `${(rent / user.totalBalance) * 100}%` }}
              className="h-full bg-gradient-to-r from-amber-600 to-amber-500 rounded-l-full relative group transition-all"
              title={`Rent: ₹${rent}`}
            />
            {/* SIPs chunk */}
            <div
              style={{ width: `${(sips / user.totalBalance) * 100}%` }}
              className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 relative group transition-all border-l border-slate-950"
              title={`SIPs: ₹${sips}`}
            />
            {/* Bills chunk */}
            <div
              style={{ width: `${(bills / user.totalBalance) * 100}%` }}
              className="h-full bg-gradient-to-r from-sky-600 to-cyan-500 relative group transition-all border-l border-slate-950"
              title={`Bills: ₹${bills}`}
            />
            {/* Safe buffer chunk */}
            <div
              style={{ width: `${safePercentage}%` }}
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-r-full border-l border-slate-950 shadow-lg shadow-emerald-500/20"
              title={`Safe Buffer: ₹${safeBuffer}`}
            />
          </div>
        </div>

        {/* Earmarked Breakdown Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-start justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Fixed Rent</span>
              <p className="text-lg font-bold font-mono text-slate-100 mt-1">₹{rent.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-amber-400 mt-0.5 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Auto-locked (1st of month)
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-amber-400" />
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-start justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">SIP Investments</span>
              <p className="text-lg font-bold font-mono text-slate-100 mt-1">₹{sips.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-violet-400 mt-0.5 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Auto-debit (5th of month)
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-violet-400" />
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-4 flex items-start justify-between">
            <div>
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Upcoming Utility Bills</span>
              <p className="text-lg font-bold font-mono text-slate-100 mt-1">₹{bills.toLocaleString('en-IN')}</p>
              <p className="text-[11px] text-cyan-400 mt-0.5 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Estimated (10th of month)
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
          </div>
        </div>

        {/* RBI AA Notice — dynamic, no hardcoded ₹1.4L */}
        <div className="mt-4 p-3 bg-slate-950/40 rounded-xl border border-slate-800/50 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Firewall Rule: Total Balance (₹{user.totalBalance.toLocaleString('en-IN')}) - Earmarked (₹{totalEarmarked.toLocaleString('en-IN')}) = ₹{safeBuffer.toLocaleString('en-IN')} Liquid Buffer.</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">Rule ID: FW-RBI-2026</span>
        </div>

      </div>
    </div>
  );
}
