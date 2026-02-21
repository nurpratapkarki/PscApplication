import {
  AdEventType,
  RewardedAdEventType,
  RewardedInterstitialAd,
} from "react-native-google-mobile-ads";
import { AD_CONFIG, AD_UNIT_IDS } from "./adConfig";

class RewardedInterstitialAdService {
  private ad: RewardedInterstitialAd;
  private isLoaded = false;
  private isLoading = false;
  private hasEarnedReward = false;
  private pendingResolver: ((value: boolean) => void) | null = null;

  constructor() {
    this.ad = RewardedInterstitialAd.createForAdRequest(AD_UNIT_IDS.noteRewarded, {
      keywords: AD_CONFIG.KEYWORDS,
    });
    this.attachListeners();
  }

  private attachListeners() {
    this.ad.addAdEventListener(RewardedAdEventType.LOADED, () => {
      this.isLoaded = true;
      this.isLoading = false;
    });

    this.ad.addAdEventListener(AdEventType.ERROR, () => {
      this.isLoaded = false;
      this.isLoading = false;
      if (this.pendingResolver) {
        const resolve = this.pendingResolver;
        this.pendingResolver = null;
        resolve(true);
      }
    });

    this.ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
      this.hasEarnedReward = true;
    });

    this.ad.addAdEventListener(AdEventType.CLOSED, () => {
      this.isLoaded = false;
      if (this.pendingResolver) {
        const resolve = this.pendingResolver;
        const earned = this.hasEarnedReward;
        this.pendingResolver = null;
        resolve(earned);
      }
      this.hasEarnedReward = false;
      this.preload();
    });
  }

  preload() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;
    this.ad.load();
  }

  async showForReward(): Promise<boolean> {
    if (!this.isLoaded) {
      this.preload();
      return true;
    }

    this.hasEarnedReward = false;
    return new Promise<boolean>((resolve) => {
      this.pendingResolver = resolve;
      try {
        this.ad.show();
      } catch {
        this.pendingResolver = null;
        resolve(true);
      }
    });
  }
}

export const rewardedInterstitialAdService = new RewardedInterstitialAdService();
