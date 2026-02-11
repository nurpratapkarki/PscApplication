import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Card, Avatar, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

type RankingType = 'answers' | 'contributions';

interface RankingEntry {
  rank: number;
  user_name: string;
  profile_picture: string | null;
  questions_answered: number;
  correct_answers: number;
  accuracy_percentage: number;
  questions_contributed: number;
  study_streak_days: number;
  mock_tests_completed: number;
}

interface RankingsResponse {
  type: RankingType;
  label: string;
  my_entry: RankingEntry | null;
  top_users: RankingEntry[];
}

export default function LeaderboardScreen() {
  const [rankingType, setRankingType] = useState<RankingType>('answers');
  const { data, status } = useApi<RankingsResponse>(`/api/rankings/?type=${rankingType}`);

  const getMedalColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return Colors.textTertiary;
  };

  const getInitials = (name: string) => name.substring(0, 2).toUpperCase();

  const getPrimaryValue = (entry: RankingEntry) =>
    rankingType === 'answers' ? entry.questions_answered : entry.questions_contributed;

  const getPrimaryLabel = () =>
    rankingType === 'answers' ? 'answered' : 'contributed';

  const TopThreeCard = ({ entry, position }: { entry: RankingEntry; position: number }) => (
    <View style={[styles.topCard, position === 1 && styles.topCardFirst]}>
      <View style={[styles.medalBadge, { backgroundColor: getMedalColor(entry.rank) }]}>
        <Text style={styles.medalText}>{entry.rank}</Text>
      </View>
      {entry.profile_picture ? (
        <Avatar.Image size={position === 1 ? 64 : 52} source={{ uri: entry.profile_picture }} />
      ) : (
        <Avatar.Text size={position === 1 ? 64 : 52} label={getInitials(entry.user_name)} style={{ backgroundColor: Colors.primary }} />
      )}
      <Text style={styles.topName} numberOfLines={1}>{entry.user_name}</Text>
      <Text style={styles.topScore}>{getPrimaryValue(entry).toLocaleString()}</Text>
      <Text style={styles.topStatText}>{getPrimaryLabel()}</Text>
      {rankingType === 'answers' && (
        <Text style={styles.topStatText}>{entry.accuracy_percentage}% acc</Text>
      )}
    </View>
  );

  const LeaderboardRow = ({ entry }: { entry: RankingEntry }) => (
    <Card style={styles.rowCard}>
      <Card.Content style={styles.rowContent}>
        <Text style={styles.rankText}>{entry.rank}</Text>
        {entry.profile_picture ? (
          <Avatar.Image size={40} source={{ uri: entry.profile_picture }} />
        ) : (
          <Avatar.Text size={40} label={getInitials(entry.user_name)} style={{ backgroundColor: Colors.secondary }} />
        )}
        <View style={styles.rowInfo}>
          <Text style={styles.rowName}>{entry.user_name}</Text>
          <Text style={styles.rowSubtext}>
            {rankingType === 'answers'
              ? `${entry.accuracy_percentage}% accuracy • ${entry.mock_tests_completed} tests`
              : `${entry.questions_answered} answered • ${entry.study_streak_days}d streak`}
          </Text>
        </View>
        <Text style={styles.rowScore}>{getPrimaryValue(entry).toLocaleString()}</Text>
      </Card.Content>
    </Card>
  );

  const topUsers = data?.top_users ?? [];
  const myEntry = data?.my_entry;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>लिडरबोर्ड</Text>
      </View>

      <View style={styles.segmentContainer}>
        <SegmentedButtons
          value={rankingType}
          onValueChange={(value) => setRankingType(value as RankingType)}
          buttons={[
            { value: 'answers', label: 'Most Answered', icon: 'help-circle' },
            { value: 'contributions', label: 'Top Contributors', icon: 'plus-circle' },
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
          {/* My Rank Card */}
          {myEntry && (
            <Card style={styles.myRankCard}>
              <Card.Content style={styles.myRankContent}>
                <View style={styles.myRankLeft}>
                  <Text style={styles.myRankLabel}>Your Rank</Text>
                  <Text style={styles.myRankValue}>#{myEntry.rank}</Text>
                </View>
                <View style={styles.myRankDivider} />
                <View style={styles.myRankStat}>
                  <Text style={styles.myRankStatValue}>{getPrimaryValue(myEntry)}</Text>
                  <Text style={styles.myRankStatLabel}>{getPrimaryLabel()}</Text>
                </View>
                <View style={styles.myRankStat}>
                  <Text style={styles.myRankStatValue}>{myEntry.accuracy_percentage}%</Text>
                  <Text style={styles.myRankStatLabel}>accuracy</Text>
                </View>
                <View style={styles.myRankStat}>
                  <Text style={styles.myRankStatValue}>{myEntry.study_streak_days}d</Text>
                  <Text style={styles.myRankStatLabel}>streak</Text>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Top 3 */}
          {topUsers.length >= 3 && (
            <View style={styles.topThreeContainer}>
              <TopThreeCard entry={topUsers[1]} position={2} />
              <TopThreeCard entry={topUsers[0]} position={1} />
              <TopThreeCard entry={topUsers[2]} position={3} />
            </View>
          )}

          {/* Rest of leaderboard */}
          <View style={styles.listContainer}>
            {topUsers.slice(3).map((entry) => (
              <LeaderboardRow key={entry.rank} entry={entry} />
            ))}
          </View>

          {topUsers.length === 0 && (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="trophy-outline" size={60} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No leaderboard data yet</Text>
              <Text style={styles.emptySubtext}>
                {rankingType === 'answers'
                  ? 'Start answering questions to appear here!'
                  : 'Contribute questions to climb the ranks!'}
              </Text>
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
  // My Rank Card
  myRankCard: { backgroundColor: Colors.primary, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 3 },
  myRankContent: { flexDirection: 'row', alignItems: 'center' },
  myRankLeft: { alignItems: 'center', paddingRight: Spacing.md },
  myRankLabel: { fontSize: 11, color: Colors.white + 'CC', fontWeight: '600' },
  myRankValue: { fontSize: 28, fontWeight: '700', color: Colors.white },
  myRankDivider: { width: 1, height: 40, backgroundColor: Colors.white + '40', marginRight: Spacing.md },
  myRankStat: { flex: 1, alignItems: 'center' },
  myRankStatValue: { fontSize: 16, fontWeight: '700', color: Colors.white },
  myRankStatLabel: { fontSize: 10, color: Colors.white + 'CC' },
  // Top 3
  topThreeContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: Spacing.xl, gap: Spacing.sm },
  topCard: { alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, width: 100, elevation: 2 },
  topCardFirst: { width: 120, paddingVertical: Spacing.lg, marginBottom: Spacing.md },
  medalBadge: { position: 'absolute', top: -10, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', zIndex: 1 },
  medalText: { color: Colors.white, fontWeight: '700', fontSize: 14 },
  topName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.sm, textAlign: 'center' },
  topScore: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  topStatText: { fontSize: 10, color: Colors.textSecondary },
  // List
  listContainer: { gap: Spacing.sm },
  rowCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md },
  rowContent: { flexDirection: 'row', alignItems: 'center' },
  rankText: { width: 30, fontSize: 16, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  rowInfo: { flex: 1, marginLeft: Spacing.md },
  rowName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowSubtext: { fontSize: 12, color: Colors.textSecondary },
  rowScore: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  // Empty
  emptyContainer: { alignItems: 'center', paddingTop: Spacing['3xl'] },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.base },
  emptySubtext: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
