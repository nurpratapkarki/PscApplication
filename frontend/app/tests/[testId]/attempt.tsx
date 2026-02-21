import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View, StyleSheet, ActivityIndicator, BackHandler,
  Alert, ScrollView, TouchableOpacity, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import { MockTest, UserAttempt, UserAnswer, UserAnswerCreatePayload } from '../../../types/test.types';
import { useColors } from '../../../hooks/useColors';
import { useLocalizedField } from '../../../hooks/useLocalizedField';
import { apiRequest } from '../../../services/api/client';
import { attemptStorage, addPendingOperation, type OfflineMockTestAnswerPayload } from '../../../services/storage';
import { isOnline, useNetwork } from '../../../hooks/useNetwork';
import { useAdInterstitial } from '../../../hooks/useInterstitialAd';

const storage = attemptStorage;
const ATTEMPT_KEY = (id: number | string) => `attempt_${id}_answers`;
const TIME_KEY = (id: number | string) => `attempt_${id}_timeLeft`;

function saveAnswers(id: number | string, answers: Record<number, number | null>) {
  storage.set(ATTEMPT_KEY(id), JSON.stringify(answers));
}
function loadAnswers(id: number | string): Record<number, number | null> {
  const raw = storage.getString(ATTEMPT_KEY(id));
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
}
function saveTimeLeft(id: number | string, seconds: number) {
  storage.set(TIME_KEY(id), seconds);
}
function loadTimeLeft(id: number | string): number | null {
  return storage.getNumber(TIME_KEY(id)) ?? null;
}
function clearAttemptCache(id: number | string) {
  storage.remove(ATTEMPT_KEY(id));
  storage.remove(TIME_KEY(id));
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const TestAttemptScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const params = useLocalSearchParams<{ testId: string | string[] }>();

  const testId = useMemo(() => {
    if (Array.isArray(params.testId)) return params.testId[0];
    return params.testId;
  }, [params.testId]);
  const numericTestId = Number.parseInt(testId || '', 10);
  const { isConnected } = useNetwork();

  const { execute: startAttempt, data: userAttempt, status: attemptStatus } =
    useApi<UserAttempt>('/api/attempts/start/', true);
  const {
    execute: fetchTest,
    data: testData,
    status: testStatus,
    error: testError,
    isOfflineData: isOfflineTestData,
  } =
    useApi<MockTest>(testId ? `/api/mock-tests/${testId}/` : '', true);
  const { execute: submitBulkAnswers, status: bulkAnswerStatus } =
    useApi<UserAnswer[]>('/api/answers/bulk/', true, { method: 'POST' });

  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(-1);
  const [showQuestionNav, setShowQuestionNav] = useState(false);
  const [offlineAttemptKey, setOfflineAttemptKey] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoSubmitted = useRef(false);
  const timerInitialized = useRef(false);
  const hasInitialized = useRef(false);
  const questionStartTime = useRef(Date.now());
  const questionTimings = useRef<Record<number, number>>({});
  const { showAfterMockTest } = useAdInterstitial();
  const activeAttemptKey = userAttempt ? String(userAttempt.id) : offlineAttemptKey;
  const isOfflineMode = !userAttempt && !!offlineAttemptKey;

  useEffect(() => {
    if (!testId || hasInitialized.current) return;
    hasInitialized.current = true;
    fetchTest().catch(() => {});

    if (!Number.isFinite(numericTestId)) {
      return;
    }

    if (!isConnected) {
      setOfflineAttemptKey(`offline_test_${testId}`);
      return;
    }

    startAttempt({ mock_test_id: numericTestId, mode: 'MOCK_TEST' }).catch(() => {
      // Allow fully offline attempt flow when server attempt cannot be started.
      setOfflineAttemptKey(`offline_test_${testId}`);
    });
  }, [testId, numericTestId, fetchTest, startAttempt, isConnected]);

  useEffect(() => {
    if (!activeAttemptKey) return;
    const cached = loadAnswers(activeAttemptKey);
    if (Object.keys(cached).length > 0) setAnswers(cached);
    const cachedTime = loadTimeLeft(activeAttemptKey);
    if (cachedTime !== null && cachedTime > 0) {
      setTimeLeft(cachedTime);
      timerInitialized.current = true;
    }
  }, [activeAttemptKey]);

  useEffect(() => {
    if (testData?.duration_minutes && !timerInitialized.current) {
      timerInitialized.current = true;
      setTimeLeft(testData.duration_minutes * 60);
    }
  }, [testData]);

  useEffect(() => {
    if (timeLeft <= 0 || !testData) return;
    if (timerRef.current) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev <= 1 ? 0 : prev - 1;
        if (activeAttemptKey && next % 5 === 0) saveTimeLeft(activeAttemptKey, next);
        if (next === 0 && timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
        return next;
      });
    }, 1000);
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  }, [testData, activeAttemptKey, timeLeft > 0]); // eslint-disable-line

  const buildOfflineAnswerPayloads = useCallback((): OfflineMockTestAnswerPayload[] => {
    const payloads: OfflineMockTestAnswerPayload[] = Object.entries(answers).map(
      ([questionId, answerId]) => {
        const numericQuestionId = Number.parseInt(questionId, 10);
        return {
          question: numericQuestionId,
          selected_answer: answerId,
          time_taken_seconds: questionTimings.current[numericQuestionId] ?? 0,
          is_skipped: answerId === null,
          is_marked_for_review: false,
        };
      },
    );

    const answeredIds = new Set(payloads.map((p) => p.question));
    testData?.test_questions?.forEach(({ question }) => {
      if (!answeredIds.has(question.id)) {
        payloads.push({
          question: question.id,
          selected_answer: null,
          time_taken_seconds: 0,
          is_skipped: true,
          is_marked_for_review: false,
        });
      }
    });

    return payloads;
  }, [answers, testData]);

  const handleSubmit = useCallback(async () => {
    if (bulkAnswerStatus === 'loading') return;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }

    const offlineAnswerPayloads = buildOfflineAnswerPayloads();

    if (userAttempt) {
      const answerPayloads: UserAnswerCreatePayload[] = offlineAnswerPayloads.map((answer) => ({
        ...answer,
        user_attempt: userAttempt.id,
      }));

      try {
        await submitBulkAnswers({ answers: answerPayloads });
        await apiRequest(`/api/attempts/${userAttempt.id}/submit/`, { method: 'POST', body: {} });
        if (activeAttemptKey) {
          clearAttemptCache(activeAttemptKey);
        }
        const attemptId = userAttempt.id;
        showAfterMockTest(() => { router.replace(`/tests/${attemptId}/results`); });
        return;
      } catch {
        if (!isOnline()) {
          addPendingOperation({ endpoint: '/api/answers/bulk/', method: 'POST', body: { answers: answerPayloads } });
          addPendingOperation({ endpoint: `/api/attempts/${userAttempt.id}/submit/`, method: 'POST', body: {} });
          if (activeAttemptKey) {
            clearAttemptCache(activeAttemptKey);
          }
          Alert.alert(
            t('tests.savedOffline', { defaultValue: 'Saved Offline' }),
            t('tests.savedOfflineMsg', { defaultValue: 'Your answers have been saved and will sync when you\'re back online.' }),
            [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)/tests') }],
          );
          return;
        }
      }

      Alert.alert(t('tests.submissionFailed'), t('tests.submissionFailedMsg'));
      return;
    }

    // If offline attempt mode later regains network, try immediate submit first.
    if (Number.isFinite(numericTestId) && isOnline()) {
      try {
        const startedAttempt = await apiRequest<UserAttempt>('/api/attempts/start/', {
          method: 'POST',
          body: { mock_test_id: numericTestId, mode: 'MOCK_TEST' },
        });

        const answersForStartedAttempt: UserAnswerCreatePayload[] = offlineAnswerPayloads.map((answer) => ({
          ...answer,
          user_attempt: startedAttempt.id,
        }));

        await submitBulkAnswers({ answers: answersForStartedAttempt });
        await apiRequest(`/api/attempts/${startedAttempt.id}/submit/`, { method: 'POST', body: {} });
        if (activeAttemptKey) {
          clearAttemptCache(activeAttemptKey);
        }
        showAfterMockTest(() => { router.replace(`/tests/${startedAttempt.id}/results`); });
        return;
      } catch {
        // Fall through to queued offline sync
      }
    }

    if (Number.isFinite(numericTestId)) {
      addPendingOperation({
        type: 'MOCK_TEST_SUBMISSION',
        mockTestId: numericTestId,
        answers: offlineAnswerPayloads,
      });
      if (activeAttemptKey) {
        clearAttemptCache(activeAttemptKey);
      }
      Alert.alert(
        t('tests.savedOffline', { defaultValue: 'Saved Offline' }),
        t('tests.savedOfflineMsg', { defaultValue: 'Your answers have been saved and will sync when you\'re back online.' }),
        [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)/tests') }],
      );
      return;
    }

    Alert.alert(t('tests.submissionFailed'), t('tests.submissionFailedMsg'));
  }, [
    bulkAnswerStatus,
    buildOfflineAnswerPayloads,
    userAttempt,
    submitBulkAnswers,
    activeAttemptKey,
    t,
    router,
    numericTestId,
    showAfterMockTest,
  ]);

  useEffect(() => {
    if (timeLeft === 0 && timerInitialized.current && testData && !hasAutoSubmitted.current && bulkAnswerStatus !== 'loading') {
      hasAutoSubmitted.current = true;
      Alert.alert(t('tests.timesUp'), t('tests.timesUpMsg'), [{ text: t('common.ok'), onPress: handleSubmit }]);
    }
  }, [timeLeft, testData, handleSubmit, bulkAnswerStatus, t]);

  useEffect(() => {
    const backAction = () => {
      Alert.alert(t('tests.holdOn'), t('tests.cantGoBack'), [{ text: t('common.ok') }]);
      return true;
    };
    const handler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => handler.remove();
  }, [t]);

  const handleAnswerSelect = useCallback((questionId: number, answerId: number) => {
    const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
    questionTimings.current[questionId] = (questionTimings.current[questionId] ?? 0) + elapsed;
    questionStartTime.current = Date.now();
    setAnswers(prev => {
      const updated = { ...prev, [questionId]: answerId };
      if (activeAttemptKey) saveAnswers(activeAttemptKey, updated);
      return updated;
    });
  }, [activeAttemptKey]);

  const handleNext = useCallback(() => {
    if (testData?.test_questions && currentQuestionIndex < testData.test_questions.length - 1) {
      const q = testData.test_questions[currentQuestionIndex]?.question;
      if (q) {
        const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
        questionTimings.current[q.id] = (questionTimings.current[q.id] ?? 0) + elapsed;
      }
      setCurrentQuestionIndex(prev => prev + 1);
      questionStartTime.current = Date.now();
    }
  }, [testData, currentQuestionIndex]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const q = testData?.test_questions?.[currentQuestionIndex]?.question;
      if (q) {
        const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
        questionTimings.current[q.id] = (questionTimings.current[q.id] ?? 0) + elapsed;
      }
      setCurrentQuestionIndex(prev => prev - 1);
      questionStartTime.current = Date.now();
    }
  }, [currentQuestionIndex, testData]);

  const showSubmitConfirm = useCallback(() => {
    const total = testData?.test_questions?.length || 0;
    const answered = Object.keys(answers).length;
    const unanswered = total - answered;
    Alert.alert(
      t('tests.finishTest'),
      unanswered > 0 ? t('tests.unansweredWarning', { count: unanswered }) : t('tests.finishConfirm'),
      [{ text: t('common.cancel'), style: 'cancel' }, { text: t('common.submit'), onPress: handleSubmit }]
    );
  }, [testData, answers, handleSubmit, t]);

  useEffect(() => { return () => { if (timerRef.current) clearInterval(timerRef.current); }; }, []);

  const isSubmitting = bulkAnswerStatus === 'loading';
  const totalQuestions = testData?.test_questions?.length || 0;
  const answeredCount = Object.keys(answers).length;

  if (testStatus === 'loading' || (attemptStatus === 'loading' && isConnected && !offlineAttemptKey)) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.loadingCard, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {t('tests.preparingTest')}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (testStatus === 'error' || !testData) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle" size={48} color={colors.error} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          {testError || t('tests.failedToLoadTest')}
        </Text>
      </SafeAreaView>
    );
  }

  const currentQuestionData = testData.test_questions?.[currentQuestionIndex]?.question;
  if (!currentQuestionData) return null;

  const progress = (currentQuestionIndex + 1) / totalQuestions;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isTimeLow = timeLeft >= 0 && timeLeft <= 60;
  const selectedAnswer = answers[currentQuestionData.id];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      {(isOfflineMode || isOfflineTestData) && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.warning + '18' }]}>
          <MaterialCommunityIcons name="cloud-off-outline" size={14} color={colors.warning} />
          <Text style={[styles.offlineBannerText, { color: colors.warning }]}>
            {t('offline.usingCachedData')}
          </Text>
        </View>
      )}

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {/* Progress info */}
        <View style={styles.topLeft}>
          <Text style={[styles.questionCounter, { color: colors.textSecondary }]}>
            {currentQuestionIndex + 1} / {totalQuestions}
          </Text>
          <Text style={[styles.answeredLabel, { color: colors.textTertiary }]}>
            {answeredCount} answered
          </Text>
        </View>

        {/* Timer */}
        <TouchableOpacity
          style={[
            styles.timerPill,
            { backgroundColor: isTimeLow ? colors.error + '15' : colors.primary + '10' },
          ]}
          onPress={() => {}} // tapping timer does nothing but feels tactile
          activeOpacity={0.9}
        >
          <MaterialCommunityIcons
            name="clock-outline"
            size={14}
            color={isTimeLow ? colors.error : colors.primary}
          />
          <Text style={[
            styles.timerText,
            { color: isTimeLow ? colors.error : colors.primary },
          ]}>
            {formatTime(Math.max(0, timeLeft))}
          </Text>
        </TouchableOpacity>

        {/* Finish */}
        <TouchableOpacity
          style={[styles.finishBtn, { backgroundColor: colors.error + '15' }]}
          onPress={showSubmitConfirm}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          <Text style={[styles.finishBtnText, { color: colors.error }]}>
            {t('tests.finish')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Progress bar ── */}
      <View style={[styles.progressTrack, { backgroundColor: colors.surfaceVariant }]}>
        <View
          style={[
            styles.progressFill,
            { width: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>

      {/* ── Question ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Question card */}
        <View style={[styles.questionCard, { backgroundColor: colors.surface }]}>
          {/* Question number badge */}
          <View style={[styles.questionBadge, { backgroundColor: colors.primary + '15' }]}>
            <Text style={[styles.questionBadgeText, { color: colors.primary }]}>
              Q{currentQuestionIndex + 1}
            </Text>
          </View>

          <Text style={[styles.questionText, { color: colors.textPrimary }]}>
            {lf(currentQuestionData.question_text_en, currentQuestionData.question_text_np)}
          </Text>

          {currentQuestionData.question_text_np &&
            currentQuestionData.question_text_np !== currentQuestionData.question_text_en && (
              <Text style={[styles.questionTextNp, { color: colors.primary }]}>
                {currentQuestionData.question_text_np}
              </Text>
            )}

          {!!currentQuestionData.image && (
            <Image
              source={{ uri: currentQuestionData.image }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          )}
        </View>

        {/* Answer options */}
        <View style={styles.optionsContainer}>
          {currentQuestionData.answers?.map((option, optIndex) => {
            const isSelected = selectedAnswer === option.id;
            const optionLabel = String.fromCharCode(65 + optIndex); // A, B, C, D
            return (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.option,
                  {
                    backgroundColor: isSelected ? colors.primary + '12' : colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleAnswerSelect(currentQuestionData.id, option.id)}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.optionLabel,
                  {
                    backgroundColor: isSelected ? colors.primary : colors.surfaceVariant,
                  },
                ]}>
                  <Text style={[
                    styles.optionLabelText,
                    { color: isSelected ? '#fff' : colors.textSecondary },
                  ]}>
                    {optionLabel}
                  </Text>
                </View>
                <Text style={[
                  styles.optionText,
                  { color: colors.textPrimary },
                  isSelected && { fontWeight: '600' },
                ]}>
                  {lf(option.answer_text_en, option.answer_text_np)}
                </Text>
                {isSelected && (
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Report */}
        <TouchableOpacity
          style={styles.reportBtn}
          onPress={() => router.push(`/report/${currentQuestionData.id}` as any)}
        >
          <MaterialCommunityIcons name="flag-outline" size={14} color={colors.textTertiary} />
          <Text style={[styles.reportBtnText, { color: colors.textTertiary }]}>
            {t('report.reportQuestion', { defaultValue: 'Report this question' })}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Footer ── */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.navBtn,
            { backgroundColor: colors.surfaceVariant },
            currentQuestionIndex === 0 && { opacity: 0.4 },
          ]}
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <MaterialCommunityIcons name="chevron-left" size={20} color={colors.textPrimary} />
          <Text style={[styles.navBtnText, { color: colors.textPrimary }]}>
            {t('tests.previous')}
          </Text>
        </TouchableOpacity>

        {/* Question grid dots */}
        <TouchableOpacity
          style={[styles.dotNavBtn, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => setShowQuestionNav(!showQuestionNav)}
        >
          <MaterialCommunityIcons name="view-grid-outline" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {isLastQuestion ? (
          <TouchableOpacity
            style={[styles.submitBtn, { backgroundColor: colors.success }]}
            onPress={showSubmitConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="check-all" size={18} color="#fff" />
            )}
            <Text style={styles.submitBtnText}>
              {t('tests.finishAndSubmit')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, { backgroundColor: colors.primary }]}
            onPress={handleNext}
          >
            <Text style={[styles.navBtnText, { color: '#fff' }]}>
              {t('tests.next')}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Question navigator overlay ── */}
      {showQuestionNav && (
        <TouchableOpacity
          style={styles.navOverlay}
          activeOpacity={1}
          onPress={() => setShowQuestionNav(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.navSheet, { backgroundColor: colors.surface }]}
            onPress={() => {}}
          >
            <Text style={[styles.navSheetTitle, { color: colors.textPrimary }]}>
              {t('tests.questions')}
            </Text>
            <View style={styles.navGrid}>
              {testData.test_questions?.map((_, index) => {
                const qId = testData.test_questions![index].question.id;
                const isAnswered = answers[qId] !== undefined;
                const isCurrent = index === currentQuestionIndex;
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.navDot,
                      {
                        backgroundColor: isCurrent
                          ? colors.primary
                          : isAnswered
                          ? colors.success + '20'
                          : colors.surfaceVariant,
                        borderColor: isCurrent
                          ? colors.primary
                          : isAnswered
                          ? colors.success
                          : colors.border,
                      },
                    ]}
                    onPress={() => {
                      setCurrentQuestionIndex(index);
                      setShowQuestionNav(false);
                    }}
                  >
                    <Text style={[
                      styles.navDotText,
                      { color: isCurrent ? '#fff' : isAnswered ? colors.success : colors.textSecondary },
                    ]}>
                      {index + 1}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.navLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('tests.current')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.success + '20', borderWidth: 1, borderColor: colors.success }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('analytics.answered')}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: colors.surfaceVariant }]} />
                <Text style={[styles.legendText, { color: colors.textSecondary }]}>{t('tests.unanswered')}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingCard: { padding: 32, borderRadius: 20, alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14, textAlign: 'center' },
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  offlineBannerText: { fontSize: 12, fontWeight: '700' },

  // Top bar
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topLeft: {},
  questionCounter: { fontSize: 15, fontWeight: '700' },
  answeredLabel: { fontSize: 11, marginTop: 1 },
  timerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },
  timerText: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  finishBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  finishBtnText: { fontSize: 13, fontWeight: '700' },

  // Progress
  progressTrack: { height: 3 },
  progressFill: { height: '100%' },

  // Scroll
  scrollContent: { padding: 16, paddingBottom: 24 },

  // Question card
  questionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  questionBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 10,
  },
  questionBadgeText: { fontSize: 12, fontWeight: '800' },
  questionText: { fontSize: 17, lineHeight: 27, fontWeight: '600' },
  questionTextNp: { fontSize: 15, lineHeight: 24, marginTop: 8 },
  questionImage: {
    width: '100%' as any,
    height: 200,
    marginTop: 12,
    borderRadius: 10,
  },

  // Options
  optionsContainer: { gap: 10, marginBottom: 16 },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  optionLabel: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabelText: { fontSize: 13, fontWeight: '800' },
  optionText: { flex: 1, fontSize: 15, lineHeight: 22 },

  // Report
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 8,
  },
  reportBtnText: { fontSize: 12 },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 13,
    borderRadius: 13,
  },
  navBtnText: { fontSize: 14, fontWeight: '700' },
  dotNavBtn: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 13,
  },
  submitBtnText: { fontSize: 14, fontWeight: '800', color: '#fff' },

  // Nav overlay
  navOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  navSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  navSheetTitle: { fontSize: 16, fontWeight: '700', marginBottom: 16 },
  navGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  navDot: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  navDotText: { fontSize: 13, fontWeight: '700' },
  navLegend: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 3 },
  legendText: { fontSize: 12 },
});

export default TestAttemptScreen;
