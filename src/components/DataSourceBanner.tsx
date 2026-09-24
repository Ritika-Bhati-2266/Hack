'use client';

import { FileCheck2, Landmark, PlugZap } from 'lucide-react';

type Source = 'aa' | 'csv' | string;

/**
 * DataSourceBanner — production mode: only real sources.
 * csv = your uploaded statement, aa = live Account Aggregator.
 */
export default function DataSourceBanner({ source }: { source: Source }) {
  if (source === 'csv') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-safe/30 bg-safe/[0.08] px-4 py-3.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-safe/15 border border-safe/30">
          <FileCheck2 className="h-4 w-4 text-safe" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-[0.18em] text-safe">
            LIVE DATA — YOUR CSV ✓ REAL
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-mist">
            These are the <b className="text-white">real numbers</b> from your uploaded
            statement, plus the balance you entered.
          </p>
        </div>
      </div>
    );
  }

  if (source === 'aa') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-safe/30 bg-safe/[0.08] px-4 py-3.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-safe/15 border border-safe/30">
          <Landmark className="h-4 w-4 text-safe" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-[0.18em] text-safe">
            LIVE DATA — ACCOUNT AGGREGATOR ✓
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-mist">
            <b className="text-white">Live data</b> straight from your bank — powering
            these same numbers in the Dashboard + Simulator.
          </p>
        </div>
      </div>
    );
  }

  // no session / unknown — must connect first
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 border border-amber-400/30">
        <PlugZap className="h-4 w-4 text-amber-300" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-black tracking-[0.18em] text-amber-300">
          NO DATA — CONNECT REQUIRED
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-mist">
            No bank data connected yet. <b className="text-white">Connect</b> via AA or CSV
            on the Connect page — only then will runway and verdicts be accurate.
        </p>
      </div>
    </div>
  );
}
