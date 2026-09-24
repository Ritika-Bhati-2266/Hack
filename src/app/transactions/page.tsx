'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ListFilter, Search, PlugZap } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import DataSourceBanner from '@/components/DataSourceBanner';

export default function TransactionsPage() {
  const { liveData } = useFinanceStore();
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [catFilter, setCatFilter] = useState('all');

  const txns = useMemo(() => liveData?.transactions || [], [liveData]);
  const categories = useMemo(
    () => [...new Set(txns.map((t) => t.parsedCategory || 'other'))].sort(),
    [txns]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return txns.filter((t) => {
      if (typeFilter !== 'all' && t.type !== typeFilter) return false;
      if (catFilter !== 'all' && (t.parsedCategory || 'other') !== catFilter) return false;
      if (q && !`${t.narration} ${t.amount}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [txns, query, typeFilter, catFilter]);

  const summary = useMemo(() => {
    let inflow = 0, outflow = 0;
    const byCat: Record<string, number> = {};
    for (const t of txns) {
      if (t.amount >= 0) inflow += t.amount;
      else outflow += Math.abs(t.amount);
      const c = t.parsedCategory || 'other';
      byCat[c] = (byCat[c] || 0) + Math.abs(t.amount);
    }
    const top = Object.entries(byCat).sort((a, b) => b[1] - a[1]).slice(0, 6);
    return { inflow, outflow, count: txns.length, top };
  }, [txns]);

  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const maxTop = Math.max(1, ...summary.top.map(([, v]) => v));

  if (!liveData) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-dusk hover:text-white">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.02] p-10 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center mx-auto">
            <PlugZap className="w-5 h-5 text-dusk" />
          </div>
          <p className="font-display font-extrabold text-lg mt-3">No transactions yet</p>
          <p className="text-sm text-mist mt-1 max-w-md mx-auto">Connect tab se AA ya CSV upload karo — yahan har transaction category ke saath dikhega.</p>
          <Link href="/connect" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-bold">
            Connect data →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-dusk hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <DataSourceBanner source={liveData.source} />

      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-surface p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-safe/10 border border-safe/25 text-safe text-[11px] font-bold">
            <ListFilter className="w-3.5 h-3.5" /> {summary.count} TRANSACTIONS • {liveData.meta?.parsedCount ?? 0} CATEGORIZED
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight mt-3">Where your money goes.</h1>
          <p className="text-sm text-mist mt-2">Parser {(liveData.meta?.parsingAccuracy ?? 0)}% accuracy — {liveData.source === 'csv' ? 'tumhare asli statement se' : 'live AA data se'}.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
            <div className="p-4 rounded-2xl bg-well/60 border border-white/[0.08]">
              <p className="text-[11px] text-dusk font-semibold">INFLOW</p>
              <p className="font-mono font-black text-safe mt-0.5">{inr(summary.inflow)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-well/60 border border-white/[0.08]">
              <p className="text-[11px] text-dusk font-semibold">OUTFLOW</p>
              <p className="font-mono font-black text-red-300 mt-0.5">{inr(summary.outflow)}</p>
            </div>
            <div className="p-4 rounded-2xl bg-well/60 border border-white/[0.08] col-span-2 sm:col-span-1">
              <p className="text-[11px] text-dusk font-semibold">NET</p>
              <p className="font-mono font-black text-white mt-0.5">{inr(summary.inflow - summary.outflow)}</p>
            </div>
          </div>
        </div>
      </div>

      {summary.top.length > 0 && (
        <div className="rounded-[24px] bg-surface border border-white/[0.08] p-6 space-y-3">
          <h2 className="font-display font-extrabold">Top categories</h2>
          {summary.top.map(([cat, amt]) => (
            <div key={cat}>
              <div className="flex justify-between text-xs font-mono mb-1">
                <span className="text-mist font-bold">{cat}</span>
                <span className="text-white">{inr(amt)}</span>
              </div>
              <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${(amt / maxTop) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-[24px] bg-surface border border-white/[0.08] p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="flex items-center gap-2 flex-1 bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2.5">
            <Search className="w-4 h-4 text-dusk shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search narration…" className="bg-transparent outline-none text-sm w-full placeholder:text-dusk" />
          </div>
          <div className="flex gap-1.5">
            {(['all', 'credit', 'debit'] as const).map((t) => (
              <button key={t} onClick={() => setTypeFilter(t)} className={`px-3.5 py-2 rounded-xl text-xs font-bold border ${typeFilter === t ? 'bg-primary text-white border-primary' : 'bg-white/5 text-mist border-white/[0.08]'}`}>
                {t === 'all' ? 'All' : t === 'credit' ? 'In ↑' : 'Out ↓'}
              </button>
            ))}
          </div>
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs font-bold text-mist outline-none">
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="divide-y divide-white/[0.06] max-h-[480px] overflow-y-auto">
          {filtered.map((t, i) => (
            <div key={i} className="flex items-center justify-between gap-3 py-3 px-1">
              <div className="min-w-0">
                <p className="font-bold text-[13px] truncate">{t.narration}</p>
                <p className="text-[11px] font-mono text-dusk mt-0.5">{t.date} • <span className="text-cyan-300">{t.parsedCategory || 'other'}</span></p>
              </div>
              <p className={`font-mono font-black text-sm shrink-0 ${t.amount >= 0 ? 'text-safe' : 'text-white'}`}>
                {t.amount >= 0 ? '+' : '−'}{inr(Math.abs(t.amount))}
              </p>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-sm text-dusk text-center py-8">Koi transaction match nahi hua — filter badlo.</p>
          )}
        </div>
      </div>
    </div>
  );
}
