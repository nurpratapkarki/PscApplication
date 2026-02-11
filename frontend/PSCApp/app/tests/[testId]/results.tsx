import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../../hooks/useApi';
import { UserAttempt, MockTestSummary } from '../../../types/test.types';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';

// Expandable Answer Item Component
const AnswerReviewItem = ({ answer, index }: { answer: any; index: number }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => setExpanded(!expanded)}
      style={styles.answerReviewItem}
    >
      <View style={styles.answerReviewHeader}>
        <View style={[
          styles.answerStatusIcon,
          { backgroundColor: answer.is_correct ? Colors.successLight : Colors.errorLight }
        ]}>
          <MaterialCommunityIcons
            name={answer.is_correct ? 'check' : 'close'}
            size={18}
            color={answer.is_correct ? Colors.success : Colors.error}
          />
        </View>
        
        <View style={styles.answerReviewContent}>
          <Text style={styles.questionNumber}>Question {index + 1}</Text>
          <Text style={styles.questionPreview} numberOfLines={expanded ? undefined : 2}>
            {answer.question_text || 'Question text unavailable'}
          </Text>
        </View>

        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={Colors.textSecondary}
        />
      </View>

      {expanded && (
        <View style={styles.answerReviewExpanded}>
          {/* Your Answer */}
          <View style={styles.answerSection}>
            <Text style={styles.answerSectionLabel}>Your Answer:</Text>
            <View style={[
              styles.answerBox,
              answer.selected_answer_text
                ? (answer.is_correct ? styles.answerBoxCorrect : styles.answerBoxIncorrect)
                : styles.answerBoxSkipped
            ]}>
              <Text style={[
                styles.answerBoxText,
                { color: answer.selected_answer_text 
                  ? (answer.is_correct ? Colors.success : Colors.error)
                  : Colors.textSecondary 
                }
              ]}>
                {answer.selected_answer_text || 'No answer selected (Skipped)'}
              </Text>
            </View>
          </View>

          {/* Correct Answer (if incorrect) */}
          {!answer.is_correct && answer.correct_answer_text && (
            <View style={styles.answerSection}>
              <Text style={styles.answerSectionLabel}>Correct Answer:</Text>
              <View style={[styles.answerBox, styles.answerBoxCorrect]}>
                <MaterialCommunityIcons
                  name="check-circle"
                  size={16}
                  color={Colors.success}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.answerBoxText, { color: Colors.success }]}>
                  {answer.correct_answer_text}
                </Text>
              </View>
            </View>
          )}

          {/* Explanation (if available) */}
          {answer.explanation && (
            <View style={styles.explanationSection}>
              <View style={styles.explanationHeader}>
                <MaterialCommunityIcons name="lightbulb-outline" size={16} color={Colors.info} />
                <Text style={styles.explanationLabel}>Explanation</Text>
              </View>
              <Text style={styles.explanationText}>{answer.explanation}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const TestResultsScreen = () => {
  const router = useRouter();
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
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading results...</Text>
      </SafeAreaView>
    );
  }

  if (status === 'error' || !attempt) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={60} color={Colors.error} />
        <Text style={styles.errorText}>{error || 'Failed to load results'}</Text>
        <Button mode="outlined" onPress={() => router.back()}>
          Go Back
        </Button>
      </SafeAreaView>
    );
  }

  const mockTestObj = typeof attempt.mock_test === 'object' ? (attempt.mock_test as MockTestSummary) : null;
  const passPercentage = mockTestObj?.pass_percentage ?? 50;
  const pct = Number(attempt.percentage ?? 0);
  const scoreObtained = Number(attempt.score_obtained ?? 0);
  const totalScore = Number(attempt.total_score ?? 0);
  const isPassed = pct >= passPercentage;
  const userAnswers = attempt.user_answers || [];
  const correctCount = userAnswers.filter((a) => a.is_correct).length;
  const skippedCount = userAnswers.filter((a) => a.is_skipped || !a.selected_answer).length;
  const incorrectCount = userAnswers.length - correctCount - skippedCount;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Result Header */}
        <View style={[styles.resultHeader, { backgroundColor: isPassed ? Colors.successLight : Colors.errorLight }]}>
          <View style={[styles.resultIconContainer, { backgroundColor: isPassed ? Colors.success : Colors.error }]}>
            <MaterialCommunityIcons name={isPassed ? 'trophy' : 'emoticon-sad'} size={48} color={Colors.white} />
          </View>
          <Text style={[styles.resultStatus, { color: isPassed ? Colors.success : Colors.error }]}>
            {isPassed ? 'Congratulations!' : 'Keep Practicing!'}
          </Text>
          <Text style={styles.resultSubtitle}>
            {isPassed ? 'You passed the test' : 'You did not pass this time'}
          </Text>
        </View>

        {/* Score Card */}
        <Card style={styles.scoreCard}>
          <Card.Content>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{Math.round(pct)}%</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <ProgressBar
              progress={pct / 100}
              color={isPassed ? Colors.success : Colors.error}
              style={styles.progressBar}
            />
            <View style={styles.scoreDetails}>
              <View style={styles.scoreDetailItem}>
                <Text style={styles.scoreDetailValue}>{scoreObtained}</Text>
                <Text style={styles.scoreDetailLabel}>Obtained</Text>
              </View>
              <View style={styles.scoreDetailDivider} />
              <View style={styles.scoreDetailItem}>
                <Text style={styles.scoreDetailValue}>{totalScore}</Text>
                <Text style={styles.scoreDetailLabel}>Total</Text>
              </View>
              <View style={styles.scoreDetailDivider} />
              <View style={styles.scoreDetailItem}>
                <Text style={styles.scoreDetailValue}>
                  {Math.floor((attempt.total_time_taken || 0) / 60)}m
                </Text>
                <Text style={styles.scoreDetailLabel}>Time</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: Colors.successLight }]}>
            <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
            <Text style={[styles.statValue, { color: Colors.success }]}>{correctCount}</Text>
            <Text style={styles.statLabel}>Correct</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.errorLight }]}>
            <MaterialCommunityIcons name="close-circle" size={24} color={Colors.error} />
            <Text style={[styles.statValue, { color: Colors.error }]}>{incorrectCount}</Text>
            <Text style={styles.statLabel}>Incorrect</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: Colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="minus-circle" size={24} color={Colors.textSecondary} />
            <Text style={[styles.statValue, { color: Colors.textSecondary }]}>{skippedCount}</Text>
            <Text style={styles.statLabel}>Skipped</Text>
          </View>
        </View>

        {/* Answer Review - Enhanced */}
        <Card style={styles.reviewCard}>
          <Card.Content>
            <View style={styles.reviewHeader}>
              <Text style={styles.sectionTitle}>Answer Review</Text>
              <Text style={styles.reviewSubtitle}>Tap any question to see details</Text>
            </View>
            
            <View style={styles.answerReviewList}>
              {userAnswers.map((answer, index) => (
                <AnswerReviewItem key={answer.id || index} answer={answer} index={index} />
              ))}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button
          mode="outlined"
          icon="clipboard-list"
          style={styles.actionButton}
          onPress={() => router.replace('/(tabs)/tests')}
        >
          All Tests
        </Button>
        <Button
          mode="contained"
          icon="home"
          style={styles.actionButton}
          onPress={() => router.replace('/(tabs)/')}
        >
          Home
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: Spacing.md, fontSize: 16, color: Colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  errorText: { fontSize: 16, color: Colors.textSecondary, marginVertical: Spacing.lg, textAlign: 'center' },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  resultHeader: { borderRadius: BorderRadius.xl, padding: Spacing.xl, alignItems: 'center', marginBottom: Spacing.lg },
  resultIconContainer: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  resultStatus: { fontSize: 24, fontWeight: '700' },
  resultSubtitle: { fontSize: 14, color: Colors.textSecondary },
  scoreCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 3 },
  scoreCircle: { alignItems: 'center', marginBottom: Spacing.md },
  scoreValue: { fontSize: 48, fontWeight: '700', color: Colors.textPrimary },
  scoreLabel: { fontSize: 14, color: Colors.textSecondary },
  progressBar: { height: 8, borderRadius: 4, marginBottom: Spacing.lg },
  scoreDetails: { flexDirection: 'row', justifyContent: 'space-around' },
  scoreDetailItem: { alignItems: 'center' },
  scoreDetailValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scoreDetailLabel: { fontSize: 12, color: Colors.textSecondary },
  scoreDetailDivider: { width: 1, backgroundColor: Colors.border },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { flex: 1, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', marginTop: Spacing.xs },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  reviewCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.md },
  reviewHeader: { marginBottom: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  reviewSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  answerReviewList: { gap: Spacing.sm },
  
  // Answer Review Item Styles
  answerReviewItem: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
  answerReviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  answerStatusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  answerReviewContent: {
    flex: 1,
  },
  questionNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 2,
  },
  questionPreview: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  answerReviewExpanded: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  answerSection: {
    gap: Spacing.xs,
  },
  answerSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  answerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
  },
  answerBoxCorrect: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
  },
  answerBoxIncorrect: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  answerBoxSkipped: {
    backgroundColor: Colors.surfaceVariant,
    borderColor: Colors.border,
  },
  answerBoxText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  explanationSection: {
    backgroundColor: Colors.infoLight,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: Spacing.xs,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  explanationLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.info,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  explanationText: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  actionButton: { flex: 1, borderRadius: BorderRadius.lg },
});

export default TestResultsScreen;