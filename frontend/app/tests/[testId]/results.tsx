import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import { UserAttempt, MockTestSummary } from '../../../types/test.types';
import { useColors } from '../../../hooks/useColors';
import { BannerAdSafe } from '../../../components/ads/BannerAdSafe';

// ── Answer Review Item ────────────────────────────────────────────────────────
const AnswerReviewItem = ({
  answer,
  index,
  colors,
  t,
}: {
  answer: any;
  index: number;
  colors: ReturnType<typeof useColors>;
  t: (key: string) => string;
}) => {
  const [expanded, setExpanded] = useState(false);
  const isCorrect = answer.is_correct;
  const isSkipped = !answer.selected_answer;

  const statusColor = isCorrect ? colors.success : isSkipped ? colors.textSecondary : colors.error;
  const statusIcon = isCorrect ? 'check' : isSkipped ? 'minus' : 'close';
  const statusBg = isCorrect ? colors.success + '15' : isSkipped ? colors.surfaceVariant : colors.error + '15';

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => setExpanded(!expanded)}
      style={[styles.reviewItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={styles.reviewItemHeader}>
        {/* Status icon */}
        <View style={[styles.reviewStatusIcon, { backgroundColor: statusBg }]}>
          <MaterialCommunityIcons name={statusIcon} size={14} color={statusColor} />
        </View>

        {/* Question number + preview */}
        <View style={styles.reviewItemContent}>
          <Text style={[styles.reviewQNum, { color: colors.primary }]}>
            Q{index + 1}
          </Text>
          <Text style={[styles.reviewQPreview, { color: colors.textPrimary }]} numberOfLines={expanded ? undefined : 2}>
            {answer.question_text || t('results.questionUnavailable')}
          </Text>
        </View>

        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textTertiary}
        />
      </View>

      {expanded && (
        <View style={[styles.reviewExpanded, { borderTopColor: colors.border }]}>
          {/* Your answer */}
          <View style={styles.answerSection}>
            <Text style={[styles.answerSectionLabel, { color: colors.textSecondary }]}>
              {t('results.yourAnswer')}
            </Text>
            <View style={[
              styles.answerBox,
              {
                backgroundColor: isSkipped
                  ? colors.surfaceVariant
                  : isCorrect
                  ? colors.success + '12'
                  : colors.error + '12',
                borderColor: isSkipped
                  ? colors.border
                  : isCorrect
                  ? colors.success
                  : colors.error,
              },
            ]}>
              <Text style={[
                styles.answerBoxText,
                { color: isSkipped ? colors.textSecondary : isCorrect ? colors.success : colors.error },
              ]}>
                {answer.selected_answer_text || t('results.noAnswerSelected')}
              </Text>
            </View>
          </View>

          {/* Correct answer (if wrong) */}
          {!isCorrect && answer.correct_answer_text && (
            <View style={styles.answerSection}>
              <Text style={[styles.answerSectionLabel, { color: colors.textSecondary }]}>
                {t('results.correctAnswer')}
              </Text>
              <View style={[styles.answerBox, { backgroundColor: colors.success + '12', borderColor: colors.success }]}>
                <MaterialCommunityIcons name="check-circle" size={14} color={colors.success} style={{ marginRight: 6 }} />
                <Text style={[styles.answerBoxText, { color: colors.success }]}>
                  {answer.correct_answer_text}
                </Text>
              </View>
            </View>
          )}

          {/* Explanation */}
          {answer.explanation && (
            <View style={[styles.explanationBox, { backgroundColor: colors.info + '10' }]}>
              <View style={styles.explanationHeader}>
                <MaterialCommunityIcons name="lightbulb-outline" size={14} color={colors.info} />
                <Text style={[styles.explanationLabel, { color: colors.info }]}>
                  {t('results.explanation')}
                </Text>
              </View>
              <Text style={[styles.explanationText, { color: colors.textPrimary }]}>
                {answer.explanation}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
const TestResultsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const params = useLocalSearchParams<{ testId: string | string[] }>();

  const attemptId = useMemo(() => {
    if (Array.isArray(params.testId)) return params.testId[0];
    return params.testId;
  }, [params.testId]);

  const { data: attempt, status, error } = useApi<UserAttempt>(
    attemptId ? `/api/attempts/${attemptId}/` : '',
    !attemptId
  );

  if (!attemptId || status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {t('results.loadingResults')}
        </Text>
      </SafeAreaView>
    );
  }

  if (status === 'error' || !attempt) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle" size={60} color={colors.error} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {error || t('results.failedToLoadResults')}
        </Text>
      </SafeAreaView>
    );
  }

  const mockTestObj = typeof attempt.mock_test === 'object' ? (attempt.mock_test as MockTestSummary) : null;
  const passPercentage = mockTestObj?.pass_percentage ?? 50;
  const scoreObtained = Number(attempt.score_obtained ?? 0);
  const totalScore = Number(attempt.total_score ?? 0);
  const pct = totalScore > 0 ? (scoreObtained / totalScore) * 100 : 0; 
  const isPassed = pct >= passPercentage;
  const userAnswers = attempt.user_answers || [];
  const correctCount = userAnswers.filter(a => a.is_correct).length;
  const skippedCount = userAnswers.filter(a => a.is_skipped || !a.selected_answer).length;
  const incorrectCount = userAnswers.length - correctCount - skippedCount;
  const timeTaken = attempt.total_time_taken || 0;
const accuracyPct = userAnswers.length > 0
  ? (correctCount / userAnswers.filter(a => !a.is_skipped && a.selected_answer).length) * 100
  : 0; // accuracy on attempted only
  const statItems = [
    { icon: 'check-circle', value: correctCount, label: t('results.correct'), color: colors.success },
    { icon: 'close-circle', value: incorrectCount, label: t('results.incorrect'), color: colors.error },
    { icon: 'minus-circle', value: skippedCount, label: t('results.skipped'), color: colors.textSecondary },
    {
      icon: 'clock-outline',
      value: `${Math.floor(timeTaken / 60)}m`,
      label: t('results.time'),
      color: colors.accent,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Hero result band ── */}
        <View style={[
          styles.hero,
          { backgroundColor: isPassed ? colors.success : colors.error },
        ]}>
          <View style={styles.heroIconCircle}>
            <Text style={styles.heroEmoji}>{isPassed ? '🏆' : '💪'}</Text>
          </View>
          <Text style={styles.heroTitle}>
            {isPassed ? t('results.congratulations') : t('results.keepPracticing')}
          </Text>
          <Text style={styles.heroSubtitle}>
            {isPassed ? t('results.youPassed') : t('results.didNotPass')}
          </Text>

          {/* Score pill */}
          <View style={styles.scorePill}>
  <Text style={[styles.scorePillValue, { color: isPassed ? colors.success : colors.error }]}>
    {Math.round(pct)}%
  </Text>
  <Text style={[styles.scorePillLabel, { color: colors.textSecondary }]}>
    {scoreObtained} / {totalScore} marks
  </Text>
  {/* Only show accuracy if meaningfully different from score % */}
  {Math.round(accuracyPct) !== Math.round(pct) && userAnswers.length > 0 && (
    <Text style={[styles.scorePillAccuracy, { color: colors.textTertiary }]}>
      {Math.round(accuracyPct)}% accuracy on {userAnswers.filter(a => a.selected_answer).length} attempted
    </Text>
  )}
</View>
        </View>

        {/* ── Progress bar card (overlaps hero) ── */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface }]}>
          <View style={styles.progressCardHeader}>
            <Text style={[styles.progressCardLabel, { color: colors.textSecondary }]}>
              Pass mark: {passPercentage}%
            </Text>
            <Text style={[styles.progressCardPct, { color: isPassed ? colors.success : colors.error }]}>
              {Math.round(pct)}%
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
            {/* Pass threshold marker */}
            <View style={[
              styles.passThreshold,
              { left: `${passPercentage}%` as any, backgroundColor: colors.textTertiary },
            ]} />
            <View style={[
              styles.progressFill,
              {
                width: `${Math.min(pct, 100)}%`,
                backgroundColor: isPassed ? colors.success : colors.error,
              },
            ]} />
          </View>
        </View>

        {/* ── Stats grid ── */}
        <View style={styles.statsGrid}>
          {statItems.map((item, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statIconWrap, { backgroundColor: item.color + '15' }]}>
                <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
              </View>
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>{item.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{item.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Banner Ad (perfect placement — before answer review) ── */}
        <BannerAdSafe style={{ marginBottom: 20 }} />

        {/* ── Answer Review ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('results.answerReview')}
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {t('results.tapToSeeDetails')}
            </Text>
          </View>

          <View style={styles.reviewList}>
            {userAnswers.map((answer, index) => (
              <AnswerReviewItem
                key={answer.id || index}
                answer={answer}
                index={index}
                colors={colors}
                t={t}
              />
            ))}
          </View>
        </View>

      </ScrollView>

      {/* ── Bottom actions ── */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.bottomBtn, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => router.replace('/(tabs)/tests')}
        >
          <MaterialCommunityIcons name="clipboard-list" size={18} color={colors.textPrimary} />
          <Text style={[styles.bottomBtnText, { color: colors.textPrimary }]}>
            {t('common.allTests')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.bottomBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.replace('/(tabs)/')}
        >
          <MaterialCommunityIcons name="home" size={18} color="#fff" />
          <Text style={[styles.bottomBtnText, { color: '#fff' }]}>
            {t('common.home')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { fontSize: 14 },
  scrollContent: { paddingBottom: 100 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 52,
    gap: 8,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  scorePill: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  scorePillValue: { fontSize: 32, fontWeight: '800', letterSpacing: -0.5 },
  scorePillLabel: { fontSize: 13, marginTop: 2 },

  // Progress card (overlaps hero)
  progressCard: {
    marginTop: -28,
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  progressCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  scorePillAccuracy: { fontSize: 11, marginTop: 4 },
  progressCardLabel: { fontSize: 12, fontWeight: '500' },
  progressCardPct: { fontSize: 14, fontWeight: '800' },
  progressTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  passThreshold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 1,
  },
  progressFill: { height: '100%', borderRadius: 5 },

  // Stats grid
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  statIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  statLabel: { fontSize: 9, marginTop: 2, textAlign: 'center', fontWeight: '500' },

  // Section
  section: { paddingHorizontal: 16, marginBottom: 24 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSubtitle: { fontSize: 12, marginTop: 2 },
  reviewList: { gap: 8 },

  // Review item
  reviewItem: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  reviewItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 10,
  },
  reviewStatusIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewItemContent: { flex: 1 },
  reviewQNum: { fontSize: 11, fontWeight: '700', marginBottom: 2 },
  reviewQPreview: { fontSize: 13, lineHeight: 19 },
  reviewExpanded: {
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: 12,
    gap: 10,
  },
  answerSection: { gap: 5 },
  answerSectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  answerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  answerBoxText: { fontSize: 13, lineHeight: 19, flex: 1 },
  explanationBox: {
    padding: 10,
    borderRadius: 10,
    gap: 5,
  },
  explanationHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  explanationLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  explanationText: { fontSize: 13, lineHeight: 19 },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  bottomBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 13,
    borderRadius: 13,
  },
  bottomBtnText: { fontSize: 14, fontWeight: '700' },
});

export default TestResultsScreen;