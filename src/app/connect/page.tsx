'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Landmark, Upload, Trash2, CheckCircle2, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import {
  createConsent, approveConsent, fetchAAData, uploadCSV, deleteMyData, getLiveProfile, LiveProfileRes,
} from '@/lib/api';

export default function ConnectPage() {
  const [step, setStep] = useState<'idle' | 'consent' | 'active' | 'fetched'>('idle');
  const [consentId, setConsentId] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveProfileRes | null>(null);
  const [balance, setBalance] = useState('150000');
  const [msg, setMsg] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setLoading(true); setError(null); setMsg(null);
    try { await fn(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Something failed — is backend on :3001?'); }
    finally { setLoading(false); }
  };

  const handleCreate = () => run(async () => {
    const s = await createConsent();
    setConsentId(s.consentId); setSessionToken(s.sessionToken); setStep('consent');
    setMsg(`Consent created — now approve it.`);
  });
  const handleApprove = () => run(async () => {
    await approveConsent(consentId, sessionToken); setStep('active');
    setMsg('Consent approved — now fetch live data.');
  });
  const handleFetch = () => run(async () => {
    await fetchAAData(consentId, sessionToken);
    const profile = await getLiveProfile();
    setLive(profile); setStep('fetched');
    setMsg(`Live profile loaded — source: ${profile.source}, balance ₹${profile.profile.balance.toLocaleString('en-IN')}.`);
  });
  const handleCSV = async (file: File) => run(async () => {
    const res = await uploadCSV(file, Number(balance) || undefined);
    const profile = await getLiveProfile();
    setLive(profile); setStep('fetched');
    setMsg(`${res.message || 'CSV parsed'} — source: csv. ${res.balanceWarning || ''}`);
  });
  const handleDelete = () => run(async () => {
    await deleteMyData(); setLive(null); setStep('idle'); setMsg('All session data deleted (DPDP).');
  });

  const stepIdx = step === 'idle' ? 0 : step === 'consent' ? 1 : step === 'active' ? 2 : 3;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0B111E] p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-400/10 border border-emerald-400/25 text-emerald-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> RBI ACCOUNT AGGREGATOR • DPDP SAFE
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight mt-3">Connect your money.</h1>
          <p className="text-sm text-slate-400 mt-2 max-w-lg">
            Mock AA flow ya CSV upload — backend <span className="font-mono text-emerald-300">:3001</span> pe session-isolated. Judges ke liye 3-click demo.
          </p>

          {/* Stepper */}
          <div className="flex items-center gap-2 mt-6">
            {['Consent', 'Approve', 'Fetch'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold whitespace-nowrap transition-all ${
                  stepIdx > i ? 'bg-[#10B981] text-black border-[#10B981]' : stepIdx === i + 1 || (stepIdx === 0 && i === 0) ? 'bg-white/10 text-white border-white/20' : 'bg-white/[0.03] text-slate-500 border-white/10'
                }`}>
                  <span className="font-mono">{i + 1}</span> {s} {stepIdx > i && '✓'}
                </div>
                {i < 2 && <div className={`h-px flex-1 ${stepIdx > i ? 'bg-[#10B981]/50' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">{error}</p>}
      {msg && <p className="text-sm text-emerald-300 bg-emerald-400/10 border border-emerald-400/25 rounded-2xl p-4">{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-[24px] bg-[#0B111E] border border-white/10 p-6 space-y-3">
          <h2 className="font-display font-extrabold flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#10B981]" /> Option A — AA Flow
          </h2>
          <button onClick={handleCreate} disabled={loading} className={`w-full py-3 rounded-2xl text-sm font-extrabold transition-all ${stepIdx >= 1 ? 'bg-white/10 text-slate-300 border border-white/10' : 'bg-[#10B981] text-black hover:brightness-110 shadow-[0_0_25px_rgba(16,185,129,0.3)]'} disabled:opacity-50`}>
            1. Create consent {stepIdx >= 1 && '✓'}
          </button>
          <button onClick={handleApprove} disabled={loading || step === 'idle'} className="w-full py-3 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold hover:bg-white/10 disabled:opacity-40">
            2. Approve consent {stepIdx >= 2 && '✓'}
          </button>
          <button onClick={handleFetch} disabled={loading || (step !== 'active' && step !== 'fetched')} className="w-full py-3 rounded-2xl bg-emerald-400 text-black text-sm font-extrabold hover:brightness-110 disabled:opacity-40">
            3. Fetch my data {stepIdx >= 3 && '✓'}
          </button>
          {consentId && <p className="text-[10px] font-mono text-slate-600 break-all">consent: {consentId.slice(0, 32)}…</p>}
        </div>

        <div className="rounded-[24px] bg-[#0B111E] border border-white/10 p-6 space-y-3">
          <h2 className="font-display font-extrabold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-300" /> Option B — CSV
          </h2>
          <p className="text-[11px] text-slate-500 font-mono">date, narration, amount, type</p>
          <label className="text-[10px] font-black tracking-[0.18em] text-slate-500">CURRENT BALANCE (₹)</label>
          <input value={balance} onChange={(e) => setBalance(e.target.value)} inputMode="numeric"
            className="w-full bg-black/60 border border-white/10 rounded-2xl px-4 py-3 text-sm font-mono font-bold focus:border-cyan-300 outline-none" />
          <label className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/[0.04] border border-dashed border-white/20 text-sm font-bold text-slate-300 cursor-pointer hover:bg-white/[0.07] hover:border-cyan-300/40 transition-all">
            <Upload className="w-4 h-4" /> Choose CSV statement
            <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f); }} />
          </label>
        </div>
      </div>

      {live && (
        <div className="rounded-[24px] bg-[#0B111E] border border-emerald-400/25 p-6 space-y-4 animate-fade-up shadow-[0_0_40px_rgba(16,185,129,0.15)]">
          <h3 className="font-display font-extrabold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-300" /> Live Profile — <span className="font-mono text-sm text-emerald-300">{live.source}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: 'Balance', v: `₹${live.profile.balance.toLocaleString('en-IN')}`, c: 'text-white' },
              { l: 'Income/mo', v: `₹${live.profile.monthlyInflow.toLocaleString('en-IN')}`, c: 'text-white' },
              { l: 'Runway', v: live.state.runway.display, c: 'text-[#10B981]' },
              { l: 'Safe/day', v: `₹${live.state.safeToSpend.daily.toLocaleString('en-IN')}`, c: 'text-white' },
            ].map((s) => (
              <div key={s.l} className="p-3.5 rounded-2xl bg-black/50 border border-white/[0.07]">
                <p className="text-[11px] text-slate-500 font-semibold">{s.l}</p>
                <p className={`font-mono font-black mt-0.5 ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/simulator" className="flex-1 text-center py-3 rounded-2xl bg-[#10B981] text-black text-sm font-extrabold hover:brightness-110">
              Simulate with this data →
            </Link>
            <button onClick={handleDelete} disabled={loading} className="flex-1 py-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm font-bold hover:bg-red-500/20 flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete My Data (DPDP)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
