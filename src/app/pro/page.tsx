'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Check, Loader2, Star, ShieldCheck } from 'lucide-react';
import { setupAutopay, getMandate } from '@/lib/api';

export default function ProPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mandate, setMandate] = useState<{ mandateId: string; status: string; amount: number } | null>(null);
  const [annual, setAnnual] = useState(false);

  const price = annual ? 1499 : 149;

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    try {
      const m = await setupAutopay(price, annual ? 'yearly' : 'monthly', 'Previse Pro');
      setMandate(m);
      // Poll once for status (stub confirms instantly)
      try {
        const full = await getMandate(m.mandateId);
        setMandate(full);
      } catch { /* stub — keep setup response */ }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AutoPay setup failed — is backend on :3001?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-dusk hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/25 text-amber-300 text-[11px] font-bold">
          <Star className="w-3.5 h-3.5" /> PREVISE PRO — UPI AUTOPAY
        </div>
        <h1 className="font-display font-black text-3xl sm:text-5xl tracking-tight">Unlimited simulations.</h1>
        <p className="text-sm text-mist">Free me 3 sims/month. Pro me AA sync, goals, firewall, history — sab unlimited.</p>
        <div className="inline-flex rounded-full bg-white/5 border border-white/[0.08] p-1 text-xs font-bold">
          <button onClick={() => setAnnual(false)} className={`px-4 py-2 rounded-full ${!annual ? 'bg-primary text-white' : 'text-mist'}`}>Monthly ₹149</button>
          <button onClick={() => setAnnual(true)} className={`px-4 py-2 rounded-full ${annual ? 'bg-primary text-white' : 'text-mist'}`}>Yearly ₹1,499</button>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="rounded-[24px] bg-surface border border-white/[0.08] p-6 space-y-4">
          <h2 className="font-display font-extrabold text-lg">Free — ₹0</h2>
          <ul className="space-y-2 text-sm text-mist">
            {['3 simulations / month', 'Basic buffer + runway check', 'Mock demo data only'].map((f) => (
              <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-dusk shrink-0 mt-0.5" />{f}</li>
            ))}
          </ul>
          <Link href="/simulator" className="block text-center py-3 rounded-2xl bg-white/5 border border-white/[0.08] text-sm font-bold hover:bg-white/10">
            Continue free
          </Link>
        </div>
        <div className="rounded-[24px] bg-surface border border-primary/40 p-6 space-y-4 shadow-[0_0_40px_rgba(83,134,94,0.25)] relative">
          <span className="absolute -top-3 left-6 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full bg-primary text-white">MOST POPULAR</span>
          <h2 className="font-display font-extrabold text-lg">Pro — ₹{price.toLocaleString('en-IN')}{annual ? '/yr' : '/mo'}</h2>
          <ul className="space-y-2 text-sm text-mist">
            {['Unlimited simulations', 'AA sync + CSV + live profile', 'Goals + firewall + history', 'UPI AutoPay — cancel anytime'].map((f) => (
              <li key={f} className="flex gap-2"><Check className="w-4 h-4 text-safe shrink-0 mt-0.5" />{f}</li>
            ))}
          </ul>
          {mandate ? (
            <div className="rounded-2xl bg-safe/10 border border-safe/25 p-4 text-sm space-y-1">
              <p className="font-black text-safe">Mandate {mandate.status.toUpperCase()} ✓</p>
              <p className="text-mist font-mono text-xs">id: {mandate.mandateId.slice(0, 24)}… • ₹{mandate.amount}/mo</p>
              <p className="text-[11px] text-dusk">Demo stub hai — real paise nahi katega. Real UPI AutoPay ke liye Razorpay keys chahiye (ROADMAP Phase 4).</p>
            </div>
          ) : (
            <button onClick={handleSubscribe} disabled={loading} className="w-full py-3.5 rounded-2xl bg-primary text-white font-extrabold text-sm hover:brightness-110 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Setting up mandate…' : `Subscribe with UPI AutoPay`}
            </button>
          )}
          {error && <p className="text-xs text-red-300">{error}</p>}
        </div>
      </div>

      <p className="text-[11px] text-dusk text-center flex items-center justify-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5" /> No real money moves in demo — autopay endpoint stub hai, API-compatible.
      </p>
    </div>
  );
}
