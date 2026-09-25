'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Target, TrendingUp, CalendarClock, Plus, Pencil, Trash2, X, Check } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { Goal } from '@/types';

const CATS: Goal['category'][] = ['emergency', 'tech', 'travel', 'asset'];

export default function GoalsPage() {
  const { goals, currentSimulation, addGoal, updateGoal, deleteGoal } = useFinanceStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const blankForm = { name: '', targetAmount: 100000, currentAmount: 0, monthlyContribution: 10000, targetDate: '', category: 'emergency' as Goal['category'] };
  const [form, setForm] = useState(blankForm);
  const [editForm, setEditForm] = useState({ currentAmount: 0, monthlyContribution: 0, targetAmount: 0, targetDate: '' });
  // Frozen "today" for days-left math (stable across re-renders).
  const [nowMs] = useState(() => Date.now());
  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;

  const canAdd = form.name.trim().length >= 2 && form.targetAmount > 0 && form.monthlyContribution >= 0 && form.currentAmount >= 0 && form.targetDate !== '';

  const openAdd = () => {
    // Default date computed in the event handler (not render) — +180 days out.
    const d = new Date();
    d.setDate(d.getDate() + 180);
    setForm({ ...blankForm, targetDate: d.toISOString().slice(0, 10) });
    setShowAdd(true);
  };

  const startEdit = (g: Goal) => {
    setEditing(g.id);
    setEditForm({ currentAmount: g.currentAmount, monthlyContribution: g.monthlyContribution, targetAmount: g.targetAmount, targetDate: g.targetDate });
  };

  const saveEdit = (id: string) => {
    updateGoal(id, {
      currentAmount: Math.max(0, editForm.currentAmount),
      monthlyContribution: Math.max(0, editForm.monthlyContribution),
      targetAmount: Math.max(1, editForm.targetAmount),
      targetDate: editForm.targetDate || undefined,
    });
    setEditing(null);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs text-dusk hover:text-white">
        <ArrowLeft className="w-4 h-4" /> Back to Home
      </Link>

      <div className="relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-surface p-6 sm:p-8">
        <div className="absolute inset-0 bg-grid opacity-60" />
        <div className="absolute -top-16 right-10 w-[300px] h-[180px] bg-violet-500/15 blur-[90px] rounded-full pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-400/10 border border-violet-400/25 text-violet-300 text-[11px] font-bold">
              <Target className="w-3.5 h-3.5" /> {goals.length} ACTIVE GOALS
            </div>
            <h1 className="font-display font-black text-3xl sm:text-4xl tracking-tight mt-3">Goals, with consequences.</h1>
            <p className="text-sm text-mist mt-2">Every simulation shows how many months this purchase delays your goal.</p>
          </div>
          <div className="flex gap-2">
            {currentSimulation ? (
              <span className="text-[11px] font-mono px-3 py-2.5 rounded-xl bg-amber-400/10 border border-amber-400/25 text-amber-300 whitespace-nowrap">
                SIM IMPACT: +{currentSimulation.goalDelayMonths} mo avg
              </span>
            ) : (
              <Link href="/simulator" className="text-xs font-extrabold px-4 py-2.5 rounded-xl bg-primary text-white whitespace-nowrap hover:brightness-110">
                Run a simulation →
              </Link>
            )}
            <button onClick={openAdd} className="inline-flex items-center gap-1.5 text-xs font-extrabold px-4 py-2.5 rounded-xl bg-white/5 border border-white/[0.08] whitespace-nowrap hover:bg-white/10">
              <Plus className="w-4 h-4" /> Add goal
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.length === 0 && (
          <div className="md:col-span-2 rounded-[24px] border border-dashed border-white/[0.08] bg-white/[0.02] p-8 text-center animate-fade-up">
            <div className="w-12 h-12 rounded-2xl bg-violet-400/10 border border-violet-400/25 flex items-center justify-center mx-auto">
              <Target className="w-5 h-5 text-violet-300" />
            </div>
            <p className="font-display font-extrabold text-lg mt-3">No goals yet</p>
            <p className="text-sm text-mist mt-1 max-w-md mx-auto">Hit “Add goal” above — set a name, target and monthly contribution.</p>
          </div>
        )}
        {goals.map((g, i) => {
          const pct = Math.min(100, Math.round((g.currentAmount / Math.max(1, g.targetAmount)) * 100));
          const delay = currentSimulation?.perGoalDelays?.find((d) => d.goalId === g.id)?.delayMonths ?? 0;
          const remaining = g.targetAmount - g.currentAmount;
          // Days left from existing targetDate only — invalid/empty date skips the line.
          const deadlineMs = new Date(g.targetDate + 'T00:00:00').getTime();
          const daysLeft = g.targetDate && !Number.isNaN(deadlineMs)
            ? Math.max(0, Math.ceil((deadlineMs - nowMs) / 86400000))
            : null;
          const isEditing = editing === g.id;
          return (
            <div key={g.id} className="rounded-[24px] bg-surface border border-white/[0.08] p-4 sm:p-6 space-y-4 card-hover animate-fade-up min-w-0" style={{ animationDelay: `${i * 0.07}s` }}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-display font-extrabold text-[17px] break-words">{g.name}</h3>
                  <p className="text-[11px] text-dusk font-mono mt-1 flex items-center gap-1.5">
                    <CalendarClock className="w-3 h-3" /> target {g.targetDate} • {inr(g.monthlyContribution)}/mo
                  </p>
                  <p className="text-[11px] font-mono mt-1 text-mist">
                    {inr(g.currentAmount)} saved of {inr(g.targetAmount)}
                    {daysLeft !== null && <span className="text-dusk"> • {daysLeft}d left</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`font-display font-black text-2xl ${pct >= 70 ? 'text-safe' : pct >= 40 ? 'text-amber-300' : 'text-mist'}`}>{pct}%</span>
                  {!isEditing ? (
                    <>
                      <button onClick={() => startEdit(g)} className="p-2 rounded-lg bg-white/5 border border-white/[0.08] hover:bg-white/10" title="Edit">
                        <Pencil className="w-3.5 h-3.5 text-mist" />
                      </button>
                      <button onClick={() => deleteGoal(g.id)} className="p-2 rounded-lg bg-white/5 border border-white/[0.08] hover:bg-red-500/20" title="Delete">
                        <Trash2 className="w-3.5 h-3.5 text-red-300" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => saveEdit(g.id)} className="p-2 rounded-lg bg-safe border border-safe" title="Save">
                        <Check className="w-3.5 h-3.5 text-black" />
                      </button>
                      <button onClick={() => setEditing(null)} className="p-2 rounded-lg bg-white/5 border border-white/[0.08]" title="Cancel">
                        <X className="w-3.5 h-3.5 text-mist" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              <div className="h-3 bg-well/70 rounded-full border border-white/[0.08] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-safe to-cyan-300 transition-all" style={{ width: `${pct}%` }} />
              </div>
              {!isEditing ? (
                <div className="flex items-center justify-between font-mono text-[12px]">
                  <span className="text-mist">{inr(g.currentAmount)} <span className="text-dusk">/ {inr(g.targetAmount)}</span></span>
                  <span className="text-dusk">{inr(Math.max(0, remaining))} left</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {([['currentAmount', 'SAVED (₹)'], ['monthlyContribution', 'MONTHLY (₹)'], ['targetAmount', 'TARGET (₹)']] as const).map(([k, label]) => (
                    <div key={k}>
                      <label className="text-[10px] font-bold tracking-widest text-dusk">{label}</label>
                      <input type="number" min={0} value={editForm[k]} onChange={(e) => setEditForm({ ...editForm, [k]: Number(e.target.value) || 0 })} className="mt-1 w-full bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2 text-sm font-mono outline-none focus:border-primary" />
                    </div>
                  ))}
                  <div className="col-span-2">
                    <label className="text-[10px] font-bold tracking-widest text-dusk">TARGET DATE</label>
                    <input type="date" value={editForm.targetDate} onChange={(e) => setEditForm({ ...editForm, targetDate: e.target.value })} className="mt-1 w-full bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2 text-sm outline-none focus:border-primary" />
                  </div>
                </div>
              )}
              {delay > 0 ? (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-amber-400/[0.08] border border-amber-400/25 text-[12px]">
                  <TrendingUp className="w-4 h-4 text-amber-300" />
                  <span className="text-mist">This purchase delays it by</span>
                  <b className="font-mono text-amber-300">+{delay} mo</b>
                </div>
              ) : (
                <div className="px-3.5 py-2.5 rounded-2xl bg-safe/[0.07] border border-safe/20 text-[12px] text-safe font-semibold">
                  ✓ No delay from current simulation
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-base/80 backdrop-blur-sm p-4 pb-safe" onClick={() => setShowAdd(false)}>
          <div className="bg-surface border border-white/[0.08] rounded-3xl p-6 w-full max-w-lg space-y-4 max-h-[90dvh] overflow-y-auto overscroll-contain animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-extrabold">New goal</h3>
              <button onClick={() => setShowAdd(false)} className="p-1.5 rounded-full hover:bg-white/10"><X className="w-5 h-5 text-mist" /></button>
            </div>
            <div>
              <label className="text-[11px] font-bold tracking-widest text-dusk">GOAL NAME</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 w-full bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {([['targetAmount', 'TARGET (₹)'], ['currentAmount', 'SAVED SO FAR (₹)'], ['monthlyContribution', 'MONTHLY (₹)']] as const).map(([k, label]) => (
                <div key={k} className={k === 'monthlyContribution' ? 'col-span-2' : ''}>
                  <label className="text-[11px] font-bold tracking-widest text-dusk">{label}</label>
                  <input type="number" min={0} value={form[k]} onChange={(e) => setForm({ ...form, [k]: Number(e.target.value) || 0 })} className="mt-1 w-full bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm font-mono focus:border-primary outline-none" />
                </div>
              ))}
              <div>
                <label className="text-[11px] font-bold tracking-widest text-dusk">TARGET DATE</label>
                <input type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className="mt-1 w-full bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none" />
              </div>
              <div>
                <label className="text-[11px] font-bold tracking-widest text-dusk">CATEGORY</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Goal['category'] })} className="mt-1 w-full bg-well/60 border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm focus:border-primary outline-none">
                  {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <button
              disabled={!canAdd}
              onClick={() => { addGoal(form); setShowAdd(false); setForm(blankForm); }}
              className={`w-full py-3 rounded-xl font-bold text-sm ${canAdd ? 'bg-primary text-white hover:brightness-110' : 'bg-white/5 text-dusk cursor-not-allowed'}`}
            >
              Add goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
