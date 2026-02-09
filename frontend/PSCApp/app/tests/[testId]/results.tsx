import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../../hooks/useApi';
import { UserAttempt, MockTestSummary } from '../../../types/test.types';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';

const TestResultsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ testId: string | string[] }>();

  const attemptId = useMemo(() => {
    if (Array.isArray(params.testId)) return params.testId[0];
    return params.testId;
  }, [params.testId]);

  const { data: attempt, status, error } = useApi<UserAttempt>(attemptId ? `/api/attempts/${attemptId}/` : '', !attemptId);

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
        <Button mode="outlined" onPress={() => router.back()}>Go Back</Button>
      </SafeAreaView>
    );
  }

  const mockTestObj = typeof attempt.mock_test === 'object' ? (attempt.mock_test as MockTestSummary) : null;
  const passPercentage = mockTestObj?.pass_percentage ?? 50;
  const isPassed = (attempt.percentage || 0) >= passPercentage;
  const userAnswers = attempt.user_answers || [];
  const correctCount = userAnswers.filter((a) => a.is_correct).length;
  const incorrectCount = userAnswers.filter((a) => !a.is_correct && a.selected_answer_text).length;
  const skippedCount = userAnswers.filter((a) => !a.selected_answer_text).length;

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
          <Text style={styles.resultSubtitle}>{isPassed ? 'You passed the test' : 'You did not pass this time'}</Text>
        </View>

        {/* Score Card */}
        <Card style={styles.scoreCard}>
          <Card.Content>
            <View style={styles.scoreCircle}>
              <Text style={styles.scoreValue}>{attempt.percentage?.toFixed(0)}%</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <ProgressBar progress={(attempt.percentage || 0) / 100} color={isPassed ? Colors.success : Colors.error} style={styles.progressBar} />
            <View style={styles.scoreDetails}>
              <View style={styles.scoreDetailItem}>
                <Text style={styles.scoreDetailValue}>{attempt.score_obtained}</Text>
                <Text style={styles.scoreDetailLabel}>Obtained</Text>
              </View>
              <View style={styles.scoreDetailDivider} />
              <View style={styles.scoreDetailItem}>
                <Text style={styles.scoreDetailValue}>{attempt.total_score}</Text>
                <Text style={styles.scoreDetailLabel}>Total</Text>
              </View>
              <View style={styles.scoreDetailDivider} />
              <View style={styles.scoreDetailItem}>
                <Text style={styles.scoreDetailValue}>{Math.floor((attempt.total_time_taken || 0) / 60)}m</Text>
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

        {/* Answer Review */}
        <Card style={styles.reviewCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Answer Review</Text>
            {userAnswers.map((answer, index) => (
              <View key={answer.id} style={styles.answerRow}>
                <View style={[styles.answerIcon, { backgroundColor: answer.is_correct ? Colors.successLight : Colors.errorLight }]}>
                  <MaterialCommunityIcons name={answer.is_correct ? 'check' : 'close'} size={16} color={answer.is_correct ? Colors.success : Colors.error} />
                </View>
                <View style={styles.answerInfo}>
                  <Text style={styles.answerQuestion}>Question {index + 1}</Text>
                  <Text style={styles.answerText} numberOfLines={1}>
                    {answer.selected_answer_text || 'Skipped'}
                  </Text>
                  {!answer.is_correct && answer.correct_answer_text && (
                    <Text style={styles.correctAnswer}>Correct: {answer.correct_answer_text}</Text>
                  )}
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <Button mode="outlined" icon="clipboard-list" style={styles.actionButton} onPress={() => router.replace('/(tabs)/tests')}>
          All Tests
        </Button>
        <Button mode="contained" icon="home" style={styles.actionButton} onPress={() => router.replace('/(tabs)/')}>
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
  reviewCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  answerRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  answerIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  answerInfo: { flex: 1 },
  answerQuestion: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  answerText: { fontSize: 13, color: Colors.textSecondary },
  correctAnswer: { fontSize: 12, color: Colors.success, marginTop: 2 },
  bottomActions: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', backgroundColor: Colors.white, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border, gap: Spacing.md },
  actionButton: { flex: 1, borderRadius: BorderRadius.lg },
});

export default TestResultsScreen;