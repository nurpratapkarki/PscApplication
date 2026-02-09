import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

// API response structure from backend
interface LeaderboardApiEntry {
  rank: number;
  previous_rank: number | null;
  user_name: string | null;
  profile_picture: string | null;
  total_score: string;
  tests_completed: number;
  accuracy_percentage: string;
  time_period: string;
  branch: number;
  sub_branch: number | null;
}

// Transformed structure for UI display
interface LeaderboardEntry {
  rank: number;
  userName: string;
  profilePicture: string | null;
  score: number;
  testsCompleted: number;
  accuracy: number;
}

// Transform API response to UI format
function transformLeaderboardData(apiData: LeaderboardApiEntry[] | null): LeaderboardEntry[] {
  if (!apiData || !Array.isArray(apiData)) return [];

  return apiData
    .map((entry, index) => ({
      rank: entry.rank || index + 1,
      userName: entry.user_name || `User ${index + 1}`,
      profilePicture: entry.profile_picture,
      score: parseFloat(entry.total_score) || 0,
      testsCompleted: entry.tests_completed || 0,
      accuracy: parseFloat(entry.accuracy_percentage) || 0,
    }))
    .sort((a, b) => b.score - a.score) // Sort by score descending
    .map((entry, index) => ({ ...entry, rank: index + 1 })); // Reassign ranks
}

export default function LeaderboardScreen() {
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'all_time'>('weekly');
  const { data: rawLeaderboard, status } = useApi<LeaderboardApiEntry[]>(`/api/leaderboard/?period=${period}`);

  // Transform the raw API data to UI format
  const leaderboard = useMemo(() => transformLeaderboardData(rawLeaderboard), [rawLeaderboard]);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return Colors.textTertiary;
  };

  const TopThreeCard = ({ entry, position }: { entry: LeaderboardEntry; position: number }) => (
    <View style={[styles.topCard, position === 1 && styles.topCardFirst]}>
      <View style={[styles.medalBadge, { backgroundColor: getMedalColor(entry.rank) }]}>
        <Text style={styles.medalText}>{entry.rank}</Text>
      </View>
      <Avatar.Text size={position === 1 ? 64 : 52} label={entry.userName.substring(0, 2).toUpperCase()} style={{ backgroundColor: Colors.primary }} />
      <Text style={styles.topName} numberOfLines={1}>{entry.userName}</Text>
      <Text style={styles.topScore}>{entry.score.toLocaleString()} pts</Text>
      <View style={styles.topStats}>
        <Text style={styles.topStatText}>{entry.accuracy.toFixed(0)}% accuracy</Text>
      </View>
    </View>
  );

  const LeaderboardRow = ({ entry }: { entry: LeaderboardEntry }) => (
    <Card style={styles.rowCard}>
      <Card.Content style={styles.rowContent}>
        <Text style={styles.rankText}>{entry.rank}</Text>
        <Avatar.Text size={40} label={entry.userName.substring(0, 2).toUpperCase()} style={{ backgroundColor: Colors.secondary }} />
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{entry.userName}</Text>
          <Text style={styles.rowSubtext}>{entry.testsCompleted} tests • {entry.accuracy.toFixed(0)}%</Text>
        </View>
        <Text style={styles.rowScore}>{entry.score.toLocaleString()}</Text>
      </Card.Content>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>लिडरबोर्ड</Text>
      </View>

      <View style={styles.segmentContainer}>
        <SegmentedButtons
          value={period}
          onValueChange={(value) => setPeriod(value as any)}
          buttons={[
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'all_time', label: 'All Time' },
          ]}
          style={styles.segmentedButtons}
        />
      </View>

      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top 3 */}
          {leaderboard && leaderboard.length >= 3 && (
            <View style={styles.topThreeContainer}>
              <TopThreeCard entry={leaderboard[1]} position={2} />
              <TopThreeCard entry={leaderboard[0]} position={1} />
              <TopThreeCard entry={leaderboard[2]} position={3} />
            </View>
          )}

          {/* Rest of leaderboard */}
          <View style={styles.listContainer}>
            {leaderboard?.slice(3).map((entry, index) => (
              <LeaderboardRow key={`${entry.rank}-${index}`} entry={entry} />
            ))}
          </View>

          {(!leaderboard || leaderboard.length === 0) && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="trophy-outline" size={60} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No leaderboard data yet</Text>
              <Text style={styles.emptySubtext}>Start practicing to appear on the leaderboard!</Text>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.primary },
  segmentContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  segmentedButtons: { backgroundColor: Colors.white },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingHorizontal: Spacing.base, paddingBottom: Spacing['3xl'] },
  topThreeContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: Spacing.xl, gap: Spacing.sm },
  topCard: { alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, width: 100, elevation: 2 },
  topCardFirst: { width: 120, paddingVertical: Spacing.lg, marginBottom: Spacing.md },
  medalBadge: { position: 'absolute', top: -10, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  medalText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  topName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.sm, textAlign: 'center' },
  topScore: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  topStats: { marginTop: Spacing.xs },
  topStatText: { fontSize: 10, color: Colors.textSecondary },
  listContainer: { gap: Spacing.sm },
  rowCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md },
  rowContent: { flexDirection: 'row', alignItems: 'center' },
  rankText: { width: 30, fontSize: 16, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  rowInfo: { flex: 1, marginLeft: Spacing.md },
  rowName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowSubtext: { fontSize: 12, color: Colors.textSecondary },
  rowScore: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing['3xl'] },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.base },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});

