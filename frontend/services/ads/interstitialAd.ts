import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { Platform, StatusBar } from 'react-native';
import { AD_UNIT_IDS, AD_CONFIG } from './adConfig';

class InterstitialAdService {
  private ad: InterstitialAd;
  private isLoaded = false;
  private isLoading = false;
  private onClosedCallback: (() => void) | null = null;

  constructor() {
    this.ad = InterstitialAd.createForAdRequest(AD_UNIT_IDS.interstitial, {
      keywords: AD_CONFIG.KEYWORDS,
    });
    this.attachListeners();
  }

  private attachListeners() {
    this.ad.addAdEventListener(AdEventType.LOADED, () => {
      this.isLoaded = true;
      this.isLoading = false;
    });

    this.ad.addAdEventListener(AdEventType.ERROR, () => {
      this.isLoaded = false;
      this.isLoading = false;
      if (this.onClosedCallback) {
        const cb = this.onClosedCallback;
        this.onClosedCallback = null;
        cb();
      }
    });

    this.ad.addAdEventListener(AdEventType.OPENED, () => {
      if (Platform.OS === 'ios') StatusBar.setHidden(true);
    });

    this.ad.addAdEventListener(AdEventType.CLOSED, () => {
      if (Platform.OS === 'ios') StatusBar.setHidden(false);
      this.isLoaded = false;
      if (this.onClosedCallback) {
        const cb = this.onClosedCallback;
        this.onClosedCallback = null;
        cb();
      }
      this.preload();
    });
  }

  preload() {
    if (this.isLoaded || this.isLoading) return;
    this.isLoading = true;
    this.ad.load();
  }

  show(onComplete: () => void) {
    if (!this.isLoaded) {
      onComplete();
      return;
    }
    this.onClosedCallback = onComplete;
    try {
      this.ad.show();
    } catch {
      this.onClosedCallback = null;
      onComplete();
    }
  }
}

export const interstitialAdService = new InterstitialAdService();