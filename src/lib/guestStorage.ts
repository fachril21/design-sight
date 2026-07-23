/**
 * Versioned localStorage for guest identity + local run history
 * (Epic 01, US1.3). Handles missing/blocked localStorage (private mode) by
 * falling back to in-memory storage, and discards corrupted payloads rather
 * than crashing the boot path (plan edge cases E6/E7).
 */

export interface LocalRun {
  id: string;
  gameSlug: string;
  mode: 'quick';
  totalScore: number;
  roundScores: number[];
  completedAt: string; // ISO timestamp
}

interface GuestData {
  version: 1;
  runs: LocalRun[];
  /** True when this history belongs to an account but hasn't synced yet. */
  pendingSync: boolean;
}

const GUEST_ID_KEY = 'ds_guest_id';
const GUEST_RUNS_KEY = 'ds_guest_runs';
const ACCOUNT_RUNS_PREFIX = 'ds_runs_';

const EMPTY: GuestData = { version: 1, runs: [], pendingSync: false };

/** In-memory fallback when localStorage throws (private mode / quota). */
const memoryStore = new Map<string, string>();
let storageBroken = false;

function safeGet(key: string): string | null {
  if (storageBroken) return memoryStore.get(key) ?? null;
  try {
    return localStorage.getItem(key);
  } catch {
    storageBroken = true;
    return memoryStore.get(key) ?? null;
  }
}

function safeSet(key: string, value: string): void {
  if (!storageBroken) {
    try {
      localStorage.setItem(key, value);
      return;
    } catch {
      storageBroken = true;
    }
  }
  memoryStore.set(key, value);
}

function safeRemove(key: string): void {
  if (!storageBroken) {
    try {
      localStorage.removeItem(key);
      return;
    } catch {
      storageBroken = true;
    }
  }
  memoryStore.delete(key);
}

/** True when progress can't persist across reloads (worth a UI warning). */
export function isStoragePersistent(): boolean {
  return !storageBroken;
}

/** Lazily create the guest identity (a random UUID). */
export function getOrCreateGuestId(): string {
  const existing = safeGet(GUEST_ID_KEY);
  if (existing) return existing;
  const id = crypto.randomUUID();
  safeSet(GUEST_ID_KEY, id);
  return id;
}

export function peekGuestId(): string | null {
  return safeGet(GUEST_ID_KEY);
}

function parseGuestData(raw: string | null): GuestData {
  if (!raw) return { ...EMPTY };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      (parsed as GuestData).version === 1 &&
      Array.isArray((parsed as GuestData).runs)
    ) {
      return parsed as GuestData;
    }
  } catch {
    /* fall through: corrupted payload is discarded */
  }
  return { ...EMPTY };
}

export function loadGuestRuns(): GuestData {
  return parseGuestData(safeGet(GUEST_RUNS_KEY));
}

export function appendGuestRun(run: LocalRun): void {
  const data = loadGuestRuns();
  safeSet(
    GUEST_RUNS_KEY,
    JSON.stringify({ ...data, runs: [...data.runs, run] }),
  );
}

export function loadAccountRuns(userId: string): GuestData {
  return parseGuestData(safeGet(ACCOUNT_RUNS_PREFIX + userId));
}

export function appendAccountRun(userId: string, run: LocalRun): void {
  const data = loadAccountRuns(userId);
  safeSet(
    ACCOUNT_RUNS_PREFIX + userId,
    JSON.stringify({ ...data, runs: [...data.runs, run] }),
  );
}

/**
 * Guest -> account upgrade (Epic 01 AC): move local guest history under the
 * account namespace (marked pendingSync for the Epic 02+ server sync), then
 * retire the guest identity. Idempotent: a second call is a no-op.
 */
export function upgradeGuestToAccount(userId: string): { migratedRuns: number } {
  const guest = loadGuestRuns();
  if (guest.runs.length === 0) {
    safeRemove(GUEST_ID_KEY);
    return { migratedRuns: 0 };
  }
  const account = loadAccountRuns(userId);
  const merged: GuestData = {
    version: 1,
    runs: [...account.runs, ...guest.runs],
    pendingSync: true,
  };
  safeSet(ACCOUNT_RUNS_PREFIX + userId, JSON.stringify(merged));
  safeRemove(GUEST_RUNS_KEY);
  safeRemove(GUEST_ID_KEY);
  return { migratedRuns: guest.runs.length };
}
