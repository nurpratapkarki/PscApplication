import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Text, Card, ProgressBar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { UserStatistics } from '../../types/contribution.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const { width } = Dimensions.get('window');

interface CategoryPerformance {
  category_name: string;
  questions_attempted: number;
  correct_answers: number;
  accuracy: number;
}

export default function AnalyticsScreen() {
  const { data: stats, status } = useApi<UserStatistics>('/api/statistics/me/');
  const { data: categoryStats } = useApi<CategoryPerformance[]>('/api/statistics/by-category/');

  const StatBox = ({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) => (
    <View style={styles.statBox}>
      <MaterialCommunityIcons name={icon as any} size={28} color={color} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const CategoryRow = ({ item }: { item: CategoryPerformance }) => (
    <View style={styles.categoryRow}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.category_name}</Text>
        <Text style={styles.categorySubtext}>{item.questions_attempted} questions • {item.correct_answers} correct</Text>
      </View>
      <View style={styles.categoryProgress}>
        <Text style={[styles.accuracyText, { color: item.accuracy >= 70 ? Colors.success : item.accuracy >= 50 ? Colors.warning : Colors.error }]}>
          {item.accuracy.toFixed(0)}%
        </Text>
        <ProgressBar progress={item.accuracy / 100} color={item.accuracy >= 70 ? Colors.success : item.accuracy >= 50 ? Colors.warning : Colors.error} style={styles.progressBar} />
      </View>
    </View>
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>तपाईंको प्रगति</Text>
        </View>

        {/* Overview Stats */}
        <Card style={styles.overviewCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              <StatBox icon="fire" value={stats?.study_streak_days || 0} label="Day Streak" color={Colors.error} />
              <StatBox icon="help-circle" value={stats?.questions_answered || 0} label="Answered" color={Colors.primary} />
              <StatBox icon="check-circle" value={stats?.total_correct_answers || 0} label="Correct" color={Colors.success} />
              <StatBox icon="clipboard-check" value={stats?.mock_tests_completed || 0} label="Tests" color={Colors.accent} />
            </View>
          </Card.Content>
        </Card>

        {/* Accuracy Card */}
        <Card style={styles.accuracyCard}>
          <Card.Content style={styles.accuracyContent}>
            <View style={styles.accuracyCircle}>
              <Text style={styles.accuracyValue}>{stats?.accuracy_percentage?.toFixed(0) || 0}%</Text>
              <Text style={styles.accuracyLabel}>Accuracy</Text>
            </View>
            <View style={styles.accuracyDetails}>
              <View style={styles.accuracyRow}>
                <MaterialCommunityIcons name="check" size={20} color={Colors.success} />
                <Text style={styles.accuracyDetailText}>Correct: {stats?.total_correct_answers || 0}</Text>
              </View>
              <View style={styles.accuracyRow}>
                <MaterialCommunityIcons name="close" size={20} color={Colors.error} />
                <Text style={styles.accuracyDetailText}>Incorrect: {(stats?.questions_answered || 0) - (stats?.total_correct_answers || 0)}</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Category Performance */}
        <Card style={styles.categoryCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Performance by Category</Text>
            {categoryStats && categoryStats.length > 0 ? (
              categoryStats.map((item, index) => <CategoryRow key={index} item={item} />)
            ) : (
              <View style={styles.emptyCategory}>
                <MaterialCommunityIcons name="chart-bar" size={40} color={Colors.textTertiary} />
                <Text style={styles.emptyCategoryText}>No category data yet</Text>
                <Text style={styles.emptyCategorySubtext}>Start practicing to see your performance breakdown</Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={24} color={Colors.warning} />
              <Text style={styles.tipsTitle}>Improvement Tips</Text>
            </View>
            <Text style={styles.tipItem}>• Focus on categories with accuracy below 70%</Text>
            <Text style={styles.tipItem}>• Maintain your daily streak for consistent progress</Text>
            <Text style={styles.tipItem}>• Take mock tests regularly to simulate exam conditions</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.primary },
  overviewCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.xs },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  accuracyCard: { backgroundColor: Colors.primaryLight + '30', borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  accuracyContent: { flexDirection: 'row', alignItems: 'center' },
  accuracyCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.xl },
  accuracyValue: { fontSize: 28, fontWeight: '700', color: Colors.primary },
  accuracyLabel: { fontSize: 12, color: Colors.textSecondary },
  accuracyDetails: { flex: 1 },
  accuracyRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  accuracyDetailText: { fontSize: 14, color: Colors.textPrimary, marginLeft: Spacing.sm },
  categoryCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  categoryRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  categoryInfo: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  categorySubtext: { fontSize: 12, color: Colors.textSecondary },
  categoryProgress: { width: 80, alignItems: 'flex-end' },
  accuracyText: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  progressBar: { height: 6, borderRadius: 3, width: 80 },
  emptyCategory: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyCategoryText: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.sm },
  emptyCategorySubtext: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center' },
  tipsCard: { backgroundColor: Colors.warningLight, borderRadius: BorderRadius.xl },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  tipsTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginLeft: Spacing.sm },
  tipItem: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
});

