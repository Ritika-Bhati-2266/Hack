'use client';

import { Clock, Sparkles, Target, TrendingUp, Wallet } from 'lucide-react';
import { useFinanceStore } from '@/store/useFinanceStore';
import { goalCountdown, nearestBill, surplusSplit, topSpendCategory, visibleTransactions } from '@/lib/insights';

/**
 * InsightsPanel — personalized, real-data-only guidance.
 * Each line renders only when its rule has data; missing data skips
 * the line (no dashes, no invented numbers). Returns null when empty.
 */
export default function InsightsPanel() {
  const { user, goals, liveData, activeCustomer } = useFinanceStore();

  const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
  const locked = user.earmarkedExpenses.reduce((s, e) => s + e.amount, 0);
  const monthlySavings = user.monthlyIncome - locked;

  // Transactions belong to the live session — never show another
  // profile's statement under a custom profile.
  const txns = visibleTransactions(activeCustomer, liveData?.transactions);
  const cat = topSpendCategory(txns);
  const surplus = surplusSplit(user);
  const bill = nearestBill(user.earmarkedExpenses);
  const goalLines = goalCountdown(goals, monthlySavings);

  const rows: Array<{ icon: 'trend' | 'wallet' | 'clock' | 'target'; title: string; sub: string; tone: string }> = [];

  if (cat) {
    rows.push({
      icon: 'trend',
      title: `${cap(cat.category)} is your top spend — ${cat.sharePct}% of outflow`,
      sub: `${inr(cat.amount)} debited in this statement`,
      tone: 'text-cyan-300',
    });
  }
  if (surplus && !surplus.tight) {
    rows.push({
      icon: 'wallet',
      title: `${inr(surplus.surplus)} extra this month`,
      sub: `Consider saving ${inr(surplus.saveSuggested)}, keep ${inr(surplus.keepFlexible)} flexible`,
      tone: 'text-safe',
    });
  } else if (surplus && surplus.tight) {
    rows.push({
      icon: 'wallet',
      title: 'Budget tight — no surplus this month',
      sub: 'Locked commitments + daily burn eat the full income',
      tone: 'text-amber-300',
    });
  }
  if (bill) {
    rows.push({
      icon: 'clock',
      title: `${bill.name} — ${inr(bill.amount)} ${bill.daysLeft === 0 ? 'due today' : bill.daysLeft === 1 ? 'due tomorrow' : `in ${bill.daysLeft} days`}`,
      sub: 'Auto-debit — firewall keeps this locked',
      tone: 'text-amber-300',
    });
  }
  for (const g of goalLines) {
    rows.push({
      icon: 'target',
      title: g.stalled
        ? `${g.name}: stalled — no monthly contribution set`
        : `${g.name}: ${inr(g.monthly)}/mo → ${g.monthsToGoal} mo to finish`,
      sub: g.stalled ? 'Add a monthly amount to restart progress' : g.onTrack ? 'On track for the deadline' : 'Behind deadline — raise monthly or extend date',
      tone: g.stalled || !g.onTrack ? 'text-amber-300' : 'text-safe',
    });
  }

  if (rows.length === 0) return null;

  const Icon = ({ k, className }: { k: string; className?: string }) =>
    k === 'trend' ? <TrendingUp className={className} />
    : k === 'wallet' ? <Wallet className={className} />
    : k === 'clock' ? <Clock className={className} />
    : <Target className={className} />;

  return (
    <section className="rounded-[28px] border border-white/[0.08] bg-surface p-6 space-y-4 animate-fade-up">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-cyan-300" />
        <h2 className="font-display font-extrabold text-lg text-white">Your insights</h2>
        <span className="text-[10px] font-mono text-dusk">{txns.length > 0 ? `Based on ${txns.length} imported transactions` : 'live numbers • per profile'}</span>
      </div>
      <div className="space-y-2.5">
        {rows.map((r, i) => (
          <div key={i} className="flex items-start gap-3 rounded-2xl bg-well/60 border border-white/[0.08] px-4 py-3">
            <Icon k={r.icon} className={`w-4 h-4 mt-0.5 shrink-0 ${r.tone}`} />
            <div className="min-w-0">
              <p className="font-bold text-sm text-white leading-snug">{r.title}</p>
              <p className="text-[11px] font-mono text-dusk mt-0.5">{r.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function cap(s: string) {
  return s.length > 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}
