import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, Avatar, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { useColors } from '../../hooks/useColors';
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

interface TopContributor {
  rank: number;
  user_name: string;
  profile_picture: string | null;
  questions_contributed: number;
  questions_approved: number;
  featured_count: number;
}

const ContributorCard = ({ contributor, colors, t, styles }: { contributor: TopContributor; colors: ColorScheme; t: (key: string, options?: any) => string; styles: ReturnType<typeof createStyles> }) => {
  const isTopThree = contributor.rank <= 3;
  const badgeColors = ['#FFD700', '#C0C0C0', '#CD7F32'];

  return (
    <Card style={[styles.contributorCard, isTopThree && styles.topThreeCard]}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.rankBadge}>
          {isTopThree ? (
            <View style={[styles.topRankBadge, { backgroundColor: badgeColors[contributor.rank - 1] }]}>
              <MaterialCommunityIcons name="crown" size={16} color={colors.white} />
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
              <MaterialCommunityIcons name="file-document-plus" size={14} color={colors.primary} />
              <Text style={styles.statValue}>{contributor.questions_contributed}</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="check-decagram" size={14} color={colors.success} />
              <Text style={styles.statValue}>{contributor.questions_approved}</Text>
            </View>
            {contributor.featured_count > 0 && (
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="star" size={14} color={colors.warning} />
                <Text style={styles.statValue}>{contributor.featured_count}</Text>
              </View>
            )}
          </View>
        </View>
        {isTopThree && (
          <Chip compact style={styles.topChip} textStyle={styles.topChipText}>{t('community.topRank', { rank: contributor.rank })}</Chip>
        )}
      </Card.Content>
    </Card>
  );
};

export default function TopContributorsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: contributors, status } = usePaginatedApi<TopContributor>('/api/top-contributors/');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('community.topContributors')}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Hero Section */}
      <Card style={styles.heroCard}>
        <Card.Content style={styles.heroContent}>
          <MaterialCommunityIcons name="account-group" size={40} color={colors.primary} />
          <Text style={styles.heroTitle}>{t('community.heroesTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('community.heroesSubtitle')}</Text>
        </Card.Content>
      </Card>

      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !contributors || contributors.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="account-heart" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('community.noContributors')}</Text>
          <Text style={styles.emptySubtitle}>{t('community.beFirstContributor')}</Text>
        </View>
      ) : (
        <FlatList data={contributors} keyExtractor={(item) => String(item.rank)} contentContainerStyle={styles.listContent} renderItem={({ item }) => <ContributorCard contributor={item} colors={colors} t={t} styles={styles} />} />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  heroCard: { marginHorizontal: Spacing.base, backgroundColor: colors.primaryLight + '30', borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  heroContent: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: Spacing.sm },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary },
  listContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  contributorCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, elevation: 2 },
  topThreeCard: { borderWidth: 2, borderColor: colors.primaryLight },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  rankBadge: { width: 36, marginRight: Spacing.sm },
  topRankBadge: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rankNumber: { fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  contributorInfo: { flex: 1, marginLeft: Spacing.md },
  contributorName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  statsRow: { flexDirection: 'row', marginTop: Spacing.xs, gap: Spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 13, color: colors.textSecondary },
  topChip: { backgroundColor: colors.primaryLight },
  topChipText: { fontSize: 11, color: colors.primary },
});
