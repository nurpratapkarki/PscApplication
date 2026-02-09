import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../../hooks/usePaginatedApi';
import { Question, AnswerOption } from '../../../types/question.types';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';

interface AnswerState {
  questionId: number;
  selectedAnswerId: number | null;
  isCorrect: boolean;
  correctAnswerId: number;
}

const QuestionScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId: string; count?: string }>();
  const categoryId = params.categoryId;
  const count = params.count || '10';

  const { data: questions, status, error, execute: fetchQuestions } = usePaginatedApi<Question>('/api/questions/', true);

  useEffect(() => {
    if (categoryId) {
      fetchQuestions(`?category=${categoryId}&page_size=${count}`);
    }
  }, [categoryId, count, fetchQuestions]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [answers, setAnswers] = useState<AnswerState[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);

  const currentQuestion = questions?.[currentIndex];
  const totalQuestions = questions?.length || 0;
  const progress = totalQuestions > 0 ? (currentIndex + 1) / totalQuestions : 0;

  useEffect(() => {
    if (status !== 'success' || showExplanation) return;
    if (timeLeft === 0) { handleSubmitAnswer(); return; }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, status, showExplanation]);

  const handleSelectAnswer = (answerId: number) => {
    if (!showExplanation) setSelectedAnswer(answerId);
  };

  const handleSubmitAnswer = useCallback(() => {
    if (!currentQuestion || !currentQuestion.answers) return;
    const correctAnswer = currentQuestion.answers.find((a) => a.is_correct);
    const isCorrect = selectedAnswer === correctAnswer?.id;
    setAnswers((prev) => [...prev, { questionId: currentQuestion.id, selectedAnswerId: selectedAnswer, isCorrect, correctAnswerId: correctAnswer?.id || 0 }]);
    setShowExplanation(true);
  }, [currentQuestion, selectedAnswer]);

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setTimeLeft(30);
    } else {
      const finalScore = answers.filter((a) => a.isCorrect).length;
      router.replace({ pathname: '/practice/results', params: { score: String(finalScore), total: String(totalQuestions) } });
    }
  };

  const handleEndPractice = () => {
    Alert.alert('End Practice', 'Are you sure you want to end?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'End', style: 'destructive', onPress: () => {
          const finalScore = answers.filter((a) => a.isCorrect).length;
          router.replace({ pathname: '/practice/results', params: { score: String(finalScore), total: String(currentIndex + 1) } });
        }},
    ]);
  };

  const getAnswerStyle = (answer: AnswerOption) => {
    if (!showExplanation) return selectedAnswer === answer.id ? styles.selectedOption : styles.option;
    if (answer.is_correct) return styles.correctOption;
    if (selectedAnswer === answer.id && !answer.is_correct) return styles.incorrectOption;
    return styles.option;
  };

  if (status === 'loading' || !currentQuestion) {
    return (<SafeAreaView style={styles.loaderContainer}><ActivityIndicator size="large" color={Colors.primary} /><Text style={styles.loadingText}>Loading questions...</Text></SafeAreaView>);
  }

  if (status === 'error') {
    return (<SafeAreaView style={styles.errorContainer}><MaterialCommunityIcons name="alert-circle" size={60} color={Colors.error} /><Text style={styles.errorText}>Failed to load questions</Text><Button mode="contained" onPress={() => router.back()}>Go Back</Button></SafeAreaView>);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Practice', headerRight: () => (<Button mode="text" textColor={Colors.error} onPress={handleEndPractice}>End</Button>) }} />
      <View style={styles.header}>
        <View style={styles.progressInfo}>
          <Text style={styles.questionCount}>Question {currentIndex + 1}/{totalQuestions}</Text>
          <View style={styles.timerContainer}>
            <MaterialCommunityIcons name="clock-outline" size={18} color={timeLeft <= 10 ? Colors.error : Colors.textSecondary} />
            <Text style={[styles.timerText, timeLeft <= 10 && styles.timerWarning]}>{timeLeft}s</Text>
          </View>
        </View>
        <ProgressBar progress={progress} color={Colors.primary} style={styles.progressBar} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card style={styles.questionCard}><Card.Content>
          <View style={styles.difficultyBadge}><Text style={styles.difficultyText}>{currentQuestion.difficulty_level}</Text></View>
          <Text style={styles.questionText}>{currentQuestion.question_text_en}</Text>
          {currentQuestion.question_text_np && <Text style={styles.questionTextNp}>{currentQuestion.question_text_np}</Text>}
        </Card.Content></Card>
        <View style={styles.optionsContainer}>
          {currentQuestion.answers?.map((answer, idx) => (
            <TouchableOpacity key={answer.id} onPress={() => handleSelectAnswer(answer.id)} disabled={showExplanation} activeOpacity={0.7}>
              <View style={getAnswerStyle(answer)}>
                <View style={styles.optionLetter}><Text style={styles.optionLetterText}>{String.fromCharCode(65 + idx)}</Text></View>
                <Text style={styles.optionText}>{answer.answer_text_en}</Text>
                {showExplanation && answer.is_correct && <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />}
                {showExplanation && selectedAnswer === answer.id && !answer.is_correct && <MaterialCommunityIcons name="close-circle" size={24} color={Colors.error} />}
              </View>
            </TouchableOpacity>
          ))}
        </View>
        {showExplanation && currentQuestion.explanation_en && (
          <Card style={styles.explanationCard}><Card.Content>
            <Text style={styles.explanationTitle}>Explanation</Text>
            <Text style={styles.explanationText}>{currentQuestion.explanation_en}</Text>
          </Card.Content></Card>
        )}
      </ScrollView>
      <View style={styles.bottomActions}>
        {!showExplanation ? (
          <Button mode="contained" onPress={handleSubmitAnswer} disabled={selectedAnswer === null} style={styles.actionButton}>Submit Answer</Button>
        ) : (
          <Button mode="contained" onPress={handleNext} style={styles.actionButton}>{currentIndex === totalQuestions - 1 ? 'See Results' : 'Next Question'}</Button>
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
  scrollContent: { padding: Spacing.base, paddingBottom: 120 },
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
  bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  actionButton: { borderRadius: BorderRadius.lg },
});

