import React, { useState, useRef } from 'react';
import {
  View, StyleSheet, Dimensions, FlatList,
  Animated, TouchableOpacity,
} from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  titleKey: string;
  descriptionKey: string;
  color: string;
  bgColor: string;
}

export default function WelcomeScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);
  const otherLanguage = i18n.language === 'EN' ? 'NP' : 'EN';
  const tOther = (key: string) => t(key, { lng: otherLanguage });

  const slides: OnboardingSlide[] = [
    {
      id: '1',
      icon: 'book-education',
      titleKey: 'auth.onboarding.slide1Title',
      descriptionKey: 'auth.onboarding.slide1Description',
      color: colors.primary,
      bgColor: colors.primary + '12',
    },
    {
      id: '2',
      icon: 'clipboard-text-clock',
      titleKey: 'auth.onboarding.slide2Title',
      descriptionKey: 'auth.onboarding.slide2Description',
      color: colors.accent,
      bgColor: colors.accent + '12',
    },
    {
      id: '3',
      icon: 'account-group',
      titleKey: 'auth.onboarding.slide3Title',
      descriptionKey: 'auth.onboarding.slide3Description',
      color: colors.secondary,
      bgColor: colors.secondary + '12',
    },
  ];

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setCurrentIndex(viewableItems[0].index ?? 0);
  }).current;
  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.push('/(auth)/login');
    }
  };

  const currentSlide = slides[currentIndex];

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width }]}>
      {/* Icon area */}
      <View style={styles.slideTop}>
        <View style={[styles.iconOuter, { backgroundColor: item.color + '15' }]}>
          <View style={[styles.iconInner, { backgroundColor: item.color + '25' }]}>
            <View style={[styles.iconCore, { backgroundColor: item.color }]}>
              <MaterialCommunityIcons name={item.icon} size={56} color="#fff" />
            </View>
          </View>
        </View>
      </View>

      {/* Text */}
      <View style={styles.slideText}>
        <Text style={[styles.slideTitle, { color: colors.textPrimary }]}>
          {t(item.titleKey)}
        </Text>
        <Text style={[styles.slideTitleNp, { color: item.color }]}>
          {tOther(item.titleKey)}
        </Text>
        <Text style={[styles.slideDesc, { color: colors.textSecondary }]}>
          {t(item.descriptionKey)}
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* Skip */}
      <TouchableOpacity
        style={styles.skipBtn}
        onPress={() => router.push('/(auth)/login')}
      >
        <Text style={[styles.skipText, { color: colors.textSecondary }]}>
          {t('auth.skip')}
        </Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={item => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
        style={{ flex: 1 }}
      />

      {/* Bottom area */}
      <View style={styles.bottom}>
        {/* Dots */}
        <View style={styles.dots}>
          {slides.map((slide, index) => {
            const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
            const dotWidth = scrollX.interpolate({
              inputRange, outputRange: [6, 24, 6], extrapolate: 'clamp',
            });
            const opacity = scrollX.interpolate({
              inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp',
            });
            return (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  { width: dotWidth, opacity, backgroundColor: slide.color },
                ]}
              />
            );
          })}
        </View>

        {/* CTA button */}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: currentSlide.color }]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={styles.nextBtnText}>
            {currentIndex === slides.length - 1 ? t('auth.getStarted') : t('auth.next')}
          </Text>
          <MaterialCommunityIcons
            name={currentIndex === slides.length - 1 ? 'rocket-launch' : 'arrow-right'}
            size={20}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Step counter */}
        <Text style={[styles.stepCounter, { color: colors.textTertiary }]}>
          {currentIndex + 1} of {slides.length}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  skipBtn: {
    flexDirection: 'row', alignItems: 'center',
    alignSelf: 'flex-end', paddingHorizontal: 20, paddingVertical: 14,
    gap: 2,
  },
  skipText: { fontSize: 14, fontWeight: '500' },

  slide: { flex: 1, paddingHorizontal: 32 },
  slideTop: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
  },
  iconOuter: {
    width: 220, height: 220, borderRadius: 110,
    alignItems: 'center', justifyContent: 'center',
  },
  iconInner: {
    width: 170, height: 170, borderRadius: 85,
    alignItems: 'center', justifyContent: 'center',
  },
  iconCore: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12,
  },
  slideText: { paddingBottom: 32 },
  slideTitle: {
    fontSize: 26, fontWeight: '800', letterSpacing: -0.3,
    textAlign: 'center', marginBottom: 4,
  },
  slideTitleNp: {
    fontSize: 18, fontWeight: '600',
    textAlign: 'center', marginBottom: 14,
  },
  slideDesc: {
    fontSize: 15, lineHeight: 24, textAlign: 'center',
  },

  bottom: { paddingHorizontal: 24, paddingBottom: 32, gap: 16 },
  dots: {
    flexDirection: 'row', justifyContent: 'center',
    alignItems: 'center', gap: 6,
  },
  dot: { height: 6, borderRadius: 3 },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, borderRadius: 16,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 8,
  },
  nextBtnText: { fontSize: 16, fontWeight: '800', color: '#fff', letterSpacing: -0.2 },
  stepCounter: { fontSize: 12, textAlign: 'center' },
});