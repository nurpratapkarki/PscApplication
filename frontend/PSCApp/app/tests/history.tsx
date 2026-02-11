import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { UserAttempt } from '../../types/test.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const AttemptCard = ({ attempt, onPress }: { attempt: UserAttempt; onPress: () => void }) => {
  const attemptedDate = new Date(attempt.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  // DRF serializes DecimalField as strings — parse to number
  const pct = Number(attempt.percentage ?? 0);
  const isPassed = pct >= 50;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.attemptCard}>
        <Card.Content style={styles.attemptContent}>
          <View style={[styles.statusIndicator, { backgroundColor: isPassed ? Colors.success : Colors.error }]} />
          <View style={styles.attemptInfo}>
            <Text style={styles.attemptTitle} numberOfLines={1}>{attempt.mock_test_title}</Text>
            <Text style={styles.attemptDate}>{attemptedDate}</Text>
            <View style={styles.attemptStats}>
              <Chip compact style={[styles.scoreChip, { backgroundColor: isPassed ? Colors.successLight : Colors.errorLight }]} textStyle={{ color: isPassed ? Colors.success : Colors.error }}>
                {pct.toFixed(0)}%
              </Chip>
              <Text style={styles.attemptScore}>{Number(attempt.score_obtained ?? 0)}/{Number(attempt.total_score ?? 0)} pts</Text>
            </View>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textTertiary} />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export default function TestHistoryScreen() {
  const router = useRouter();
  const { data: attempts, status } = usePaginatedApi<UserAttempt>('/api/attempts/');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Test History</Text>
        <View style={{ width: 44 }} />
      </View>

      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !attempts || attempts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="clipboard-text-clock" size={80} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Test History</Text>
          <Text style={styles.emptySubtitle}>You haven&apos;t attempted any tests yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.sectionLabel}>{attempts.length} Attempts</Text>
          {attempts.map((attempt) => (
            <AttemptCard key={attempt.id} attempt={attempt} onPress={() => router.push(`/tests/${attempt.id}/results`)} />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  sectionLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.md },
  attemptCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, elevation: 2 },
  attemptContent: { flexDirection: 'row', alignItems: 'center' },
  statusIndicator: { width: 4, height: 50, borderRadius: 2, marginRight: Spacing.md },
  attemptInfo: { flex: 1 },
  attemptTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  attemptDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  attemptStats: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs, gap: Spacing.sm },
  scoreChip: { height: 24 },
  attemptScore: { fontSize: 13, color: Colors.textSecondary },
});

