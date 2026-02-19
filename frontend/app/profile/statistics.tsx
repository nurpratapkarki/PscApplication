import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserStatistics } from '../../types/contribution.types';
import { useColors } from '../../hooks/useColors';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

export default function ProfileStatisticsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { data: stats, status } = useApi<UserStatistics>('/api/statistics/me/');

  const StatCard = ({ icon, value, label, color, subtitle }: { icon: string; value: string | number; label: string; color: string; subtitle?: string }) => (
    <Card style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <Card.Content style={styles.statContent}>
        <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
        {subtitle && <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>}
      </Card.Content>
    </Card>
  );

  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const accuracy = stats?.questions_answered ? Math.round(((stats.questions_correct || 0) / stats.questions_answered) * 100) : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('statistics.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Overview Card */}
        <Card style={[styles.overviewCard, { backgroundColor: Colors.primaryLight + '30' }]}>
          <Card.Content>
            <View style={styles.overviewHeader}>
              <MaterialCommunityIcons name="chart-line" size={28} color={Colors.primary} />
              <Text style={[styles.overviewTitle, { color: colors.textPrimary }]}>{t('statistics.performanceOverview')}</Text>
            </View>
            <View style={styles.accuracySection}>
              <Text style={[styles.accuracyValue, { color: Colors.primary }]}>{accuracy}%</Text>
              <Text style={[styles.accuracyLabel, { color: colors.textSecondary }]}>{t('statistics.overallAccuracy')}</Text>
              <ProgressBar progress={accuracy / 100} color={accuracy >= 70 ? Colors.success : accuracy >= 50 ? Colors.warning : Colors.error} style={styles.progressBar} />
            </View>
          </Card.Content>
        </Card>

        {/* Stats Grid */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('statistics.studyProgress')}</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="help-circle" value={stats?.questions_answered || 0} label={t('statistics.questionsAnswered')} color={Colors.primary} />
          <StatCard icon="check-circle" value={stats?.questions_correct || 0} label={t('statistics.correctAnswers')} color={Colors.success} />
          <StatCard icon="fire" value={stats?.study_streak_days || 0} label={t('statistics.dayStreak')} color={Colors.error} subtitle={t('statistics.keepItUp')} />
          <StatCard icon="clock-outline" value={`${Math.round((stats?.total_study_time || 0) / 60)}h`} label={t('statistics.studyTime')} color={Colors.secondary} />
        </View>

        {/* Contributions */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('statistics.contributions')}</Text>
        <View style={styles.statsGrid}>
          <StatCard icon="file-document-plus" value={stats?.questions_contributed || 0} label={t('statistics.contributed')} color={Colors.accent} />
          <StatCard icon="check-decagram" value={stats?.questions_made_public || 0} label={t('statistics.approved')} color={Colors.success} />
          <StatCard icon="trophy" value={`#${stats?.contribution_rank || '-'}`} label={t('statistics.rank')} color={Colors.warning} />
          <StatCard icon="star" value={stats?.featured_contributions || 0} label={t('statistics.featured')} color={Colors.primary} />
        </View>

        {/* Tests */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('statistics.mockTests')}</Text>
        <Card style={[styles.testsCard, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <View style={styles.testRow}>
              <View style={styles.testItem}>
                <Text style={[styles.testValue, { color: colors.textPrimary }]}>{stats?.tests_attempted || 0}</Text>
                <Text style={[styles.testLabel, { color: colors.textSecondary }]}>{t('statistics.attempted')}</Text>
              </View>
              <View style={[styles.testDivider, { backgroundColor: colors.border }]} />
              <View style={styles.testItem}>
                <Text style={[styles.testValue, { color: colors.textPrimary }]}>{stats?.tests_passed || 0}</Text>
                <Text style={[styles.testLabel, { color: colors.textSecondary }]}>{t('statistics.passed')}</Text>
              </View>
              <View style={[styles.testDivider, { backgroundColor: colors.border }]} />
              <View style={styles.testItem}>
                <Text style={[styles.testValue, { color: Colors.success }]}>{stats?.tests_attempted ? Math.round(((stats.tests_passed || 0) / stats.tests_attempted) * 100) : 0}%</Text>
                <Text style={[styles.testLabel, { color: colors.textSecondary }]}>{t('statistics.passRate')}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  overviewCard: { borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  overviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  overviewTitle: { fontSize: 18, fontWeight: '700', marginLeft: Spacing.sm },
  accuracySection: { alignItems: 'center' },
  accuracyValue: { fontSize: 48, fontWeight: '700' },
  accuracyLabel: { fontSize: 14 },
  progressBar: { height: 8, borderRadius: 4, width: '100%', marginTop: Spacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: Spacing.md, marginTop: Spacing.sm },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { width: '48%', borderRadius: BorderRadius.lg },
  statContent: { alignItems: 'center', paddingVertical: Spacing.md },
  statIconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  statValue: { fontSize: 24, fontWeight: '700' },
  statLabel: { fontSize: 12, textAlign: 'center' },
  statSubtitle: { fontSize: 10 },
  testsCard: { borderRadius: BorderRadius.xl },
  testRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  testItem: { alignItems: 'center', flex: 1 },
  testValue: { fontSize: 28, fontWeight: '700' },
  testLabel: { fontSize: 12 },
  testDivider: { width: 1, height: 40 },
});
