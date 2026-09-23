'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Landmark, Upload, Trash2, CheckCircle2, ShieldCheck, FileSpreadsheet, Loader2, AlertTriangle, PlugZap } from 'lucide-react';
import {
  createConsent, approveConsent, fetchAAData, uploadCSV, deleteMyData, getLiveProfile, LiveProfileRes,
} from '@/lib/api';
import DataSourceBanner from '@/components/DataSourceBanner';

export default function ConnectPage() {
  const [step, setStep] = useState<'idle' | 'consent' | 'active' | 'fetched'>('idle');
  const [consentId, setConsentId] = useState('');
  const [sessionToken, setSessionToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState<LiveProfileRes | null>(null);
  const [expired, setExpired] = useState(false);
  const [balance, setBalance] = useState('150000');
  const [msg, setMsg] = useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setLoading(true); setError(null); setMsg(null); setExpired(false);
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
    if (profile.source === 'mock') {
      // Backend falls back to demo data with 200 when the session is gone — never present it as live
      setExpired(true);
      setMsg('Session expired — showing demo data. Reconnect via AA or CSV.');
    } else if (profile.source === 'aa') {
      // AA TSP is mock — fake transactions, not real bank sync. Say it loudly.
      setMsg(`Demo profile loaded — source: aa (MOCK TSP, not real bank data). Real numbers ke liye CSV upload karo. Balance ₹${profile.profile.balance.toLocaleString('en-IN')}.`);
    } else {
      setMsg(`Live profile loaded — source: ${profile.source}, balance ₹${profile.profile.balance.toLocaleString('en-IN')}.`);
    }
  });
  const handleCSV = async (file: File) => run(async () => {
    // Backend requires explicit balance — CSV has no balance column.
    const trimmed = balance.trim();
    const b = Number(trimmed);
    if (trimmed === '' || !Number.isFinite(b) || b < 0) {
      throw new Error('Current balance dalo (₹ me number) — CSV me balance column nahi hota, iske bina runway galat aayega.');
    }
    const res = await uploadCSV(file, b);
    const profile = await getLiveProfile();
    setLive(profile); setStep('fetched');
    if (profile.source === 'mock') {
      setExpired(true);
      setMsg('Session expired right after upload — showing demo data. Please upload again.');
    } else {
      setMsg(`${res.message || 'CSV parsed'} — source: csv. ${res.balanceWarning || ''} ${(res.meta?.warnings || []).join(' ')}`.trim());
    }
  });
  const handleDelete = () => run(async () => {
    await deleteMyData(); setLive(null); setStep('idle'); setMsg('All session data deleted (DPDP).');
  });

  const stepIdx = step === 'idle' ? 0 : step === 'consent' ? 1 : step === 'active' ? 2 : 3;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-dusk hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-surface p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-safe/10 border border-safe/25 text-safe text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> RBI ACCOUNT AGGREGATOR • DPDP SAFE
          </div>
          <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight mt-3">Connect your money.</h1>
          <p className="text-sm text-mist mt-2 max-w-lg">
            Mock AA flow ya CSV upload — backend <span className="font-mono text-safe">:3001</span> pe session-isolated. Judges ke liye 3-click demo.
          </p>

          {/* Stepper */}
          <div className="mt-6 overflow-x-auto max-w-full pb-1 -mx-1 px-1">
          <div className="flex items-center gap-2 min-w-[480px]">
            {['Consent', 'Approve', 'Fetch'].map((s, i) => (
              <div key={s} className="flex items-center gap-2 flex-1 min-w-0">
                <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-bold whitespace-nowrap transition-all ${
                  stepIdx > i ? 'bg-primary text-white border-primary' : stepIdx === i + 1 || (stepIdx === 0 && i === 0) ? 'bg-white/10 text-white border-white/[0.14]' : 'bg-white/[0.03] text-dusk border-white/[0.08]'
                }`}>
                  <span className="font-mono">{i + 1}</span> {s} {stepIdx > i && '✓'}
                </div>
                {i < 2 && <div className={`h-px flex-1 ${stepIdx > i ? 'bg-primary/50' : 'bg-white/10'}`} />}
              </div>
            ))}
          </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 text-sm text-red-300 bg-red-500/10 border border-red-500/30 rounded-2xl p-4 animate-fade-up" role="alert">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="min-w-0 break-words">{error}</p>
        </div>
      )}
      {msg && !expired && (
        <div className="flex items-start gap-2.5 text-sm text-safe bg-safe/10 border border-safe/25 rounded-2xl p-4 animate-fade-up">
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="min-w-0 break-words">{msg}</p>
        </div>
      )}
      {expired && (
        <div className="text-sm text-amber-300 bg-amber-400/10 border border-amber-400/30 rounded-2xl p-4 animate-fade-up">
          <b>Session expired (1h TTL)</b> — {msg || 'ye demo data hai, live nahi.'} AA ya CSV se dobara connect karo, 10 second me restore ho jayega.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-[24px] bg-surface border border-white/[0.08] p-6 space-y-3">
          <h2 className="font-display font-extrabold flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" /> Option A — AA Flow
            <span className="text-[9px] font-black tracking-widest px-2 py-1 rounded-lg bg-amber-400/15 text-amber-300 border border-amber-400/30">
              MOCK DEMO
            </span>
          </h2>
          <button onClick={handleCreate} disabled={loading} className={`w-full py-3 rounded-2xl text-sm font-extrabold transition-all ${stepIdx >= 1 ? 'bg-white/10 text-mist border border-white/[0.08]' : 'bg-primary text-white hover:brightness-110 shadow-[0_0_25px_rgba(83,134,94,0.3)]'} disabled:opacity-50`}>
            1. Create consent {stepIdx >= 1 && '✓'}
          </button>
          <button onClick={handleApprove} disabled={loading || step === 'idle'} className="w-full py-3 rounded-2xl bg-white/5 border border-white/[0.08] text-sm font-bold hover:bg-white/10 active:scale-[0.99] disabled:opacity-40 disabled:cursor-wait flex items-center justify-center gap-2">
            {loading && step === 'consent' && <Loader2 className="w-4 h-4 animate-spin" />}
            2. Approve consent {stepIdx >= 2 && '✓'}
          </button>
          <button onClick={handleFetch} disabled={loading || (step !== 'active' && step !== 'fetched')} className="w-full py-3 rounded-2xl bg-safe text-black text-sm font-extrabold hover:brightness-110 active:scale-[0.99] disabled:opacity-40 disabled:cursor-wait flex items-center justify-center gap-2">
            {loading && (step === 'active' || step === 'fetched') && <Loader2 className="w-4 h-4 animate-spin" />}
            3. Fetch my data {stepIdx >= 3 && '✓'}
          </button>
          {consentId && <p className="text-[10px] font-mono text-dusk break-all">consent: {consentId.slice(0, 32)}…</p>}
        </div>

        <div className="rounded-[24px] bg-surface border border-white/[0.08] p-6 space-y-3">
          <h2 className="font-display font-extrabold flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-cyan-300" /> Option B — CSV
            <span className="text-[9px] font-black tracking-widest px-2 py-1 rounded-lg bg-safe/15 text-safe border border-safe/30">
              REAL DATA
            </span>
          </h2>
          <p className="text-[11px] text-dusk font-mono">date, narration, amount, type</p>
          <label className="text-[10px] font-black tracking-[0.18em] text-cyan-400/80">CURRENT BALANCE (₹)</label>
          <input
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            inputMode="numeric"
            className="w-full bg-[#070b14] border border-cyan-500/30 rounded-2xl px-4 py-3 text-base font-mono font-extrabold text-cyan-300 placeholder-cyan-500/40 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(0,240,255,0.3)] outline-none transition-all"
          />
          <label className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/[0.04] border border-dashed border-white/[0.14] text-sm font-bold text-mist cursor-pointer hover:bg-white/[0.07] hover:border-cyan-300/40 transition-all">
            <Upload className="w-4 h-4" /> Choose CSV statement
            <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f); }} />
          </label>
        </div>
      </div>

      {loading && !live && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {!live && !loading && (
        <div className="rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center animate-fade-up">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/[0.08] flex items-center justify-center mx-auto">
            <PlugZap className="w-5 h-5 text-dusk" />
          </div>
          <p className="font-display font-extrabold text-lg mt-3">No live data yet</p>
          <p className="text-sm text-mist mt-1 max-w-md mx-auto">Upar Option A (AA mock demo) ya Option B (CSV — asli numbers) se connect karo. Phir yahan balance, runway aur safe-spend dikhega.</p>
        </div>
      )}

      {live && (
        <div className="rounded-[24px] bg-surface border border-safe/25 p-6 space-y-4 animate-fade-up shadow-[0_0_40px_rgba(6,182,212,0.15)]">
          <h3 className="font-display font-extrabold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-safe" /> {expired || live.source !== 'csv' ? 'Demo Data' : 'Live Profile'} — <span className={`font-mono text-sm ${expired || live.source !== 'csv' ? 'text-amber-300' : 'text-safe'}`}>{expired ? 'mock' : live.source}{!expired && live.source === 'aa' ? ' (mock TSP)' : ''}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { l: 'Balance', v: `₹${live.profile.balance.toLocaleString('en-IN')}`, c: 'text-white' },
              { l: 'Income/mo', v: `₹${live.profile.monthlyInflow.toLocaleString('en-IN')}`, c: 'text-white' },
              { l: 'Runway', v: live.state.runway.display, c: 'text-safe' },
              { l: 'Safe/day', v: `₹${live.state.safeToSpend.daily.toLocaleString('en-IN')}`, c: 'text-white' },
            ].map((s) => (
              <div key={s.l} className="p-3.5 rounded-2xl bg-well/60 border border-white/[0.08]">
                <p className="text-[11px] text-dusk font-semibold">{s.l}</p>
                <p className={`font-mono font-black mt-0.5 ${s.c}`}>{s.v}</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/simulator" className="flex-1 text-center py-3 rounded-2xl bg-primary text-white text-sm font-extrabold hover:brightness-110">
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
