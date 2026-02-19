import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserStatistics } from '../../types/contribution.types';
import { useColors } from '../../hooks/useColors';

interface CategoryPerformance {
  category_name: string;
  questions_attempted: number;
  correct_answers: number;
  accuracy_percentage: number;
}

interface StatBoxProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string | number;
  label: string;
  color: string;
  colors: ReturnType<typeof useColors>;
}

function StatBox({ icon, value, label, color, colors }: StatBoxProps) {
  return (
    <View style={styles.statBox}>
      <View style={[styles.statIconWrapper, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={24} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

interface CategoryRowProps {
  item: CategoryPerformance;
  colors: ReturnType<typeof useColors>;
}

function CategoryRow({ item, colors }: CategoryRowProps) {
  const acc = Number(item.accuracy_percentage ?? 0);
  
  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return colors.success;
    if (accuracy >= 50) return colors.warning;
    return colors.error;
  };

  const accuracyColor = getAccuracyColor(acc);
  const progressWidth = Math.min(acc, 100);
  
  return (
    <View style={styles.categoryRow}>
      <View style={styles.categoryInfo}>
        <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={1}>
          {item.category_name}
        </Text>
        <Text style={[styles.categorySubtext, { color: colors.textSecondary }]}>
          {item.questions_attempted} questions • {item.correct_answers} correct
        </Text>
      </View>
      <View style={styles.categoryProgress}>
        <Text style={[styles.accuracyText, { color: accuracyColor }]}>
          {acc.toFixed(0)}%
        </Text>
        <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceVariant }]}>
          <View 
            style={[
              styles.progressBarFill, 
              { width: `${progressWidth}%`, backgroundColor: accuracyColor }
            ]} 
          />
        </View>
      </View>
    </View>
  );
}

export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: stats, status } = useApi<UserStatistics>('/api/statistics/me/');
  const { data: categoryStats } = useApi<CategoryPerformance[]>('/api/statistics/by-category/');

  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const accuracy = Number(stats?.accuracy_percentage ?? 0);
  const correctAnswers = stats?.total_correct_answers || 0;
  const incorrectAnswers = (stats?.questions_answered || 0) - correctAnswers;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('analytics.title')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {t('analytics.subtitle')}
          </Text>
        </View>

        {/* Overview Stats Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="chart-line" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('analytics.overview')}
              </Text>
            </View>
          </View>

          <View style={[styles.overviewCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statsGrid}>
              <StatBox
                icon="fire"
                value={stats?.study_streak_days || 0}
                label={t('analytics.dayStreak')}
                color={colors.secondary}
                colors={colors}
              />
              <StatBox
                icon="help-circle"
                value={stats?.questions_answered || 0}
                label={t('analytics.answered')}
                color={colors.primary}
                colors={colors}
              />
            </View>
            <View style={styles.statsGrid}>
              <StatBox
                icon="check-circle"
                value={correctAnswers}
                label={t('analytics.correct')}
                color={colors.success}
                colors={colors}
              />
              <StatBox
                icon="clipboard-check"
                value={stats?.mock_tests_completed || 0}
                label={t('analytics.tests')}
                color={colors.accent}
                colors={colors}
              />
            </View>
          </View>
        </View>

        {/* Accuracy Card */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconWrapper, { backgroundColor: colors.accent + '15' }]}>
                <MaterialCommunityIcons name="chart-box" size={18} color={colors.accent} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('analytics.accuracy')}
              </Text>
            </View>
          </View>

          <View style={[styles.accuracyCard, { backgroundColor: colors.surface }]}>
            <View style={styles.accuracyContent}>
              <View style={[styles.accuracyCircle, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles.accuracyValue, { color: colors.primary }]}>
                  {accuracy.toFixed(0)}%
                </Text>
                <Text style={[styles.accuracyLabel, { color: colors.textSecondary }]}>
                  {t('analytics.accuracy')}
                </Text>
              </View>
              <View style={styles.accuracyDetails}>
                <View style={styles.accuracyRow}>
                  <View style={[styles.accuracyIconWrapper, { backgroundColor: colors.success + '15' }]}>
                    <MaterialCommunityIcons name="check" size={16} color={colors.success} />
                  </View>
                  <View style={styles.accuracyTextWrapper}>
                    <Text style={[styles.accuracyDetailLabel, { color: colors.textSecondary }]}>
                      {t('analytics.correct')}
                    </Text>
                    <Text style={[styles.accuracyDetailValue, { color: colors.textPrimary }]}>
                      {correctAnswers}
                    </Text>
                  </View>
                </View>
                <View style={styles.accuracyRow}>
                  <View style={[styles.accuracyIconWrapper, { backgroundColor: colors.error + '15' }]}>
                    <MaterialCommunityIcons name="close" size={16} color={colors.error} />
                  </View>
                  <View style={styles.accuracyTextWrapper}>
                    <Text style={[styles.accuracyDetailLabel, { color: colors.textSecondary }]}>
                      {t('analytics.incorrect')}
                    </Text>
                    <Text style={[styles.accuracyDetailValue, { color: colors.textPrimary }]}>
                      {incorrectAnswers}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Category Performance */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconWrapper, { backgroundColor: colors.warning + '15' }]}>
                <MaterialCommunityIcons name="format-list-bulleted" size={18} color={colors.warning} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('analytics.performanceByCategory')}
              </Text>
            </View>
          </View>

          <View style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
            {categoryStats && categoryStats.length > 0 ? (
              categoryStats.map((item, index) => (
                <CategoryRow key={index} item={item} colors={colors} />
              ))
            ) : (
              <View style={styles.emptyCategory}>
                <View style={[styles.emptyIconWrapper, { backgroundColor: colors.surfaceVariant }]}>
                  <MaterialCommunityIcons name="chart-bar" size={32} color={colors.textTertiary} />
                </View>
                <Text style={[styles.emptyCategoryText, { color: colors.textPrimary }]}>
                  {t('analytics.noCategoryData')}
                </Text>
                <Text style={[styles.emptyCategorySubtext, { color: colors.textSecondary }]}>
                  {t('analytics.startPracticing')}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Tips Card */}
        <View style={[styles.tipsCard, { 
          backgroundColor: colors.info + '15',
          borderLeftColor: colors.info 
        }]}>
          <View style={styles.tipsHeader}>
            <View style={[styles.tipIconContainer, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="lightbulb-on" size={20} color={colors.info} />
            </View>
            <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>
              {t('analytics.improvementTips')}
            </Text>
          </View>
          <View style={styles.tipsContent}>
            <View style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: colors.info }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {t('analytics.tip1')}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: colors.info }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {t('analytics.tip2')}
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: colors.info }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>
                {t('analytics.tip3')}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scrollContent: { 
    padding: 16, 
    paddingBottom: 32 
  },

  // Header
  header: { 
    marginBottom: 20 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '700', 
    letterSpacing: -0.5 
  },
  headerSubtitle: { 
    fontSize: 14, 
    marginTop: 4 
  },

  // Section
  section: { 
    marginBottom: 24 
  },
  sectionHeader: { 
    marginBottom: 12 
  },
  sectionTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  sectionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700' 
  },

  // Overview Card
  overviewCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  statsGrid: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 16
  },
  statBox: { 
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8
  },
  statIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8
  },
  statValue: { 
    fontSize: 20, 
    fontWeight: '700', 
    marginTop: 4,
    letterSpacing: -0.3
  },
  statLabel: { 
    fontSize: 11, 
    marginTop: 2,
    textAlign: 'center'
  },

  // Accuracy Card
  accuracyCard: {
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  accuracyContent: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  accuracyCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: 20
  },
  accuracyValue: { 
    fontSize: 28, 
    fontWeight: '700',
    letterSpacing: -0.5
  },
  accuracyLabel: { 
    fontSize: 12,
    marginTop: 2
  },
  accuracyDetails: { 
    flex: 1,
    gap: 12
  },
  accuracyRow: { 
    flexDirection: 'row', 
    alignItems: 'center'
  },
  accuracyIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  accuracyTextWrapper: {
    flex: 1
  },
  accuracyDetailLabel: { 
    fontSize: 12,
    marginBottom: 2
  },
  accuracyDetailValue: { 
    fontSize: 18, 
    fontWeight: '700',
    letterSpacing: -0.3
  },

  // Category Card
  categoryCard: {
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  categoryRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 12
  },
  categoryInfo: { 
    flex: 1,
    marginRight: 12
  },
  categoryName: { 
    fontSize: 15, 
    fontWeight: '600',
    marginBottom: 4
  },
  categorySubtext: { 
    fontSize: 12 
  },
  categoryProgress: { 
    width: 90, 
    alignItems: 'flex-end' 
  },
  accuracyText: { 
    fontSize: 14, 
    fontWeight: '700', 
    marginBottom: 6 
  },
  progressBarTrack: { 
    height: 6, 
    borderRadius: 3, 
    width: 90,
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3
  },

  // Empty State
  emptyCategory: { 
    alignItems: 'center', 
    paddingVertical: 40,
    paddingHorizontal: 20
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  emptyCategoryText: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginTop: 8,
    marginBottom: 4
  },
  emptyCategorySubtext: { 
    fontSize: 13, 
    textAlign: 'center' 
  },

  // Tips Card
  tipsCard: { 
    borderRadius: 16, 
    padding: 16, 
    borderLeftWidth: 4
  },
  tipsHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },
  tipsTitle: { 
    fontSize: 16, 
    fontWeight: '600' 
  },
  tipsContent: {
    marginLeft: 40,
    gap: 8
  },
  tipItem: { 
    flexDirection: 'row', 
    alignItems: 'flex-start',
    marginBottom: 4
  },
  tipBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
    marginRight: 10
  },
  tipText: { 
    fontSize: 14, 
    lineHeight: 20,
    flex: 1
  }
});