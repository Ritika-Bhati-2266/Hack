'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import {
  ShieldCheck,
  TrendingUp,
  Clock,
  Zap,
  ArrowRight,
  Lock,
  Wallet,
  Smartphone,
  Laptop,
  Plane,
  BadgeCheck,
} from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { previewSimulation } from '@/lib/engine';
import FinancialFirewall from '@/components/FinancialFirewall';
import InsightsPanel from '@/components/InsightsPanel';
import DataSourceBanner from '@/components/DataSourceBanner';
import CreateProfileModal from '@/components/CreateProfileModal';

export default function DashboardPage() {
  const { user, goals, activeCustomer, customProfiles, liveData } = useFinanceStore();
  const [showCreate, setShowCreate] = useState(false);
  // Hydration-safe: server snapshot is always false, so server HTML and the
  // first client render both omit the gate. After zustand persist restores,
  // the subscription re-reads and the gate appears only for true first-timers.
  const hydrated = useSyncExternalStore(
    (cb) => useFinanceStore.persist?.onFinishHydration(cb) ?? (() => {}),
    () => useFinanceStore.persist?.hasHydrated() ?? false,
    () => false
  );
  const hasData = !!liveData || user.totalBalance > 0 || user.earmarkedExpenses.length > 0;
  // First-visit gate: no bank data + no saved profiles.
  const showGate = hydrated && !liveData && Object.keys(customProfiles).length === 0;

  const totalEarmarked = user.earmarkedExpenses.reduce((acc, c) => acc + c.amount, 0);
  // Single source of truth: same backend-parity engine as the Simulator.
  // Hero preview (iPhone ₹80k cash) is derived live — never hardcoded.
  const heroPreview = previewSimulation(user, goals, { itemName: 'iPhone 16', price: 80000, mode: 'CASH' });
  const buffer = heroPreview.todayBuffer;
  const safeRunway = heroPreview.todayRunwayMonths.toFixed(1);
  const safeToSpendToday = heroPreview.todaySafeSpendToday;

  // ── TRY-IT-NOW widget (simulator-first): local state, no store/history writes.
  const TRY_PRESETS = [
    { label: 'iPhone 16', price: 80000, Icon: Smartphone },
    { label: 'MacBook Air', price: 120000, Icon: Laptop },
    { label: 'Bali Trip', price: 60000, Icon: Plane },
  ] as const;
  const [tryItem, setTryItem] = useState('iPhone 16');
  const [tryPrice, setTryPrice] = useState(80000);
  const [tried, setTried] = useState(false);
  const tryPreview = previewSimulation(user, goals, { itemName: tryItem.trim() || 'Item', price: Math.max(1000, tryPrice), mode: 'CASH' });
  const tryPct = user.totalBalance > 0 ? Math.min(999, Math.round((tryPrice / user.totalBalance) * 100)) : null;

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
    <div className="space-y-6 sm:space-y-8 relative min-w-0">
      {/* Background Cyber Lights */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-full max-w-[800px] h-[400px] bg-gradient-to-r from-blue-600/15 via-cyan-500/20 to-purple-600/15 blur-[140px] pointer-events-none rounded-full" />

      {liveData ? <DataSourceBanner source={liveData.source} /> : customProfiles[activeCustomer] ? null : <DataSourceBanner source="none" />}

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
            <h1 className="font-display font-black tracking-tight leading-[0.95] text-[clamp(2rem,9vw,4.5rem)] text-white break-words">
              Buy it or
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300 drop-shadow-[0_0_35px_rgba(0,240,255,0.4)]">
                park it?
              </span>
              <br />
              Know instantly.
            </h1>
            <p className="text-gray-300 text-[16px] leading-relaxed max-w-xl font-normal">
              <b className="text-white font-semibold">“What happens to my money if I buy this?”</b> — Previse
              simulates runway, buffer and goal-delay <b className="text-cyan-300 font-semibold">before you swipe</b>.
              Deterministic rules. Zero hallucination.
            </p>
            <div className="flex flex-col min-[420px]:flex-row min-[420px]:flex-wrap gap-3 sm:gap-3.5 pt-2">
              {!hasData ? (
                <>
                  <Link
                    href="/connect"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 min-h-[48px] rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white font-extrabold text-sm shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:shadow-[0_0_55px_rgba(0,240,255,0.6)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    <Lock className="w-4 h-4 text-white" />
                    Connect Bank (AA)
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/simulator"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 min-h-[48px] rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white transition-all active:scale-[0.98] hover:bg-white/10"
                  >
                    <Zap className="w-4 h-4 text-dusk" />
                    Try Simulator anyway
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/simulator"
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 min-h-[48px] rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white font-extrabold text-sm shadow-[0_0_35px_rgba(0,240,255,0.4)] hover:shadow-[0_0_55px_rgba(0,240,255,0.6)] hover:-translate-y-0.5 active:scale-[0.98] transition-all"
                  >
                    <Zap className="w-4 h-4 fill-white text-white" />
                    Launch What-If Simulator
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link
                    href="/connect"
                    className="inline-flex items-center justify-center gap-2 px-7 py-4 min-h-[48px] rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white transition-all active:scale-[0.98] hover:bg-white/10 hover:border-cyan-500/40"
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

          {/* Right — interactive TRY-IT-NOW widget (no navigation needed) */}
          <div className="relative min-w-0">
            {/* Decorative back glow frame */}
            <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600 blur-xl opacity-30 animate-pulse" />

            <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-[#0e1424]/90 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.7)] p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-cyan-300 fill-cyan-300" />
                <p className="text-[11px] font-mono font-black tracking-[0.18em] text-cyan-300">TRY IT NOW — NO NAVIGATION</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {TRY_PRESETS.map(({ label, price, Icon }) => (
                  <button
                    key={label}
                    onClick={() => { setTryItem(label); setTryPrice(price); }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all active:scale-95 ${tryItem === label ? 'bg-cyan-400 text-black border-cyan-300' : 'bg-white/5 text-mist border-white/[0.08] hover:text-white'}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
              <div>
                <div className="flex items-baseline justify-between">
                  <p className="font-mono font-black text-2xl text-white">{inr(tryPrice)}</p>
                  <p className="text-[10px] font-mono text-dusk">{tryPct === null ? 'no balance yet' : `${tryPct}% of balance`}</p>
                </div>
                <input
                  type="range" min={5000} max={Math.max(300000, user.totalBalance)} step={1000} value={tryPrice}
                  onChange={(e) => setTryPrice(Number(e.target.value))}
                  className="volt-range w-full mt-2"
                  style={{ ['--fill' as string]: `${(tryPrice / Math.max(300000, user.totalBalance)) * 100}%` }}
                  aria-label="Try amount"
                />
              </div>
              <button
                onClick={() => setTried(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(0,240,255,0.3)] hover:shadow-[0_0_40px_rgba(0,240,255,0.5)] active:scale-[0.98] transition-all"
              >
                ⚡ SIMULATE
              </button>
              {tried && (
                <div className="rounded-2xl bg-well/60 border border-white/[0.08] p-4 animate-fade-up">
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-xl text-sm font-black tracking-widest border shrink-0 ${
                      tryPreview.verdict === 'WAIT' ? 'bg-red-500/20 text-red-300 border-red-500/40' :
                      tryPreview.verdict === 'EMI' ? 'bg-amber-400/20 text-amber-300 border-amber-400/40' :
                      'bg-cyan-400/20 text-cyan-300 border-cyan-400/40'
                    }`}>
                      {tryPreview.verdict}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-white truncate">{tryPreview.verdictTitle}</p>
                      <p className="text-[11px] font-mono text-dusk mt-0.5">
                        runway {tryPreview.todayRunwayMonths.toFixed(1)} → {tryPreview.simulatedRunwayMonths.toFixed(1)} mo • buffer {inr(tryPreview.todayBuffer)} → {inr(tryPreview.simulatedBuffer)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-dusk">{hasData ? 'Based on live numbers.' : 'Demo numbers — connect for the real ones.'}</span>
                <Link href="/simulator" className="inline-flex items-center gap-1 text-xs font-extrabold text-cyan-400 hover:gap-2 transition-all">
                  Full simulator <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PERSONAL INSIGHTS (skips lines without data) ── */}
      <InsightsPanel />

      {/* ── FULL TRACKING (teaser when no bank data) ── */}
      {!liveData && (
        <div className="flex items-center gap-2.5 px-1 animate-fade-up">
          <Lock className="w-4 h-4 text-amber-300 shrink-0" />
          <p className="text-xs font-bold text-mist">
            Full tracking — <Link href="/connect" className="text-cyan-300 hover:underline">connect your bank</Link> to unlock live numbers
          </p>
        </div>
      )}
      <div className={!liveData ? 'opacity-80 space-y-8' : 'space-y-8'}>
      {/* ── STATS BENTO ────────────────────────── */}
      <section className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-fade-up stagger-2">
        <div className={`cyber-card rounded-3xl p-5 sm:p-6 relative overflow-hidden group min-w-0 min-[420px]:col-span-2 lg:col-span-1 ${hasData ? 'border-cyan-400/40 shadow-[0_0_35px_rgba(0,240,255,0.18)] bg-cyan-500/[0.06]' : 'border-white/10 opacity-70'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono font-black tracking-[0.16em] text-cyan-300">SPEND TODAY ★</span>
            <Wallet className="w-5 h-5 text-cyan-300 group-hover:scale-110 transition-transform" />
          </div>
          <p className="font-display font-black text-3xl sm:text-[40px] leading-none text-cyan-300 font-mono break-words">{hasData ? inr(safeToSpendToday) : '₹--'}</p>
          <p className="text-[11px] mt-2 font-mono text-gray-300 break-words">{hasData ? `after ${daysRemainingInMonth}d burn ${inr(remainingBurn)}` : 'Connect bank to compute safe daily spend'}</p>
        </div>

        <div className="cyber-card rounded-3xl p-5 sm:p-6 relative overflow-hidden group opacity-80 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono font-black tracking-[0.16em] text-gray-400">SAFE BUFFER</span>
            <ShieldCheck className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="font-display font-black text-2xl sm:text-[32px] leading-none text-white break-words">{hasData ? `₹${(buffer / 100000).toFixed(1)}L` : '₹--'}</p>
          <p className="text-[11px] text-gray-400 mt-2 font-mono break-words">{hasData ? `of ${inr(user.totalBalance)} • ${inr(totalEarmarked)} locked` : 'Connect bank to view liquid buffer'}</p>
          <div className="mt-4 h-1.5 rounded-full bg-white/5 overflow-hidden p-0.5">
            <div className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-[width] duration-700 ease-out" style={{ width: `${hasData ? Math.max(4, Math.min(100, (buffer / Math.max(1, user.totalBalance)) * 100)) : 0}%` }} />
          </div>
        </div>

        <div className="cyber-card rounded-3xl p-5 sm:p-6 relative overflow-hidden group opacity-80 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono font-black tracking-[0.16em] text-gray-400">RUNWAY</span>
            <Clock className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <p className="font-display font-black text-2xl sm:text-[32px] leading-none text-white break-words">{hasData ? safeRunway : '--'}<span className="text-base font-bold text-gray-400 ml-1">mo</span></p>
          <p className="text-[11px] mt-2 font-bold text-cyan-300 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" /> {hasData ? 'Target >3.0 mo' : 'Connect bank for burn rate'}
          </p>
        </div>

        <div className="cyber-card rounded-3xl p-5 sm:p-6 relative overflow-hidden group opacity-80 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-mono font-black tracking-[0.16em] text-gray-400">GOALS</span>
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_rgba(0,240,255,0.8)]" />
          </div>
          <p className="font-display font-black text-2xl sm:text-[32px] leading-none text-white break-words">{hasData ? goalsOnTrack : '--'} <span className="text-base font-bold text-cyan-400">{hasData ? 'on track' : 'connected'}</span></p>
          <p className="text-[11px] text-gray-400 mt-2 font-mono truncate">{hasData && goals.length > 0 ? goals.map((g) => g.name.split(' ')[0]).join(' • ') : 'Connect data to track goals'}</p>
        </div>
      </section>

      {/* ── FIREWALL ───────────────────────────── */}
      <div className="animate-fade-up stagger-3">
        <FinancialFirewall />
      </div>

      {/* ── LEDGER ───────────────────────────── */}
      <div className="animate-fade-up stagger-4">
        <div className="glass rounded-3xl p-6">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
            <div>
              <h3 className="font-display font-extrabold text-lg">Earmarked Ledger</h3>
              <p className="text-xs text-dusk">Rent + SIP + bills — firewall-locked, excluded from spend</p>
            </div>
            {hasData ? (
              <span className="text-xs font-mono font-bold text-amber-300 bg-amber-400/10 px-3 py-1.5 rounded-full border border-amber-400/20">
                {inr(totalEarmarked)} locked
              </span>
            ) : (
              <span className="text-xs font-mono font-bold text-gray-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                No Data
              </span>
            )}
          </div>
          <div className="divide-y divide-white/[0.08]">
            {user.earmarkedExpenses.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm text-mist">Nothing locked yet — connect your bank and earmarked funds will appear here.</p>
                <Link href="/connect" className="mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400/15 text-amber-300 border border-amber-400/30 text-xs font-extrabold hover:bg-amber-400/25 transition-colors">
                  <Lock className="w-3.5 h-3.5" /> Connect bank to see earmarked funds
                </Link>
              </div>
            )}
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
      </div>
      </div>

      {/* ── HOW IT WORKS ───────────────────────── */}
      <section className="flex flex-wrap items-center gap-x-6 gap-y-2 px-1 animate-fade-up stagger-5 opacity-70" aria-label="How it works">
        {[
          { n: '01', t: 'Connect', d: 'AA / CSV → live profile' },
          { n: '02', t: 'Simulate', d: 'Cash vs EMI → runway + buffer' },
          { n: '03', t: 'Decide', d: 'BUY / WAIT / EMI stamp' },
        ].map((s) => (
          <div key={s.n} className="flex items-baseline gap-2 text-xs">
            <span className="font-mono font-black text-[11px] text-dusk">{s.n}</span>
            <p className="font-bold text-mist">{s.t} <span className="font-normal text-dusk">— {s.d}</span></p>
          </div>
        ))}
      </section>

      {/* Profile gate (first visit only) */}
      {showGate && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-base/85 backdrop-blur-md p-4 pb-safe animate-fade-up overscroll-contain">
          <div className="bg-surface border border-white/[0.08] rounded-3xl p-6 sm:p-8 w-full max-w-md space-y-5 text-center shadow-[0_25px_80px_rgba(0,0,0,0.8)]">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 via-cyan-400 to-indigo-500 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(0,240,255,0.4)]">
              <span className="font-display font-black text-white text-2xl leading-none">P</span>
            </div>
            <div>
              <h2 className="font-display font-black text-2xl tracking-tight text-white">No profile connected</h2>
              <p className="text-sm text-mist mt-2 leading-relaxed">Connect your bank data or load a sample to see personalized financial insights.</p>
            </div>
            <div className="space-y-2.5">
              <Link
                href="/connect"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-500 to-indigo-600 text-white font-extrabold text-sm shadow-[0_0_25px_rgba(0,240,255,0.35)] hover:brightness-110 active:scale-[0.98] transition-all"
              >
                <Lock className="w-4 h-4 text-white" />
                Connect Data (AA / CSV)
              </Link>
              <button
                onClick={() => setShowCreate(true)}
                className="w-full py-3.5 rounded-2xl bg-white/5 border border-white/10 text-sm font-bold text-white hover:bg-white/10 transition-all"
              >
                Create Profile Manually
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create profile modal (shared with navbar) */}
      <CreateProfileModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}
