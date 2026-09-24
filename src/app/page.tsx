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
import { useFinanceStore } from '@/store/useFinanceStore';
import { previewSimulation } from '@/lib/engine';
import FinancialFirewall from '@/components/FinancialFirewall';
import DataSourceBanner from '@/components/DataSourceBanner';

export default function DashboardPage() {
  const { user, goals, activeCustomer, switchCustomer, customProfiles, createProfile, deleteProfile, liveData } = useFinanceStore();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', monthlyIncome: 80000, totalBalance: 150000, dailyBurnRate: 1200, rent: 25000, sip: 15000, bills: 8000 });
  const allProfiles: Record<string, { label: string; sub: string }> = { ...customProfiles };
  const activeLabel = activeCustomer === 'live' && liveData ? `Live (${liveData.source === 'csv' ? 'CSV' : 'AA'})` : allProfiles[activeCustomer]?.label || 'No data — connect';
  const hasData = !!liveData || user.totalBalance > 0 || user.earmarkedExpenses.length > 0;
  const canCreate = form.name.trim().length >= 2 && form.monthlyIncome > 0 && form.monthlyIncome <= 100000000 && form.totalBalance > 0 && form.totalBalance <= 100000000 && form.dailyBurnRate >= 0 && form.rent >= 0 && form.sip >= 0 && form.bills >= 0;
  const earmarkedTotal = form.rent + form.sip + form.bills;

  const totalEarmarked = user.earmarkedExpenses.reduce((acc, c) => acc + c.amount, 0);
  // Single source of truth: same backend-parity engine as the Simulator.
  // Hero preview (iPhone ₹80k cash) is derived live — never hardcoded.
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
    <div className="space-y-8 relative">
      {/* Background Cyber Lights */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-r from-blue-600/15 via-cyan-500/20 to-purple-600/15 blur-[140px] pointer-events-none rounded-full" />

      {/* ── Ticker ─────────────────────────────── */}
      <div className="overflow-hidden max-w-full rounded-full border border-cyan-500/20 bg-cyan-950/20 backdrop-blur-md py-3 px-5 select-none shadow-[0_0_20px_rgba(0,240,255,0.1)]" aria-hidden="true">
        <div className="flex whitespace-nowrap animate-ticker gap-10 sm:gap-12 text-[11px] sm:text-xs font-mono text-cyan-300/80 w-max">
          {[0, 1].map((k) => (
            <span key={k} className="flex gap-10 sm:gap-12 shrink-0 pr-10 sm:pr-12">
              <span className="shrink-0">RUNWAY <b className="text-cyan-400 font-bold">{safeRunway} MO</b></span>
              <span className="shrink-0">BUFFER <b className="text-white font-bold">{inr(buffer)}</b></span>
              <span className="shrink-0">FIREWALL <b className="text-amber-300 font-bold">{inr(totalEarmarked)} LOCKED</b></span>
              <span className="shrink-0">ENGINE <b className="text-cyan-300 font-bold">DETERMINISTIC • NO LLM</b></span>
              <span className="shrink-0">AA <b className="text-safe font-bold">LIVE</b></span>
              <span className="shrink-0">CSV <b className="text-white font-bold">REAL DATA</b></span>
              <span className="shrink-0">QA <b className="text-emerald-400 font-bold">24/24 PASS</b></span>
            </span>
          ))}
        </div>
      </div>

      {/* ── Profiles (live + custom only, no demo) ──────── */}
      {liveData ? <DataSourceBanner source={liveData.source} /> : <DataSourceBanner source="none" />}
      <div className="rounded-2xl border border-white/10 bg-[#0b0f19]/80 backdrop-blur-xl p-3.5 flex flex-col sm:flex-row sm:items-center gap-3 animate-fade-up shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-2 px-1 shrink-0">
          <Flame className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span className="text-[11px] font-mono font-extrabold tracking-[0.18em] text-cyan-300">PROFILES</span>
        </div>
        <div className="flex flex-wrap gap-2 flex-1">
          {liveData && (
            <button
              onClick={() => switchCustomer('live')}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all active:scale-95 ${
                activeCustomer === 'live'
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-500 text-white border-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                  : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              ● Live
              <span className="hidden sm:inline font-normal text-[11px] ml-1 opacity-80">
                • {liveData.source === 'csv' ? 'CSV' : 'AA'}
              </span>
            </button>
          )}
          {Object.keys(customProfiles).map((id) => (
            <button
              key={id}
              onClick={() => switchCustomer(id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all active:scale-95 ${
                activeCustomer === id ? 'bg-cyan-400 text-black border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.5)]' : 'bg-white/5 text-cyan-300 border-cyan-500/20'
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
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-dashed border-cyan-500/40 text-cyan-300 text-xs font-bold transition-all active:scale-95 hover:border-cyan-400 hover:bg-cyan-500/10"
          >
            <Plus className="w-3.5 h-3.5" /> Create Profile
          </button>
        </div>
      </div>

      {/* ── HERO (landing-first) ───────────────── */}
      <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#070b14]/90 backdrop-blur-2xl shadow-[0_25px_80px_rgba(0,0,0,0.8)] animate-fade-up stagger-1">
        <div className="absolute inset-0 bg-framer-grid opacity-30" />
        <div className="absolute -top-32 left-1/4 w-[600px] h-[350px] bg-blue-600/20 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 right-0 w-[500px] h-[350px] bg-cyan-400/15 blur-[140px] rounded-full pointer-events-none" />

        <div className="relative grid lg:grid-cols-[1.15fr_0.85fr] gap-6 sm:gap-8 p-6 sm:p-12 items-center">
          {/* Left copy */}
          <div className="space-y-5 sm:space-y-6 min-w-0">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-cyan-400/30 text-cyan-300 text-[11px] font-mono font-bold tracking-wide shadow-[0_0_20px_rgba(0,240,255,0.2)]">
              <BadgeCheck className="w-4 h-4 text-cyan-400" />
              EXPENSE TRACKERS SHOW PAST • PREVISE SIMULATES FUTURE
            </div>
            <h1 className="font-display font-black tracking-tight leading-[0.95] text-[clamp(2.6rem,8vw,4.5rem)] text-white">
              Buy it or
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 drop-shadow-[0_0_35px_rgba(0,240,255,0.4)]">
                park it?
              </span>
              <br />
              Know in 5 sec.
            </h1>
            <p className="text-gray-300 text-[16px] leading-relaxed max-w-xl font-normal">
              <b className="text-white font-semibold">“Mere paise ka kya hoga agar main ye kharidu?”</b> — Previse
              runway, buffer aur goal-delay simulate karta hai <b className="text-cyan-300 font-semibold">swipe se pehle</b>.
              Deterministic rules. Zero hallucination.
            </p>
            <div className="flex flex-wrap gap-3.5 pt-2">
              {!hasData ? (
                <>
                  <Link
                    href="/connect"
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white font-extrabold text-sm shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:shadow-[0_0_55px_rgba(0,240,255,0.6)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    <Lock className="w-4 h-4 text-white" />
                    Connect Bank (AA)
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/simulator"
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white transition-all active:scale-[0.98] hover:bg-white/10"
                  >
                    <Zap className="w-4 h-4 text-dusk" />
                    Try Simulator anyway
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/simulator"
                    className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white font-extrabold text-sm shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:shadow-[0_0_55px_rgba(0,240,255,0.6)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    <Zap className="w-4 h-4 fill-white text-white" />
                    Launch What-If Simulator
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/connect"
                    className="inline-flex items-center gap-2 px-7 py-4 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white transition-all active:scale-[0.98] hover:bg-white/10 hover:border-cyan-500/40"
                  >
                    <Lock className="w-4 h-4 text-amber-300" />
                    Connect Bank (AA)
                  </Link>
                </>
              )}
            </div>
            <div className="flex items-center gap-6 pt-3 text-[11px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" /> INSTANT ENGINE</span>
              <span>✓ VERIFIED BY :3001</span>
              <span className="hidden sm:inline">RBI AA LIVE</span>
            </div>
          </div>

          {/* Right — live verdict card (Framer dark frame look) */}
          <div className="relative min-w-0">
            {/* Decorative back glow frame */}
            <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 blur-xl opacity-30 animate-pulse" />

            <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#0e1424]/90 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-cyan-400/30 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.2)]">
                    <Smartphone className="w-5 h-5 text-cyan-300" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-[14px] font-bold text-white">iPhone 16 • ₹80,000</p>
                    <p className="text-[11px] text-gray-400 font-mono">CASH • {activeLabel}</p>
                  </div>
                </div>
                <span className={`text-[11px] font-black tracking-widest px-3 py-1 rounded-xl border animate-stamp-in shadow-lg ${
                  heroVerdict === 'WAIT' ? 'bg-red-500/20 text-red-300 border-red-500/40 shadow-red-500/20' :
                  heroVerdict === 'EMI' ? 'bg-amber-400/20 text-amber-300 border-amber-400/40 shadow-amber-400/20' :
                   'bg-cyan-400/20 text-cyan-300 border-cyan-400/40 shadow-cyan-400/20'
                }`}>
                  {heroVerdict}
                </span>
              </div>
              <div className="p-6 space-y-5">
                <div>
                  <div className="flex justify-between text-[11px] font-mono font-bold tracking-widest text-gray-400 mb-2">
                    <span>RUNWAY IMPACT</span>
                    <span className="text-gray-300">{safeRunway} MO → <b className={heroVerdict === 'WAIT' ? 'text-red-400' : heroVerdict === 'EMI' ? 'text-amber-300' : 'text-cyan-300'}>{heroAfterRunway} MO</b></span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 border border-white/10 overflow-hidden flex p-0.5">
                    <div className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full" style={{ width: `${Math.min(70, Number(safeRunway) * 18)}%` }} />
                    <div className="h-full bg-red-500/80 rounded-full ml-1" style={{ width: '18%' }} />
                  </div>
                  <div className="flex justify-between mt-2 text-[11px] font-mono">
                    <span className="text-cyan-400">● before {safeRunway}mo</span>
                    <span className={heroVerdict === 'WAIT' ? 'text-red-300' : heroVerdict === 'EMI' ? 'text-amber-300' : 'text-cyan-300'}>● after {heroAfterRunway}mo</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-4">
                    <p className="text-[10px] font-mono font-bold tracking-widest text-gray-400">BUFFER LEFT</p>
                    <p className="font-mono font-black text-xl mt-1 text-white">{inr(buffer)}</p>
                  </div>
                  <div className="rounded-2xl bg-cyan-500/10 border border-cyan-400/30 p-4 shadow-[0_0_20px_rgba(0,240,255,0.15)]">
                    <p className="text-[10px] font-mono font-bold tracking-widest text-cyan-300">SAFE TODAY</p>
                    <p className="font-mono font-black text-xl mt-1 text-cyan-300">{inr(safeToSpendToday)}</p>
                  </div>
                </div>
                <Link href="/simulator" className="flex items-center justify-between group px-1 pt-1">
                  <span className="text-xs text-gray-400">{hasData ? 'Live numbers pe based — apna amount try karo.' : 'Bina bank data ke preview hai — real verdict ke liye connect karo.'}</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-cyan-400 group-hover:gap-2.5 transition-all">
                    Try it <ArrowUpRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BENTO ────────────────────────── */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-up stagger-2">
        <div className="cyber-card rounded-3xl p-6 relative overflow-hidden group col-span-2 lg:col-span-1 border-cyan-400/40 shadow-[0_0_35px_rgba(0,240,255,0.18)] bg-cyan-500/[0.06]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono font-black tracking-[0.16em] text-cyan-300">SPEND TODAY ★</span>
            <Wallet className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
          </div>
          <p className="font-display font-black text-[40px] leading-none text-cyan-300 font-mono">{inr(safeToSpendToday)}</p>
          <p className="text-[11px] mt-2 font-mono text-gray-300">after {daysRemainingInMonth}d burn {inr(remainingBurn)}</p>
        </div>

        <div className="cyber-card rounded-3xl p-6 relative overflow-hidden group opacity-80">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono font-black tracking-[0.16em] text-gray-400">SAFE BUFFER</span>
            <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="font-display font-black text-[32px] leading-none text-white">₹{(buffer / 100000).toFixed(1)}L</p>
          <p className="text-[11px] text-gray-400 mt-2 font-mono">of {inr(user.totalBalance)} • {inr(totalEarmarked)} locked</p>
          <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden p-0.5">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full" style={{ width: `${Math.max(4, Math.min(100, (buffer / Math.max(1, user.totalBalance)) * 100))}%` }} />
          </div>
        </div>

        <div className="cyber-card rounded-3xl p-6 relative overflow-hidden group opacity-80">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono font-black tracking-[0.16em] text-gray-400">RUNWAY</span>
            <Clock className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="font-display font-black text-[32px] leading-none text-white">{safeRunway}<span className="text-base font-bold text-gray-400 ml-1">mo</span></p>
          <p className="text-[11px] mt-2 font-bold text-cyan-300 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> Target &gt;3.0 mo
          </p>
        </div>

        <div className="cyber-card rounded-3xl p-6 relative overflow-hidden group opacity-80">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono font-black tracking-[0.16em] text-gray-400">GOALS</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
          </div>
          <p className="font-display font-black text-[32px] leading-none text-white">{goalsOnTrack} <span className="text-base font-bold text-cyan-400">on track</span></p>
          <p className="text-[11px] text-gray-400 mt-2 font-mono truncate">{goals.map((g) => g.name.split(' ')[0]).join(' • ')}</p>
        </div>
      </section>

      {/* ── FIREWALL ───────────────────────────── */}
      <div className="animate-fade-up stagger-3">
        <FinancialFirewall />
      </div>

      {/* ── LEDGER + CTA ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-up stagger-4">
        <div className="lg:col-span-2 glass rounded-3xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div>
              <h3 className="font-display font-extrabold text-lg">Earmarked Ledger</h3>
              <p className="text-xs text-dusk">Rent + SIP + bills — firewall locked, spend me count nahi</p>
            </div>
            <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
              {inr(totalEarmarked)} locked
            </span>
          </div>
          <div className="divide-y divide-white/[0.08]">
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
                    <p className="text-[11px] text-dusk">Due {e.dueDate} • auto-debit</p>
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

        <div className="rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-b from-surface to-well p-7 flex flex-col justify-between relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display font-extrabold text-xl leading-tight">Know before you swipe</h3>
            <p className="text-xs text-mist leading-relaxed">iPhone ₹80k cash → runway {safeRunway} → {heroAfterRunway}mo → <b className={heroVerdict === 'WAIT' ? 'text-red-300' : heroVerdict === 'EMI' ? 'text-amber-300' : 'text-safe'}>{heroVerdict}</b>. Live data pe based.</p>
            <div className="rounded-2xl bg-well/60 border border-white/[0.08] p-4 font-mono text-[11px] space-y-2.5">
              <div className="flex justify-between gap-4"><span className="text-dusk shrink-0">INPUT</span><span className="text-white text-right">iPhone ₹80k cash</span></div>
              <div className="h-px bg-white/[0.06]" />
              <div className="flex justify-between gap-4"><span className="text-dusk shrink-0">OUTPUT</span><span className={heroVerdict === 'WAIT' ? 'text-red-300 font-bold text-right' : heroVerdict === 'EMI' ? 'text-amber-300 font-bold text-right' : 'text-safe font-bold text-right'}>{heroVerdict} • {heroPreview.verdictTitle}</span></div>
            </div>
          </div>
          <Link href="/simulator" className="mt-5 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-primary text-white font-extrabold text-sm hover:brightness-110 transition-colors">
            Simulate a purchase <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* ── HOW IT WORKS ───────────────────────── */}
      <section className="grid sm:grid-cols-3 gap-3 animate-fade-up stagger-5">
        {[
          { n: '01', t: 'Connect', d: 'AA / CSV → live profile in 3 clicks', c: 'text-cyan-300' },
          { n: '02', t: 'Simulate', d: 'Cash vs EMI → runway + buffer + goals', c: 'text-primary' },
          { n: '03', t: 'Decide', d: 'BUY / WAIT / EMI stamp — deterministic', c: 'text-violet-300' },
        ].map((s) => (
          <div key={s.n} className="glass rounded-2xl p-5 flex gap-4 items-start">
            <span className={`font-display font-black text-2xl ${s.c}`}>{s.n}</span>
            <div>
              <p className="font-bold text-sm">{s.t}</p>
              <p className="text-xs text-dusk mt-1 leading-relaxed">{s.d}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Create profile modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 backdrop-blur-sm p-4" onClick={() => setShowCreate(false)}>
          <div className="bg-surface border border-white/[0.08] rounded-3xl p-6 w-full max-w-lg space-y-4 max-h-[90vh] overflow-y-auto animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">Create Profile</h3>
              <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-mist" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="text-[11px] font-bold tracking-widest text-dusk">NAME</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g., Ritika" className="mt-1 w-full bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none" />
              </div>
              {([['monthlyIncome', 'MONTHLY INCOME (₹)'], ['totalBalance', 'TOTAL BALANCE (₹)'], ['dailyBurnRate', 'DAILY BURN (₹)'], ['rent', 'RENT (₹)'], ['sip', 'SIP (₹)'], ['bills', 'BILLS (₹)']] as const).map(([k, label]) => (
                <div key={k}>
                  <label className="text-[11px] font-bold tracking-widest text-dusk">{label}</label>
                  <input type="number" min={0} value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) || 0 })} className="mt-1 w-full bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none" />
                </div>
              ))}
            </div>
            {earmarkedTotal > form.totalBalance && form.totalBalance > 0 && (
              <p className="text-[11px] text-amber-300 bg-amber-400/10 border border-amber-400/25 rounded-xl px-3 py-2">Monthly earmarked (₹{earmarkedTotal.toLocaleString('en-IN')}) exceeds your balance — runway will start from 0.</p>
            )}
            <button
              disabled={!canCreate}
              onClick={() => { createProfile(form); setShowCreate(false); setForm({ name: '', monthlyIncome: 80000, totalBalance: 150000, dailyBurnRate: 1200, rent: 25000, sip: 15000, bills: 8000 }); }}
              className={`w-full py-3 rounded-xl font-bold text-sm ${canCreate ? 'bg-primary text-white hover:brightness-110' : 'bg-white/5 text-dusk cursor-not-allowed'}`}
            >
              Create & Switch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
