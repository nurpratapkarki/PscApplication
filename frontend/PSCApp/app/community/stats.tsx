import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { PlatformStatistics } from '../../types/contribution.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

export default function CommunityStatsScreen() {
  const router = useRouter();
  const { data: stats, status } = useApi<PlatformStatistics>('/api/platform-statistics/');

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
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Platform Stats</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Stats */}
        <Card style={styles.heroCard}>
          <Card.Content style={styles.heroContent}>
            <MaterialCommunityIcons name="chart-bar" size={40} color={Colors.primary} />
            <Text style={styles.heroTitle}>PSC Prep Nepal</Text>
            <Text style={styles.heroSubtitle}>Growing together, learning together</Text>
            <View style={styles.heroStats}>
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{formatNumber(stats?.total_users || 0)}</Text>
                <Text style={styles.heroStatLabel}>Users</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{formatNumber(stats?.total_questions || 0)}</Text>
                <Text style={styles.heroStatLabel}>Questions</Text>
              </View>
              <View style={styles.heroStatDivider} />
              <View style={styles.heroStatItem}>
                <Text style={styles.heroStatValue}>{formatNumber(stats?.total_mock_tests || 0)}</Text>
                <Text style={styles.heroStatLabel}>Tests</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Content Stats */}
        <Text style={styles.sectionTitle}>Content</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="help-circle" value={stats?.total_questions || 0} label="Total Questions" color={Colors.primary} />
          <StatCard icon="clipboard-list" value={stats?.total_mock_tests || 0} label="Mock Tests" color={Colors.secondary} />
          <StatCard icon="folder" value={stats?.total_categories || 0} label="Categories" color={Colors.accent} />
          <StatCard icon="school" value={stats?.total_branches || 0} label="Branches" color={Colors.warning} />
        </View>

        {/* Community Stats */}
        <Text style={styles.sectionTitle}>Community</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="account-group" value={stats?.total_users || 0} label="Registered Users" color={Colors.primary} />
          <StatCard icon="account-check" value={stats?.active_users_today || 0} label="Active Today" color={Colors.success} />
          <StatCard icon="file-document-plus" value={stats?.questions_added_today || 0} label="Added Today" color={Colors.accent} />
          <StatCard icon="clipboard-check" value={stats?.tests_taken_today || 0} label="Tests Today" color={Colors.secondary} />
        </View>

        {/* Growth Card */}
        <Card style={styles.growthCard}>
          <Card.Content>
            <View style={styles.growthHeader}>
              <MaterialCommunityIcons name="trending-up" size={24} color={Colors.success} />
              <Text style={styles.growthTitle}>Platform Growth</Text>
            </View>
            <View style={styles.growthItem}>
              <Text style={styles.growthLabel}>Question Bank Completion</Text>
              <ProgressBar progress={0.72} color={Colors.primary} style={styles.progressBar} />
              <Text style={styles.growthPercent}>72%</Text>
            </View>
            <View style={styles.growthItem}>
              <Text style={styles.growthLabel}>User Engagement</Text>
              <ProgressBar progress={0.85} color={Colors.success} style={styles.progressBar} />
              <Text style={styles.growthPercent}>85%</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  heroCard: { backgroundColor: Colors.primaryLight + '30', borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  heroContent: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroTitle: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.sm },
  heroSubtitle: { fontSize: 14, color: Colors.textSecondary },
  heroStats: { flexDirection: 'row', marginTop: Spacing.lg, width: '100%', justifyContent: 'space-around' },
  heroStatItem: { alignItems: 'center' },
  heroStatValue: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  heroStatLabel: { fontSize: 12, color: Colors.textSecondary },
  heroStatDivider: { width: 1, backgroundColor: Colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { width: '48%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg },
  statContent: { alignItems: 'center', paddingVertical: Spacing.md },
  statIconContainer: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  statValue: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  statSubtitle: { fontSize: 10, color: Colors.textTertiary },
  growthCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl },
  growthHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  growthTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginLeft: Spacing.sm },
  growthItem: { marginBottom: Spacing.md },
  growthLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.xs },
  progressBar: { height: 8, borderRadius: 4 },
  growthPercent: { fontSize: 12, color: Colors.textSecondary, textAlign: 'right', marginTop: 4 },
});
