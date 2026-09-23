'use client';

import { FlaskConical, FileCheck2, UserRound } from 'lucide-react';

type Source = 'aa' | 'csv' | 'mock' | string;

/**
 * DataSourceBanner — judges ko 2 sec me clear kare:
 * sirf CSV real hai, AA + personas + default sab mock/demo hain.
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
            Ye tumhare upload kiye statement ke <b className="text-white">asli numbers</b> hain
            + tumhara diya hua balance. Yahi ek real source hai.
          </p>
        </div>
      </div>
    );
  }

  if (source === 'aa') {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 border border-amber-400/30">
          <FlaskConical className="h-4 w-4 text-amber-300" />
        </span>
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-[0.18em] text-amber-300">
            DEMO MODE — MOCK DATA ⚠ NOT REAL
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-mist">
            AA flow abhi <b className="text-white">mock TSP</b> hai — fake transactions generate hoti hain,
            real bank sync nahi. Real numbers ke liye <b className="text-white">CSV upload</b> karo.
          </p>
        </div>
      </div>
    );
  }

  // mock / fallback / default Priya Sharma profile
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.04] px-4 py-3.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/[0.08]">
        <UserRound className="h-4 w-4 text-mist" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-black tracking-[0.18em] text-mist">
          DEMO DATA — DEFAULT PROFILE
        </p>
        <p className="mt-1 text-[13px] leading-relaxed text-mist">
          Koi session data nahi — demo profile (Priya Sharma) dikh raha hai. AA mock hai,
          real data sirf CSV se aata hai.
        </p>
      </div>
    </div>
  );
}
