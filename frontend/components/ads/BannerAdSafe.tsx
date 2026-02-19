import React, { useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import {
  BannerAd,
  BannerAdSize,
  useForeground,
} from 'react-native-google-mobile-ads';
import { AD_UNIT_IDS } from '../../services/ads/adConfig';
import { useAdStore } from '../../store/adStore';

interface Props {
  style?: object;
}

export function BannerAdSafe({ style }: Props) {
  const isPremium = useAdStore((s) => s.isPremium);
  const [failed, setFailed] = useState(false);
  const bannerRef = useRef<BannerAd>(null);

  useForeground(() => {
    if (Platform.OS === 'ios') bannerRef.current?.load();
  });

  if (isPremium || failed) return null;

  return (
    <View style={[styles.container, style]}>
      <BannerAd
        ref={bannerRef}
        unitId={AD_UNIT_IDS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        onAdFailedToLoad={() => setFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
});