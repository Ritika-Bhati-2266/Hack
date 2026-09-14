'use client';

import { Shield, AlertTriangle, CheckCircle2, Clock, ArrowRight } from 'lucide-react';
import { SimulationResult } from '@/types';

interface SplitViewProps {
  simulation: SimulationResult;
}

export default function SplitViewComparison({ simulation }: SplitViewProps) {
  const isWait = simulation.verdict === 'WAIT';
  const isEMI = simulation.verdict === 'EMI';

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <span>Split View Comparison</span>
            <span className="text-xs font-normal text-slate-400 font-mono">(PPT Slide 5 Spec)</span>
          </h3>
          <p className="text-xs text-slate-400">Comparing financial state BEFORE vs AFTER purchase of {simulation.itemName}</p>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400">Payment Mode:</span>
          <span className="text-xs font-bold text-emerald-400 font-mono ml-2 uppercase">
            {simulation.mode === 'CASH' ? 'Full Cash' : `${simulation.mode.replace('_', ' ')} Mo EMI`}
          </span>
        </div>
      </div>

      {/* Split Cards Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* LEFT CARD: STATE TODAY */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400" />
          
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                STATE TODAY
              </span>
              <h4 className="text-xl font-extrabold text-slate-100 mt-2">Baseline Position</h4>
            </div>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
              On Track
            </span>
          </div>

          <div className="space-y-4">
            {/* Liquid Emergency Buffer */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Safe Emergency Buffer</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  ₹{(simulation.todayBuffer / 1000).toFixed(0)}k
                </span>
                <span className="text-xs text-slate-400 font-mono">₹{simulation.todayBuffer.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Total ₹1.4L - ₹60k Earmarked</p>
            </div>

            {/* Safe Runway */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
              <span className="text-xs text-slate-400 font-medium">Safe Runway</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className="text-2xl font-black font-mono text-slate-100">
                  {simulation.todayRunwayMonths} <span className="text-sm font-sans font-normal text-slate-400">Months</span>
                </span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Healthy (&gt;3.0 Mo)
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Based on ₹1,500/day burn rate</p>
            </div>

            {/* Goal Impact */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Goal Target Status</span>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">Emergency Shield & Tech Fund</p>
              </div>
              <span className="text-xs font-bold text-emerald-400 font-mono">0 Mo Delay</span>
            </div>
          </div>
        </div>

        {/* RIGHT CARD: STATE SIMULATED */}
        <div className={`rounded-3xl bg-slate-900/90 border p-6 relative overflow-hidden shadow-xl ${
          isWait ? 'border-rose-500/30' : isEMI ? 'border-amber-500/30' : 'border-emerald-500/30'
        }`}>
          <div className={`absolute top-0 left-0 right-0 h-1 ${
            isWait ? 'bg-gradient-to-r from-rose-500 to-red-600' : isEMI ? 'bg-gradient-to-r from-amber-500 to-orange-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
          }`} />

          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 bg-slate-950 px-2.5 py-1 rounded-full border border-slate-800">
                STATE SIMULATED
              </span>
              <h4 className="text-xl font-extrabold text-slate-100 mt-2">Post-Purchase Position</h4>
            </div>
            <span className={`flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full border ${
              isWait
                ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                : isEMI
                ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
            }`}>
              {isWait ? <AlertTriangle className="w-3.5 h-3.5" /> : isEMI ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              {simulation.verdictBadge}
            </span>
          </div>

          <div className="space-y-4">
            {/* Liquid Emergency Buffer Simulated */}
            <div className={`p-4 rounded-2xl bg-slate-950/70 border ${isWait ? 'border-rose-500/20' : 'border-slate-800'}`}>
              <span className="text-xs text-slate-400 font-medium">Simulated Safe Buffer</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-2xl font-black font-mono ${isWait ? 'text-rose-400' : isEMI ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ₹{(simulation.simulatedBuffer / 1000).toFixed(0)}k
                </span>
                <span className="text-xs text-rose-400 font-mono font-bold">
                  -₹{((simulation.todayBuffer - simulation.simulatedBuffer) / 1000).toFixed(0)}k Drop
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                {simulation.mode === 'CASH'
                  ? `₹${simulation.purchasePrice.toLocaleString('en-IN')} cash deducted upfront`
                  : `₹${simulation.downPayment.toLocaleString('en-IN')} downpayment + ₹${simulation.monthlyEMI.toLocaleString('en-IN')}/mo EMI`}
              </p>
            </div>

            {/* Safe Runway Simulated */}
            <div className={`p-4 rounded-2xl bg-slate-950/70 border ${isWait ? 'border-rose-500/20' : 'border-slate-800'}`}>
              <span className="text-xs text-slate-400 font-medium">Simulated Safe Runway</span>
              <div className="flex items-baseline justify-between mt-1">
                <span className={`text-2xl font-black font-mono ${isWait ? 'text-rose-400' : 'text-slate-100'}`}>
                  {simulation.simulatedRunwayMonths} <span className="text-sm font-sans font-normal text-slate-400">Months</span>
                </span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                  isWait
                    ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                    : isEMI
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                }`}>
                  {isWait ? 'Vulnerable (<2.0 Mo)' : isEMI ? 'Moderate (2.0-3.0 Mo)' : 'Safe (>3.0 Mo)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Runway drop of {(simulation.todayRunwayMonths - simulation.simulatedRunwayMonths).toFixed(1)} months</p>
            </div>

            {/* Goal Delay Impact */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 font-medium">Goal Delay Impact</span>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">Overall Portfolio Targets</p>
              </div>
              <span className="text-xs font-bold text-amber-400 font-mono bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                Delayed +{simulation.goalDelayMonths} Months
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
