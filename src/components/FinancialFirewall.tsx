'use client';

import { ShieldCheck, Lock } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function FinancialFirewall() {
  const { user } = useFinanceStore();

  const rent = user.earmarkedExpenses.find((e) => e.category === 'rent')?.amount || 35000;
  const sips = user.earmarkedExpenses.find((e) => e.category === 'sip')?.amount || 15000;
  const bills = user.earmarkedExpenses.find((e) => e.category === 'bill')?.amount || 10000;
  const emi = user.earmarkedExpenses.filter((e) => e.category === 'emi').reduce((s, e) => s + e.amount, 0);

  const totalEarmarked = user.earmarkedExpenses.reduce((s, e) => s + e.amount, 0);
  const safeBuffer = user.totalBalance - totalEarmarked;

  const earmarkedPct = Math.round((totalEarmarked / Math.max(1, user.totalBalance)) * 100);
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#0b0f19]/90 backdrop-blur-2xl p-6 sm:p-8 min-w-0 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
      <div className="absolute -top-24 right-0 w-[450px] h-[280px] bg-amber-400/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-24 left-0 w-[450px] h-[280px] bg-cyan-400/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.25)]">
              <ShieldCheck className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="font-display font-black text-xl text-white">Financial Firewall</h2>
                <span className="text-[10px] font-mono font-black tracking-widest px-2.5 py-0.5 rounded-full bg-cyan-400/15 text-cyan-300 border border-cyan-400/30 animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                  ● ACTIVE
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Rent + SIP + bills pehle lock — uske baad hi safe-to-spend.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white/[0.04] px-4 py-2.5 rounded-2xl border border-white/10 self-start md:self-auto backdrop-blur-md">
            <Lock className="w-4 h-4 text-amber-300" />
            <span className="text-xs text-gray-300 font-semibold">Locked:</span>
            <span className="font-mono text-sm font-black text-amber-300">{inr(totalEarmarked)}</span>
            <span className="text-[11px] font-mono text-gray-400">({earmarkedPct}%)</span>
          </div>
        </div>

        {/* Bar */}
        <div className="mb-2 flex items-center justify-between text-[11px] font-bold tracking-widest">
          <span className="text-amber-300/80">■ EARMARKED {earmarkedPct}%</span>
          <span className="text-safe">■ FREE BUFFER {100 - earmarkedPct}%</span>
        </div>
        <div className="h-5 w-full bg-well/70 rounded-full p-1 flex overflow-hidden border border-white/[0.08]">
          <div style={{ width: `${(rent / Math.max(1, user.totalBalance)) * 100}%` }} className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-l-full" title={`Rent ${inr(rent)}`} />
          <div style={{ width: `${(sips / Math.max(1, user.totalBalance)) * 100}%` }} className="h-full bg-gradient-to-r from-violet-500 to-indigo-400 border-l border-base" title={`SIP ${inr(sips)}`} />
          <div style={{ width: `${(bills / Math.max(1, user.totalBalance)) * 100}%` }} className="h-full bg-gradient-to-r from-sky-500 to-cyan-400 border-l border-base" title={`Bills ${inr(bills)}`} />
          {emi > 0 && (
            <div style={{ width: `${(emi / Math.max(1, user.totalBalance)) * 100}%` }} className="h-full bg-gradient-to-r from-orange-500 to-red-400 border-l border-base" title={`EMI ${inr(emi)}`} />
          )}
          <div className="h-full bg-gradient-to-r from-safe to-cyan-300 rounded-r-full border-l border-base shadow-[0_0_20px_rgba(6,182,212,0.4)] flex-1" title={`Buffer ${inr(safeBuffer)}`} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-dusk">
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-400" /> Rent</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-400" /> SIP</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Bills</span>
          {emi > 0 && (
            <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-400" /> EMI</span>
          )}
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-safe" /> Free buffer</span>
        </div>

        <div className={`grid grid-cols-1 gap-3 mt-5 ${emi > 0 ? 'sm:grid-cols-4' : 'sm:grid-cols-3'}`}>
          {[
            { label: 'RENT • 1st', amt: rent, dot: 'bg-amber-400', text: 'text-amber-300' },
            { label: 'SIP • 5th', amt: sips, dot: 'bg-violet-400', text: 'text-violet-300' },
            { label: emi > 0 ? 'BILLS • 10th' : 'BILLS • 10th', amt: bills, dot: 'bg-cyan-400', text: 'text-cyan-300' },
            ...(emi > 0 ? [{ label: 'EMI • 1st', amt: emi, dot: 'bg-orange-400', text: 'text-orange-300' }] : []),
          ].map((c) => (
            <div key={c.label} className="rounded-2xl bg-well/50 border border-white/[0.08] p-4 flex items-center justify-between gap-2 min-w-0 transition-colors hover:border-white/[0.14]">
              <div className="min-w-0">
                <p className="text-[10px] font-black tracking-[0.15em] text-dusk">{c.label}</p>
                <p className="font-mono font-black text-lg mt-1">{inr(c.amt)}</p>
              </div>
              <span className={`w-2.5 h-2.5 rounded-full ${c.dot}`} />
            </div>
          ))}
        </div>

        <p className="mt-4 font-mono text-[11px] text-dusk bg-well/50 border border-white/[0.08] rounded-xl px-4 py-2.5">
          <span className="text-orange-300">✓ RULE FW-RBI-2026:</span> {inr(user.totalBalance)} − {inr(totalEarmarked)} = <b className="text-white">{inr(safeBuffer)}</b> liquid buffer
        </p>
      </div>
    </div>
  );
}
