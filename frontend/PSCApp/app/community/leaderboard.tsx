import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, SegmentedButtons, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { LeaderboardEntry, LeaderboardTimePeriod } from '../../types/contribution.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const getRankColor = (rank: number) => {
  if (rank === 1) return '#FFD700';
  if (rank === 2) return '#C0C0C0';
  if (rank === 3) return '#CD7F32';
  return Colors.textSecondary;
};

const getRankIcon = (rank: number) => {
  if (rank <= 3) return 'crown';
  return null;
};

const LeaderboardItem = ({ entry, isCurrentUser }: { entry: LeaderboardEntry; isCurrentUser?: boolean }) => {
  const rankChange = entry.previous_rank ? entry.previous_rank - entry.rank : 0;

  return (
    <View style={[styles.leaderboardItem, isCurrentUser && styles.currentUserItem]}>
      <View style={[styles.rankContainer, { backgroundColor: getRankColor(entry.rank) + '20' }]}>
        {entry.rank <= 3 ? (
          <MaterialCommunityIcons name="crown" size={20} color={getRankColor(entry.rank)} />
        ) : (
          <Text style={[styles.rankText, { color: getRankColor(entry.rank) }]}>{entry.rank}</Text>
        )}
      </View>
      <Avatar.Image size={44} source={{ uri: entry.profile_picture || `https://i.pravatar.cc/100?u=${entry.user_name}` }} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{entry.user_name}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>{entry.total_score} pts</Text>
          <Text style={styles.statDot}>•</Text>
          <Text style={styles.statText}>{entry.accuracy_percentage}% acc</Text>
        </View>
      </View>
      {rankChange !== 0 && (
        <View style={styles.rankChange}>
          <MaterialCommunityIcons name={rankChange > 0 ? 'arrow-up' : 'arrow-down'} size={14} color={rankChange > 0 ? Colors.success : Colors.error} />
          <Text style={[styles.rankChangeText, { color: rankChange > 0 ? Colors.success : Colors.error }]}>{Math.abs(rankChange)}</Text>
        </View>
      )}
    </View>
  );
};

export default function LeaderboardScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<LeaderboardTimePeriod>('WEEKLY');
  const { data: entries, status } = usePaginatedApi<LeaderboardEntry>(`/api/leaderboard/?time_period=${period}`);

  const topThree = entries?.slice(0, 3) || [];
  const rest = entries?.slice(3) || [];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodContainer}>
        <SegmentedButtons value={period} onValueChange={(v) => setPeriod(v as LeaderboardTimePeriod)} buttons={[{ value: 'WEEKLY', label: 'Weekly' }, { value: 'MONTHLY', label: 'Monthly' }, { value: 'ALL_TIME', label: 'All Time' }]} style={styles.segmentedButtons} />
      </View>

      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Top 3 Podium */}
          {topThree.length >= 3 && (
            <View style={styles.podium}>
              {/* 2nd Place */}
              <View style={styles.podiumItem}>
                <Avatar.Image size={60} source={{ uri: topThree[1]?.profile_picture || `https://i.pravatar.cc/100?u=${topThree[1]?.user_name}` }} />
                <View style={[styles.podiumBadge, { backgroundColor: '#C0C0C0' }]}>
                  <Text style={styles.podiumRank}>2</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{topThree[1]?.user_name}</Text>
                <Text style={styles.podiumScore}>{topThree[1]?.total_score} pts</Text>
              </View>
              {/* 1st Place */}
              <View style={[styles.podiumItem, styles.podiumFirst]}>
                <MaterialCommunityIcons name="crown" size={28} color="#FFD700" style={styles.crownIcon} />
                <Avatar.Image size={80} source={{ uri: topThree[0]?.profile_picture || `https://i.pravatar.cc/100?u=${topThree[0]?.user_name}` }} />
                <View style={[styles.podiumBadge, { backgroundColor: '#FFD700' }]}>
                  <Text style={styles.podiumRank}>1</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{topThree[0]?.user_name}</Text>
                <Text style={styles.podiumScore}>{topThree[0]?.total_score} pts</Text>
              </View>
              {/* 3rd Place */}
              <View style={styles.podiumItem}>
                <Avatar.Image size={60} source={{ uri: topThree[2]?.profile_picture || `https://i.pravatar.cc/100?u=${topThree[2]?.user_name}` }} />
                <View style={[styles.podiumBadge, { backgroundColor: '#CD7F32' }]}>
                  <Text style={styles.podiumRank}>3</Text>
                </View>
                <Text style={styles.podiumName} numberOfLines={1}>{topThree[2]?.user_name}</Text>
                <Text style={styles.podiumScore}>{topThree[2]?.total_score} pts</Text>
              </View>
            </View>
          )}

          {/* Rest of Leaderboard */}
          <Card style={styles.listCard}>
            {rest.map((entry) => (
              <LeaderboardItem key={entry.rank} entry={entry} />
            ))}
            {rest.length === 0 && topThree.length === 0 && (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="trophy-outline" size={60} color={Colors.textTertiary} />
                <Text style={styles.emptyText}>No leaderboard data yet</Text>
              </View>
            )}
          </Card>
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
  periodContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  segmentedButtons: { backgroundColor: Colors.white },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  podium: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', marginBottom: Spacing.xl, paddingTop: Spacing.xl },
  podiumItem: { alignItems: 'center', width: 100 },
  podiumFirst: { marginBottom: 20 },
  crownIcon: { marginBottom: -10 },
  podiumBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: -12 },
  podiumRank: { fontSize: 12, fontWeight: '700', color: Colors.white },
  podiumName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.xs },
  podiumScore: { fontSize: 11, color: Colors.textSecondary },
  listCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  leaderboardItem: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  currentUserItem: { backgroundColor: Colors.primaryLight + '20' },
  rankContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  rankText: { fontSize: 14, fontWeight: '700' },
  userInfo: { flex: 1, marginLeft: Spacing.md },
  userName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 12, color: Colors.textSecondary },
  statDot: { marginHorizontal: 4, color: Colors.textTertiary },
  rankChange: { flexDirection: 'row', alignItems: 'center' },
  rankChangeText: { fontSize: 12, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', padding: Spacing.xl },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.md },
});
