import { apiRequest, getAccessToken } from './api/client';
import type { PaginatedResponse } from '../types/api.types';
import type { Question } from '../types/question.types';

const OFFLINE_DOWNLOAD_PAGE_SIZE = 200;

export async function downloadCategoryQuestions(categoryId: number): Promise<Question[]> {
  const token = getAccessToken();
  let nextUrl: string | null = `/api/questions/?category=${categoryId}&page_size=${OFFLINE_DOWNLOAD_PAGE_SIZE}`;
  const allQuestions: Question[] = [];

  while (nextUrl) {
    const response: PaginatedResponse<Question> | Question[] = await apiRequest(nextUrl, {
      token: token ?? undefined,
    });

    if (Array.isArray(response)) {
      allQuestions.push(...response);
      break;
    }

    allQuestions.push(...response.results);
    nextUrl = response.next;
  }

  return allQuestions;
}
