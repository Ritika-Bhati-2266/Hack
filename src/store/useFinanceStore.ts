import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserFinancialState, Goal, SimulationInput, SimulationResult, PaymentMode } from '@/types';
import { previewSimulation } from '@/lib/engine';

export type CustomerId = 'spender' | 'saver' | 'chaser' | string;

interface FinanceStore {
  user: UserFinancialState;
  goals: Goal[];
  currentSimulation: SimulationResult | null;
  activeCustomer: CustomerId;
  customProfiles: Record<string, { label: string; sub: string; user: UserFinancialState; goals: Goal[] }>;
  switchCustomer: (id: CustomerId) => void;
  createProfile: (data: { name: string; monthlyIncome: number; totalBalance: number; dailyBurnRate: number; rent: number; sip: number; bills: number }) => string;
  deleteProfile: (id: string) => void;
  runSimulation: (input: SimulationInput) => SimulationResult;
  clearSimulation: () => void;
  acceptWaitRecommendation: () => void;
  confirmPurchaseAnyway: () => void;
}

export type CustomerRecord = { label: string; sub: string; user: UserFinancialState; goals: Goal[] };
export const CUSTOMERS: Record<string, CustomerRecord> = {
  spender: {
    label: 'Rahul Verma',
    sub: 'Spender • Food 32% ↑',
    user: {
      totalBalance: 240000,
      monthlyIncome: 85000,
      dailyBurnRate: 1500,
      earmarkedExpenses: [
        { id: '1', name: 'Apartment Rent', amount: 35000, category: 'rent', dueDate: '1st of month', autoDebit: true },
        { id: '2', name: 'Mutual Fund SIPs', amount: 15000, category: 'sip', dueDate: '5th of month', autoDebit: true },
        { id: '3', name: 'Electricity & Wifi', amount: 10000, category: 'bill', dueDate: '10th of month', autoDebit: true },
      ],
    },
    goals: [
      { id: 'g1', name: 'Emergency Shield Fund', targetAmount: 300000, currentAmount: 210000, monthlyContribution: 15000, targetDate: '2026-12-31', category: 'emergency', delayInMonths: 0 },
      { id: 'g2', name: 'iPhone 16 Pro Max', targetAmount: 80000, currentAmount: 35000, monthlyContribution: 8000, targetDate: '2026-10-15', category: 'tech', delayInMonths: 0 },
      { id: 'g3', name: 'Bali Retreat Trip', targetAmount: 120000, currentAmount: 60000, monthlyContribution: 6000, targetDate: '2026-11-20', category: 'travel', delayInMonths: 0 },
    ],
  },
  saver: {
    label: 'Priya Sharma',
    sub: 'Saver • SIP Regular',
    user: {
      totalBalance: 290000,
      monthlyIncome: 95000,
      dailyBurnRate: 1266,
      earmarkedExpenses: [
        { id: '1', name: 'Apartment Rent', amount: 28000, category: 'rent', dueDate: '1st of month', autoDebit: true },
        { id: '2', name: 'Mutual Fund SIPs', amount: 30000, category: 'sip', dueDate: '5th of month', autoDebit: true },
        { id: '3', name: 'Electricity & Wifi', amount: 8800, category: 'bill', dueDate: '10th of month', autoDebit: true },
      ],
    },
    goals: [
      { id: 'g1', name: 'Emergency Shield Fund', targetAmount: 300000, currentAmount: 245000, monthlyContribution: 15000, targetDate: '2026-12-31', category: 'emergency', delayInMonths: 0 },
      { id: 'g2', name: 'Europe Trip', targetAmount: 250000, currentAmount: 180000, monthlyContribution: 12000, targetDate: '2026-10-15', category: 'travel', delayInMonths: 0 },
      { id: 'g3', name: 'iPhone 16 Pro Max', targetAmount: 80000, currentAmount: 65000, monthlyContribution: 5000, targetDate: '2026-11-20', category: 'tech', delayInMonths: 0 },
    ],
  },
  chaser: {
    label: 'Aman Singh',
    sub: 'Chaser • Tight Buffer',
    user: {
      totalBalance: 98000,
      monthlyIncome: 65000,
      dailyBurnRate: 1166,
      earmarkedExpenses: [
        { id: '1', name: 'Apartment Rent', amount: 22000, category: 'rent', dueDate: '1st of month', autoDebit: true },
        { id: '2', name: 'Mutual Fund SIPs', amount: 10000, category: 'sip', dueDate: '5th of month', autoDebit: true },
        { id: '3', name: 'Electricity & Wifi', amount: 12000, category: 'bill', dueDate: '10th of month', autoDebit: true },
      ],
    },
    goals: [
      { id: 'g1', name: 'Emergency Shield Fund', targetAmount: 200000, currentAmount: 98000, monthlyContribution: 10000, targetDate: '2026-12-31', category: 'emergency', delayInMonths: 0 },
      { id: 'g2', name: 'Bike Downpayment', targetAmount: 60000, currentAmount: 48000, monthlyContribution: 8000, targetDate: '2026-10-15', category: 'asset', delayInMonths: 0 },
      { id: 'g3', name: 'Bali Retreat Trip', targetAmount: 120000, currentAmount: 30000, monthlyContribution: 5000, targetDate: '2026-11-20', category: 'travel', delayInMonths: 0 },
    ],
  },
};

export const useFinanceStore = create<FinanceStore>()(
  persist(
    (set, get) => ({
  user: CUSTOMERS.spender.user,
  goals: CUSTOMERS.spender.goals,
  currentSimulation: null,
  activeCustomer: 'spender',
  customProfiles: {},
  switchCustomer: (id) => {
    const custom = get().customProfiles[id];
    const c = (CUSTOMERS as Record<string, CustomerRecord>)[id] || custom;
    if (!c) return;
    set({ activeCustomer: id, user: c.user, goals: c.goals, currentSimulation: null });
  },
  createProfile: (data) => {
    const id = `custom_${Date.now()}`;
    const newUser: UserFinancialState = {
      totalBalance: data.totalBalance,
      monthlyIncome: data.monthlyIncome,
      dailyBurnRate: data.dailyBurnRate,
      earmarkedExpenses: [
        { id: '1', name: 'Apartment Rent', amount: data.rent, category: 'rent', dueDate: '1st of month', autoDebit: true },
        { id: '2', name: 'Mutual Fund SIPs', amount: data.sip, category: 'sip', dueDate: '5th of month', autoDebit: true },
        { id: '3', name: 'Electricity & Wifi', amount: data.bills, category: 'bill', dueDate: '10th of month', autoDebit: true },
      ],
    };
    const newGoals: Goal[] = [
      { id: 'g1', name: 'Emergency Shield Fund', targetAmount: 300000, currentAmount: Math.round(data.totalBalance * 0.6), monthlyContribution: Math.round(data.monthlyIncome * 0.15), targetDate: '2026-12-31', category: 'emergency', delayInMonths: 0 },
      { id: 'g2', name: 'Custom Goal', targetAmount: 100000, currentAmount: Math.round(data.totalBalance * 0.2), monthlyContribution: Math.round(data.monthlyIncome * 0.1), targetDate: '2026-11-20', category: 'tech', delayInMonths: 0 },
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
      set({ customProfiles: next, activeCustomer: 'spender', user: CUSTOMERS.spender.user, goals: CUSTOMERS.spender.goals, currentSimulation: null });
    } else {
      set({ customProfiles: next });
    }
  },

  runSimulation: (input: SimulationInput): SimulationResult => {
    const { user, goals } = get();
    const result = previewSimulation(user, goals, input);
    set({ currentSimulation: result });
    return result;
  },

  clearSimulation: () => set({ currentSimulation: null }),

  acceptWaitRecommendation: () => {
    set({ currentSimulation: null });
  },

  confirmPurchaseAnyway: () => {
    const { currentSimulation, user } = get();
    if (!currentSimulation) return;
    set({
      user: {
        ...user,
        totalBalance: currentSimulation.simulatedBalance,
      },
      currentSimulation: null,
    });
  },
}),
    {
      name: 'previse-customer',
      partialize: (state) => ({ activeCustomer: state.activeCustomer, customProfiles: state.customProfiles }),
      onRehydrateStorage: () => (state) => {
        if (state && state.activeCustomer) {
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
