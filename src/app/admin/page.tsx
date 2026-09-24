'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, KeyRound, Users } from 'lucide-react';
import { getBetaSignups, BetaSignupRow } from '@/lib/api';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [rows, setRows] = useState<BetaSignupRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getBetaSignups(token.trim());
      setRows(res.signups);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
      setRows(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-dusk hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="rounded-[28px] border border-white/[0.08] bg-surface p-6 sm:p-8 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/[0.08] text-mist text-[11px] font-bold">
          <Users className="w-3.5 h-3.5" /> BETA ADMIN {rows ? `• ${rows.length} SIGNUPS` : ''}
        </div>
        <h1 className="font-display font-black text-3xl tracking-tight">Beta signups</h1>
        <p className="text-sm text-mist">Token-gated list — must match <span className="font-mono">BETA_ADMIN_TOKEN</span> on the backend (set the env var).</p>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 flex-1 bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2.5">
            <KeyRound className="w-4 h-4 text-dusk shrink-0" />
            <input value={token} onChange={(e) => setToken(e.target.value)} type="password" placeholder="Admin token" className="bg-transparent outline-none text-sm w-full placeholder:text-dusk" />
          </div>
          <button onClick={load} disabled={loading || !token.trim()} className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-40 flex items-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Load
          </button>
        </div>
        {error && <p className="text-xs text-red-300">{error} — wrong token or backend :3001 is down.</p>}
        <label className="flex items-center gap-2 text-xs text-mist">
          <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} /> Full emails dikhao (default masked — PII hygiene)
        </label>
      </div>

      {rows && (
        <div className="rounded-[24px] bg-surface border border-white/[0.08] divide-y divide-white/[0.06]">
          {rows.map((r) => (
            <div key={r.position} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="font-bold text-sm truncate">#{r.position} {r.name}</p>
                <p className="text-[11px] font-mono text-dusk truncate">{reveal ? r.emailFull : r.email}{r.usecase ? ` • ${r.usecase}` : ''}</p>
              </div>
              <span className="text-[10px] font-mono text-dusk shrink-0">{r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : ''}</span>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-dusk text-center py-8">No signups yet.</p>}
        </div>
      )}
    </div>
  );
}
