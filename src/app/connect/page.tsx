'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Landmark, Upload, Trash2, CheckCircle2 } from 'lucide-react';
import {
  createConsent,
  approveConsent,
  fetchAAData,
  uploadCSV,
  deleteMyData,
  getLiveProfile,
  LiveProfileRes,
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
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something failed — is backend on :3001?');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () =>
    run(async () => {
      const s = await createConsent();
      setConsentId(s.consentId);
      setSessionToken(s.sessionToken);
      setStep('consent');
      setMsg(`Consent created: ${s.consentId.slice(0, 12)}… — now approve it.`);
    });

  const handleApprove = () =>
    run(async () => {
      await approveConsent(consentId, sessionToken);
      setStep('active');
      setMsg('Consent approved — now fetch live data.');
    });

  const handleFetch = () =>
    run(async () => {
      await fetchAAData(consentId, sessionToken);
      const profile = await getLiveProfile();
      setLive(profile);
      setStep('fetched');
      setMsg(`Live profile loaded — source: ${profile.source}, balance ₹${profile.profile.balance.toLocaleString('en-IN')}.`);
    });

  const handleCSV = async (file: File) =>
    run(async () => {
      const res = await uploadCSV(file, Number(balance) || undefined);
      const profile = await getLiveProfile();
      setLive(profile);
      setStep('fetched');
      setMsg(`${res.message || 'CSV parsed'} — source: csv. ${res.balanceWarning || ''}`);
    });

  const handleDelete = () =>
    run(async () => {
      await deleteMyData();
      setLive(null);
      setStep('idle');
      setMsg('All session data deleted (DPDP).');
    });

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-slate-100">Connect Your Bank Data</h1>
        <p className="text-sm text-slate-400 mt-1">
          RBI Account Aggregator (mock) or CSV upload. Backend: <span className="font-mono text-emerald-400">:3001</span> — session isolated via x-session-id.
        </p>
      </div>

      {error && <p className="text-sm text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl p-3">{error}</p>}
      {msg && <p className="text-sm text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3">{msg}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AA flow */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
          <h2 className="font-bold text-slate-100 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-emerald-400" /> Option A — Account Aggregator
          </h2>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className={`px-2 py-1 rounded-full border ${step !== 'idle' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 border-slate-700'}`}>1 Consent</span>
            <span>→</span>
            <span className={`px-2 py-1 rounded-full border ${step === 'active' || step === 'fetched' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 border-slate-700'}`}>2 Approve</span>
            <span>→</span>
            <span className={`px-2 py-1 rounded-full border ${step === 'fetched' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-slate-800 border-slate-700'}`}>3 Fetch</span>
          </div>
          <div className="flex flex-col gap-2">
            <button onClick={handleCreate} disabled={loading} className="py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500 disabled:opacity-50">
              1. Create consent
            </button>
            <button onClick={handleApprove} disabled={loading || step === 'idle'} className="py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-slate-200 hover:bg-slate-700 disabled:opacity-50">
              2. Approve consent
            </button>
            <button onClick={handleFetch} disabled={loading || (step !== 'active' && step !== 'fetched')} className="py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 disabled:opacity-50">
              3. Fetch my data
            </button>
          </div>
          {consentId && <p className="text-[11px] font-mono text-slate-500 break-all">consent: {consentId}</p>}
        </div>

        {/* CSV flow */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 space-y-4">
          <h2 className="font-bold text-slate-100 flex items-center gap-2">
            <Upload className="w-5 h-5 text-cyan-400" /> Option B — CSV Upload
          </h2>
          <p className="text-xs text-slate-400">Columns: <span className="font-mono">date, narration, amount, type</span></p>
          <label className="text-xs font-semibold text-slate-400 tracking-widest">CURRENT BANK BALANCE (₹)</label>
          <input
            value={balance}
            onChange={(e) => setBalance(e.target.value)}
            inputMode="numeric"
            className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-cyan-500 outline-none"
          />
          <label className="block py-3 rounded-xl bg-slate-800 border border-dashed border-slate-600 text-center text-sm text-slate-300 cursor-pointer hover:bg-slate-700">
            Choose CSV statement
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleCSV(f);
              }}
            />
          </label>
        </div>
      </div>

      {live && (
        <div className="rounded-3xl bg-slate-900/90 border border-emerald-500/20 p-6 space-y-3">
          <h3 className="font-bold text-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Live Profile — {live.source}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><p className="text-slate-400">Balance</p><p className="font-mono font-bold text-slate-100">₹{live.profile.balance.toLocaleString('en-IN')}</p></div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><p className="text-slate-400">Income/mo</p><p className="font-mono font-bold text-slate-100">₹{live.profile.monthlyInflow.toLocaleString('en-IN')}</p></div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><p className="text-slate-400">Runway</p><p className="font-mono font-bold text-emerald-400">{live.state.runway.display}</p></div>
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800"><p className="text-slate-400">Safe/day</p><p className="font-mono font-bold text-slate-100">₹{live.state.safeToSpend.daily.toLocaleString('en-IN')}</p></div>
          </div>
          {live.meta && (
            <p className="text-[11px] text-slate-500 font-mono">
              Parsed {live.meta.parsedCount}/{live.meta.totalTransactions} • accuracy {(live.meta.parsingAccuracy * 100).toFixed(0)}%{live.meta.warnings.map((w) => ` • ${w}`).join('')}
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2">
            <Link href="/simulator" className="flex-1 text-center py-2.5 rounded-xl bg-violet-600 text-white text-sm font-bold hover:bg-violet-500">
              Simulate with this data →
            </Link>
            <button onClick={handleDelete} disabled={loading} className="flex-1 py-2.5 rounded-xl bg-rose-600/10 border border-rose-500/30 text-rose-300 text-sm font-bold hover:bg-rose-600/20 flex items-center justify-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete My Data (DPDP)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
