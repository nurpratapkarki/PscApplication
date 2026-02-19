/**
 * Question cache — uses MMKV for synchronous, high-performance storage.
 *
 * Functions keep their async signatures for backward compatibility
 * with existing consumers, but operations are synchronous under the hood.
 */
import { Question } from '../types/question.types';
import {
  cacheQuestionsMMKV,
  getCachedQuestionsMMKV,
  getCachedCategoryInfoMMKV,
  getCachedCategoriesMMKV,
  clearCategoryCacheMMKV,
  clearAllQuestionCacheMMKV,
  type CachedCategoryInfo,
} from './storage';

export type { CachedCategoryInfo };

/** Save questions for a category */
export async function cacheQuestions(
  categoryId: number,
  categoryName: string,
  questions: Question[],
): Promise<void> {
  cacheQuestionsMMKV(categoryId, categoryName, questions);
}

/** Get cached questions for a category, or null if not cached / expired */
export async function getCachedQuestions(categoryId: number): Promise<Question[] | null> {
  return getCachedQuestionsMMKV<Question>(categoryId);
}

/** Get info about a single cached category (for UI indicators) */
export async function getCachedCategoryInfo(categoryId: number): Promise<CachedCategoryInfo | null> {
  return getCachedCategoryInfoMMKV(categoryId);
}

/** Get list of all cached categories */
export async function getCachedCategories(): Promise<CachedCategoryInfo[]> {
  return getCachedCategoriesMMKV();
}

/** Remove cached questions for a single category */
export async function clearCategoryCache(categoryId: number): Promise<void> {
  clearCategoryCacheMMKV(categoryId);
}

/** Remove all cached questions */
export async function clearAllQuestionCache(): Promise<void> {
  clearAllQuestionCacheMMKV();
}
