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


const TestInstructionsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const params = useLocalSearchParams<{ testId: string | string[] }>();
  const [agreed, setAgreed] = React.useState(false);

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
          {error || t('tests.failedToLoadInstructions')}
        </Text>
        <Button mode="outlined" onPress={() => router.back()}>{t('common.back')}</Button>
      </SafeAreaView>
    );
  }

  const instructions = [
    {
      icon: 'help-circle-outline' as const,
      text: t('tests.instructionContainsQuestions', { count: test.total_questions }),
      color: colors.primary,
    },
    {
      icon: 'clock-outline' as const,
      text: t('tests.instructionTimeLimit', { minutes: test.duration_minutes }),
      color: colors.accent,
    },
    {
      icon: 'pause-circle-outline' as const,
      text: t('tests.instructionNoPause'),
      color: colors.warning,
    },
    {
      icon: 'check-circle-outline' as const,
      text: t('tests.instructionSingleCorrect'),
      color: colors.success,
    },
    {
      icon: 'percent' as const,
      text: t('tests.instructionPassPercent', { percent: test.pass_percentage }),
      color: colors.secondary,
    },
    {
      icon: 'chart-line' as const,
      text: t('tests.instructionInstantResults'),
      color: colors.primary,
    },
    {
      icon: 'wifi' as const,
      text: t('tests.instructionStableInternet'),
      color: colors.textSecondary,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { borderBottomColor: colors.border, backgroundColor: colors.surface }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>
          {t('tests.instructions')}
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Warning Banner ── */}
        <View style={[styles.warningBanner, { backgroundColor: colors.warning + '15', borderColor: colors.warning + '40' }]}>
          <MaterialCommunityIcons name="alert-circle" size={22} color={colors.warning} />
          <View style={styles.warningText}>
            <Text style={[styles.warningTitle, { color: colors.textPrimary }]}>
              {t('tests.readCarefully')}
            </Text>
            <Text style={[styles.warningSubtitle, { color: colors.warning }]}>
              {t('tests.readCarefullySubtitle')}
            </Text>
          </View>
        </View>

        {/* ── Summary pills ── */}
        <View style={styles.summaryRow}>
          {[
            { icon: 'help-circle', value: test.total_questions, label: t('tests.questions'), color: colors.primary },
            { icon: 'clock', value: `${test.duration_minutes}m`, label: t('tests.duration'), color: colors.accent },
            { icon: 'target', value: `${test.pass_percentage}%`, label: t('tests.passMark'), color: colors.success },
          ].map((item, i) => (
            <View key={i} style={[styles.summaryPill, { backgroundColor: colors.surface }]}>
              <View style={[styles.summaryIconWrap, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{item.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Instructions list ── */}
        <View style={[styles.instructionsCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.instructionsTitle, { color: colors.textPrimary }]}>
            {t('tests.beforeYouStart', { defaultValue: 'Before you start' })}
          </Text>
          {instructions.map((item, index) => (
            <View
              key={index}
              style={[
                styles.instructionRow,
                index < instructions.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <View style={[styles.instructionIconWrap, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon} size={18} color={item.color} />
              </View>
              <Text style={[styles.instructionText, { color: colors.textPrimary }]}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Agreement ── */}
        <TouchableOpacity
          style={[
            styles.agreementRow,
            {
              backgroundColor: agreed ? colors.primary + '10' : colors.surface,
              borderColor: agreed ? colors.primary : colors.border,
            },
          ]}
          onPress={() => setAgreed(!agreed)}
          activeOpacity={0.8}
        >
          <View style={[
            styles.checkbox,
            {
              backgroundColor: agreed ? colors.primary : 'transparent',
              borderColor: agreed ? colors.primary : colors.border,
            },
          ]}>
            {agreed && (
              <MaterialCommunityIcons name="check" size={14} color="#fff" />
            )}
          </View>
          <Text style={[styles.agreementText, { color: colors.textPrimary }]}>
            {t('tests.instructionsAgreement')}
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.startBtn,
            { backgroundColor: agreed ? colors.primary : colors.surfaceVariant },
          ]}
          disabled={!agreed}
          onPress={() => router.navigate(`/tests/${testId}/attempt`)}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons
            name="play-circle"
            size={22}
            color={agreed ? '#fff' : colors.textTertiary}
          />
          <Text style={[styles.startBtnText, { color: agreed ? '#fff' : colors.textTertiary }]}>
            {t('tests.beginTest')}
          </Text>
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
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: { fontSize: 17, fontWeight: '700' },

  // Warning
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  warningText: { flex: 1 },
  warningTitle: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  warningSubtitle: { fontSize: 12, fontWeight: '500' },

  // Summary pills
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  summaryPill: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  summaryValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  summaryLabel: { fontSize: 10, marginTop: 2, fontWeight: '500' },

  // Instructions card
  instructionsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  instructionsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
  },
  instructionIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  instructionText: { fontSize: 13, flex: 1, lineHeight: 19 },

  // Agreement
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agreementText: { fontSize: 13, flex: 1, lineHeight: 19 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
  },
  startBtnText: { fontSize: 16, fontWeight: '800' },
});

export default TestInstructionsScreen;