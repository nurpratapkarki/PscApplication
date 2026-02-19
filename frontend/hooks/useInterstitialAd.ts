import { useCallback } from 'react';
import { interstitialAdService } from '../services/ads/interstitialAd';
import { useAdStore } from '../store/adStore';

export function useAdInterstitial() {
  const isPremium = useAdStore((s) => s.isPremium);
  const incrementPracticeCount = useAdStore((s) => s.incrementPracticeCount);

  const showAfterMockTest = useCallback(
    (onComplete: () => void) => {
      if (isPremium) { onComplete(); return; }
      interstitialAdService.show(onComplete);
    },
    [isPremium]
  );

  const showAfterPractice = useCallback(
    (onComplete: () => void) => {
      if (isPremium) { onComplete(); return; }
      incrementPracticeCount();
      const { practiceSessionCount } = useAdStore.getState();
      const shouldShow = practiceSessionCount % 2 === 0;
      if (shouldShow) {
        interstitialAdService.show(onComplete);
      } else {
        onComplete();
      }
    },
    [isPremium, incrementPracticeCount]
  );

  return { showAfterMockTest, showAfterPractice };
}