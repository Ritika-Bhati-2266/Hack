'use client';

import Link from 'next/link';
import { ArrowLeft, Target, TrendingUp, CalendarClock } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function GoalsPage() {
  const { goals, currentSimulation } = useFinanceStore();
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-dusk hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-surface p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -top-16 right-10 w-[300px] h-[180px] bg-violet-500/15 blur-[90px] rounded-full pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-400/10 border border-violet-400/25 text-violet-300 text-[11px] font-bold">
              <Target className="w-3.5 h-3.5" /> {goals.length} ACTIVE GOALS
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight mt-3">Goals, with consequences.</h1>
            <p className="text-sm text-mist mt-2">Har simulation batata hai — ye purchase tumhare goal ko kitne months delay karega.</p>
          </div>
          {currentSimulation ? (
            <span className="text-[11px] font-mono px-3 py-2 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 whitespace-nowrap">
              SIM IMPACT: +{currentSimulation.goalDelayMonths} mo avg
            </span>
          ) : (
            <Link href="/simulator" className="text-xs font-extrabold px-4 py-2.5 rounded-xl bg-primary text-white whitespace-nowrap hover:brightness-110">
              Run a simulation →
            </Link>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.length === 0 && (
          <div className="md:col-span-2 rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center animate-fade-up">
            <div className="w-12 h-12 rounded-2xl bg-violet-400/10 border border-violet-400/25 flex items-center justify-center mx-auto">
              <Target className="w-5 h-5 text-violet-300" />
            </div>
            <p className="font-display font-extrabold text-lg mt-3">No goals yet</p>
            <p className="text-sm text-mist mt-1 max-w-md mx-auto">Dashboard pe apni profile banao ya Connect se CSV upload karo — goals yahan progress + delay impact ke saath dikhenge.</p>
            <Link href="/connect" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-white/5 border border-white/[0.08] text-xs font-bold text-frost transition-all active:scale-95 hover:bg-white/10">
              Connect data →
            </Link>
          </div>
        )}
        {goals.map((g, i) => {
          const pct = Math.min(100, Math.round((g.currentAmount / Math.max(1, g.targetAmount)) * 100));
          const delay = currentSimulation?.perGoalDelays?.find((d) => d.goalId === g.id)?.delayMonths ?? 0;
          const remaining = g.targetAmount - g.currentAmount;
          return (
            <div key={g.id} className="rounded-[24px] bg-surface border border-white/[0.08] p-4 sm:p-6 space-y-4 card-hover animate-fade-up min-w-0" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-extrabold text-[17px] break-words">{g.name}</h3>
                  <p className="text-[11px] text-dusk font-mono mt-1 flex items-center gap-1.5">
                    <CalendarClock className="w-3 h-3" /> target {g.targetDate} • {inr(g.monthlyContribution)}/mo
                  </p>
                </div>
                <span className={`font-display font-black text-2xl ${pct >= 70 ? 'text-safe' : pct >= 40 ? 'text-amber-300' : 'text-mist'}`}>{pct}%</span>
              </div>
              <div className="h-3 bg-well/70 rounded-full border border-white/[0.08] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-safe to-cyan-300 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex items-center justify-between font-mono text-[12px]">
                <span className="text-mist">{inr(g.currentAmount)} <span className="text-dusk">/ {inr(g.targetAmount)}</span></span>
                <span className="text-dusk">{inr(Math.max(0, remaining))} left</span>
              </div>
              {delay > 0 ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-400/[0.08] border border-amber-400/25 text-[12px]">
                  <TrendingUp className="w-4 h-4 text-amber-300" />
                  <span className="text-mist">This purchase delays it by</span>
                  <b className="font-mono text-amber-300">+{delay} mo</b>
                </div>
              ) : (
                <div className="px-3.5 py-2.5 rounded-2xl bg-safe/[0.07] border border-safe/20 text-[12px] text-safe font-semibold">
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
