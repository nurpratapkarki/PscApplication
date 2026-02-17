import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { PlatformStatistics } from '../../types/contribution.types';
import { useColors } from '../../hooks/useColors';
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export default function CommunityStatsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: stats, status } = useApi<PlatformStatistics>('/api/platform-stats/');

  const StatCard = ({ icon, value, label, color, subtitle }: { icon: string; value: string | number; label: string; color: string; subtitle?: string }) => (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statContent}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={28} color={color} />
        </View>
        <Text style={styles.statValue}>{typeof value === 'number' ? formatNumber(value) : value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('community.platformStats')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Stats */}
        <Card style={styles.heroCard}>
          <Card.Content style={styles.heroContent}>
            <MaterialCommunityIcons name="chart-bar" size={40} color={colors.primary} />
            <Text style={styles.heroTitle}>{t('community.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('community.heroSubtitle')}</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{formatNumber(stats?.total_users || 0)}</Text>
                <Text style={styles.heroStatLabel}>{t('community.users')}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{formatNumber(stats?.total_questions || 0)}</Text>
                <Text style={styles.heroStatLabel}>{t('community.questions')}</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{formatNumber(stats?.total_mock_tests || 0)}</Text>
                <Text style={styles.heroStatLabel}>{t('community.tests')}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Content Stats */}
        <Text style={styles.sectionTitle}>{t('community.content')}</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="help-circle" value={stats?.total_questions || 0} label={t('community.totalQuestions')} color={colors.primary} />
          <StatCard icon="clipboard-list" value={stats?.total_mock_tests || 0} label={t('community.mockTests')} color={colors.secondary} />
          <StatCard icon="folder" value={stats?.total_categories || 0} label={t('community.categories')} color={colors.accent} />
          <StatCard icon="school" value={stats?.total_branches || 0} label={t('community.branches')} color={colors.warning} />
        </View>

        {/* Community Stats */}
        <Text style={styles.sectionTitle}>{t('community.community')}</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="account-group" value={stats?.total_users || 0} label={t('community.registeredUsers')} color={colors.primary} />
          <StatCard icon="account-check" value={stats?.active_users_today || 0} label={t('community.activeToday')} color={colors.success} />
          <StatCard icon="file-document-plus" value={stats?.questions_added_today || 0} label={t('community.addedToday')} color={colors.accent} />
          <StatCard icon="clipboard-check" value={stats?.tests_taken_today || 0} label={t('community.testsToday')} color={colors.secondary} />
        </View>

        {/* Growth Card */}
        <Card style={styles.growthCard}>
          <Card.Content>
            <View style={styles.growthHeader}>
              <MaterialCommunityIcons name="trending-up" size={24} color={colors.success} />
              <Text style={styles.growthTitle}>{t('community.platformGrowth')}</Text>
            </View>
            <View style={styles.growthItem}>
              <Text style={styles.growthLabel}>{t('community.questionBankCompletion')}</Text>
              <ProgressBar progress={0.72} color={colors.primary} style={styles.progressBar} />
              <Text style={styles.growthPercent}>72%</Text>
            </View>
            <View style={styles.growthItem}>
              <Text style={styles.growthLabel}>{t('community.userEngagement')}</Text>
              <ProgressBar progress={0.85} color={colors.success} style={styles.progressBar} />
              <Text style={styles.growthPercent}>85%</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  heroCard: { backgroundColor: colors.primaryLight + '30', borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  heroContent: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginTop: Spacing.sm },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary },
  heroStats: { flexDirection: 'row', marginTop: Spacing.lg, width: '100%', justifyContent: 'space-around' },
  heroStatItem: { alignItems: 'center' },
  heroStatValue: { fontSize: 28, fontWeight: '700', color: colors.primary },
  heroStatLabel: { fontSize: 12, color: colors.textSecondary },
  heroStatDivider: { width: 1, backgroundColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { width: '48%', backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg },
  statContent: { alignItems: 'center', paddingVertical: Spacing.md },
  statIconContainer: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  statValue: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },
  statSubtitle: { fontSize: 10, color: colors.textTertiary },
  growthCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl },
  growthHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  growthTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginLeft: Spacing.sm },
  growthItem: { marginBottom: Spacing.md },
  growthLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: Spacing.xs },
  progressBar: { height: 8, borderRadius: 4 },
  growthPercent: { fontSize: 12, color: colors.textSecondary, textAlign: 'right', marginTop: 4 },
});
