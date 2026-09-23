'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  Zap,
  ArrowRight,
  ArrowUpRight,
  Lock,
  Wallet,
  Plus,
  X,
  Trash2,
  Smartphone,
  BadgeCheck,
  Flame,
} from 'lucide-react';
import { useFinanceStore, CUSTOMERS, CustomerId } from '@/store/useFinanceStore';
import { previewSimulation } from '@/lib/engine';
import FinancialFirewall from '@/components/FinancialFirewall';

export default function DashboardPage() {
  const { user, goals, activeCustomer, switchCustomer, customProfiles, createProfile, deleteProfile } = useFinanceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', monthlyIncome: 80000, totalBalance: 150000, dailyBurnRate: 1200, rent: 25000, sip: 15000, bills: 8000 });
  const allProfiles: Record<string, { label: string; sub: string }> = { ...CUSTOMERS, ...customProfiles };
  const canCreate = form.name.trim().length >= 2 && form.monthlyIncome > 0 && form.monthlyIncome <= 100000000 && form.totalBalance > 0 && form.totalBalance <= 100000000 && form.dailyBurnRate >= 0 && form.rent >= 0 && form.sip >= 0 && form.bills >= 0;
  const earmarkedTotal = form.rent + form.sip + form.bills;

  const totalEarmarked = user.earmarkedExpenses.reduce((acc, c) => acc + c.amount, 0);
  // Single source of truth: same backend-parity engine as the Simulator.
  // Hero demo preview (iPhone ₹80k cash) is derived live — never hardcoded.
  const heroPreview = previewSimulation(user, goals, { itemName: 'iPhone 16', price: 80000, mode: 'CASH' });
  const buffer = heroPreview.todayBuffer;
  const safeRunway = heroPreview.todayRunwayMonths.toFixed(1);
  const safeToSpendToday = heroPreview.todaySafeSpendToday;
  const heroVerdict = heroPreview.verdict;
  const heroAfterRunway = heroPreview.simulatedRunwayMonths.toFixed(1);

  // Honest goal tracking: months-to-goal (income − commitments) vs months until targetDate
  const monthlySavingsForGoals = user.monthlyIncome - totalEarmarked;
  const monthsUntil = (targetDate: string) => {
    const ms = new Date(targetDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24 * 30)));
  };
  const goalsOnTrack = goals.filter((g) => {
    if (monthlySavingsForGoals <= 0) return false;
    const monthsToGoal = Math.ceil(Math.max(0, g.targetAmount - g.currentAmount) / monthlySavingsForGoals);
    return monthsToGoal <= monthsUntil(g.targetDate);
  }).length;

  const daysRemainingInMonth = (() => {
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    return Math.max(1, daysInMonth - now.getDate() + 1);
  })();
  const remainingBurn = daysRemainingInMonth * user.dailyBurnRate;

  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  return (
    <div className="space-y-8">
      {/* ── Ticker ─────────────────────────────── */}
      <div className="overflow-hidden max-w-full rounded-full border border-white/10 bg-white/[0.03] py-2 select-none" aria-hidden="true">
        <div className="flex whitespace-nowrap animate-ticker gap-8 text-[11px] font-mono text-slate-400 w-max">
          {[0, 1].map((k) => (
            <span key={k} className="flex gap-8">
              <span>RUNWAY <b className="text-[#10B981]">{safeRunway} MO</b></span>
              <span>BUFFER <b className="text-white">{inr(buffer)}</b></span>
              <span>FIREWALL <b className="text-amber-300">{inr(totalEarmarked)} LOCKED</b></span>
              <span>ENGINE <b className="text-emerald-300">DETERMINISTIC • NO LLM</b></span>
              <span>AA <b className="text-amber-300">MOCK • DEMO DATA</b></span>
              <span>REAL <b className="text-white">CSV ONLY</b></span>
              <span>QA <b className="text-white">24/24 PASS</b></span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Persona switcher (judge demo) ──────── */}
      <div className="glass rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-up">
        <div className="flex items-center gap-2 px-1 shrink-0">
          <Flame className="w-4 h-4 text-[#10B981]" />
          <span className="text-[11px] font-black tracking-[0.18em] text-slate-400">JUDGE DEMO — SWITCH PERSONA</span>
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          {Object.keys(CUSTOMERS).map((id) => (
            <button
              key={id}
              onClick={() => switchCustomer(id)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                activeCustomer === id
                  ? 'bg-[#10B981] text-black border-[#10B981] shadow-[0_0_20px_rgba(16,185,129,0.3)]'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {CUSTOMERS[id as CustomerId].label.split(' ')[0]}
              <span className="hidden sm:inline font-normal text-[11px] ml-1 opacity-70">
                {id === 'spender' ? '• Spender' : id === 'saver' ? '• Saver' : '• Tight'}
              </span>
            </button>
          ))}
          {Object.keys(customProfiles).map((id) => (
            <button
              key={id}
              onClick={() => switchCustomer(id)}
              className={`px-4 py-2 rounded-full text-xs font-bold border flex items-center gap-2 transition-all active:scale-95 ${
                activeCustomer === id ? 'bg-emerald-400 text-black border-emerald-400' : 'bg-white/5 text-emerald-300 border-emerald-400/20'
              }`}
            >
              {customProfiles[id].label.split(' ')[0]}
              <span onClick={(e) => { e.stopPropagation(); deleteProfile(id); }} className="opacity-60 hover:opacity-100">
                <Trash2 className="w-3 h-3" />
              </span>
            </button>
          ))}
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-dashed border-white/20 text-slate-300 text-xs font-bold transition-all active:scale-95 hover:border-[#10B981]/50 hover:text-[#10B981]"
          >
            <Plus className="w-3.5 h-3.5" /> Apni profile
          </button>
        </div>
      </div>

      {/* ── HERO (landing-first) ───────────────── */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/10 bg-[#0B111E] animate-fade-up stagger-1">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute -top-32 left-1/4 w-[500px] h-[300px] bg-[#10B981]/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 right-0 w-[400px] h-[300px] bg-emerald-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative grid lg:grid-cols-[1.15fr_0.85fr] gap-6 sm:gap-8 p-4 sm:p-10">
          {/* Left copy */}
          <div className="space-y-4 sm:space-y-5 min-w-0">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#10B981]/10 border border-[#10B981]/25 text-[#10B981] text-[11px] font-bold tracking-wide">
              <BadgeCheck className="w-3.5 h-3.5" />
              EXPENSE TRACKERS SHOW PAST • PREVISE SIMULATES FUTURE
            </div>
            <h1 className="font-display font-black tracking-tight leading-[0.95] text-[clamp(2.5rem,9vw,4rem)]">
              Buy it or
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10B981] via-emerald-300 to-cyan-300">
                park it?
              </span>
              <br />
              Know in 5 sec.
            </h1>
            <p className="text-slate-400 text-[15px] leading-relaxed max-w-xl">
              <b className="text-slate-200">“Mere paise ka kya hoga agar main ye kharidu?”</b> — Previse
              runway, buffer aur goal-delay simulate karta hai <b className="text-slate-200">swipe se pehle</b>.
              Deterministic rules. No hallucination.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link
                href="/simulator"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-[#10B981] text-black font-extrabold text-sm shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
              >
                <Zap className="w-4 h-4 fill-black" />
                Launch What-If Simulator
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/connect"
                className="inline-flex items-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-slate-200 transition-all active:scale-[0.98] hover:bg-white/10"
              >
                <Lock className="w-4 h-4 text-amber-300" />
                Connect Bank (AA)
              </Link>
            </div>
            <div className="flex items-center gap-5 pt-2 text-[11px] font-mono text-slate-500">
              <span>⚡ INSTANT LOCAL ENGINE</span>
              <span>✓ VERIFIED BY :3001</span>
              <span className="hidden sm:inline">RBI AA MOCK</span>
            </div>
          </div>

          {/* Right — live verdict card */}
          <div className="relative min-w-0">
            <div className="rounded-3xl overflow-hidden border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-white/10 flex items-center justify-center">
                    <Smartphone className="w-4.5 h-4.5 w-5 h-5 text-slate-200" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[13px] font-bold">iPhone 16 • ₹80,000</p>
                    <p className="text-[11px] text-slate-500 font-mono">CASH • {allProfiles[activeCustomer]?.label}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-black tracking-widest px-2.5 py-1 rounded-lg border animate-stamp-in verdict-stamp ${
                  heroVerdict === 'WAIT' ? 'bg-red-500/15 text-red-300 border-red-500/30' :
                  heroVerdict === 'EMI' ? 'bg-amber-400/15 text-amber-300 border-amber-400/30' :
                   'bg-orange-400/15 text-orange-300 border-orange-400/30'
                }`}>
                  {heroVerdict}
                </span>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <div className="flex justify-between text-[11px] font-bold tracking-widest text-slate-500 mb-2">
                    <span>RUNWAY IMPACT</span>
                    <span className="font-mono text-slate-300">{safeRunway} MO → <b className={heroVerdict === 'WAIT' ? 'text-red-300' : heroVerdict === 'EMI' ? 'text-amber-300' : 'text-emerald-300'}>{heroAfterRunway} MO</b></span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden flex">
                    <div className="h-full bg-gradient-to-r from-[#10B981] to-emerald-400 rounded-full" style={{ width: `${Math.min(70, Number(safeRunway) * 18)}%` }} />
                    <div className="h-full bg-red-500/80" style={{ width: '18%' }} />
                  </div>
                    <div className="flex justify-between mt-1.5 text-[11px] font-mono">
                      <span className="text-emerald-300">● before {safeRunway}mo</span>
                      <span className={heroVerdict === 'WAIT' ? 'text-red-300' : heroVerdict === 'EMI' ? 'text-amber-300' : 'text-emerald-300'}>● after {heroAfterRunway}mo</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/[0.04] border border-white/[0.07] p-3.5">
                    <p className="text-[10px] font-bold tracking-widest text-slate-500">BUFFER LEFT</p>
                    <p className="font-mono font-black text-lg mt-0.5">{inr(buffer)}</p>
                  </div>
                  <div className="rounded-2xl bg-[#10B981]/[0.07] border border-[#10B981]/20 p-3.5">
                    <p className="text-[10px] font-bold tracking-widest text-[#10B981]/80">SAFE TODAY</p>
                    <p className="font-mono font-black text-lg mt-0.5 text-[#10B981]">{inr(safeToSpendToday)}</p>
                  </div>
                </div>
                <Link href="/simulator" className="flex items-center justify-between group px-1 pt-1">
                  <span className="text-xs text-slate-400">Same phone, persona badlo — verdict badlega.</span>
                  <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#10B981] group-hover:gap-2 transition-all">
                    Try it <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BENTO ────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-up stagger-2">
        <div className="glass card-hover rounded-3xl p-5 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-[0.16em] text-slate-500">SAFE BUFFER</span>
            <ShieldCheck className="w-4 h-4 text-[#10B981]" />
          </div>
          <p className="font-display font-black text-[28px] leading-none">₹{(buffer / 100000).toFixed(1)}L</p>
          <p className="text-[11px] text-slate-500 mt-2 font-mono">of {inr(user.totalBalance)} • {inr(totalEarmarked)} locked</p>
          <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full bg-[#10B981] rounded-full" style={{ width: `${Math.max(4, Math.min(100, (buffer / Math.max(1, user.totalBalance)) * 100))}%` }} />
          </div>
        </div>

        <div className="glass card-hover rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-[0.16em] text-slate-500">RUNWAY</span>
            <Clock className="w-4 h-4 text-violet-300" />
          </div>
          <p className="font-display font-black text-[28px] leading-none">{safeRunway}<span className="text-sm font-bold text-slate-500 ml-1">mo</span></p>
          <p className="text-[11px] mt-2 font-bold text-emerald-300 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Target &gt;3.0 mo
          </p>
        </div>

        <div className="glass card-hover rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-[0.16em] text-slate-500">GOALS</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <p className="font-display font-black text-[28px] leading-none">{goalsOnTrack} <span className="text-sm font-bold text-emerald-300">on track</span></p>
          <p className="text-[11px] text-slate-500 mt-2 font-mono truncate">{goals.map((g) => g.name.split(' ')[0]).join(' • ')}</p>
        </div>

        <div className="rounded-3xl p-5 bg-orange-400 text-black card-hover relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black tracking-[0.16em] text-black/60">SPEND TODAY</span>
            <Wallet className="w-4 h-4" />
          </div>
          <p className="font-display font-black text-[28px] leading-none font-mono">{inr(safeToSpendToday)}</p>
          <p className="text-[11px] mt-2 font-semibold text-black/60">after {daysRemainingInMonth}d burn {inr(remainingBurn)}</p>
        </div>
      </section>

      {/* ── FIREWALL ───────────────────────────── */}
      <div className="animate-fade-up stagger-3">
        <FinancialFirewall />
      </div>

      {/* ── LEDGER + CTA ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up stagger-4">
        <div className="lg:col-span-2 glass rounded-3xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.07]">
            <div>
              <h3 className="font-display font-extrabold text-lg">Earmarked Ledger</h3>
              <p className="text-xs text-slate-500">Rent + SIP + bills — firewall locked, spend me count nahi</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
              {inr(totalEarmarked)} locked
            </span>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {user.earmarkedExpenses.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-3 py-4 group rounded-xl px-2 -mx-2 transition-colors hover:bg-white/[0.03]">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] border ${
                    e.category === 'rent' ? 'bg-amber-400/10 text-amber-300 border-amber-400/20' :
                    e.category === 'sip' ? 'bg-violet-400/10 text-violet-300 border-violet-400/20' :
                    e.category === 'emi' ? 'bg-orange-400/10 text-orange-300 border-orange-400/20' :
                    'bg-cyan-400/10 text-cyan-300 border-cyan-400/20'
                  }`}>
                    {e.category.slice(0, 3).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{e.name}</p>
                    <p className="text-[11px] text-slate-500">Due {e.dueDate} • auto-debit</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold">{inr(e.amount)}</p>
                  <p className="text-[10px] font-bold text-amber-300/80 tracking-wider flex items-center justify-end gap-1">
                    <Lock className="w-2.5 h-2.5" /> LOCKED
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-[#101828] to-black p-6 flex flex-col justify-between relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#10B981]/60 to-transparent" />
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-[#10B981]" />
            </div>
            <h3 className="font-display font-extrabold text-xl leading-tight">Try the 10-second demo judges love</h3>
            <p className="text-xs text-slate-400 leading-relaxed">iPhone ₹80k cash → runway {safeRunway} → {heroAfterRunway}mo → <b className={heroVerdict === 'WAIT' ? 'text-red-300' : heroVerdict === 'EMI' ? 'text-amber-300' : 'text-emerald-300'}>{heroVerdict}</b>. Persona switch karo → verdict flip.</p>
            <div className="rounded-2xl bg-black/60 border border-white/10 p-3.5 font-mono text-[11px] space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">INPUT</span><span className="text-white">iPhone ₹80k cash</span></div>
              <div className="flex justify-between"><span className="text-slate-500">OUTPUT</span><span className={heroVerdict === 'WAIT' ? 'text-red-300 font-bold' : heroVerdict === 'EMI' ? 'text-amber-300 font-bold' : 'text-emerald-300 font-bold'}>{heroVerdict} • {heroPreview.verdictTitle}</span></div>
            </div>
          </div>
          <Link href="/simulator" className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-white text-black font-extrabold text-sm hover:bg-[#10B981] transition-colors">
            Simulate a purchase <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── HOW IT WORKS ───────────────────────── */}
      <section className="grid sm:grid-cols-3 gap-3 animate-fade-up stagger-5">
        {[
          { n: '01', t: 'Connect', d: 'AA mock / CSV → live profile in 3 clicks', c: 'text-cyan-300' },
          { n: '02', t: 'Simulate', d: 'Cash vs EMI → runway + buffer + goals', c: 'text-[#10B981]' },
          { n: '03', t: 'Decide', d: 'BUY / WAIT / EMI stamp — deterministic', c: 'text-violet-300' },
        ].map((s) => (
          <div key={s.n} className="glass rounded-2xl p-5 flex gap-4 items-start">
            <span className={`font-display font-black text-2xl ${s.c}`}>{s.n}</span>
            <div>
              <p className="font-bold text-sm">{s.t}</p>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.d}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Create profile modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-[#0B111E] border border-white/10 rounded-3xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">Apni profile banao</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold tracking-widest text-slate-500">NAME</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Ritika" className="mt-1 w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-[#10B981] outline-none" />
              </div>
              {([['monthlyIncome', 'MONTHLY INCOME (₹)'], ['totalBalance', 'TOTAL BALANCE (₹)'], ['dailyBurnRate', 'DAILY BURN (₹)'], ['rent', 'RENT (₹)'], ['sip', 'SIP (₹)'], ['bills', 'BILLS (₹)']] as const).map(([k, label]) => (
                <div key={k}>
                  <label className="text-[11px] font-bold tracking-widest text-slate-500">{label}</label>
                  <input type="number" min={0} value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) || 0 })} className="mt-1 w-full bg-black/50 border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-[#10B981] outline-none" />
                </div>
              ))}
            </div>
            {earmarkedTotal > form.totalBalance && form.totalBalance > 0 && (
              <p className="text-[11px] text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded-xl px-3 py-2">Monthly earmarked (₹{earmarkedTotal.toLocaleString('en-IN')}) balance se zyada hai — runway 0 se start hoga.</p>
            )}
            <button
              disabled={!canCreate}
              onClick={() => { createProfile(form); setShowCreate(false); setForm({ name: '', monthlyIncome: 80000, totalBalance: 150000, dailyBurnRate: 1200, rent: 25000, sip: 15000, bills: 8000 }); }}
              className={`w-full py-3 rounded-xl font-bold text-sm ${canCreate ? 'bg-[#10B981] text-black hover:brightness-110' : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
            >
              Create & Switch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
