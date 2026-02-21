import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../../hooks/usePaginatedApi';
import { usePracticeStore } from '../../../store/practiceStore';
import { useSettingsStore } from '../../../store/settingsStore';
import { useColors } from '../../../hooks/useColors';
import { useLocalizedField } from '../../../hooks/useLocalizedField';
import { Question, AnswerOption } from '../../../types/question.types';
import { cacheQuestions, getCachedQuestions } from '../../../services/questionCache';
import { ColorScheme } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';
import { useAdInterstitial } from '../../../hooks/useInterstitialAd';
const QUESTION_TIME_SECONDS = 30;

function AnswerOptionItemBase({
  answer,
  index,
  isSelected,
  showExplanation,
  onSelect,
  colors,
  styles,
  lf,
}: {
  answer: AnswerOption;
  index: number;
  isSelected: boolean;
  showExplanation: boolean;
  onSelect: (id: number) => void;
  colors: ColorScheme;
  styles: ReturnType<typeof createStyles>;
  lf: ReturnType<typeof useLocalizedField>;
}) {
  const getStyle = () => {
    if (!showExplanation) return isSelected ? styles.selectedOption : styles.option;
    if (answer.is_correct) return styles.correctOption;
    if (isSelected && !answer.is_correct) return styles.incorrectOption;
    return styles.option;
  };

  return (
    <TouchableOpacity
      onPress={() => onSelect(answer.id)}
      disabled={showExplanation}
      activeOpacity={0.7}
    >
      <View style={getStyle()}>
        <View style={styles.optionLetter}>
          <Text style={styles.optionLetterText}>{String.fromCharCode(65 + index)}</Text>
        </View>
        <Text style={styles.optionText}>{lf(answer.answer_text_en, answer.answer_text_np)}</Text>
        {showExplanation && answer.is_correct && (
          <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
        )}
        {showExplanation && isSelected && !answer.is_correct && (
          <MaterialCommunityIcons name="close-circle" size={24} color={colors.error} />
        )}
      </View>
    </TouchableOpacity>
  );
}
const AnswerOptionItem = React.memo(AnswerOptionItemBase);

const QuestionScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ categoryId: string; count?: string; categoryName?: string }>();
  const categoryId = params.categoryId;
  const count = params.count || '10';
  const categoryName = params.categoryName || `Category ${categoryId}`;
  const requestedCount = Number.parseInt(count, 10) || 10;

  // Practice store for session persistence
  const { startSession, answerQuestion, completeSession, session } = usePracticeStore();
  const shuffleQuestions = useSettingsStore((s) => s.shuffleQuestions);
  const showExplanationsPref = useSettingsStore((s) => s.showExplanations);
  const autoAdvance = useSettingsStore((s) => s.autoAdvance);
  const { showAfterPractice } = useAdInterstitial();

  const { data: apiQuestions, status: apiStatus, execute: fetchQuestions } = usePaginatedApi<Question>('/api/questions/', true);
  const [cachedFallback, setCachedFallback] = useState<Question[] | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  // Derived: use API data or cached fallback
  const questions = apiQuestions ?? cachedFallback;
  const status = cachedFallback ? 'success' : apiStatus;

  // Fetch questions once on mount, cache on success, fallback on error
  const hasFetched = useRef(false);
  useEffect(() => {
    if (!categoryId || hasFetched.current) return;
    hasFetched.current = true;

    fetchQuestions(`?category=${categoryId}&page_size=${count}`)
      .then((res) => {
        // Cache the fetched questions for offline use
        if (res?.results) {
          cacheQuestions(Number(categoryId), categoryName, res.results);
        }
      })
      .catch(async () => {
        // API failed — try loading from cache
        const cached = await getCachedQuestions(Number(categoryId));
        if (cached && cached.length > 0) {
          setCachedFallback(cached.slice(0, requestedCount));
          setIsOffline(true);
        }
      });
  }, [categoryId, count, categoryName, fetchQuestions, requestedCount]);

  // Initialize practice store session when questions load
  useEffect(() => {
    if (questions && questions.length > 0 && !session) {
      let prepared = [...questions];
      if (shuffleQuestions) {
        // Fisher-Yates shuffle
        for (let i = prepared.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [prepared[i], prepared[j]] = [prepared[j], prepared[i]];
        }
      }
      startSession(Number(categoryId), categoryName, prepared);
    }
  }, [questions, categoryId, categoryName, startSession, session, shuffleQuestions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: number; isCorrect: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);

  // Refs to avoid stale closures in timer
  const selectedAnswerRef = useRef<number | null>(null);
  const showExplanationRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleNextRef = useRef<() => void>(() => { });

  // Keep refs in sync
  useEffect(() => { selectedAnswerRef.current = selectedAnswer; }, [selectedAnswer]);
  useEffect(() => { showExplanationRef.current = showExplanation; }, [showExplanation]);

  const currentQuestion = questions?.[currentIndex];
  const totalQuestions = questions?.length || 0;
  const progress = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;

  // Submit answer handler using refs to avoid stale closures
  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion || !currentQuestion.answers) return;
    if (showExplanationRef.current) return; // Already submitted

    const correctAnswer = currentQuestion.answers.find((a) => a.is_correct);
    const currentSelected = selectedAnswerRef.current;
    const isCorrect = currentSelected === correctAnswer?.id;

    setAnswers((prev) => [...prev, { questionId: currentQuestion.id, isCorrect }]);
    setShowExplanation(true);

    // Persist to practice store
    const timeTaken = QUESTION_TIME_SECONDS - timeLeft;
    answerQuestion(
      currentQuestion.id,
      currentSelected?.toString() || '',
      isCorrect,
      timeTaken,
    );

    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    // Auto-advance to next question if preference is enabled
    if (autoAdvance) {
      const delay = showExplanationsPref ? 2000 : 1000;
      autoAdvanceRef.current = setTimeout(() => {
        handleNextRef.current();
      }, delay);
    }
  }, [currentQuestion, timeLeft, answerQuestion, autoAdvance, showExplanationsPref]);

  // Timer effect - clean, no stale closure issues
  useEffect(() => {
    if (status !== 'success' || showExplanation || !currentQuestion) {
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up - auto-submit on next tick
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
  }, [status, showExplanation, currentQuestion]);

  // Handle auto-submit when timer hits 0
  useEffect(() => {
    if (timeLeft === 0 && !showExplanation && currentQuestion) {
      handleSubmitAnswer();
    }
  }, [timeLeft, showExplanation, currentQuestion, handleSubmitAnswer]);

  const handleSelectAnswer = useCallback((answerId: number) => {
    if (!showExplanationRef.current) {
      setSelectedAnswer(answerId);
    }
  }, []);

  const handleNext = useCallback(() => {
    // Clear any pending auto-advance timeout
    if (autoAdvanceRef.current) {
      clearTimeout(autoAdvanceRef.current);
      autoAdvanceRef.current = null;
    }
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(QUESTION_TIME_SECONDS);
    } else {
      completeSession();
      const finalScore = answers.filter((a) => a.isCorrect).length;
      showAfterPractice(() => {
        router.replace({
          pathname: '/practice/results',
          params: { score: String(finalScore), total: String(totalQuestions) },
        });
      });
    }
  }, [currentIndex, totalQuestions, answers, router, completeSession, showAfterPractice]);

  // Keep handleNextRef in sync so autoAdvance timeout calls the latest version
  useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

  const handleEndPractice = useCallback(() => {
    Alert.alert(t('practice.endPractice'), t('practice.endConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('practice.end'),
        style: 'destructive',
        onPress: () => {
          completeSession();
          const finalScore = answers.filter((a) => a.isCorrect).length;
          showAfterPractice(() => {
            router.replace({
              pathname: '/practice/results',
              params: { score: String(finalScore), total: String(currentIndex + 1) },
            });
          });
        },
      },
    ]);
  }, [answers, currentIndex, router, completeSession, t, showAfterPractice]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoAdvanceRef.current) {
        clearTimeout(autoAdvanceRef.current);
      }
    };
  }, []);

  if (status === 'loading' || !currentQuestion) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('practice.loadingQuestions')}</Text>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={60} color={colors.error} />
        <Text style={styles.errorText}>{t('practice.failedToLoad')}</Text>
        <Button mode="contained" onPress={() => router.back()}>{t('common.back')}</Button>
      </SafeAreaView>
    );
  }

  const questionText = currentQuestion ? lf(currentQuestion.question_text_en, currentQuestion.question_text_np) : '';
  const questionTextSecondary = currentQuestion && lf(currentQuestion.question_text_en, currentQuestion.question_text_np) === currentQuestion.question_text_en
    ? currentQuestion.question_text_np
    : currentQuestion?.question_text_en;
  const explanationText = currentQuestion ? lf(currentQuestion.explanation_en, currentQuestion.explanation_np) : '';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          title: t('practice.practice'),
          headerRight: () => (
            <Button mode="text" textColor={colors.error} onPress={handleEndPractice}>{t('practice.end')}</Button>
          ),
        }}
      />
      {isOffline && (
        <View style={styles.offlineBanner}>
          <MaterialCommunityIcons name="cloud-off-outline" size={16} color={colors.warning} />
          <Text style={styles.offlineBannerText}>{t('offline.usingCachedData')}</Text>
        </View>
      )}
      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <Text style={styles.questionCount}>{t('practice.question')} {currentIndex + 1}/{totalQuestions}</Text>
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={timeLeft <= 10 ? colors.error : colors.textSecondary}
            />
            <Text style={[styles.timerText, timeLeft <= 10 && styles.timerWarning]}>
              {timeLeft}s
            </Text>
          </View>
        </View>
        <ProgressBar progress={progress} color={colors.primary} style={styles.progressBar} />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Card style={styles.questionCard}>
          <Card.Content>
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{currentQuestion.difficulty_level}</Text>
            </View>
            <Text style={styles.questionText}>{questionText}</Text>
            {!!questionTextSecondary && questionTextSecondary !== questionText && (
              <Text style={styles.questionTextNp}>{questionTextSecondary}</Text>
            )}
            {!!currentQuestion.image && (
              <Image
                source={{ uri: currentQuestion.image }}
                style={styles.questionImage}
                resizeMode="contain"
              />
            )}
          </Card.Content>
        </Card>

        <View style={styles.optionsContainer}>
          {currentQuestion.answers?.map((answer, idx) => (
            <AnswerOptionItem
              key={answer.id}
              answer={answer}
              index={idx}
              isSelected={selectedAnswer === answer.id}
              showExplanation={showExplanation}
              onSelect={handleSelectAnswer}
              colors={colors}
              styles={styles}
              lf={lf}
            />
          ))}
        </View>

        {showExplanation && showExplanationsPref && explanationText && (
          <Card style={styles.explanationCard}>
            <Card.Content>
              <Text style={styles.explanationTitle}>{t('practice.explanation')}</Text>
              <Text style={styles.explanationText}>{explanationText}</Text>
            </Card.Content>
          </Card>
        )}

        {showExplanation && (
          <TouchableOpacity
            style={styles.reportButton}
            onPress={() => router.push(`/report/${currentQuestion.id}` as any)}
          >
            <MaterialCommunityIcons name="flag-outline" size={16} color={colors.error} />
            <Text style={styles.reportButtonText}>{t('report.reportQuestion', { defaultValue: 'Report Question' })}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={styles.bottomActions}>
        {!showExplanation ? (
          <Button
            mode="contained"
            onPress={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            style={styles.actionButton}
          >
            {t('practice.submitAnswer')}
          </Button>
        ) : (
          <Button mode="contained" onPress={handleNext} style={styles.actionButton}>
            {currentIndex === totalQuestions - 1 ? t('practice.seeResults') : t('practice.nextQuestion')}
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};

export default QuestionScreen;

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { marginTop: Spacing.base, color: colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, backgroundColor: colors.background },
  errorText: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, marginVertical: Spacing.base },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  questionCount: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 16, fontWeight: '700', color: colors.textSecondary },
  timerWarning: { color: colors.error },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: colors.border },
  scrollArea: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing.base },
  questionCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  difficultyBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, backgroundColor: colors.warningLight, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm },
  difficultyText: { fontSize: 11, fontWeight: '600', color: colors.warning, textTransform: 'uppercase' },
  questionText: { fontSize: 18, fontWeight: '600', color: colors.textPrimary, lineHeight: 26 },
  questionTextNp: { fontSize: 16, color: colors.primary, marginTop: Spacing.sm, lineHeight: 24 },
  questionImage: { width: '100%' as unknown as number, height: 200, marginTop: Spacing.md, borderRadius: BorderRadius.md },
  optionsContainer: { gap: Spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardBackground, padding: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: colors.border },
  selectedOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.infoLight, padding: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: colors.primary },
  correctOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.successLight, padding: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: colors.success },
  incorrectOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.errorLight, padding: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: colors.error },
  optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  optionLetterText: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  optionText: { flex: 1, fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  explanationCard: { backgroundColor: colors.infoLight, borderRadius: BorderRadius.lg, marginTop: Spacing.lg },
  explanationTitle: { fontSize: 14, fontWeight: '700', color: colors.info, marginBottom: Spacing.sm },
  explanationText: { fontSize: 14, color: colors.textPrimary, lineHeight: 22 },
  bottomActions: { backgroundColor: colors.cardBackground, padding: Spacing.base, borderTopWidth: 1, borderTopColor: colors.border },
  actionButton: { borderRadius: BorderRadius.lg },
  offlineBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.warningLight, paddingVertical: Spacing.xs, paddingHorizontal: Spacing.base },
  offlineBannerText: { fontSize: 12, fontWeight: '600', color: colors.warning },
  reportButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: Spacing.md, paddingVertical: Spacing.sm },
  reportButtonText: { fontSize: 13, color: colors.error, fontWeight: '500' },
});
