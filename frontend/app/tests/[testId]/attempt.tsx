import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, BackHandler, Alert, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button, Card, Text, Title, RadioButton, ProgressBar } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import { MockTest, UserAttempt, UserAnswer, UserAnswerCreatePayload } from '../../../types/test.types';
import { useColors } from '../../../hooks/useColors';
import { useLocalizedField } from '../../../hooks/useLocalizedField';
import { ColorScheme } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';
import { attemptStorage, addPendingOperation } from '../../../services/storage';
import { isOnline } from '../../../hooks/useNetwork';
import { useAdInterstitial } from '../../../hooks/useInterstitialAd';

// ─── MMKV instance (from central storage module) ─────────────────────────────
const storage = attemptStorage;

// ─── Storage helpers ──────────────────────────────────────────────────────────
const ATTEMPT_KEY = (attemptId: number) => `attempt_${attemptId}_answers`;
const TIME_KEY = (attemptId: number) => `attempt_${attemptId}_timeLeft`;

function saveAnswers(attemptId: number, answers: Record<number, number | null>) {
  storage.set(ATTEMPT_KEY(attemptId), JSON.stringify(answers));
}

function loadAnswers(attemptId: number): Record<number, number | null> {
  const raw = storage.getString(ATTEMPT_KEY(attemptId));
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveTimeLeft(attemptId: number, seconds: number) {
  storage.set(TIME_KEY(attemptId), seconds);
}

function loadTimeLeft(attemptId: number): number | null {
  const val = storage.getNumber(TIME_KEY(attemptId));
  return val ?? null;
}

function clearAttemptCache(attemptId: number) {
  storage.remove(ATTEMPT_KEY(attemptId));
  storage.remove(TIME_KEY(attemptId));
}

// ─── Utilities ────────────────────────────────────────────────────────────────
const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// ─── Component ────────────────────────────────────────────────────────────────
const TestAttemptScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ testId: string | string[] }>();

  const testId = useMemo(() => {
    if (Array.isArray(params.testId)) return params.testId[0];
    return params.testId;
  }, [params.testId]);

  // ── API hooks ──────────────────────────────────────────────────────────────
  const { execute: startAttempt, data: userAttempt, status: attemptStatus } =
    useApi<UserAttempt>('/api/attempts/start/', true);

  const { execute: fetchTest, data: testData, status: testStatus, error: testError } =
    useApi<MockTest>(testId ? `/api/mock-tests/${testId}/` : '', true);

  // Bulk answer submission — POST all answers at once on final submit
  const { execute: submitBulkAnswers, status: bulkAnswerStatus } =
    useApi<UserAnswer[]>('/api/answers/bulk/', true, { method: 'POST' });

  const { execute: submitTest, status: submitStatus } =
    useApi<UserAttempt>(
      userAttempt ? `/api/attempts/${userAttempt.id}/submit/` : '',
      true,
      { method: 'POST' }
    );

  // ── Local state ────────────────────────────────────────────────────────────
  // answers: { [questionId]: selectedAnswerId }
  // This is the single source of truth — nothing goes to the backend until submit
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(-1); // -1 = not yet initialized

  // ── Refs ───────────────────────────────────────────────────────────────────
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoSubmitted = useRef(false);
  const timerInitialized = useRef(false);
  const hasInitialized = useRef(false);
  const questionStartTime = useRef(Date.now());
  // Track time-per-question locally so we can send it on submit
  const questionTimings = useRef<Record<number, number>>({});

  // ── Step 1: Start attempt ──────────────────────────────────────────────────
  useEffect(() => {
    if (!testId || hasInitialized.current) return;
    hasInitialized.current = true;

    startAttempt({ mock_test_id: parseInt(testId, 10), mode: 'MOCK_TEST' }).catch(() => {
      // attemptStatus = 'error', handled in render
    });
  }, [testId, startAttempt]);

  // ── Step 2: Fetch test data after attempt is created ───────────────────────
  useEffect(() => {
    if (userAttempt) fetchTest();
  }, [userAttempt, fetchTest]);

  // ── Step 3: Restore cached answers + timer once we have the attempt ID ─────
  useEffect(() => {
    if (!userAttempt) return;

    const cachedAnswers = loadAnswers(userAttempt.id);
    if (Object.keys(cachedAnswers).length > 0) {
      setAnswers(cachedAnswers);
    }

    const cachedTime = loadTimeLeft(userAttempt.id);
    if (cachedTime !== null && cachedTime > 0) {
      // Restore timer from where they left off
      setTimeLeft(cachedTime);
      timerInitialized.current = true;
    }
  }, [userAttempt]);

  // ── Step 4: Initialize timer from test duration (only if no cached time) ───
  useEffect(() => {
    if (testData?.duration_minutes && !timerInitialized.current) {
      timerInitialized.current = true;
      setTimeLeft(testData.duration_minutes * 60);
    }
  }, [testData]);

  // ── Timer: runs once timeLeft is a positive number ─────────────────────────
  useEffect(() => {
    if (timeLeft <= 0 || !testData) return;
    if (timerRef.current) return; // already running

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev <= 1 ? 0 : prev - 1;

        // Persist remaining time every 5 seconds to avoid hammering MMKV
        if (userAttempt && next % 5 === 0) {
          saveTimeLeft(userAttempt.id, next);
        }

        if (next === 0 && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }

        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [testData, timeLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps
  const { showAfterMockTest } = useAdInterstitial();
  // ── Final submission ───────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!userAttempt || submitStatus === 'loading' || bulkAnswerStatus === 'loading') return;

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Build bulk payload from local answers state
    const answerPayloads: UserAnswerCreatePayload[] = Object.entries(answers).map(
      ([questionId, answerId]) => ({
        user_attempt: userAttempt.id,
        question: parseInt(questionId, 10),
        selected_answer: answerId,
        time_taken_seconds: questionTimings.current[parseInt(questionId, 10)] ?? 0,
        is_skipped: answerId === null,
        is_marked_for_review: false,
      })
    );

    // Also mark unanswered questions as skipped
    const answeredIds = new Set(Object.keys(answers).map(Number));
    testData?.test_questions?.forEach(({ question }) => {
      if (!answeredIds.has(question.id)) {
        answerPayloads.push({
          user_attempt: userAttempt.id,
          question: question.id,
          selected_answer: null,
          time_taken_seconds: 0,
          is_skipped: true,
          is_marked_for_review: false,
        });
      }
    });

    try {
      await submitBulkAnswers({ answers: answerPayloads });
      await submitTest();

      // Clean up cache — test is done
      clearAttemptCache(userAttempt.id);
      const attemptId = userAttempt.id;
      showAfterMockTest(() => {
        router.replace(`/tests/${attemptId}/results`);
      });
    } catch {
      if (!isOnline()) {
        // Queue for later sync when back online
        addPendingOperation({
          endpoint: '/api/answers/bulk/',
          method: 'POST',
          body: { answers: answerPayloads },
        });
        addPendingOperation({
          endpoint: `/api/attempts/${userAttempt.id}/submit/`,
          method: 'POST',
          body: {},
        });
        clearAttemptCache(userAttempt.id);
        Alert.alert(
          t('tests.savedOffline', { defaultValue: 'Saved Offline' }),
          t('tests.savedOfflineMsg', { defaultValue: 'Your answers have been saved. Results will sync when you\'re back online.' }),
          [{ text: t('common.ok'), onPress: () => router.replace('/(tabs)/tests') }],
        );
      } else {
        Alert.alert(t('tests.submissionFailed'), t('tests.submissionFailedMsg'));
      }
    }
  }, [userAttempt, answers, testData, submitBulkAnswers, submitTest, router, submitStatus, bulkAnswerStatus, t, showAfterMockTest]);

  // ── Auto-submit when timer hits 0 ─────────────────────────────────────────
  useEffect(() => {
    if (
      timeLeft === 0 &&
      timerInitialized.current &&
      testData &&
      !hasAutoSubmitted.current &&
      submitStatus !== 'loading'
    ) {
      hasAutoSubmitted.current = true;
      Alert.alert(t('tests.timesUp'), t('tests.timesUpMsg'), [
        { text: t('common.ok'), onPress: handleSubmit },
      ]);
    }
  }, [timeLeft, testData, handleSubmit, submitStatus, t]);

  // ── Prevent back navigation during test ───────────────────────────────────
  useEffect(() => {
    const backAction = () => {
      Alert.alert(t('tests.holdOn'), t('tests.cantGoBack'), [
        { text: t('common.ok') },
      ]);
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [t]);

  // ── Answer selection — pure local state, no API call ──────────────────────
  const handleAnswerSelect = useCallback(
    (questionId: number, answerId: number) => {
      // Accumulate time for this question
      const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
      questionTimings.current[questionId] =
        (questionTimings.current[questionId] ?? 0) + elapsed;
      questionStartTime.current = Date.now(); // reset for re-selection tracking

      setAnswers(prev => {
        const updated = { ...prev, [questionId]: answerId };

        // Persist to MMKV immediately so crash/backgrounding loses nothing
        if (userAttempt) {
          saveAnswers(userAttempt.id, updated);
        }

        return updated;
      });
    },
    [userAttempt]
  );

  // ── Navigation between questions ──────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (testData?.test_questions && currentQuestionIndex < testData.test_questions.length - 1) {
      // Record time spent on current question before moving
      const currentQuestion = testData.test_questions[currentQuestionIndex]?.question;
      if (currentQuestion) {
        const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
        questionTimings.current[currentQuestion.id] =
          (questionTimings.current[currentQuestion.id] ?? 0) + elapsed;
      }
      setCurrentQuestionIndex(prev => prev + 1);
      questionStartTime.current = Date.now();
    }
  }, [testData, currentQuestionIndex]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      // Record time spent before going back
      const currentQuestion = testData?.test_questions?.[currentQuestionIndex]?.question;
      if (currentQuestion) {
        const elapsed = Math.round((Date.now() - questionStartTime.current) / 1000);
        questionTimings.current[currentQuestion.id] =
          (questionTimings.current[currentQuestion.id] ?? 0) + elapsed;
      }
      setCurrentQuestionIndex(prev => prev - 1);
      questionStartTime.current = Date.now();
    }
  }, [currentQuestionIndex, testData]);

  const showSubmitConfirm = useCallback(() => {
    const totalQuestions = testData?.test_questions?.length || 0;
    const answeredCount = Object.keys(answers).length;
    const unanswered = totalQuestions - answeredCount;

    Alert.alert(
      t('tests.finishTest'),
      unanswered > 0
        ? t('tests.unansweredWarning', { count: unanswered })
        : t('tests.finishConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('common.submit'), onPress: handleSubmit },
      ]
    );
  }, [testData, answers, handleSubmit, t]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // ── Derived values ────────────────────────────────────────────────────────
  const isSubmitting = submitStatus === 'loading' || bulkAnswerStatus === 'loading';

  // ── Render: loading ───────────────────────────────────────────────────────
  if (attemptStatus === 'loading' || testStatus === 'loading' || (testId && !testData)) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('tests.preparingTest')}</Text>
      </SafeAreaView>
    );
  }

  // ── Render: error ─────────────────────────────────────────────────────────
  if (testStatus === 'error' || !testData) {
    return (
      <SafeAreaView style={styles.container}>
        <Title>{t('common.error')}</Title>
        <Text style={styles.errorText}>{testError || t('tests.failedToLoadTest')}</Text>
        <Button onPress={() => router.back()}>{t('common.back')}</Button>
      </SafeAreaView>
    );
  }

  const currentQuestionData = testData.test_questions?.[currentQuestionIndex]?.question;
  if (!currentQuestionData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>{t('tests.noQuestions')}</Text>
      </SafeAreaView>
    );
  }

  const questionProgress = testData.test_questions
    ? (currentQuestionIndex + 1) / testData.test_questions.length
    : 0;

  // ── Render: main ──────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: t('tests.takingTest', {
            title: lf(testData.title_en, testData.title_np),
          }),
        }}
      />

      {/* Header: question counter + timer + finish button */}
      <View style={styles.header}>
        <Text style={styles.questionCounter}>
          {t('tests.questionCounter', {
            current: currentQuestionIndex + 1,
            total: testData.test_questions?.length || 0,
          })}
        </Text>
        <Title
          style={[
            styles.timerText,
            timeLeft >= 0 && timeLeft <= 60 && styles.timerWarning,
          ]}
        >
          {formatTime(Math.max(0, timeLeft))}
        </Title>
        <Button
          onPress={showSubmitConfirm}
          disabled={isSubmitting}
          loading={isSubmitting}
        >
          {t('tests.finish')}
        </Button>
      </View>

      <ProgressBar
        progress={questionProgress}
        style={styles.progressBar}
        color={colors.primary}
      />

      {/* Question + options */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.questionCard}>
          <Card.Content>
            <Text style={styles.questionText}>
              {lf(currentQuestionData.question_text_en, currentQuestionData.question_text_np)}
            </Text>

            {currentQuestionData.question_text_np &&
              currentQuestionData.question_text_np !== currentQuestionData.question_text_en && (
                <Text style={styles.questionTextNp}>
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

            <RadioButton.Group
              onValueChange={newValue =>
                handleAnswerSelect(currentQuestionData.id, parseInt(newValue, 10))
              }
              value={answers[currentQuestionData.id]?.toString() || ''}
            >
              {currentQuestionData.answers?.map(option => (
                <RadioButton.Item
                  key={option.id}
                  label={lf(option.answer_text_en, option.answer_text_np)}
                  value={option.id.toString()}
                  style={[
                    styles.option,
                    answers[currentQuestionData.id] === option.id && styles.selectedOption,
                  ]}
                />
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        <TouchableOpacity
          style={styles.reportButton}
          onPress={() => router.push(`/report/${currentQuestionData.id}` as any)}
        >
          <MaterialCommunityIcons name="flag-outline" size={16} color={colors.error} />
          <Text style={styles.reportButtonText}>{t('report.reportQuestion', { defaultValue: 'Report Question' })}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer: prev / next / submit */}
      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
          icon="chevron-left"
        >
          {t('tests.previous')}
        </Button>

        {currentQuestionIndex === (testData.test_questions?.length || 0) - 1 ? (
          <Button
            mode="contained"
            onPress={showSubmitConfirm}
            disabled={isSubmitting}
            loading={isSubmitting}
            icon="check-all"
            buttonColor={colors.success}
          >
            {t('tests.finishAndSubmit')}
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={handleNext}
            icon="chevron-right"
            contentStyle={styles.nextButtonContent}
          >
            {t('tests.next')}
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const createStyles = (colors: ColorScheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.sm,
      backgroundColor: colors.cardBackground,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    questionCounter: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    timerText: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    timerWarning: {
      color: colors.error,
    },
    progressBar: {
      marginHorizontal: Spacing.base,
      height: 4,
      borderRadius: 2,
    },
    scrollContainer: {
      padding: Spacing.base,
      paddingBottom: Spacing.lg,
    },
    questionCard: {
      backgroundColor: colors.cardBackground,
      borderRadius: BorderRadius.lg,
      elevation: 2,
    },
    questionText: {
      fontSize: 18,
      lineHeight: 26,
      fontWeight: '600',
      color: colors.textPrimary,
      marginBottom: Spacing.base,
    },
    questionTextNp: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.primary,
      marginBottom: Spacing.base,
    },
    questionImage: {
      width: '100%' as unknown as number,
      height: 200,
      marginTop: Spacing.sm,
      marginBottom: Spacing.base,
      borderRadius: BorderRadius.md,
    },
    option: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: BorderRadius.md,
      marginBottom: Spacing.sm,
      backgroundColor: colors.cardBackground,
    },
    selectedOption: {
      borderColor: colors.primary,
      backgroundColor: colors.infoLight,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      padding: Spacing.base,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.cardBackground,
    },
    nextButtonContent: {
      flexDirection: 'row-reverse',
    },
    loadingText: {
      marginTop: Spacing.base,
      fontSize: 16,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    errorText: {
      textAlign: 'center',
      margin: Spacing.xl,
      fontSize: 18,
      color: colors.error,
    },
    reportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: Spacing.md,
      paddingVertical: Spacing.sm,
    },
    reportButtonText: {
      fontSize: 13,
      color: colors.error,
      fontWeight: '500',
    },
  });

export default TestAttemptScreen;