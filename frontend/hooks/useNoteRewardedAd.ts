import { useCallback } from "react";
import { rewardedInterstitialAdService } from "../services/ads/rewardedInterstitialAd";
import { useAdStore } from "../store/adStore";

const todayKey = () => new Date().toISOString().slice(0, 10);

export function useNoteRewardedAd() {
  const isPremium = useAdStore((s) => s.isPremium);
  const lastNoteViewAdDate = useAdStore((s) => s.lastNoteViewAdDate);
  const downloadedNoteIds = useAdStore((s) => s.downloadedNoteIds);
  const markNoteDownloaded = useAdStore((s) => s.markNoteDownloaded);
  const setLastNoteViewAdDate = useAdStore((s) => s.setLastNoteViewAdDate);

  const ensureViewAccess = useCallback(
    async (noteId: number) => {
      if (isPremium || downloadedNoteIds.includes(noteId)) {
        return true;
      }

      const today = todayKey();
      if (lastNoteViewAdDate === today) {
        return true;
      }

      const rewarded = await rewardedInterstitialAdService.showForReward();
      if (rewarded) {
        setLastNoteViewAdDate(today);
      }
      return rewarded;
    },
    [downloadedNoteIds, isPremium, lastNoteViewAdDate, setLastNoteViewAdDate],
  );

  const ensureDownloadAccess = useCallback(
    async (noteId: number) => {
      if (isPremium || downloadedNoteIds.includes(noteId)) {
        return true;
      }
      const rewarded = await rewardedInterstitialAdService.showForReward();
      if (rewarded) {
        markNoteDownloaded(noteId);
      }
      return rewarded;
    },
    [downloadedNoteIds, isPremium, markNoteDownloaded],
  );

  const isDownloaded = useCallback(
    (noteId: number) => downloadedNoteIds.includes(noteId),
    [downloadedNoteIds],
  );

  return {
    ensureViewAccess,
    ensureDownloadAccess,
    isDownloaded,
  };
}

