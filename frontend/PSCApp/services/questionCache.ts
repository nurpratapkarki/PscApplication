import AsyncStorage from '@react-native-async-storage/async-storage';
import { Question } from '../types/question.types';

const CACHE_PREFIX = 'question_cache_';
const CACHE_INDEX_KEY = 'question_cache_index';
const CACHE_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedData {
  questions: Question[];
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

/** Save questions for a category to AsyncStorage */
export async function cacheQuestions(
  categoryId: number,
  categoryName: string,
  questions: Question[],
): Promise<void> {
  const key = `${CACHE_PREFIX}${categoryId}`;
  const data: CachedData = {
    questions,
    cachedAt: Date.now(),
    categoryName,
    questionCount: questions.length,
  };
  await AsyncStorage.setItem(key, JSON.stringify(data));

  // Update cache index
  const index = await getCacheIndex();
  index[categoryId] = {
    categoryId,
    categoryName,
    questionCount: questions.length,
    cachedAt: data.cachedAt,
  };
  await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
}

/** Get cached questions for a category, or null if not cached / expired */
export async function getCachedQuestions(categoryId: number): Promise<Question[] | null> {
  try {
    const key = `${CACHE_PREFIX}${categoryId}`;
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;

    const data: CachedData = JSON.parse(raw);
    if (Date.now() - data.cachedAt > CACHE_EXPIRY_MS) {
      // Expired — remove
      await clearCategoryCache(categoryId);
      return null;
    }
    return data.questions;
  } catch {
    return null;
  }
}

/** Get info about a single cached category (for UI indicators) */
export async function getCachedCategoryInfo(categoryId: number): Promise<CachedCategoryInfo | null> {
  const index = await getCacheIndex();
  const info = index[categoryId];
  if (!info) return null;

  // Check expiry
  if (Date.now() - info.cachedAt > CACHE_EXPIRY_MS) {
    await clearCategoryCache(categoryId);
    return null;
  }
  return info;
}

/** Get list of all cached categories */
export async function getCachedCategories(): Promise<CachedCategoryInfo[]> {
  const index = await getCacheIndex();
  const result: CachedCategoryInfo[] = [];
  const expired: number[] = [];

  for (const [id, info] of Object.entries(index)) {
    if (Date.now() - info.cachedAt > CACHE_EXPIRY_MS) {
      expired.push(Number(id));
    } else {
      result.push(info);
    }
  }

  // Clean up expired entries
  if (expired.length > 0) {
    for (const id of expired) {
      await clearCategoryCache(id);
    }
  }

  return result;
}

/** Remove cached questions for a single category */
export async function clearCategoryCache(categoryId: number): Promise<void> {
  const key = `${CACHE_PREFIX}${categoryId}`;
  await AsyncStorage.removeItem(key);

  const index = await getCacheIndex();
  delete index[categoryId];
  await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
}

/** Remove all cached questions */
export async function clearAllQuestionCache(): Promise<void> {
  const index = await getCacheIndex();
  const keys = Object.keys(index).map((id) => `${CACHE_PREFIX}${id}`);
  if (keys.length > 0) {
    await AsyncStorage.multiRemove(keys);
  }
  await AsyncStorage.removeItem(CACHE_INDEX_KEY);
}

// Internal helper
async function getCacheIndex(): Promise<Record<number, CachedCategoryInfo>> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}
