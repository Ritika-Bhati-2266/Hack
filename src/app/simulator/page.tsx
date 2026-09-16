'use client';

import { useState } from 'react';
import { Zap, AlertTriangle, CheckCircle2, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useFinanceStore, CUSTOMERS, CustomerId } from '@/store/useFinanceStore';
import SplitViewComparison from '@/components/SplitViewComparison';
import TrajectoryChart from '@/components/TrajectoryChart';
import { PaymentMode } from '@/types';

export default function SimulatorPage() {
  const { runSimulation, currentSimulation, clearSimulation, activeCustomer, switchCustomer, user, acceptWaitRecommendation, confirmPurchaseAnyway } = useFinanceStore();
  const [itemName, setItemName] = useState('iPhone 16 Pro Max');
  const [price, setPrice] = useState(80000);
  const [mode, setMode] = useState<PaymentMode>('CASH');

  const priceError = price <= 0 ? 'Amount must be > ₹0' : price > user.totalBalance * 3 ? 'Amount unusually high vs balance' : null;
  const nameError = !itemName.trim() ? 'Item name required' : null;
  const canSimulate = !priceError && !nameError;

  const handleSimulate = () => {
    if (!canSimulate) return;
    runSimulation({ itemName: itemName.trim(), price, mode });
  };

  const modeOptions: { id: PaymentMode; label: string; sub: string }[] = [
    { id: 'CASH', label: 'Full Cash', sub: `₹${price.toLocaleString('en-IN')}` },
    { id: 'EMI_3', label: '3 EMI', sub: `~₹${Math.round((price * 1.07) / 3).toLocaleString('en-IN')}/mo` },
    { id: 'EMI_6', label: '6 EMI', sub: `~₹${Math.round((price * 1.10) / 6).toLocaleString('en-IN')}/mo` },
    { id: 'EMI_12', label: '12 EMI', sub: `~₹${Math.round((price * 1.14) / 12).toLocaleString('en-IN')}/mo` },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-slate-400 hover:text-slate-200">
        <ArrowLeft className="w-4 h-4" /> Back to Dashboard
      </Link>
      {/* Customer switcher — same as dashboard, proves every-customer personalisation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
        <span className="text-xs text-slate-400">
          Simulating for: <b className="text-violet-400">{CUSTOMERS[activeCustomer].label}</b> • {CUSTOMERS[activeCustomer].sub} • Bal ₹{user.totalBalance.toLocaleString('en-IN')}
        </span>
        <div className="flex gap-2">
          {(Object.keys(CUSTOMERS) as CustomerId[]).map((id) => (
            <button
              key={id}
              onClick={() => switchCustomer(id)}
              className={`px-4 py-2 rounded-full text-xs font-bold border ${activeCustomer === id ? 'bg-white text-slate-900 border-white' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
            >
              {CUSTOMERS[id].label.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 p-6 md:p-8 shadow-xl">
        <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
          <Zap className="w-6 h-6 text-violet-400" /> What-If Simulator
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Test any purchase before you swipe — deterministic rules engine calculates runway + buffer + goal impact. India Stack AA ready (mock).
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 tracking-widest">WHAT DO YOU WANT TO BUY?</label>
            <input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              className={`mt-1.5 w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm font-medium text-slate-100 focus:outline-none ${nameError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-violet-600'}`}
              placeholder="e.g., iPhone 16 Pro"
            />
            {nameError && <p className="text-[11px] text-rose-400 mt-1">{nameError}</p>}
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 tracking-widest">AMOUNT (₹)</label>
            <input
              type="number"
              value={price}
              min={1}
              onChange={(e) => setPrice(Number(e.target.value) || 0)}
              className={`mt-1.5 w-full bg-slate-950 border rounded-xl px-4 py-3 text-sm font-bold text-slate-100 focus:outline-none ${priceError ? 'border-rose-500 focus:border-rose-500' : 'border-slate-700 focus:border-violet-600'}`}
            />
            {priceError && <p className="text-[11px] text-rose-400 mt-1">{priceError}</p>}
            <div className="flex gap-1.5 mt-2">
              {[50000, 80000, 120000].map((v) => (
                <button
                  key={v}
                  onClick={() => setPrice(v)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border ${price === v ? 'bg-white text-black border-white' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  ₹{v / 1000}k
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 tracking-widest">PAYMENT MODE</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {modeOptions.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`py-2.5 rounded-xl text-xs font-bold border text-left px-3 ${mode === m.id ? 'bg-violet-600 text-white border-violet-600' : 'bg-slate-800 text-slate-400 border-slate-700'}`}
                >
                  <span>{m.label}</span>
                  <span className="block text-[10px] font-normal opacity-70">{m.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          onClick={handleSimulate}
          disabled={!canSimulate}
          className={`mt-6 w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all shadow-lg ${canSimulate ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}`}
        >
          ⚡ Simulate Before You Swipe — Run Engine
        </button>
        {!canSimulate && <p className="text-[11px] text-amber-400 mt-2 text-center">Fix errors above to simulate</p>}
        {currentSimulation && (
          <button onClick={clearSimulation} className="mt-2 w-full py-2 text-xs text-slate-400 hover:text-slate-200">
            Clear simulation
          </button>
        )}
      </div>

      {currentSimulation && (
        <>
          <SplitViewComparison simulation={currentSimulation} />
          <TrajectoryChart simulation={currentSimulation} />

          <div
            className={`rounded-3xl p-6 border ${
              currentSimulation.verdict === 'WAIT'
                ? 'bg-rose-500/10 border-rose-500/30'
                : currentSimulation.verdict === 'EMI'
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-emerald-500/10 border-emerald-500/30'
            }`}
          >
            <div className="flex gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0 ${
                  currentSimulation.verdict === 'WAIT' ? 'bg-rose-500' : currentSimulation.verdict === 'EMI' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
              >
                {currentSimulation.verdict === 'WAIT' ? <AlertTriangle className="w-5 h-5" /> : currentSimulation.verdict === 'EMI' ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold tracking-widest text-slate-100">{currentSimulation.verdictTitle}</p>
                <p className="text-xs text-slate-300 mt-1 leading-4">{currentSimulation.verdictReasoning}</p>
                <p className="text-xs text-slate-400 mt-2 italic">{currentSimulation.recommendation}</p>
              </div>
            </div>
            {/* Phase 1: Wired verdict actions */}
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              {currentSimulation.verdict === 'WAIT' ? (
                <>
                  <button
                    onClick={acceptWaitRecommendation}
                    className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-800 transition"
                  >
                    ✓ Accept — Wait 6 Weeks
                  </button>
                  <button
                    onClick={confirmPurchaseAnyway}
                    className="flex-1 py-3 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition"
                  >
                    Buy Anyway — Deduct ₹{currentSimulation.purchasePrice.toLocaleString('en-IN')}
                  </button>
                </>
              ) : currentSimulation.verdict === 'EMI' ? (
                <>
                  <button
                    onClick={() => runSimulation({ itemName, price, mode: 'EMI_6' })}
                    className="flex-1 py-3 rounded-xl bg-amber-500 text-slate-900 font-bold text-xs hover:bg-amber-400 transition"
                  >
                    Switch to 6 EMI
                  </button>
                  <button
                    onClick={confirmPurchaseAnyway}
                    className="flex-1 py-3 rounded-xl bg-slate-900 border border-slate-700 text-slate-200 font-bold text-xs hover:bg-slate-800 transition"
                  >
                    Buy with Cash Anyway
                  </button>
                </>
              ) : (
                <button
                  onClick={confirmPurchaseAnyway}
                  className="w-full py-3 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition"
                >
                  ✓ Confirm Purchase — ₹{currentSimulation.purchasePrice.toLocaleString('en-IN')} (Safe)
                </button>
              )}
            </div>
          </div>
        </>
      )}

      {!currentSimulation && (
        <div className="rounded-2xl bg-slate-900/50 border border-slate-800 border-dashed p-8 text-center">
          <p className="text-sm text-slate-400">No simulation yet. Enter an item and hit “Simulate” — trajectory chart will appear here.</p>
          <p className="text-xs text-slate-500 mt-1">Try: iPhone ₹80k • Cash vs 6 EMI — see runway drop instantly.</p>
        </div>
      )}
    </div>
  );
}
