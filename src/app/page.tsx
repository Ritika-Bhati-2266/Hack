'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  Zap,
  ArrowRight,
  Lock,
  Wallet,
  Calendar,
  Layers,
  ChevronRight,
  AlertCircle,
  Sparkles,
  Plus,
  X,
  Trash2
} from 'lucide-react';
import { useFinanceStore, CUSTOMERS, CustomerId } from '@/store/useFinanceStore';
import FinancialFirewall from '@/components/FinancialFirewall';

export default function DashboardPage() {
  const { user, goals, activeCustomer, switchCustomer, customProfiles, createProfile, deleteProfile } = useFinanceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', monthlyIncome: 80000, totalBalance: 150000, dailyBurnRate: 1200, rent: 25000, sip: 15000, bills: 8000 });
  const allProfiles: Record<string, { label: string; sub: string }> = { ...CUSTOMERS, ...customProfiles };
  const canCreate = form.name.trim().length >= 2 && form.monthlyIncome > 0 && form.totalBalance > 0;

  const totalEarmarked = user.earmarkedExpenses.reduce((acc, c) => acc + c.amount, 0);
  const buffer = user.totalBalance - totalEarmarked;
  const monthlyBurn = user.dailyBurnRate * 30;
  const safeRunway = (buffer / Math.max(1, monthlyBurn)).toFixed(1);
  const isLowBalance = buffer <= 0 || Number(safeRunway) < 1.0;
  
  // Safe-to-spend today formula: Buffer - (DaysRemaining * DailyBurn) — dynamic
  const daysRemainingInMonth = (() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(1, daysInMonth - now.getDate() + 1);
  })();
  const remainingBurn = daysRemainingInMonth * user.dailyBurnRate;
  const safeToSpendToday = Math.max(0, buffer - remainingBurn);

  if (isLowBalance) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-rose-500/10 border border-rose-500/30 p-8 text-center">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-rose-200">Buffer Exhausted — Immediate Attention Needed</h2>
          <p className="text-sm text-rose-300/80 mt-2">Your earmarked obligations (₹{totalEarmarked.toLocaleString('en-IN')}) exceed balance (₹{user.totalBalance.toLocaleString('en-IN')}). No safe-to-spend available.</p>
          <Link href="/simulator" className="inline-flex mt-4 px-6 py-3 rounded-xl bg-rose-600 text-white font-bold text-sm">Open Simulator — Plan Recovery</Link>
        </div>
        <FinancialFirewall />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* CUSTOMER SWITCHER — proves "every customer" personalisation */}
      <div className="flex flex-col gap-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-widest text-slate-400">DEMO: SWITCH CUSTOMER</span>
            <span className="text-xs text-slate-500 hidden sm:inline">— same iPhone → different verdict per profile</span>
          </div>
          <button onClick={() => setShowCreate(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-600 text-white text-xs font-bold hover:bg-violet-500">
            <Plus className="w-3.5 h-3.5" /> Apni Profile Banao
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {Object.keys(CUSTOMERS).map((id) => (
            <button
              key={id}
              onClick={() => switchCustomer(id)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
                activeCustomer === id ? 'bg-white text-slate-900 border-white shadow' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <span>{CUSTOMERS[id as CustomerId].label.split(' ')[0]}</span>
              <span className="hidden sm:inline font-normal text-[11px] ml-1 opacity-70">{id === 'spender' ? 'Spender' : id === 'saver' ? 'Saver' : 'Chaser'}</span>
            </button>
          ))}
          {Object.keys(customProfiles).map((id) => (
            <button
              key={id}
              onClick={() => switchCustomer(id)}
              className={`group px-4 py-2 rounded-full text-xs font-bold border transition flex items-center gap-2 ${
                activeCustomer === id ? 'bg-emerald-500 text-slate-900 border-emerald-500 shadow' : 'bg-slate-800 text-emerald-300 border-emerald-500/30 hover:bg-slate-700'
              }`}
            >
              <span>{customProfiles[id].label.split(' ')[0]}</span>
              <span onClick={(e) => { e.stopPropagation(); deleteProfile(id); }} className="opacity-60 hover:opacity-100"><Trash2 className="w-3 h-3" /></span>
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-slate-500 -mt-6">
        Active: <span className="font-bold text-violet-400">{allProfiles[activeCustomer]?.label || activeCustomer}</span> • {allProfiles[activeCustomer]?.sub || ''} • Balance ₹{user.totalBalance.toLocaleString('en-IN')} • Income ₹{user.monthlyIncome.toLocaleString('en-IN')}
      </p>

      {/* Create Profile Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Apni Profile Banao</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 rounded-full hover:bg-slate-800"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <p className="text-xs text-slate-400">Apna balance/income bharo — engine tumhara personalised verdict देगा (persisted via localStorage)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold tracking-widest text-slate-400">NAME</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Ritika" className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-violet-600 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-widest text-slate-400">MONTHLY INCOME (₹)</label>
                <input type="number" value={form.monthlyIncome} onChange={(e) => setForm({ ...form, monthlyIncome: Number(e.target.value) || 0 })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-violet-600 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-widest text-slate-400">TOTAL BALANCE (₹)</label>
                <input type="number" value={form.totalBalance} onChange={(e) => setForm({ ...form, totalBalance: Number(e.target.value) || 0 })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-violet-600 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-widest text-slate-400">DAILY BURN (₹)</label>
                <input type="number" value={form.dailyBurnRate} onChange={(e) => setForm({ ...form, dailyBurnRate: Number(e.target.value) || 0 })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-violet-600 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-widest text-slate-400">RENT (₹)</label>
                <input type="number" value={form.rent} onChange={(e) => setForm({ ...form, rent: Number(e.target.value) || 0 })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-violet-600 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-widest text-slate-400">SIP (₹)</label>
                <input type="number" value={form.sip} onChange={(e) => setForm({ ...form, sip: Number(e.target.value) || 0 })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-violet-600 outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-widest text-slate-400">BILLS (₹)</label>
                <input type="number" value={form.bills} onChange={(e) => setForm({ ...form, bills: Number(e.target.value) || 0 })} className="mt-1 w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:border-violet-600 outline-none" />
              </div>
            </div>
            <button
              disabled={!canCreate}
              onClick={() => { createProfile(form); setShowCreate(false); setForm({ name: '', monthlyIncome: 80000, totalBalance: 150000, dailyBurnRate: 1200, rent: 25000, sip: 15000, bills: 8000 }); }}
              className={`w-full py-3 rounded-xl font-bold text-sm ${canCreate ? 'bg-violet-600 text-white hover:bg-violet-500' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}`}
            >
              Create & Switch
            </button>
          </div>
        </div>
      )}

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-6 md:p-8">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Personal Financial Decision Engine</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-100">
              Don&apos;t just track past spend.{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                Simulate your future.
              </span>
            </h1>
            <p className="text-sm text-slate-400">
              Connected to RBI Account Aggregator. PREVISE locks your earmarked obligations before calculating your real-time Safe-to-Spend limit.
            </p>
          </div>

          <Link
            href="/simulator"
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all self-start lg:self-auto"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Launch What-If Simulator</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* TOP CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Card 1: Safe Emergency Buffer */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 p-5 md:p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
            <span>SAFE EMERGENCY BUFFER</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-emerald-400">₹{(buffer / 100000).toFixed(1)}L</span>
            <span className="text-xs text-slate-400 font-mono">/ ₹{(user.totalBalance / 100000).toFixed(1)}L Total</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Lock className="w-3 h-3 text-amber-400" /> ₹{(totalEarmarked / 1000).toFixed(0)}k earmarked locked
          </p>
        </div>

        {/* Card 2: Safe Runway */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 p-5 md:p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
            <span>SAFE RUNWAY</span>
            <div className="w-8 h-8 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-slate-100">{safeRunway}</span>
            <span className="text-sm font-semibold text-slate-400">Months</span>
          </div>
          <p className="text-xs text-emerald-400 mt-2 font-medium flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Safe (&gt;3.0 Months target)
          </p>
        </div>

        {/* Card 3: Goal Status */}
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800/80 p-5 md:p-6 shadow-xl relative overflow-hidden group hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-3">
            <span>GOAL STATUS</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 flex items-center justify-center text-teal-400 border border-teal-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black text-slate-100">On Track</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            {goals.length} Active Goals ({goals.map((g) => g.name.split(' ')[0]).join(', ')})
          </p>
        </div>

        {/* Card 4: Safe-to-Spend Today */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 p-5 md:p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400 mb-3">
            <span>SAFE-TO-SPEND TODAY</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-400/20 flex items-center justify-center text-emerald-300">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black font-mono text-slate-100">
              ₹{safeToSpendToday.toLocaleString('en-IN')}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            After {daysRemainingInMonth} days remaining burn (₹{remainingBurn.toLocaleString('en-IN')})
          </p>
        </div>

      </div>

      {/* FINANCIAL FIREWALL VISUALIZATION */}
      <FinancialFirewall />

      {/* UPCOMING OBLIGATIONS & LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Ledger Column */}
        <div className="lg:col-span-2 rounded-3xl bg-slate-900/90 border border-slate-800 p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-100">Earmarked Obligations Ledger</h3>
              <p className="text-xs text-slate-400">Locked expenses synced via RBI Account Aggregator</p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Auto-Earmarked: ₹{totalEarmarked.toLocaleString('en-IN')}
            </span>
          </div>

          <div className="space-y-3">
            {user.earmarkedExpenses.map((expense) => (
              <div
                key={expense.id}
                className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${
                    expense.category === 'rent' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                    expense.category === 'sip' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' :
                    'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  }`}>
                    {expense.category.toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-200">{expense.name}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-slate-500" /> Due {expense.dueDate} &bull; Auto-debit active
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono text-base font-bold text-slate-100">
                    ₹{expense.amount.toLocaleString('en-IN')}
                  </span>
                  <p className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider flex items-center justify-end gap-1">
                    <Lock className="w-2.5 h-2.5" /> Firewall Locked
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Simulator CTA Card */}
        <div className="rounded-3xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100">What-If Purchase Simulator</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Planning to buy an iPhone ₹80k, Laptop, or Vacation? Test the impact on your runway before clicking buy.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Test Case:</span>
              <span className="font-mono font-bold text-emerald-400">iPhone 16 ₹80,000</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Verdict:</span>
              <span className="font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">Wait 6 Weeks</span>
            </div>
          </div>

          <Link
            href="/simulator"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-slate-100 text-slate-950 font-extrabold text-sm hover:bg-white transition-all shadow-lg"
          >
            <span>Simulate A Purchase</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

      </div>

    </div>
  );
}
