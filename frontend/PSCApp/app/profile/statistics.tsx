import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { UserStatistics } from '../../types/contribution.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

export default function ProfileStatisticsScreen() {
  const router = useRouter();
  const { data: stats, status } = useApi<UserStatistics>('/api/statistics/me/');

  const StatCard = ({ icon, value, label, color, subtitle }: { icon: string; value: string | number; label: string; color: string; subtitle?: string }) => (
    <Card style={styles.statCard}>
      <Card.Content style={styles.statContent}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <Text style={styles.statValue}>{value}</Text>
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

  const accuracy = stats?.questions_answered ? Math.round(((stats.questions_correct || 0) / stats.questions_answered) * 100) : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Statistics</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overview Card */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <View style={styles.overviewHeader}>
              <MaterialCommunityIcons name="chart-line" size={28} color={Colors.primary} />
              <Text style={styles.overviewTitle}>Performance Overview</Text>
            </View>
            <View style={styles.accuracySection}>
              <Text style={styles.accuracyValue}>{accuracy}%</Text>
              <Text style={styles.accuracyLabel}>Overall Accuracy</Text>
              <ProgressBar progress={accuracy / 100} color={accuracy >= 70 ? Colors.success : accuracy >= 50 ? Colors.warning : Colors.error} style={styles.progressBar} />
            </View>
          </Card.Content>
        </Card>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Study Progress</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="help-circle" value={stats?.questions_answered || 0} label="Questions Answered" color={Colors.primary} />
          <StatCard icon="check-circle" value={stats?.questions_correct || 0} label="Correct Answers" color={Colors.success} />
          <StatCard icon="fire" value={stats?.study_streak_days || 0} label="Day Streak" color={Colors.error} subtitle="Keep it up!" />
          <StatCard icon="clock-outline" value={`${Math.round((stats?.total_study_time || 0) / 60)}h`} label="Study Time" color={Colors.secondary} />
        </View>

        {/* Contributions */}
        <Text style={styles.sectionTitle}>Contributions</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="file-document-plus" value={stats?.questions_contributed || 0} label="Contributed" color={Colors.accent} />
          <StatCard icon="check-decagram" value={stats?.questions_made_public || 0} label="Approved" color={Colors.success} />
          <StatCard icon="trophy" value={`#${stats?.contribution_rank || '-'}`} label="Rank" color={Colors.warning} />
          <StatCard icon="star" value={stats?.featured_contributions || 0} label="Featured" color={Colors.primary} />
        </View>

        {/* Tests */}
        <Text style={styles.sectionTitle}>Mock Tests</Text>
        <Card style={styles.testsCard}>
          <Card.Content>
            <View style={styles.testRow}>
              <View style={styles.testItem}>
                <Text style={styles.testValue}>{stats?.tests_attempted || 0}</Text>
                <Text style={styles.testLabel}>Attempted</Text>
              </View>
              <View style={styles.testDivider} />
              <View style={styles.testItem}>
                <Text style={styles.testValue}>{stats?.tests_passed || 0}</Text>
                <Text style={styles.testLabel}>Passed</Text>
              </View>
              <View style={styles.testDivider} />
              <View style={styles.testItem}>
                <Text style={[styles.testValue, { color: Colors.success }]}>{stats?.tests_attempted ? Math.round(((stats.tests_passed || 0) / stats.tests_attempted) * 100) : 0}%</Text>
                <Text style={styles.testLabel}>Pass Rate</Text>
              </View>
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
  overviewCard: { backgroundColor: Colors.primaryLight + '30', borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  overviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  overviewTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginLeft: Spacing.sm },
  accuracySection: { alignItems: 'center' },
  accuracyValue: { fontSize: 48, fontWeight: '700', color: Colors.primary },
  accuracyLabel: { fontSize: 14, color: Colors.textSecondary },
  progressBar: { height: 8, borderRadius: 4, width: '100%', marginTop: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { width: '48%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg },
  statContent: { alignItems: 'center', paddingVertical: Spacing.md },
  statIconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  statValue: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 12, color: Colors.textSecondary, textAlign: 'center' },
  statSubtitle: { fontSize: 10, color: Colors.textTertiary },
  testsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl },
  testRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  testItem: { alignItems: 'center', flex: 1 },
  testValue: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  testLabel: { fontSize: 12, color: Colors.textSecondary },
  testDivider: { width: 1, height: 40, backgroundColor: Colors.border },
});
