import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

export const AD_UNIT_IDS = {
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : Platform.select({
        ios: 'ca-app-pub-1369564684863351/7341473662',
        android: 'ca-app-pub-1369564684863351/7341473662',
        default: TestIds.INTERSTITIAL,
      })!,
  noteRewarded: __DEV__
    ? TestIds.REWARDED_INTERSTITIAL
    : Platform.select({
        ios: 'ca-app-pub-1369564684863351/2291255131',
        android: 'ca-app-pub-1369564684863351/2291255131',
        default: TestIds.REWARDED_INTERSTITIAL,
      })!,
  banner: __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : Platform.select({
        ios: 'ca-app-pub-1369564684863351/9140381318',
        android: 'ca-app-pub-1369564684863351/9140381318',
        default: TestIds.ADAPTIVE_BANNER,
      })!,
};

export const AD_CONFIG = {
  PRACTICE_SESSIONS_PER_AD: 2,
  KEYWORDS: ['education', 'exam', 'study', 'learning'],
};
