import { useEffect, useState, useCallback, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { AppState, AppStateStatus } from 'react-native';
import {
  getPendingOperations,
  removePendingOperation,
} from '../services/storage';
import { apiRequest } from '../services/api/client';

/** Whether the device currently has internet connectivity */
let _isConnected = true;

/** Read connectivity synchronously (for non-hook contexts) */
export function isOnline(): boolean {
  return _isConnected;
}

/**
 * Hook that tracks network connectivity.
 * Returns `{ isConnected }` and automatically flushes
 * pending offline operations when coming back online.
 */
export function useNetwork() {
  const [isConnected, setIsConnected] = useState(true);
  const wasOffline = useRef(false);

  const handleConnectivityChange = useCallback((state: NetInfoState) => {
    const connected = state.isConnected ?? true;
    _isConnected = connected;
    setIsConnected(connected);

    if (connected && wasOffline.current) {
      wasOffline.current = false;
      flushPendingOperations();
    }

    if (!connected) {
      wasOffline.current = true;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(handleConnectivityChange);

    const appStateListener = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') {
        NetInfo.fetch().then(handleConnectivityChange);
      }
    });

    return () => {
      unsubscribe();
      appStateListener.remove();
    };
  }, [handleConnectivityChange]);

  return { isConnected };
}

/**
 * Flush all pending operations queued while offline.
 * Best-effort: failures silently stop (will retry on next reconnect).
 */
async function flushPendingOperations(): Promise<void> {
  const ops = getPendingOperations();
  if (ops.length === 0) return;

  for (const op of ops) {
    try {
      if (op.type === 'MOCK_TEST_SUBMISSION') {
        const startedAttempt = await apiRequest<{ id: number }>('/api/attempts/start/', {
          method: 'POST',
          body: { mock_test_id: op.mockTestId, mode: 'MOCK_TEST' },
        });

        const answers = op.answers.map((answer) => ({
          ...answer,
          user_attempt: startedAttempt.id,
        }));

        await apiRequest('/api/answers/bulk/', {
          method: 'POST',
          body: { answers },
        });

        await apiRequest(`/api/attempts/${startedAttempt.id}/submit/`, {
          method: 'POST',
          body: {},
        });
      } else {
        await apiRequest(op.endpoint, {
          method: op.method,
          body: op.body,
        });
      }

      removePendingOperation(op.id);
    } catch {
      break;
    }
  }
}
