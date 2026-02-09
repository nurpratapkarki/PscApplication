import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, Avatar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

interface TopContributor {
  rank: number;
  user_name: string;
  profile_picture: string | null;
  questions_contributed: number;
  questions_approved: number;
  featured_count: number;
}

const ContributorCard = ({ contributor }: { contributor: TopContributor }) => {
  const isTopThree = contributor.rank <= 3;
  const badgeColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <Card style={[styles.contributorCard, isTopThree && styles.topThreeCard]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.rankBadge}>
          {isTopThree ? (
            <View style={[styles.topRankBadge, { backgroundColor: badgeColors[contributor.rank - 1] }]}>
              <MaterialCommunityIcons name="crown" size={16} color={Colors.white} />
            </View>
          ) : (
            <Text style={styles.rankNumber}>#{contributor.rank}</Text>
          )}
        </View>
        <Avatar.Image size={56} source={{ uri: contributor.profile_picture || `https://i.pravatar.cc/100?u=${contributor.user_name}` }} />
        <View style={styles.contributorInfo}>
          <Text style={styles.contributorName}>{contributor.user_name}</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="file-document-plus" size={14} color={Colors.primary} />
              <Text style={styles.statValue}>{contributor.questions_contributed}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={Colors.success} />
              <Text style={styles.statValue}>{contributor.questions_approved}</Text>
            </View>
            {contributor.featured_count > 0 && (
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="star" size={14} color={Colors.warning} />
                <Text style={styles.statValue}>{contributor.featured_count}</Text>
              </View>
            )}
          </View>
        </View>
        {isTopThree && (
          <Chip compact style={styles.topChip} textStyle={styles.topChipText}>Top {contributor.rank}</Chip>
        )}
      </Card.Content>
    </Card>
  );
};

export default function TopContributorsScreen() {
  const router = useRouter();
  const { data: contributors, status } = usePaginatedApi<TopContributor>('/api/top-contributors/');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Contributors</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Hero Section */}
      <Card style={styles.heroCard}>
        <Card.Content style={styles.heroContent}>
          <MaterialCommunityIcons name="account-group" size={40} color={Colors.primary} />
          <Text style={styles.heroTitle}>Community Heroes</Text>
          <Text style={styles.heroSubtitle}>Recognizing those who help build our question bank</Text>
        </Card.Content>
      </Card>

      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !contributors || contributors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-heart" size={80} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Contributors Yet</Text>
          <Text style={styles.emptySubtitle}>Be the first to contribute!</Text>
        </View>
      ) : (
        <FlatList data={contributors} keyExtractor={(item) => String(item.rank)} contentContainerStyle={styles.listContent} renderItem={({ item }) => <ContributorCard contributor={item} />} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  heroCard: { marginHorizontal: Spacing.base, backgroundColor: Colors.primaryLight + '30', borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  heroContent: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.sm },
  heroSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
  listContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  contributorCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, elevation: 2 },
  topThreeCard: { borderWidth: 2, borderColor: Colors.primaryLight },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: { width: 36, marginRight: Spacing.sm },
  topRankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankNumber: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  contributorInfo: { flex: 1, marginLeft: Spacing.md },
  contributorName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  statsRow: { flexDirection: 'row', marginTop: Spacing.xs, gap: Spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 13, color: Colors.textSecondary },
  topChip: { backgroundColor: Colors.primaryLight },
  topChipText: { fontSize: 11, color: Colors.primary },
});
