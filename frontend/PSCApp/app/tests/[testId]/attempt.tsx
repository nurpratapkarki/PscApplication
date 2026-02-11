import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, StyleSheet, ActivityIndicator, BackHandler, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, Title, RadioButton, ProgressBar } from 'react-native-paper';
import { useApi } from '../../../hooks/useApi';
import { MockTest, UserAttempt, UserAnswer, UserAnswerCreatePayload } from '../../../types/test.types';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const TestAttemptScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ testId: string | string[] }>();

  const testId = useMemo(() => {
    if (Array.isArray(params.testId)) return params.testId[0];
    return params.testId;
  }, [params.testId]);

  // API callers
  const { execute: startAttempt, data: userAttempt, status: attemptStatus } = useApi<UserAttempt>('/api/attempts/start/', true);
  const { execute: fetchTest, data: testData, status: testStatus, error: testError } = useApi<MockTest>(testId ? `/api/mock-tests/${testId}/` : '', true);
  const { execute: submitAnswer } = useApi<UserAnswer>('/api/answers/', true);
  const { execute: submitTest, status: submitStatus } = useApi<UserAttempt>(userAttempt ? `/api/attempts/${userAttempt.id}/submit/` : '', true, { method: 'POST' });

  // Component State
  const [answers, setAnswers] = useState<Record<number, number | null>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(-1); // -1 = not initialized

  // Refs for timer and submission guard
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasAutoSubmitted = useRef(false);
  const timerInitialized = useRef(false);
  const questionStartTime = useRef(Date.now());

  // --- Initialization: start attempt then fetch test data ---
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (!testId || hasInitialized.current) return;
    hasInitialized.current = true;

    const initialize = async () => {
      try {
        await startAttempt({ mock_test_id: parseInt(testId, 10), mode: "MOCK_TEST" });
      } catch {
        // attemptStatus will be 'error', handled in render
      }
    };
    initialize();
  }, [testId, startAttempt]);

  // Fetch test data after attempt is created
  useEffect(() => {
    if (userAttempt) fetchTest();
  }, [userAttempt, fetchTest]);

  // Initialize timer when test data loads
  useEffect(() => {
    if (testData?.duration_minutes && !timerInitialized.current) {
      timerInitialized.current = true;
      setTimeLeft(testData.duration_minutes * 60);
    }
  }, [testData]);

  // --- Final Submission Logic ---
  const handleSubmit = useCallback(async () => {
    if (!userAttempt || submitStatus === 'loading') return;

    // Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      await submitTest();
      router.replace(`/tests/${userAttempt.id}/results`);
    } catch {
      Alert.alert("Submission Failed", "There was an error submitting your test. Please try again.");
    }
  }, [userAttempt, submitTest, router, submitStatus]);

  // --- Timer: start once when timeLeft becomes positive ---
  useEffect(() => {
    if (timeLeft <= 0 || !testData) return;

    // Only create interval if not already running
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [testData, timeLeft > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-submit when timer counts down to 0 (only after timer was initialized)
  useEffect(() => {
    if (timeLeft === 0 && timerInitialized.current && testData && !hasAutoSubmitted.current && submitStatus !== 'loading') {
      hasAutoSubmitted.current = true;
      Alert.alert("Time's Up!", "Your test will be submitted now.", [
        { text: "OK", onPress: handleSubmit },
      ]);
    }
  }, [timeLeft, testData, handleSubmit, submitStatus]);

  // --- Prevent back navigation ---
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Hold on!",
        "You can't go back during a test. Use the 'Finish & Submit' button to exit.",
        [{ text: "OK" }],
      );
      return true;
    };
    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);
    return () => backHandler.remove();
  }, []);

  // --- Answer handling with per-question time tracking ---
  const handleAnswerSelect = useCallback((questionId: number, answerId: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: answerId }));

    if (userAttempt) {
      const timeTaken = Math.round((Date.now() - questionStartTime.current) / 1000);
      const payload: UserAnswerCreatePayload = {
        user_attempt: userAttempt.id,
        question: questionId,
        selected_answer: answerId,
        time_taken_seconds: timeTaken,
        is_skipped: false,
        is_marked_for_review: false,
      };
      submitAnswer(payload).catch((err) => {
        console.warn('Failed to submit answer:', err);
      });
    }
  }, [userAttempt, submitAnswer]);

  const handleNext = useCallback(() => {
    if (testData?.test_questions && currentQuestionIndex < testData.test_questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      questionStartTime.current = Date.now();
    }
  }, [testData, currentQuestionIndex]);

  const handlePrevious = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      questionStartTime.current = Date.now();
    }
  }, [currentQuestionIndex]);

  const showSubmitConfirm = useCallback(() => {
    const totalQuestions = testData?.test_questions?.length || 0;
    const answeredCount = Object.keys(answers).length;
    const unanswered = totalQuestions - answeredCount;

    Alert.alert(
      "Finish Test",
      unanswered > 0
        ? `You have ${unanswered} unanswered question${unanswered > 1 ? 's' : ''}. Submit anyway?`
        : "Are you sure you want to finish and submit your test?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Submit", onPress: handleSubmit },
      ],
    );
  }, [testData, answers, handleSubmit]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // --- Render Logic ---
  if (attemptStatus === 'loading' || testStatus === 'loading' || (testId && !testData)) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Preparing your test...</Text>
      </SafeAreaView>
    );
  }

  if (testStatus === 'error' || !testData) {
    return (
      <SafeAreaView style={styles.container}>
        <Title>Error</Title>
        <Text style={styles.errorText}>{testError || 'Could not load the test.'}</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </SafeAreaView>
    );
  }

  const currentQuestionData = testData.test_questions?.[currentQuestionIndex]?.question;
  if (!currentQuestionData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No questions found for this test.</Text>
      </SafeAreaView>
    );
  }

  const questionProgress = testData.test_questions
    ? (currentQuestionIndex + 1) / testData.test_questions.length
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: `Taking Test: ${testData.title_en}` }} />

      <View style={styles.header}>
        <Text style={styles.questionCounter}>
          Q {currentQuestionIndex + 1}/{testData.test_questions?.length || 0}
        </Text>
        <Title style={[
          styles.timerText,
          timeLeft >= 0 && timeLeft <= 60 && styles.timerWarning,
        ]}>
          {formatTime(Math.max(0, timeLeft))}
        </Title>
        <Button
          onPress={showSubmitConfirm}
          disabled={submitStatus === 'loading'}
          loading={submitStatus === 'loading'}
        >
          Finish
        </Button>
      </View>
      <ProgressBar progress={questionProgress} style={styles.progressBar} color={Colors.primary} />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Card style={styles.questionCard}>
          <Card.Content>
            <Text style={styles.questionText}>{currentQuestionData.question_text_en}</Text>
            {currentQuestionData.question_text_np && (
              <Text style={styles.questionTextNp}>{currentQuestionData.question_text_np}</Text>
            )}
            <RadioButton.Group
              onValueChange={newValue => handleAnswerSelect(currentQuestionData.id, parseInt(newValue, 10))}
              value={answers[currentQuestionData.id]?.toString() || ''}
            >
              {currentQuestionData.answers?.map(option => (
                <RadioButton.Item
                  key={option.id}
                  label={option.answer_text_en}
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
      </ScrollView>

      <View style={styles.footer}>
        <Button
          mode="outlined"
          onPress={handlePrevious}
          disabled={currentQuestionIndex === 0}
          icon="chevron-left"
        >
          Previous
        </Button>
        <Button
          mode="contained"
          onPress={handleNext}
          disabled={currentQuestionIndex === (testData.test_questions?.length || 0) - 1}
          icon="chevron-right"
          contentStyle={styles.nextButtonContent}
        >
          Next
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  questionCounter: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timerText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  timerWarning: {
    color: Colors.error,
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
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    elevation: 2,
  },
  questionText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.base,
  },
  questionTextNp: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.primary,
    marginBottom: Spacing.base,
  },
  option: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.white,
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.infoLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
  },
  nextButtonContent: {
    flexDirection: 'row-reverse',
  },
  loadingText: {
    marginTop: Spacing.base,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  errorText: {
    textAlign: 'center',
    margin: Spacing.xl,
    fontSize: 18,
    color: Colors.error,
  },
});

export default TestAttemptScreen;
