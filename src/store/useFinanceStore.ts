import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserFinancialState, Goal, SimulationInput, SimulationResult, PaymentMode } from '@/types';
import { previewSimulation } from '@/lib/engine';

export type CustomerId = 'live' | 'empty' | string;

export interface LiveData {
  user: UserFinancialState;
  goals: Goal[];
  source: string;
  meta: { parsingAccuracy: number; parsedCount: number; totalTransactions: number; warnings: string[] } | null;
  accounts: Array<{ accountId: string; bank: string; balance: number; type: string }>;
  transactions: Array<{ date: string; narration: string; amount: number; type: string; parsedCategory?: string }>;
  fetchedAt?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  itemName: string;
  price: number;
  mode: PaymentMode;
  verdict: 'WAIT' | 'EMI' | 'BUY';
  feedback?: 'bought' | 'skipped' | null;
}

interface FinanceStore {
  user: UserFinancialState;
  goals: Goal[];
  currentSimulation: SimulationResult | null;
  activeCustomer: CustomerId;
  customProfiles: Record<string, { label: string; sub: string; user: UserFinancialState; goals: Goal[] }>;
  liveData: LiveData | null;
  history: HistoryEntry[];
  switchCustomer: (id: CustomerId) => void;
  createProfile: (data: { name: string; monthlyIncome: number; totalBalance: number; dailyBurnRate: number; rent: number; sip: number; bills: number }) => string;
  deleteProfile: (id: string) => void;
  setLiveData: (data: LiveData) => void;
  clearLiveData: () => void;
  addGoal: (g: { name: string; targetAmount: number; currentAmount: number; monthlyContribution: number; targetDate: string; category: Goal['category'] }) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  runSimulation: (input: SimulationInput) => SimulationResult;
  clearSimulation: () => void;
  acceptWaitRecommendation: () => void;
  confirmPurchaseAnyway: () => void;
  feedbackHistory: (id: string, feedback: 'bought' | 'skipped') => void;
  clearHistory: () => void;
}

export type CustomerRecord = { label: string; sub: string; user: UserFinancialState; goals: Goal[] };
// Production mode: no demo personas. Live (AA/CSV) + user-created profiles only.
export const CUSTOMERS: Record<string, CustomerRecord> = {};

export const EMPTY_USER: UserFinancialState = {
  totalBalance: 0,
  monthlyIncome: 0,
  dailyBurnRate: 0,
  earmarkedExpenses: [],
};
export const EMPTY_GOALS: Goal[] = [];
export const hasLiveBalance = (u: UserFinancialState) => u.totalBalance > 0 || u.earmarkedExpenses.length > 0;

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
  user: EMPTY_USER,
  goals: EMPTY_GOALS,
  currentSimulation: null,
  activeCustomer: 'empty',
  customProfiles: {},
  liveData: null,
  history: [],
  switchCustomer: (id) => {
    if (id === 'live') {
      const live = get().liveData;
      if (!live) return;
      set({ activeCustomer: 'live', user: live.user, goals: live.goals, currentSimulation: null });
      return;
    }
    const custom = get().customProfiles[id];
    const c = (CUSTOMERS as Record<string, CustomerRecord>)[id] || custom;
    if (!c) return;
    set({ activeCustomer: id, user: c.user, goals: c.goals, currentSimulation: null });
  },
  setLiveData: (data) => {
    set({ liveData: data, activeCustomer: 'live', user: data.user, goals: data.goals, currentSimulation: null });
  },
  clearLiveData: () => {
    const { activeCustomer } = get();
    set({ liveData: null });
    if (activeCustomer === 'live') {
      set({ activeCustomer: 'empty', user: EMPTY_USER, goals: EMPTY_GOALS, currentSimulation: null });
    }
  },
  addGoal: (g) => {
    const goal: Goal = {
      id: `g-${Date.now()}`,
      delayInMonths: 0,
      ...g,
    };
    set((s) => ({ goals: [...s.goals, goal] }));
  },
  updateGoal: (id, patch) => {
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  },
  deleteGoal: (id) => {
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }));
  },
  createProfile: (data) => {
    // CSV-style rule: never trust raw input, never invent history.
    // Clamp to sane range (same 0–10Cr bounds as backend validation).
    const clamp = (n: number) => Math.min(100000000, Math.max(0, Math.round(Number(n) || 0)));
    const income = clamp(data.monthlyIncome);
    const balance = clamp(data.totalBalance);
    const id = `custom_${Date.now()}`;
    const newUser: UserFinancialState = {
      totalBalance: balance,
      monthlyIncome: income,
      dailyBurnRate: clamp(data.dailyBurnRate),
      earmarkedExpenses: [
        ...(data.rent > 0 ? [{ id: '1', name: 'Apartment Rent', amount: clamp(data.rent), category: 'rent' as const, dueDate: '1st of month', autoDebit: true }] : []),
        ...(data.sip > 0 ? [{ id: '2', name: 'Mutual Fund SIPs', amount: clamp(data.sip), category: 'sip' as const, dueDate: '5th of month', autoDebit: true }] : []),
        ...(data.bills > 0 ? [{ id: '3', name: 'Electricity & Wifi', amount: clamp(data.bills), category: 'bill' as const, dueDate: '10th of month', autoDebit: true }] : []),
      ],
    };
    // Goals start at 0 saved — we don't know the user's real split, so we
    // don't invent one (was: 60%/20% of balance). Dates are relative, not hardcoded.
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    const inSix = new Date(); inSix.setMonth(inSix.getMonth() + 6);
    const inTwelve = new Date(); inTwelve.setMonth(inTwelve.getMonth() + 12);
    const newGoals: Goal[] = [
      { id: 'g1', name: 'Emergency Shield Fund', targetAmount: 300000, currentAmount: 0, monthlyContribution: Math.round(income * 0.15), targetDate: fmt(inTwelve), category: 'emergency', delayInMonths: 0 },
      { id: 'g2', name: 'Custom Goal', targetAmount: 100000, currentAmount: 0, monthlyContribution: Math.round(income * 0.1), targetDate: fmt(inSix), category: 'tech', delayInMonths: 0 },
    ];
    set((s) => ({
      customProfiles: { ...s.customProfiles, [id]: { label: data.name, sub: `Custom • ₹${(data.monthlyIncome/1000).toFixed(0)}k/mo`, user: newUser, goals: newGoals } },
      activeCustomer: id,
      user: newUser,
      goals: newGoals,
      currentSimulation: null,
    }));
    return id;
  },
  deleteProfile: (id) => {
    const { customProfiles, activeCustomer } = get();
    const next = { ...customProfiles };
    delete next[id];
    if (activeCustomer === id) {
      set({ customProfiles: next, activeCustomer: 'empty', user: EMPTY_USER, goals: EMPTY_GOALS, currentSimulation: null });
    } else {
      set({ customProfiles: next });
    }
  },

  runSimulation: (input: SimulationInput): SimulationResult => {
    const { user, goals } = get();
    const result = previewSimulation(user, goals, input);
    const entry: HistoryEntry = {
      id: `${Date.now()}`,
      timestamp: new Date().toISOString(),
      itemName: result.itemName,
      price: result.purchasePrice,
      mode: result.mode,
      verdict: result.verdict,
      feedback: null,
    };
    // Fire-and-forget server log (Phase 3 training data); local history is source of truth.
    try {
      fetch('/api/simulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      }).catch(() => {});
    } catch { /* SSR / offline — ignore */ }
    set((s) => ({ currentSimulation: result, history: [entry, ...s.history].slice(0, 50) }));
    return result;
  },

  clearSimulation: () => set({ currentSimulation: null }),

  feedbackHistory: (id, feedback) => {
    set((s) => ({ history: s.history.map((h) => (h.id === id ? { ...h, feedback } : h)) }));
    try {
      fetch('/api/simulations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, feedback }),
      }).catch(() => {});
    } catch { /* offline — local history still updated */ }
  },

  clearHistory: () => set({ history: [] }),

  acceptWaitRecommendation: () => {
    set({ currentSimulation: null });
  },

  confirmPurchaseAnyway: () => {
    const { currentSimulation, user } = get();
    if (!currentSimulation) return;
    // CASH: deduct upfront. EMI: balance unchanged, but track monthly commitment
    // so runway/buffer/firewall reflect the new EMI (was silently dropped before).
    if (currentSimulation.mode === 'CASH') {
      set({
        user: {
          ...user,
          totalBalance: currentSimulation.simulatedBalance,
        },
        currentSimulation: null,
      });
      return;
    }
    set({
      user: {
        ...user,
        totalBalance: currentSimulation.simulatedBalance,
        earmarkedExpenses: [
          ...user.earmarkedExpenses,
          {
            id: `emi-${Date.now()}`,
            name: `EMI: ${currentSimulation.itemName} (${currentSimulation.emiMonths}mo)`,
            amount: currentSimulation.monthlyEMI,
            category: 'emi',
            dueDate: '1st of month',
            autoDebit: true,
          },
        ],
      },
      currentSimulation: null,
    });
  },
}),
    {
      name: 'previse-customer',
      partialize: (state) => ({ activeCustomer: state.activeCustomer, customProfiles: state.customProfiles, user: state.user, goals: state.goals, liveData: state.liveData, history: state.history }),
      onRehydrateStorage: () => (state) => {
        // Keep persisted user/goals when present (e.g. EMI added via
        // confirmPurchaseAnyway) — else they were silently lost on reload.
        if (state && state.activeCustomer && (!state.user || !state.goals)) {
          const c = (CUSTOMERS as Record<string, CustomerRecord>)[state.activeCustomer] || state.customProfiles[state.activeCustomer];
          if (c) {
            state.user = c.user;
            state.goals = c.goals;
          }
        }
      },
    }
  )
);
