'use client';

import Link from 'next/link';
import { ArrowLeft, Target, TrendingUp, CalendarClock } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function GoalsPage() {
  const { goals, currentSimulation } = useFinanceStore();
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0B111E] p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -top-16 right-10 w-[300px] h-[180px] bg-violet-500/15 blur-[90px] rounded-full pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-400/10 border border-violet-400/25 text-violet-300 text-[11px] font-bold">
              <Target className="w-3.5 h-3.5" /> {goals.length} ACTIVE GOALS
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight mt-3">Goals, with consequences.</h1>
            <p className="text-sm text-slate-400 mt-2">Har simulation batata hai — ye purchase tumhare goal ko kitne months delay karega.</p>
          </div>
          {currentSimulation ? (
            <span className="text-[11px] font-mono px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 whitespace-nowrap">
              SIM IMPACT: +{currentSimulation.goalDelayMonths} mo avg
            </span>
          ) : (
            <Link href="/simulator" className="text-xs font-extrabold px-4 py-2.5 rounded-xl bg-[#10B981] text-black whitespace-nowrap hover:brightness-110">
              Run a simulation →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g, i) => {
          const pct = Math.min(100, Math.round((g.currentAmount / Math.max(1, g.targetAmount)) * 100));
          const delay = currentSimulation?.perGoalDelays?.find((d) => d.goalId === g.id)?.delayMonths ?? 0;
          const remaining = g.targetAmount - g.currentAmount;
          return (
            <div key={g.id} className="rounded-[24px] bg-[#0B111E] border border-white/10 p-6 space-y-4 card-hover animate-fade-up" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-display font-extrabold text-[17px]">{g.name}</h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-1.5">
                    <CalendarClock className="w-3 h-3" /> target {g.targetDate} • {inr(g.monthlyContribution)}/mo
                  </p>
                </div>
                <span className={`font-display font-black text-2xl ${pct >= 70 ? 'text-[#10B981]' : pct >= 40 ? 'text-amber-300' : 'text-slate-300'}`}>{pct}%</span>
              </div>
              <div className="h-3 bg-black/60 rounded-full border border-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-[#10B981] to-emerald-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between font-mono text-[12px]">
                <span className="text-slate-400">{inr(g.currentAmount)} <span className="text-slate-600">/ {inr(g.targetAmount)}</span></span>
                <span className="text-slate-500">{inr(Math.max(0, remaining))} left</span>
              </div>
              {delay > 0 ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-400/[0.08] border border-amber-400/25 text-[12px]">
                  <TrendingUp className="w-4 h-4 text-amber-300" />
                  <span className="text-slate-300">This purchase delays it by</span>
                  <b className="font-mono text-amber-300">+{delay} mo</b>
                </div>
              ) : (
                <div className="px-3.5 py-2.5 rounded-2xl bg-emerald-400/[0.07] border border-emerald-400/20 text-[12px] text-emerald-300 font-semibold">
                  ✓ No delay from current simulation
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
