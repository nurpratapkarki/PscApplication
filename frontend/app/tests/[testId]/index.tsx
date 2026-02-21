import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import { MockTest } from '../../../types/test.types';
import { useColors } from '../../../hooks/useColors';
import { useLocalizedField } from '../../../hooks/useLocalizedField';

const TestDetailsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const params = useLocalSearchParams<{ testId: string | string[] }>();

  const testId = useMemo(() => {
    if (Array.isArray(params.testId)) return params.testId[0];
    return params.testId;
  }, [params.testId]);

  const { data: test, status, error } = useApi<MockTest>(
    testId ? `/api/mock-tests/${testId}/` : '',
    !testId
  );

  if (!testId || status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (status === 'error' || !test) {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle" size={60} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          {error || t('tests.failedToLoadTest')}
        </Text>
        <Button mode="outlined" onPress={() => router.back()}>{t('common.back')}</Button>
      </SafeAreaView>
    );
  }

  const isOfficial = test.test_type === 'OFFICIAL';
  const localizedTitle = lf(test.title_en, test.title_np);
  const localizedDescription = lf(test.description_en, test.description_np);

  const stats = [
    { icon: 'help-circle-outline', value: test.total_questions, label: t('tests.questions'), color: colors.primary },
    { icon: 'clock-outline', value: `${test.duration_minutes}m`, label: t('tests.duration'), color: colors.accent },
    { icon: 'target', value: `${test.pass_percentage}%`, label: t('tests.passMark'), color: colors.success },
    { icon: 'star-outline', value: test.total_marks || test.total_questions, label: t('tests.totalMarks'), color: colors.warning },
  ];

  const quickInfo = [
    { icon: 'check-circle', text: t('tests.infoSingleCorrect'), color: colors.success },
    { icon: 'timer-sand', text: t('tests.infoTimerStart'), color: colors.warning },
    { icon: 'chart-line', text: t('tests.infoInstantResults'), color: colors.primary },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Hero Band ── */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          {/* Type badge */}
          <View style={[
            styles.typeBadge,
            { backgroundColor: isOfficial ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.15)' }
          ]}>
            <MaterialCommunityIcons
              name={isOfficial ? 'shield-check' : 'account-group'}
              size={12}
              color="#fff"
            />
            <Text style={styles.typeBadgeText}>
              {isOfficial ? t('tests.official') : t('tests.community')}
            </Text>
          </View>

          {/* Icon circle */}
          <View style={styles.heroIconCircle}>
            <MaterialCommunityIcons
              name={isOfficial ? 'shield-check' : 'account-group'}
              size={40}
              color={colors.primary}
            />
          </View>

          {/* Title */}
          <Text style={styles.heroTitle}>{localizedTitle}</Text>
          {test.title_np && test.title_en && test.title_np !== test.title_en && (
            <Text style={styles.heroTitleNp}>{test.title_np}</Text>
          )}

          {/* Branch pill */}
          {test.branch_name && (
            <View style={styles.heroBranchPill}>
              <MaterialCommunityIcons name="school" size={11} color="rgba(255,255,255,0.8)" />
              <Text style={styles.heroBranchText}>{test.branch_name}</Text>
            </View>
          )}
        </View>

        {/* ── Stats strip (overlaps hero) ── */}
        <View style={styles.statsStrip}>
          {stats.map((stat, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIconWrap, { backgroundColor: stat.color + '15' }]}>
                <MaterialCommunityIcons name={stat.icon as any} size={16} color={stat.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Description ── */}
        {!!localizedDescription && (
          <View style={[styles.descCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.descTitle, { color: colors.textPrimary }]}>
              {t('tests.about', { defaultValue: 'About this test' })}
            </Text>
            <Text style={[styles.descText, { color: colors.textSecondary }]}>
              {localizedDescription}
            </Text>
          </View>
        )}

        {/* ── Quick Info ── */}
        <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoTitle, { color: colors.textPrimary }]}>
            {t('tests.quickInfo')}
          </Text>
          {quickInfo.map((item, i) => (
            <View key={i} style={[
              styles.infoRow,
              i < quickInfo.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }
            ]}>
              <View style={[styles.infoIconWrap, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={16} color={item.color} />
              </View>
              <Text style={[styles.infoText, { color: colors.textPrimary }]}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* ── Creator ── */}
        {test.created_by_name && (
          <View style={styles.creatorRow}>
            <MaterialCommunityIcons name="account-circle-outline" size={14} color={colors.textTertiary} />
            <Text style={[styles.creatorText, { color: colors.textTertiary }]}>
              {t('tests.createdBy')} <Text style={{ color: colors.primary, fontWeight: '600' }}>{test.created_by_name}</Text>
            </Text>
          </View>
        )}

        {/* ── Attempt count ── */}
        {test.attempt_count > 0 && (
          <View style={[styles.attemptBanner, { backgroundColor: colors.primary + '10' }]}>
            <MaterialCommunityIcons name="account-multiple" size={16} color={colors.primary} />
            <Text style={[styles.attemptText, { color: colors.primary }]}>
              {t('tests.peopleTaken', { count: test.attempt_count })}
            </Text>
          </View>
        )}

      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <View style={styles.bottomMeta}>
          <Text style={[styles.bottomMetaTop, { color: colors.textSecondary }]}>{t('tests.readyToStart')}</Text>
          <Text style={[styles.bottomMetaBottom, { color: colors.textPrimary }]}>
            {test.total_questions} {t('tests.questions')} • {test.duration_minutes} {t('tests.minutes')}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.startBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push(`/tests/${testId}/instructions`)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
          <Text style={styles.startBtnText}>{t('tests.startTest')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { fontSize: 16, marginVertical: 16, textAlign: 'center' },
  scrollContent: { paddingBottom: 100 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 52,
    gap: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 8,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    letterSpacing: -0.3,
    paddingHorizontal: 16,
  },
  heroTitleNp: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  heroBranchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 4,
  },
  heroBranchText: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },

  // Stats strip
  statsStrip: {
    flexDirection: 'row',
    marginTop: -28,
    marginHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  statValue: { fontSize: 15, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { fontSize: 9, marginTop: 2, textAlign: 'center', fontWeight: '500' },

  // Description
  descCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  descTitle: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  descText: { fontSize: 14, lineHeight: 22 },

  // Quick info
  infoCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  infoIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: { fontSize: 13, flex: 1, lineHeight: 18 },

  // Creator
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    marginBottom: 12,
  },
  creatorText: { fontSize: 12 },

  // Attempt banner
  attemptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 8,
  },
  attemptText: { fontSize: 13, fontWeight: '600' },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  bottomMeta: { flex: 1 },
  bottomMetaTop: { fontSize: 12, marginBottom: 2 },
  bottomMetaBottom: { fontSize: 14, fontWeight: '700' },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 14,
  },
  startBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});

export default TestDetailsScreen;
