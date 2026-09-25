/**
 * Persist self-heal — stale/corrupt localStorage must NEVER break the UI
 * or need manual "clear site data". Any version mismatch => clean reset.
 */
import { describe, it, expect } from 'vitest';
import {
  STORE_VERSION,
  LIVE_TTL_MS,
  EMPTY_USER,
  EMPTY_GOALS,
  migratePersistedState,
  applyLiveExpiry,
} from './useFinanceStore';

describe('migratePersistedState', () => {
  it('hard-resets old versions (0, 1, 2, undefined) to empty', () => {
    for (const v of [0, 1, 2, undefined, 'x']) {
      const out = migratePersistedState(
        { activeCustomer: 'spender', user: { totalBalance: 999 }, history: [{ id: 'h1' }] },
        v
      );
      expect(out.activeCustomer).toBe('empty');
      expect(out.user).toEqual(EMPTY_USER);
      expect(out.goals).toEqual(EMPTY_GOALS);
      expect(out.liveData).toBeNull();
      // history (training data) survives the reset
      expect(out.history).toEqual([{ id: 'h1' }]);
    }
  });

  it('resets unknown customer ids even on current version', () => {
    const out = migratePersistedState(
      { activeCustomer: 'spender', customProfiles: {} },
      STORE_VERSION
    );
    expect(out.activeCustomer).toBe('empty');
  });

  it('keeps a valid live state on current version', () => {
    const live = { liveData: { fetchedAt: new Date().toISOString() } };
    const out = migratePersistedState(
      { activeCustomer: 'live', ...live },
      STORE_VERSION
    );
    expect(out.activeCustomer).toBe('live');
  });

  it('keeps a valid empty state on current version', () => {
    const out = migratePersistedState({ activeCustomer: 'empty' }, STORE_VERSION);
    expect(out.activeCustomer).toBe('empty');
  });
});

describe('applyLiveExpiry', () => {
  it('clears liveData older than LIVE_TTL_MS and resets live customer', () => {
    const s = {
      liveData: {
        user: EMPTY_USER,
        goals: EMPTY_GOALS,
        source: 'csv',
        meta: null,
        accounts: [],
        transactions: [],
        fetchedAt: new Date(Date.now() - LIVE_TTL_MS - 1000).toISOString(),
      },
      activeCustomer: 'live' as const,
      user: { ...EMPTY_USER, totalBalance: 50000 },
      goals: [],
      currentSimulation: null,
    };
    expect(applyLiveExpiry(s)).toBe(true);
    expect(s.liveData).toBeNull();
    expect(s.activeCustomer).toBe('empty');
    expect(s.user).toEqual(EMPTY_USER);
  });

  it('keeps fresh liveData untouched', () => {
    const s = {
      liveData: {
        user: EMPTY_USER,
        goals: EMPTY_GOALS,
        source: 'csv',
        meta: null,
        accounts: [],
        transactions: [],
        fetchedAt: new Date().toISOString(),
      },
      activeCustomer: 'live' as const,
      user: EMPTY_USER,
      goals: EMPTY_GOALS,
      currentSimulation: null,
    };
    expect(applyLiveExpiry(s)).toBe(false);
    expect(s.liveData).not.toBeNull();
  });

  it('does nothing when there is no liveData', () => {
    const s = {
      liveData: null,
      activeCustomer: 'empty' as const,
      user: EMPTY_USER,
      goals: EMPTY_GOALS,
      currentSimulation: null,
    };
    expect(applyLiveExpiry(s)).toBe(false);
  });
});
