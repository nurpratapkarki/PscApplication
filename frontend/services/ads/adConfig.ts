import { Platform } from 'react-native';
import { TestIds } from 'react-native-google-mobile-ads';

export const AD_UNIT_IDS = {
  interstitial: __DEV__
    ? TestIds.INTERSTITIAL
    : Platform.select({
        ios: 'ca-app-pub-XXXXXXXX/XXXXXXXX',
        android: 'ca-app-pub-XXXXXXXX/XXXXXXXX',
        default: TestIds.INTERSTITIAL,
      })!,
  banner: __DEV__
    ? TestIds.ADAPTIVE_BANNER
    : Platform.select({
        ios: 'ca-app-pub-XXXXXXXX/XXXXXXXX',
        android: 'ca-app-pub-XXXXXXXX/XXXXXXXX',
        default: TestIds.ADAPTIVE_BANNER,
      })!,
};

export const AD_CONFIG = {
  PRACTICE_SESSIONS_PER_AD: 2,
  KEYWORDS: ['education', 'exam', 'study', 'learning'],
};