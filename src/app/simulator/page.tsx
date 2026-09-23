'use client';

import { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle2, Clock, ArrowLeft, Server, Minus, Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFinanceStore, CUSTOMERS, CustomerId } from '@/store/useFinanceStore';
import SplitViewComparison from '@/components/SplitViewComparison';
import TrajectoryChart from '@/components/TrajectoryChart';
import { PaymentMode } from '@/types';
import { simulateOnBackend, BackendVerdict } from '@/lib/api';
import { backendEMI } from '@/lib/engine';

export default function SimulatorPage() {
  const { runSimulation, currentSimulation, clearSimulation, activeCustomer, switchCustomer, user, goals, acceptWaitRecommendation, confirmPurchaseAnyway } = useFinanceStore();
  const [itemName, setItemName] = useState('iPhone 16 Pro Max');
  const [price, setPrice] = useState(80000);
  const [mode, setMode] = useState<PaymentMode>('CASH');
  const [backendVerdict, setBackendVerdict] = useState<BackendVerdict | null>(null);
  const [backendLoading, setBackendLoading] = useState(false);
  const [backendError, setBackendError] = useState<string | null>(null);

  const handleVerifyBackend = async () => {
    setBackendLoading(true);
    setBackendError(null);
    try {
      const res = await simulateOnBackend(user, goals, itemName.trim(), price, mode);
      setBackendVerdict(res);
    } catch (e) {
      setBackendError(e instanceof Error ? e.message : 'Backend unreachable — is Express running on :3001?');
    } finally {
      setBackendLoading(false);
    }
  };

  const priceError = price <= 0 ? 'Amount must be > ₹0' : price > user.totalBalance * 3 ? 'Amount unusually high vs balance' : null;
  const nameError = !itemName.trim() ? 'Item name required' : null;
  const canSimulate = !priceError && !nameError;

  const handleSimulate = () => {
    if (!canSimulate) return;
    runSimulation({ itemName: itemName.trim(), price, mode });
  };

  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const pct = Math.min(100, Math.max(0, (price / Math.max(1, user.totalBalance)) * 100));

  // Displayed estimates use the same reducing-balance formula as the verdict engine
  const modeOptions: { id: PaymentMode; label: string; sub: string }[] = [
    { id: 'CASH', label: 'Full Cash', sub: inr(price) },
    { id: 'EMI_3', label: '3 EMI', sub: `~${inr(backendEMI(price, 3, 12))}/mo` },
    { id: 'EMI_6', label: '6 EMI', sub: `~${inr(backendEMI(price, 6, 12))}/mo` },
    { id: 'EMI_12', label: '12 EMI', sub: `~${inr(backendEMI(price, 12, 12))}/mo` },
  ];

  const verdict = currentSimulation?.verdict;
  const verdictStyle =
    verdict === 'WAIT'
      ? { bg: 'bg-red-500', text: 'text-red-300', border: 'border-red-500/30', glow: 'shadow-[0_0_60px_rgba(239,68,68,0.3)]' }
      : verdict === 'EMI'
      ? { bg: 'bg-amber-400', text: 'text-amber-300', border: 'border-amber-400/30', glow: 'shadow-[0_0_60px_rgba(251,191,36,0.25)]' }
      : { bg: 'bg-orange-400', text: 'text-orange-300', border: 'border-orange-400/30', glow: 'shadow-[0_0_60px_rgba(251,146,60,0.3)]' };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">ENGINE: DETERMINISTIC • FW-RBI-2026</span>
      </div>

      {/* Persona strip */}
      <div className="glass rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
        <span className="text-xs text-slate-400 shrink-0">
          Simulating for <b className="text-[#10B981]">{CUSTOMERS[activeCustomer]?.label || activeCustomer}</b>
          <span className="text-slate-500"> • Bal {inr(user.totalBalance)}</span>
        </span>
        <div className="flex gap-2 sm:ml-auto overflow-x-auto max-w-full pb-0.5">
          {(Object.keys(CUSTOMERS) as CustomerId[]).map((id) => (
            <button
              key={id}
              onClick={() => switchCustomer(id)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 whitespace-nowrap ${activeCustomer === id ? 'bg-[#10B981] text-black border-[#10B981]' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}
            >
              {CUSTOMERS[id].label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Input hero */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0B111E] p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-70" />
        <div className="absolute -top-20 left-1/3 w-[400px] h-[200px] bg-[#10B981]/10 blur-[100px] rounded-full pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#10B981] flex items-center justify-center">
              <Zap className="w-5 h-5 text-black fill-black" />
            </div>
            <div>
              <h1 className="font-display font-black text-2xl sm:text-3xl tracking-tight">What-If Simulator</h1>
              <p className="text-[13px] text-slate-500">Swipe se pehle — runway, buffer, goals. 5 second me verdict.</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_1fr_1.2fr] gap-5">
            <div>
              <label className="text-[10px] font-black tracking-[0.18em] text-slate-500">WHAT ARE YOU BUYING?</label>
              <input
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                className={`mt-2 w-full bg-black/60 border rounded-2xl px-4 py-3.5 text-[15px] font-bold focus:outline-none transition-colors ${nameError ? 'border-red-500' : 'border-white/10 focus:border-[#10B981]'}`}
                placeholder="e.g., iPhone 16 Pro"
              />
              <div className="flex gap-1.5 mt-2.5 flex-wrap">
                {['iPhone 16 Pro Max', 'MacBook Air', 'Bali Trip'].map((v) => (
                  <button key={v} onClick={() => setItemName(v)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all ${itemName === v ? 'bg-white text-black border-white' : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'}`}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black tracking-[0.18em] text-slate-500">AMOUNT</label>
              <div className="mt-2 flex items-center gap-2">
                <button onClick={() => setPrice(Math.max(1000, price - 5000))} className="w-10 h-[52px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 shrink-0">
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex-1 text-center bg-black/60 border border-white/10 rounded-2xl py-2.5">
                  <p className="font-mono font-black text-xl leading-none">{inr(price)}</p>
                  <p className="text-[10px] font-mono text-slate-500 mt-1">{pct.toFixed(0)}% of balance</p>
                </div>
                <button onClick={() => setPrice(price + 5000)} className="w-10 h-[52px] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 shrink-0">
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              <input
                type="range" min={5000} max={Math.max(300000, user.totalBalance)} step={1000} value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="volt-range w-full mt-3"
                style={{ ['--fill' as string]: `${(price / Math.max(300000, user.totalBalance)) * 100}%` }}
              />
              <div className="flex gap-1.5 mt-2.5">
                {[50000, 80000, 120000].map((v) => (
                  <button key={v} onClick={() => setPrice(v)} className={`flex-1 py-1.5 rounded-full text-[11px] font-bold border ${price === v ? 'bg-[#10B981] text-black border-[#10B981]' : 'bg-white/5 text-slate-400 border-white/10'}`}>
                    ₹{v / 1000}k
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black tracking-[0.18em] text-slate-500">PAYMENT MODE</label>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {modeOptions.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`py-2.5 rounded-2xl text-xs font-bold border text-left px-3.5 transition-all active:scale-95 ${mode === m.id ? 'bg-[#10B981] text-black border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'bg-white/[0.04] text-slate-400 border-white/10 hover:text-white'}`}
                  >
                    {m.label}
                    <span className={`block text-[10px] font-mono font-normal mt-0.5 ${mode === m.id ? 'text-black/60' : 'opacity-60'}`}>{m.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {priceError && <p className="text-[11px] text-red-300 mt-2">{priceError}</p>}

          <button
            onClick={handleSimulate}
            disabled={!canSimulate}
            className={`mt-6 w-full py-4 rounded-2xl font-display font-black text-[15px] tracking-tight transition-all ${canSimulate ? 'bg-[#10B981] text-black hover:brightness-110 shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:-translate-y-0.5' : 'bg-white/5 text-slate-600 cursor-not-allowed border border-white/10'}`}
          >
            ⚡ SIMULATE BEFORE YOU SWIPE
          </button>
          <button
            onClick={handleVerifyBackend}
            disabled={!canSimulate || backendLoading}
            className="mt-2.5 w-full py-3 rounded-2xl font-bold text-xs border border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-300 hover:bg-emerald-400/15 active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
          >
            {backendLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
            {backendLoading ? 'Verifying with backend engine…' : 'Verify with backend engine (:3001) — single source of truth'}
          </button>
          {backendLoading && (
            <div className="mt-3 grid grid-cols-3 gap-2" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="skeleton h-9 rounded-xl" />
              ))}
            </div>
          )}
          {backendError && (
            <div className="mt-2.5 flex items-start gap-2.5 rounded-2xl border border-red-500/30 bg-red-500/[0.08] px-4 py-3 animate-fade-up" role="alert">
              <AlertTriangle className="w-4 h-4 text-red-300 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[11px] font-black tracking-[0.14em] text-red-300">BACKEND UNREACHABLE</p>
                <p className="text-xs text-slate-300 mt-1 break-words">{backendError}</p>
                <p className="text-[11px] text-slate-500 mt-1">Express <span className="font-mono">:3001</span> chal raha hai? Local engine upar wala result abhi bhi valid hai.</p>
              </div>
            </div>
          )}
          {backendVerdict && (
            <div className="mt-3 p-4 rounded-2xl bg-black/60 border border-emerald-400/20 text-xs space-y-1 animate-fade-up min-w-0">
              <p className="font-black tracking-widest text-emerald-300">BACKEND: {backendVerdict.verdict.action.toUpperCase()} ({backendVerdict.verdict.severity})</p>
              <p className="text-slate-300">{backendVerdict.verdict.message}</p>
              <p className="text-slate-500 font-mono">
                Runway {backendVerdict.before.runwayDisplay} → {backendVerdict.after.runwayDisplay} • Buffer {inr(backendVerdict.before.buffer)} → {inr(backendVerdict.after.buffer)}
              </p>
              {currentSimulation && (() => {
                const local = currentSimulation.verdict.toUpperCase();
                const remote = backendVerdict.verdict.action.toUpperCase();
                const match = local === remote || (local === 'EMI' && remote === 'EMI');
                return (
                  <p className={`font-bold ${match ? 'text-emerald-300' : 'text-red-300'}`}>
                    Local: {currentSimulation.verdict} — {match ? 'MATCH ✓ backend is source of truth' : `MISMATCH ✗ (backend: ${backendVerdict.verdict.action})`}
                  </p>
                );
              })()}
            </div>
          )}
          {currentSimulation && (
            <button onClick={() => { clearSimulation(); setBackendVerdict(null); }} className="mt-2 w-full py-2 text-xs text-slate-500 hover:text-slate-300">
              Clear simulation
            </button>
          )}
        </div>
      </div>

      {currentSimulation && verdictStyle && (
        <>
          {/* ── DRAMATIC VERDICT ── */}
          <div className={`relative overflow-hidden rounded-[28px] border ${verdictStyle.border} bg-[#0B111E] p-6 sm:p-8 ${verdictStyle.glow} animate-fade-up`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
              <div className={`verdict-stamp animate-stamp-in px-6 py-3 rounded-2xl text-4xl font-black tracking-tight ${verdictStyle.text} bg-black/40 shrink-0`}>
                {currentSimulation.verdict}
              </div>
              <div className="flex-1">
                <p className="font-display font-extrabold text-xl">{currentSimulation.verdictTitle}</p>
                <p className="text-[13px] text-slate-400 mt-1.5 leading-relaxed">{currentSimulation.verdictReasoning}</p>
                <p className="text-[13px] mt-2 italic text-slate-300">→ {currentSimulation.recommendation}</p>
                <div className="flex flex-wrap gap-2 mt-3 font-mono text-[11px]">
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">runway {currentSimulation.todayRunwayMonths} → {currentSimulation.simulatedRunwayMonths} mo</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">buffer {inr(currentSimulation.todayBuffer)} → {inr(currentSimulation.simulatedBuffer)}</span>
                  <span className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10">goals +{currentSimulation.goalDelayMonths} mo</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex flex-col sm:flex-row gap-2.5">
              {currentSimulation.verdict === 'WAIT' ? (
                <>
                  <button onClick={acceptWaitRecommendation} className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 font-bold text-[13px] hover:bg-white/10 transition">
                    ✓ Accept — wait 6 weeks
                  </button>
                  <button onClick={confirmPurchaseAnyway} className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-bold text-[13px] hover:bg-red-400 transition">
                    Buy anyway — deduct {inr(currentSimulation.purchasePrice)}
                  </button>
                </>
              ) : currentSimulation.verdict === 'EMI' ? (
                <>
                  <button onClick={() => runSimulation({ itemName, price, mode: 'EMI_6' })} className="flex-1 py-3.5 rounded-2xl bg-amber-400 text-black font-bold text-[13px] hover:brightness-110 transition">
                    Switch to 6 EMI
                  </button>
                  <button onClick={confirmPurchaseAnyway} className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 font-bold text-[13px] hover:bg-white/10 transition">
                    Buy with cash anyway
                  </button>
                </>
              ) : (
                <button onClick={confirmPurchaseAnyway} className="w-full py-3.5 rounded-2xl bg-[#10B981] text-black font-extrabold text-[13px] hover:brightness-110 transition">
                  ✓ Confirm purchase — {inr(currentSimulation.purchasePrice)} (safe)
                </button>
              )}
            </div>
          </div>

          <SplitViewComparison simulation={currentSimulation} />
          <TrajectoryChart simulation={currentSimulation} />
        </>
      )}

      {!currentSimulation && (
        <div className="rounded-[28px] border border-dashed border-white/15 bg-white/[0.02] p-8 sm:p-10 text-center animate-fade-up">
          <div className="w-14 h-14 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center mx-auto">
            {verdict ? <CheckCircle2 className="w-6 h-6 text-[#10B981]" /> : <Clock className="w-6 h-6 text-slate-500" />}
          </div>
          <p className="font-display font-extrabold text-lg mt-4">No simulation yet</p>
          <p className="text-sm text-slate-400 mt-1">Item + amount + mode chuno, phir SIMULATE dabao — 5 second me verdict.</p>
          <p className="text-xs text-slate-500 mt-2">Judge tip: iPhone ₹80k cash → <b className="text-red-300">WAIT</b>. Phir 6 EMI try karo → <b className="text-amber-300">EMI OK</b>.</p>
        </div>
      )}
    </div>
  );
}
