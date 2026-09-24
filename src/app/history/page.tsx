'use client';

import Link from 'next/link';
import { ArrowLeft, History as HistoryIcon, Trash2 } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';

export default function HistoryPage() {
  const { history, feedbackHistory, clearHistory } = useFinanceStore();
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const bought = history.filter((h) => h.feedback === 'bought').length;
  const skipped = history.filter((h) => h.feedback === 'skipped').length;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/simulator" className="inline-flex items-center gap-2 text-xs text-dusk hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Simulator
      </Link>

      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-surface p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-400/10 border border-cyan-400/25 text-cyan-300 text-[11px] font-bold">
              <HistoryIcon className="w-3.5 h-3.5" /> {history.length} SIMULATIONS LOGGED
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight mt-3">Did you buy it?</h1>
            <p className="text-sm text-mist mt-2">Feedback do — bought vs skipped. Yehi data Phase 3 me ML training banega. {bought} bought • {skipped} skipped.</p>
          </div>
          {history.length > 0 && (
            <button onClick={clearHistory} className="inline-flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20">
              <Trash2 className="w-4 h-4" /> Clear
            </button>
          )}
        </div>
      </div>

      {history.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.02] p-10 text-center">
          <p className="font-display font-extrabold text-lg">No history yet</p>
          <p className="text-sm text-mist mt-1">Run your first simulation in the Simulator — it gets auto-logged here.</p>
          <Link href="/simulator" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold">
            Open simulator →
          </Link>
        </div>
      ) : (
        <div className="space-y-2.5">
          {history.map((h) => (
            <div key={h.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl bg-surface border border-white/[0.08] px-4 py-3.5">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">{h.itemName} • {inr(h.price)} • {h.mode}</p>
                <p className="text-[11px] font-mono text-dusk mt-0.5">
                  {new Date(h.timestamp).toLocaleString('en-IN')} • <b className={h.verdict === 'WAIT' ? 'text-red-300' : h.verdict === 'EMI' ? 'text-amber-300' : 'text-safe'}>{h.verdict}</b>
                  {h.feedback && <span className="text-mist"> • you {h.feedback}</span>}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <button onClick={() => feedbackHistory(h.id, 'bought')} className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border ${h.feedback === 'bought' ? 'bg-safe text-black border-safe' : 'bg-white/5 text-mist border-white/[0.08] hover:text-white'}`}>
                  ✓ Bought
                </button>
                <button onClick={() => feedbackHistory(h.id, 'skipped')} className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border ${h.feedback === 'skipped' ? 'bg-white text-black border-white' : 'bg-white/5 text-mist border-white/[0.08] hover:text-white'}`}>
                  Skipped
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
