/**
 * Previse — Backend API client (Option B: Next.js is the UI, Express is API-only)
 * Backend: http://localhost:3001 | UI: http://localhost:3000
 */
import type { UserFinancialState, Goal, PaymentMode } from '@/types';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const SESSION_KEY = 'previse-session-id';

export function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(SESSION_KEY);
  if (!id || id.length < 8) {
    id = Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      'x-session-id': getSessionId(),
      ...(opts.headers || {}),
    },
  });
  // Server is authoritative for session IDs — adopt a stronger one if minted.
  try {
    const minted = res.headers.get('x-session-id');
    if (typeof window !== 'undefined' && minted && minted.length >= 8 && minted !== localStorage.getItem(SESSION_KEY)) {
      localStorage.setItem(SESSION_KEY, minted);
    }
  } catch { /* non-browser / opaque — ignore */ }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `API ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ─── Types ───
export interface BackendProfile {
  name: string;
  balance: number;
  monthlyInflow: number;
  commitments: Array<{
    name: string;
    amount: number;
    type: string;
    dayOfMonth: number;
    active: boolean;
  }>;
  goals: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    deadline: number;
    priority: string;
  }>;
}

/** Adapter: Next.js store shape -> backend engine shape */
export function toBackendProfile(
  user: UserFinancialState,
  goals: Goal[],
  name = 'Demo User'
): BackendProfile {
  const dayOfMonth = { rent: 1, sip: 5, bill: 10, emi: 1 } as const;
  return {
    name,
    balance: user.totalBalance,
    monthlyInflow: user.monthlyIncome,
    commitments: user.earmarkedExpenses.map((e) => ({
      name: e.name,
      amount: e.amount,
      type: 'recurring',
      dayOfMonth: dayOfMonth[e.category] ?? 1,
      active: true,
    })),
    goals: goals.map((g) => ({
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: 12,
      priority: 'medium',
    })),
  };
}

export function toBackendProposal(
  itemName: string,
  price: number,
  mode: PaymentMode,
  interestRate = 12,
  loanMonths = 24
): { name: string; amount: number; mode: string; emiMonths: number; interestRate: number } {
  if (mode === 'CASH') return { name: itemName, amount: price, mode: 'cash', emiMonths: 12, interestRate };
  if (mode === 'LOAN') return { name: itemName, amount: price, mode: 'loan', emiMonths: loanMonths, interestRate };
  const months = mode === 'EMI_3' ? 3 : mode === 'EMI_6' ? 6 : 12;
  return { name: itemName, amount: price, mode: 'emi', emiMonths: months, interestRate };
}

// ─── API calls ───
export interface BackendVerdict {
  proposal: { name: string; amount: number; mode: string; emiMonths: number; interestRate: number; emiDetails: null | { monthlyEMI: number; tenure: number; totalPayable: number; totalInterest: number } };
  before: { buffer: number; runwayDisplay: string; runwayMonths: number; safeToSpendDaily: number };
  after: { buffer: number; runwayDisplay: string; runwayMonths: number; safeToSpendDaily: number };
  impact: { bufferChange: number; runwayChange: number; safeToSpendChange: number };
  verdict: { action: string; severity: string; message: string; detail: string; weeksToWait: number };
  goalImpact: Array<{ name: string; delayMonths: number }>;
  profileSource: string;
}

export async function simulateOnBackend(
  user: UserFinancialState,
  goals: Goal[],
  itemName: string,
  price: number,
  mode: PaymentMode,
  interestRate = 12,
  loanMonths = 24
): Promise<BackendVerdict> {
  const profile = toBackendProfile(user, goals);
  const proposal = toBackendProposal(itemName, price, mode, interestRate, loanMonths);
  return req<BackendVerdict>('/api/simulate/custom', {
    method: 'POST',
    body: JSON.stringify({ profile, proposal }),
  });
}

export interface LiveTransaction {
  date: string;
  narration: string;
  amount: number;
  type: string;
  parsedCategory?: string;
  parsedType?: string;
}

export interface LiveAccount {
  accountId: string;
  bank: string;
  balance: number;
  type: string;
}

export interface LiveProfileRes {
  profile: BackendProfile;
  state: {
    monthlyExpenses: number;
    buffer: { total: number };
    runway: { months: number; display: string; status: string };
    safeToSpend: { daily: number; oneTime: number };
    goals: Array<Goal & { remaining: number; monthsToGoal: number; progress: number; onTrack: boolean }>;
  };
  source: string;
  meta: {
    parsingAccuracy: number;
    parsedCount: number;
    totalTransactions: number;
    warnings: string[];
  } | null;
  fetchedAt?: string;
  consentVersion?: string;
  accounts?: LiveAccount[];
  transactions?: LiveTransaction[];
}

/**
 * Adapter: backend engine profile -> Next.js store shapes.
 * Commitment category is heuristic (backend has no category field):
 * name contains rent/sip/emi-ish keywords, else bill.
 */
export function backendProfileToStore(
  profile: BackendProfile
): { user: UserFinancialState; goals: Goal[] } {
  const cat = (name: string): UserFinancialState['earmarkedExpenses'][number]['category'] => {
    const n = name.toLowerCase();
    if (/rent/.test(n)) return 'rent';
    if (/sip|mutual|investment/.test(n)) return 'sip';
    if (/emi|loan/.test(n)) return 'emi';
    return 'bill';
  };
  const user: UserFinancialState = {
    totalBalance: profile.balance,
    monthlyIncome: profile.monthlyInflow,
    // Backend doesn't track daily burn — derive from commitments so runway math agrees.
    dailyBurnRate: Math.max(
      0,
      Math.round(profile.commitments.reduce((s, c) => s + c.amount, 0) / 30)
    ),
    earmarkedExpenses: profile.commitments.map((c, i) => ({
      id: `live-${i}`,
      name: c.name,
      amount: c.amount,
      category: cat(c.name),
      dueDate: `${c.dayOfMonth}${c.dayOfMonth === 1 ? 'st' : c.dayOfMonth === 2 ? 'nd' : c.dayOfMonth === 3 ? 'rd' : 'th'} of month`,
      autoDebit: true,
    })),
  };
  const goals: Goal[] = (profile.goals || []).map((g, i) => {
    const remaining = Math.max(0, g.targetAmount - g.currentAmount);
    const monthly = g.deadline > 0 ? Math.ceil(remaining / Math.max(1, g.deadline)) : remaining;
    const d = new Date();
    d.setMonth(d.getMonth() + (g.deadline || 12));
    return {
      id: `live-g${i}`,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      monthlyContribution: monthly,
      targetDate: d.toISOString().slice(0, 10),
      category: 'emergency',
      delayInMonths: 0,
    };
  });
  return { user, goals };
}

export const getLiveProfile = () => req<LiveProfileRes>('/api/profile/live');

export interface ConsentSession {
  consentId: string;
  sessionToken: string;
  status: string;
  createdAt: string;
}

export const createConsent = () =>
  req<ConsentSession>('/api/aa/consent', { method: 'POST', body: JSON.stringify({}) });

export const approveConsent = (consentId: string, sessionToken: string) =>
  req<ConsentSession>(`/api/aa/consent/${consentId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ sessionToken }),
  });

export const fetchAAData = (consentId: string, sessionToken: string) =>
  req<{ liveProfile: BackendProfile; meta: LiveProfileRes['meta']; sessionId: string }>('/api/aa/fetch', {
    method: 'POST',
    body: JSON.stringify({ consentId, sessionToken }),
  });

export async function uploadCSV(file: File, balance: number) {
  const form = new FormData();
  form.append('statement', file);
  form.append('balance', String(balance));
  const res = await fetch(`${API_BASE}/api/upload/csv`, {
    method: 'POST',
    headers: { 'x-session-id': getSessionId() },
    body: form,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Upload ${res.status}`);
  }
  return res.json();
}

export const deleteMyData = () => req<{ message: string }>('/api/user/data', { method: 'DELETE' });

export const setupAutopay = (amount = 149, frequency = 'monthly', purpose = 'Previse Pro') =>
  req<{ mandateId: string; status: string; amount: number; frequency: string }>(
    '/api/autopay/setup',
    { method: 'POST', body: JSON.stringify({ amount, frequency, purpose }) }
  );

export const getMandate = (mandateId: string) =>
  req<{ mandateId: string; status: string; amount: number }>('/api/autopay/' + mandateId);

export interface BetaSignupRow {
  position: number;
  name: string;
  email: string;
  emailFull: string;
  usecase: string;
  createdAt: string;
}

export const getBetaSignups = (adminToken: string) =>
  req<{ count: number; signups: BetaSignupRow[] }>('/api/beta/signups', {
    headers: { 'x-admin-token': adminToken },
  });

export const betaSignup = (name: string, email: string, usecase = '') =>
  req<{ message: string; position: number }>('/api/beta/signup', {
    method: 'POST',
    body: JSON.stringify({ name, email, usecase }),
  });

export const getHealth = () => req<{ status: string; engine: string; phase: string }>('/api/health');
