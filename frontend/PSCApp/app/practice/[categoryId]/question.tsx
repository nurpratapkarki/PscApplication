import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../../hooks/usePaginatedApi';
import { usePracticeStore } from '../../../store/practiceStore';
import { Question, AnswerOption } from '../../../types/question.types';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';

const QUESTION_TIME_SECONDS = 30;

function AnswerOptionItemBase({
  answer,
  index,
  isSelected,
  showExplanation,
  onSelect,
}: {
  answer: AnswerOption;
  index: number;
  isSelected: boolean;
  showExplanation: boolean;
  onSelect: (id: number) => void;
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
        <Text style={styles.optionText}>{answer.answer_text_en}</Text>
        {showExplanation && answer.is_correct && (
          <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
        )}
        {showExplanation && isSelected && !answer.is_correct && (
          <MaterialCommunityIcons name="close-circle" size={24} color={Colors.error} />
        )}
      </View>
    </TouchableOpacity>
  );
}
const AnswerOptionItem = React.memo(AnswerOptionItemBase);

const QuestionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId: string; count?: string }>();
  const categoryId = params.categoryId;
  const count = params.count || '10';

  // Practice store for session persistence
  const { startSession, answerQuestion, completeSession, clearSession, session } = usePracticeStore();

  const { data: questions, status, execute: fetchQuestions } = usePaginatedApi<Question>('/api/questions/', true);

  // Fetch questions once on mount
  const hasFetched = useRef(false);
  useEffect(() => {
    if (categoryId && !hasFetched.current) {
      hasFetched.current = true;
      fetchQuestions(`?category=${categoryId}&page_size=${count}`);
    }
  }, [categoryId, count, fetchQuestions]);

  // Initialize practice store session when questions load
  useEffect(() => {
    if (questions && questions.length > 0 && !session) {
      startSession(Number(categoryId), `Category ${categoryId}`, questions);
    }
  }, [questions, categoryId, startSession, session]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<{ questionId: number; isCorrect: boolean }[]>([]);
  const [timeLeft, setTimeLeft] = useState(QUESTION_TIME_SECONDS);

  // Refs to avoid stale closures in timer
  const selectedAnswerRef = useRef<number | null>(null);
  const showExplanationRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
  }, [currentQuestion, timeLeft, answerQuestion]);

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
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(QUESTION_TIME_SECONDS);
    } else {
      completeSession();
      const finalScore = answers.filter((a) => a.isCorrect).length + (showExplanation ? 0 : 0);
      // Count current answer if just submitted
      const allAnswers = [...answers];
      const score = allAnswers.filter((a) => a.isCorrect).length;
      router.replace({
        pathname: '/practice/results',
        params: { score: String(score), total: String(totalQuestions) },
      });
    }
  }, [currentIndex, totalQuestions, answers, router, completeSession, showExplanation]);

  const handleEndPractice = useCallback(() => {
    Alert.alert('End Practice', 'Are you sure you want to end?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'End',
        style: 'destructive',
        onPress: () => {
          completeSession();
          const finalScore = answers.filter((a) => a.isCorrect).length;
          router.replace({
            pathname: '/practice/results',
            params: { score: String(finalScore), total: String(currentIndex + 1) },
          });
        },
      },
    ]);
  }, [answers, currentIndex, router, completeSession]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  if (status === 'loading' || !currentQuestion) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading questions...</Text>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={60} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load questions</Text>
        <Button mode="contained" onPress={() => router.back()}>Go Back</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Practice',
          headerRight: () => (
            <Button mode="text" textColor={Colors.error} onPress={handleEndPractice}>End</Button>
          ),
        }}
      />
      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <Text style={styles.questionCount}>Question {currentIndex + 1}/{totalQuestions}</Text>
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons
              name="clock-outline"
              size={18}
              color={timeLeft <= 10 ? Colors.error : Colors.textSecondary}
            />
            <Text style={[styles.timerText, timeLeft <= 10 && styles.timerWarning]}>
              {timeLeft}s
            </Text>
          </View>
        </View>
        <ProgressBar progress={progress} color={Colors.primary} style={styles.progressBar} />
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
            <Text style={styles.questionText}>{currentQuestion.question_text_en}</Text>
            {currentQuestion.question_text_np && (
              <Text style={styles.questionTextNp}>{currentQuestion.question_text_np}</Text>
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
            />
          ))}
        </View>

        {showExplanation && currentQuestion.explanation_en && (
          <Card style={styles.explanationCard}>
            <Card.Content>
              <Text style={styles.explanationTitle}>Explanation</Text>
              <Text style={styles.explanationText}>{currentQuestion.explanation_en}</Text>
            </Card.Content>
          </Card>
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
            Submit Answer
          </Button>
        ) : (
          <Button mode="contained" onPress={handleNext} style={styles.actionButton}>
            {currentIndex === totalQuestions - 1 ? 'See Results' : 'Next Question'}
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};

export default QuestionScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: Spacing.base, color: Colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.background },
  errorText: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginVertical: Spacing.base },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm },
  progressInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  questionCount: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  timerContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timerText: { fontSize: 16, fontWeight: '700', color: Colors.textSecondary },
  timerWarning: { color: Colors.error },
  progressBar: { height: 6, borderRadius: 3, backgroundColor: Colors.border },
  scrollArea: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing.base },
  questionCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  difficultyBadge: { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: 2, backgroundColor: Colors.warningLight, borderRadius: BorderRadius.sm, marginBottom: Spacing.sm },
  difficultyText: { fontSize: 11, fontWeight: '600', color: Colors.warning, textTransform: 'uppercase' },
  questionText: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, lineHeight: 26 },
  questionTextNp: { fontSize: 16, color: Colors.primary, marginTop: Spacing.sm, lineHeight: 24 },
  optionsContainer: { gap: Spacing.md },
  option: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, padding: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.border },
  selectedOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.infoLight, padding: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.primary },
  correctOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.successLight, padding: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.success },
  incorrectOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.errorLight, padding: Spacing.base, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.error },
  optionLetter: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.surfaceVariant, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  optionLetterText: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  optionText: { flex: 1, fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  explanationCard: { backgroundColor: Colors.infoLight, borderRadius: BorderRadius.lg, marginTop: Spacing.lg },
  explanationTitle: { fontSize: 14, fontWeight: '700', color: Colors.info, marginBottom: Spacing.sm },
  explanationText: { fontSize: 14, color: Colors.textPrimary, lineHeight: 22 },
  bottomActions: { backgroundColor: Colors.white, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  actionButton: { borderRadius: BorderRadius.lg },
});
