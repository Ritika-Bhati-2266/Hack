'use client';

import Link from 'next/link';
import { ArrowLeft, ShieldCheck, Trash2, Clock, FileText, Mail } from 'lucide-react';

const CONSENT_VERSION = 'v1-2026-09';

export default function PrivacyPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-dusk hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="rounded-[28px] border border-white/[0.08] bg-surface p-6 sm:p-8 space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-safe/10 border border-safe/25 text-safe text-[11px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" /> DPDP COMPLIANCE • CONSENT {CONSENT_VERSION}
        </div>
        <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight">Privacy & data policy</h1>
        <p className="text-sm text-mist">India’s Digital Personal Data Protection Act ke hisaab se — short, honest version.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        {[
          { icon: FileText, t: 'Purpose limitation', d: 'Tumhara data sirf ek kaam ke liye use hota hai — purchase simulation. Marketing, resale, kuch nahi.' },
          { icon: ShieldCheck, t: 'Explicit consent', d: `AA flow me consent approve karne pe hi data fetch hota hai. Har consent pe version stamp lagta hai (current: ${CONSENT_VERSION}).` },
          { icon: Clock, t: 'Retention — 1 hour sessions', d: 'Bank data sirf session me rehta hai, 1 hour TTL ke saath auto-delete. Beta signup emails 90 din ki inactivity ke baad delete — retention policy v1.' },
          { icon: Trash2, t: 'Right to erasure', d: 'Connect tab → “Delete My Data” dabao — session, accounts, transactions turant wipe. Koi backup nahi rakha jata.' },
        ].map((c) => (
          <div key={c.t} className="rounded-[24px] bg-surface border border-white/[0.08] p-5 space-y-2">
            <c.icon className="w-5 h-5 text-safe" />
            <h2 className="font-display font-extrabold">{c.t}</h2>
            <p className="text-[13px] text-mist leading-relaxed">{c.d}</p>
          </div>
        ))}
      </div>

      <div className="rounded-[24px] bg-surface border border-white/[0.08] p-5 sm:p-6 space-y-2">
        <h2 className="font-display font-extrabold flex items-center gap-2"><Mail className="w-5 h-5 text-amber-300" /> Grievance officer</h2>
        <p className="text-[13px] text-mist leading-relaxed">
          Data deletion ya privacy complaint ke liye: <b className="text-white">grievance@previse.in</b> (beta me team member handle karega, 48hr SLA).
          Hosting India me (Railway/Render ap-south). 18 se kam umar ke users ke liye parent consent required.
        </p>
        <div className="flex gap-2 pt-1">
          <Link href="/connect" className="text-xs font-bold px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20">
            Delete my data →
          </Link>
          <Link href="/" className="text-xs font-bold px-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.08] hover:bg-white/10">
            Back home
          </Link>
        </div>
      </div>
    </div>
  );
}
