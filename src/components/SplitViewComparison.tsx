'use client';

import { AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { SimulationResult } from '@/types';

export default function SplitViewComparison({ simulation }: { simulation: SimulationResult }) {
  const isWait = simulation.verdict === 'WAIT';
  const isEMI = simulation.verdict === 'EMI';
  const accent = isWait ? 'text-red-300' : isEMI ? 'text-amber-300' : 'text-[#10B981]';
  const border = isWait ? 'border-red-500/30' : isEMI ? 'border-amber-400/30' : 'border-[#10B981]/25';
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="font-display font-extrabold text-lg">Before vs After</h3>
          <p className="text-xs text-slate-500">Financial state before vs after buying <b className="text-slate-300">{simulation.itemName}</b></p>
        </div>
        <span className="text-[11px] font-mono text-slate-500 uppercase">{simulation.mode === 'CASH' ? 'full cash' : simulation.mode.replace('_', ' ') + ' EMI'}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* TODAY */}
        <div className="rounded-[24px] border border-white/10 bg-[#0B111E] p-4 sm:p-6 relative overflow-hidden min-w-0 card-hover">
          <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500/70" />
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-black tracking-[0.18em] text-slate-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">STATE TODAY</span>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
              <CheckCircle2 className="w-3.5 h-3.5" /> On track
            </span>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-black/50 border border-white/[0.07] p-4">
              <p className="text-[11px] text-slate-500 font-semibold">Safe buffer</p>
              <p className="font-mono font-black text-2xl text-emerald-300 mt-0.5">{inr(simulation.todayBuffer)}</p>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">{inr(simulation.todayBalance)} − {inr(simulation.todayEarmarked)} locked</p>
            </div>
            <div className="rounded-2xl bg-black/50 border border-white/[0.07] p-4">
              <p className="text-[11px] text-slate-500 font-semibold">Runway</p>
              <p className="font-mono font-black text-2xl mt-0.5">{simulation.todayRunwayMonths} <span className="text-xs font-sans font-normal text-slate-500">months</span></p>
            </div>
            <div className="rounded-2xl bg-black/50 border border-white/[0.07] p-4 flex items-center justify-between">
              <p className="text-[11px] text-slate-500 font-semibold">Goals</p>
              <p className="text-[11px] font-mono font-bold text-emerald-300">0 mo delay</p>
            </div>
          </div>
        </div>

        {/* SIMULATED */}
        <div className={`rounded-[24px] border bg-[#0B111E] p-4 sm:p-6 relative overflow-hidden min-w-0 card-hover ${border}`}>
          <div className={`absolute top-0 left-0 right-0 h-1 ${isWait ? 'bg-red-500' : isEMI ? 'bg-amber-400' : 'bg-[#10B981]'}`} />
          <div className="flex items-center justify-between mb-5">
            <span className="text-[10px] font-black tracking-[0.18em] text-slate-500 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">STATE SIMULATED</span>
            <span className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${isWait ? 'text-red-300 bg-red-500/10 border-red-500/25' : isEMI ? 'text-amber-300 bg-amber-400/10 border-amber-400/25' : 'text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25'}`}>
              {isWait ? <AlertTriangle className="w-3.5 h-3.5" /> : isEMI ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {simulation.verdictBadge}
            </span>
          </div>
          <div className="space-y-3">
            <div className="rounded-2xl bg-black/50 border border-white/[0.07] p-4">
              <p className="text-[11px] text-slate-500 font-semibold">Simulated buffer</p>
              <div className="flex items-baseline justify-between mt-0.5">
                <p className={`font-mono font-black text-2xl ${accent}`}>{inr(simulation.simulatedBuffer)}</p>
                <p className="text-[11px] font-mono font-bold text-red-300">−{inr(simulation.todayBuffer - simulation.simulatedBuffer)}</p>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                {simulation.mode === 'CASH' ? `${inr(simulation.purchasePrice)} cash upfront` : `${inr(simulation.downPayment)} down + ${inr(simulation.monthlyEMI)}/mo × ${simulation.emiMonths}`}
              </p>
            </div>
            <div className="rounded-2xl bg-black/50 border border-white/[0.07] p-4">
              <p className="text-[11px] text-slate-500 font-semibold">Simulated runway</p>
              <div className="flex items-baseline justify-between mt-0.5">
                <p className="font-mono font-black text-2xl">{simulation.simulatedRunwayMonths} <span className="text-xs font-sans font-normal text-slate-500">months</span></p>
                <p className="text-[11px] font-mono text-slate-500">−{(simulation.todayRunwayMonths - simulation.simulatedRunwayMonths).toFixed(1)} mo</p>
              </div>
            </div>
            <div className="rounded-2xl bg-black/50 border border-white/[0.07] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[11px] text-slate-500 font-semibold">Goal delay</p>
                <p className="text-[11px] font-mono font-bold text-amber-300">+{simulation.goalDelayMonths} mo avg</p>
              </div>
              {simulation.perGoalDelays && (
                <div className="mt-2 pt-2 border-t border-white/[0.07] space-y-1">
                  {simulation.perGoalDelays.map((g) => (
                    <div key={g.goalId} className="flex justify-between text-[11px]">
                      <span className="text-slate-500">{g.goalName.split(' ').slice(0, 2).join(' ')}</span>
                      <span className="font-mono text-amber-300">+{g.delayMonths} mo</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
