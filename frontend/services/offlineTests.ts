import { apiRequest, getAccessToken } from './api/client';
import type { MockTest } from '../types/test.types';

export async function downloadMockTestDetail(testId: number): Promise<MockTest> {
  const token = getAccessToken();
  return apiRequest<MockTest>(`/api/mock-tests/${testId}/`, {
    token: token ?? undefined,
  });
}
