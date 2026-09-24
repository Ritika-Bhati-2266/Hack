'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Landmark, Upload, Trash2, CheckCircle2, ShieldCheck, FileSpreadsheet, Loader2, AlertTriangle, PlugZap } from 'lucide-react';
import {
  createConsent, approveConsent, fetchAAData, uploadCSV, deleteMyData, getLiveProfile, LiveProfileRes, backendProfileToStore,
} from '@/lib/api';
import DataSourceBanner from '@/components/DataSourceBanner';
import { useFinanceStore } from '@/store/useFinanceStore';

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
  const [samples, setSamples] = useState<Array<{ id: string; file: string; label: string; blurb: string; balance: number }>>([]);
  const [sampleId, setSampleId] = useState('');
  const setLiveData = useFinanceStore((s) => s.setLiveData);
  const clearLiveData = useFinanceStore((s) => s.clearLiveData);

  // Sample list comes from the manifest — never hardcoded here.
  useEffect(() => {
    fetch('/samples/manifest.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((m) => {
        if (m && Array.isArray(m.samples)) {
          setSamples(m.samples);
          setSampleId(m.samples[0]?.id || '');
        }
      })
      .catch(() => { /* no samples — section stays hidden */ });
  }, []);

  const adoptLive = (profile: LiveProfileRes) => {
    if (!profile || !profile.profile) return false;
    const { user, goals } = backendProfileToStore(profile.profile);
    setLiveData({
      user,
      goals,
      source: profile.source,
      meta: profile.meta,
      accounts: profile.accounts || [],
      transactions: profile.transactions || [],
      fetchedAt: profile.fetchedAt,
    });
    return true;
  };

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
    adoptLive(profile);
    setMsg(`Live profile loaded — source: ${profile.source}, balance ₹${profile.profile.balance.toLocaleString('en-IN')}. Dashboard + Simulator now run on this data.`);
  });
  const handleCSV = async (file: File) => run(async () => {
    // Backend requires explicit balance — CSV has no balance column.
    const trimmed = balance.trim();
    const b = Number(trimmed);
    if (trimmed === '' || !Number.isFinite(b) || b < 0) {
      throw new Error('Enter your current balance (number in ₹) — CSVs have no balance column, and without it the runway will be wrong.');
    }
    const res = await uploadCSV(file, b);
    const profile = await getLiveProfile();
    setLive(profile); setStep('fetched');
    adoptLive(profile);
    setMsg(`${res.message || 'CSV parsed'} — source: csv. Dashboard + Simulator now run on this data. ${res.balanceWarning || ''} ${(res.meta?.warnings || []).join(' ')}`.trim());
  });
  const handleDelete = () => run(async () => {
    await deleteMyData(); setLive(null); setStep('idle'); clearLiveData(); setMsg('All session data deleted (DPDP).');
  });

  // Sample statements reuse the exact upload/parser flow (uploadCSV +
  // adoptLive) — no separate logic. Loading replaces previous live data.
  const handleSample = () => run(async () => {
    const meta = samples.find((s) => s.id === sampleId);
    if (!meta) throw new Error('Select a sample statement first.');
    const res = await fetch(`/samples/${meta.file}`);
    if (!res.ok) throw new Error(`Sample file missing (${meta.file}) — is public/samples deployed?`);
    const blob = await res.blob();
    const up = await uploadCSV(new File([blob], meta.file, { type: 'text/csv' }), Number(balance) || meta.balance);
    const profile = await getLiveProfile();
    setLive(profile); setStep('fetched');
    adoptLive(profile);
    setMsg(`✓ ${meta.file} loaded — ${up.message || 'parsed'}. Previous data replaced. Dashboard + Simulator now run on this data.`);
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
            AA flow or CSV upload — session-isolated on backend <span className="font-mono text-safe">:3001</span>. Real bank data, no demo.
          </p>

          {/* Stepper */}
          <div className="mt-6 overflow-x-auto no-scrollbar touch-scroll max-w-full pb-1 -mx-1 px-1">
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
          <b>Session expired (1h TTL)</b> — {msg || 'reconnect to restore.'} Reconnect via AA or CSV, restored in 10 seconds.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-[24px] bg-surface border border-white/[0.08] p-6 space-y-3">
          <h2 className="font-display font-extrabold flex items-center gap-2">
            <Landmark className="w-5 h-5 text-primary" /> Option A — AA Flow
            <span className="text-[9px] font-black tracking-widest px-2 py-1 rounded-lg bg-safe/15 text-safe border border-safe/30">
              LIVE
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
            className="w-full bg-surface border border-cyan-500/30 rounded-2xl px-4 py-3 text-base font-mono font-extrabold text-cyan-300 placeholder-cyan-500/40 focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.3)] outline-none transition-all"
          />
          <label className="flex items-center justify-center gap-2 py-4 rounded-2xl bg-white/[0.04] border border-dashed border-white/[0.14] text-sm font-bold text-mist cursor-pointer hover:bg-white/[0.07] hover:border-cyan-300/40 transition-all">
            <Upload className="w-4 h-4" /> Choose CSV statement
            <input type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSV(f); }} />
          </label>
          {samples.length > 0 && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3.5 space-y-2.5">
              <p className="text-[10px] font-black tracking-[0.18em] text-dusk">OR TRY A SAMPLE — NO UPLOAD NEEDED</p>
              <select
                value={sampleId}
                onChange={(e) => {
                  setSampleId(e.target.value);
                  const meta = samples.find((s) => s.id === e.target.value);
                  if (meta) setBalance(String(meta.balance));
                }}
                className="w-full bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2.5 text-xs font-bold text-mist outline-none"
              >
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>{s.label} — {s.blurb}</option>
                ))}
              </select>
              <button onClick={handleSample} disabled={loading} className="w-full py-2.5 rounded-xl bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-extrabold hover:bg-cyan-500/20 active:scale-[0.99] disabled:opacity-40 transition-all flex items-center justify-center gap-2">
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Load selected sample
              </button>
            </div>
          )}
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
          <p className="text-sm text-mist mt-1 max-w-md mx-auto">Connect via Option A (AA) or Option B (CSV) above. Balance, runway and safe-spend will appear here.</p>
        </div>
      )}

      {live && <DataSourceBanner source={expired ? 'none' : live.source} />}
      {live && (
        <div className="rounded-[24px] bg-surface border border-safe/25 p-6 space-y-4 animate-fade-up shadow-[0_0_40px_rgba(6,182,212,0.15)]">
          <h3 className="font-display font-extrabold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-safe" /> Live Profile — <span className="font-mono text-sm text-safe">{live.source}</span>
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
