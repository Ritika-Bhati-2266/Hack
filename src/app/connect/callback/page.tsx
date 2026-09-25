'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, XCircle, Clock } from 'lucide-react';

// Setu redirects here after approve/reject (via backend /api/aa/callback,
// which verifies status with Setu first). Mock mode never lands here.
function CallbackInner() {
  const params = useSearchParams();
  const status = (params.get('status') || 'UNKNOWN').toUpperCase();
  const approved = status === 'ACTIVE' || status === 'APPROVED';

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Link href="/connect" className="inline-flex items-center gap-2 text-xs text-dusk hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Connect
      </Link>
      <div className="rounded-[24px] bg-surface border border-white/[0.08] p-8 text-center space-y-4">
        {approved ? (
          <CheckCircle2 className="w-12 h-12 text-safe mx-auto" />
        ) : status === 'REJECTED' || status === 'REVOKED' || status === 'EXPIRED' ? (
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
        ) : (
          <Clock className="w-12 h-12 text-amber-300 mx-auto" />
        )}
        <h1 className="font-display font-black text-2xl">
          {approved ? 'Bank consent approved ✓' : `Consent status: ${status}`}
        </h1>
        <p className="text-sm text-mist">
          {approved
            ? 'Setu ne approval confirm kar diya. Ab Connect page par jaake "3. Fetch my data" dabao — real bank data ayega.'
            : status === 'REJECTED' || status === 'REVOKED'
              ? 'Tumne consent reject kar diya (ya revoke ho gaya). Dobara try karne ke liye Connect page par naya consent banao.'
              : 'Consent abhi pending hai — Setu approval page par approve karo, phir wapas aao.'}
        </p>
        <Link
          href="/connect"
          className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-primary text-white font-extrabold text-sm hover:brightness-110"
        >
          Go to Connect →
        </Link>
      </div>
    </div>
  );
}

export default function ConnectCallbackPage() {
  return (
    <Suspense fallback={<div className="text-center text-sm text-dusk py-10">Loading…</div>}>
      <CallbackInner />
    </Suspense>
  );
}
