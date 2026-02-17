/**
 * Central MMKV storage utility.
 *
 * react-native-mmkv v4.x exports MMKV as a type only.
 * Use `createMMKV()` to instantiate.
 */
import { createMMKV, type MMKV } from 'react-native-mmkv';

// ── Shared instances (created once, reused everywhere) ─────────────────────

/** Default app-wide storage for API cache, offline data, etc. */
export const appStorage: MMKV = createMMKV({ id: 'app-storage' });

/** Dedicated storage for test attempt crash-protection */
export const attemptStorage: MMKV = createMMKV({ id: 'test-attempt-storage' });

// ── Zustand MMKV adapter ───────────────────────────────────────────────────
// Drop-in replacement for createJSONStorage(() => AsyncStorage)

import type { StateStorage } from 'zustand/middleware';

/**
 * Creates a Zustand-compatible StateStorage backed by an MMKV instance.
 * Use with: `createJSONStorage(() => mmkvStateStorage(appStorage))`
 * ...or more conveniently: `storage: createJSONStorage(() => zustandMMKVStorage)`
 */
function createMMKVStateStorage(instance: MMKV): StateStorage {
  return {
    getItem: (name: string) => {
      const value = instance.getString(name);
      return value ?? null;
    },
    setItem: (name: string, value: string) => {
      instance.set(name, value);
    },
    removeItem: (name: string) => {
      instance.remove(name);
    },
  };
}

/** Pre-built Zustand storage adapter using the default app storage */
export const zustandMMKVStorage: StateStorage = createMMKVStateStorage(appStorage);

// ── API Cache helpers ──────────────────────────────────────────────────────

const CACHE_PREFIX = 'api_cache:';
const CACHE_META_PREFIX = 'api_cache_meta:';

interface CacheMeta {
  cachedAt: number;
  /** Time-to-live in ms. Default: 5 minutes */
  ttl: number;
}

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cache an API response in MMKV.
 * @param key  - Cache key (typically the API endpoint)
 * @param data - JSON-serializable response data
 * @param ttl  - Time-to-live in ms (default: 5 min)
 */
export function cacheApiResponse(key: string, data: unknown, ttl = DEFAULT_TTL): void {
  appStorage.set(CACHE_PREFIX + key, JSON.stringify(data));
  appStorage.set(
    CACHE_META_PREFIX + key,
    JSON.stringify({ cachedAt: Date.now(), ttl } satisfies CacheMeta),
  );
}

/**
 * Retrieve a cached API response.
 * Returns `null` if not cached or expired.
 * If `ignoreExpiry` is true, returns stale data (useful for offline).
 */
export function getCachedApiResponse<T = unknown>(
  key: string,
  ignoreExpiry = false,
): T | null {
  const raw = appStorage.getString(CACHE_PREFIX + key);
  if (!raw) return null;

  if (!ignoreExpiry) {
    const metaRaw = appStorage.getString(CACHE_META_PREFIX + key);
    if (metaRaw) {
      try {
        const meta: CacheMeta = JSON.parse(metaRaw);
        if (Date.now() - meta.cachedAt > meta.ttl) {
          // Expired — clean up
          appStorage.remove(CACHE_PREFIX + key);
          appStorage.remove(CACHE_META_PREFIX + key);
          return null;
        }
      } catch {
        // Corrupt meta — treat as expired
        return null;
      }
    }
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Remove a specific cache entry */
export function removeCachedApiResponse(key: string): void {
  appStorage.remove(CACHE_PREFIX + key);
  appStorage.remove(CACHE_META_PREFIX + key);
}

/** Clear all API cache entries */
export function clearAllApiCache(): void {
  const allKeys = appStorage.getAllKeys();
  for (const key of allKeys) {
    if (key.startsWith(CACHE_PREFIX) || key.startsWith(CACHE_META_PREFIX)) {
      appStorage.remove(key);
    }
  }
}

// ── Question cache helpers (migrated from AsyncStorage) ────────────────────

const Q_CACHE_PREFIX = 'question_cache:';
const Q_CACHE_INDEX = 'question_cache_index';
const Q_CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface QCachedData {
  questions: unknown[];
  cachedAt: number;
  categoryName: string;
  questionCount: number;
}

export interface CachedCategoryInfo {
  categoryId: number;
  categoryName: string;
  questionCount: number;
  cachedAt: number;
}

function getQCacheIndex(): Record<number, CachedCategoryInfo> {
  const raw = appStorage.getString(Q_CACHE_INDEX);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

/** Cache questions for offline practice */
export function cacheQuestionsMMKV(
  categoryId: number,
  categoryName: string,
  questions: unknown[],
): void {
  const data: QCachedData = {
    questions,
    cachedAt: Date.now(),
    categoryName,
    questionCount: questions.length,
  };
  appStorage.set(Q_CACHE_PREFIX + categoryId, JSON.stringify(data));

  const index = getQCacheIndex();
  index[categoryId] = { categoryId, categoryName, questionCount: questions.length, cachedAt: data.cachedAt };
  appStorage.set(Q_CACHE_INDEX, JSON.stringify(index));
}

/** Get cached questions, or null if not cached / expired */
export function getCachedQuestionsMMKV<T = unknown>(categoryId: number): T[] | null {
  const raw = appStorage.getString(Q_CACHE_PREFIX + categoryId);
  if (!raw) return null;

  try {
    const data: QCachedData = JSON.parse(raw);
    if (Date.now() - data.cachedAt > Q_CACHE_EXPIRY_MS) {
      clearCategoryCacheMMKV(categoryId);
      return null;
    }
    return data.questions as T[];
  } catch {
    return null;
  }
}

/** Get info about a single cached category */
export function getCachedCategoryInfoMMKV(categoryId: number): CachedCategoryInfo | null {
  const index = getQCacheIndex();
  const info = index[categoryId];
  if (!info) return null;
  if (Date.now() - info.cachedAt > Q_CACHE_EXPIRY_MS) {
    clearCategoryCacheMMKV(categoryId);
    return null;
  }
  return info;
}

/** List all cached categories */
export function getCachedCategoriesMMKV(): CachedCategoryInfo[] {
  const index = getQCacheIndex();
  const result: CachedCategoryInfo[] = [];
  const expired: number[] = [];

  for (const [id, info] of Object.entries(index)) {
    if (Date.now() - info.cachedAt > Q_CACHE_EXPIRY_MS) {
      expired.push(Number(id));
    } else {
      result.push(info);
    }
  }

  for (const id of expired) {
    clearCategoryCacheMMKV(id);
  }

  return result;
}

/** Remove cache for a single category */
export function clearCategoryCacheMMKV(categoryId: number): void {
  appStorage.remove(Q_CACHE_PREFIX + categoryId);
  const index = getQCacheIndex();
  delete index[categoryId];
  appStorage.set(Q_CACHE_INDEX, JSON.stringify(index));
}

/** Remove all cached questions */
export function clearAllQuestionCacheMMKV(): void {
  const index = getQCacheIndex();
  for (const id of Object.keys(index)) {
    appStorage.remove(Q_CACHE_PREFIX + id);
  }
  appStorage.remove(Q_CACHE_INDEX);
}

// ── Pending operations queue (for offline submissions) ─────────────────────

const PENDING_OPS_KEY = 'pending_operations';

export interface PendingOperation {
  id: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body: unknown;
  createdAt: number;
}

export function getPendingOperations(): PendingOperation[] {
  const raw = appStorage.getString(PENDING_OPS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function addPendingOperation(op: Omit<PendingOperation, 'id' | 'createdAt'>): void {
  const ops = getPendingOperations();
  ops.push({
    ...op,
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  });
  appStorage.set(PENDING_OPS_KEY, JSON.stringify(ops));
}

export function removePendingOperation(id: string): void {
  const ops = getPendingOperations().filter(o => o.id !== id);
  appStorage.set(PENDING_OPS_KEY, JSON.stringify(ops));
}

export function clearPendingOperations(): void {
  appStorage.remove(PENDING_OPS_KEY);
}
