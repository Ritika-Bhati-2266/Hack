'use client';

import Link from 'next/link';
import { ArrowLeft, Target } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function GoalsPage() {
  const { goals, currentSimulation } = useFinanceStore();

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      <div>
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <Target className="w-6 h-6 text-teal-400" /> Goals
        </h1>
        <p className="text-sm text-slate-400 mt-1">Progress + delay impact from the latest simulation.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.currentAmount / Math.max(1, g.targetAmount)) * 100));
          const delay = currentSimulation?.perGoalDelays?.find((d) => d.goalId === g.id)?.delayMonths ?? 0;
          return (
            <div key={g.id} className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-3">
              <h3 className="font-bold text-slate-100">{g.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                ₹{g.currentAmount.toLocaleString('en-IN')} / ₹{g.targetAmount.toLocaleString('en-IN')} • {pct}%
              </p>
              <div className="h-2.5 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-400" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-xs text-slate-400">
                ₹{g.monthlyContribution.toLocaleString('en-IN')}/mo • target {g.targetDate}
                {delay > 0 && <span className="ml-2 font-bold text-amber-400">+{delay} Mo delay (simulated)</span>}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
