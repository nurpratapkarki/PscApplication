import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserStatistics } from '../../types/contribution.types';
import { useColors } from '../../hooks/useColors';
import { UserProfile } from '../../types/user.types';
import { BannerAdSafe } from '../../components/ads/BannerAdSafe';

interface CategoryPerformance {
  category_name: string;
  category_scope?: string;
  questions_attempted: number;
  correct_answers: number;
  accuracy_percentage: number;
}

// ── Stat Box ──────────────────────────────────────────────────────────────────
interface StatBoxProps {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string | number;
  label: string;
  color: string;
  colors: ReturnType<typeof useColors>;
}

function StatBox({ icon, value, label, color, colors }: StatBoxProps) {
  return (
    <View style={[styles.statBox, { backgroundColor: colors.surface }]}>
      <View style={[styles.statIconWrapper, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={22} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

// ── Category Row (redesigned) ─────────────────────────────────────────────────
interface CategoryRowProps {
  item: CategoryPerformance;
  index: number;
  colors: ReturnType<typeof useColors>;
}

function CategoryRow({ item, index, colors }: CategoryRowProps) {
  const acc = Number(item.accuracy_percentage ?? 0);

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return colors.success;
    if (accuracy >= 50) return colors.warning;
    return colors.error;
  };

  const accuracyColor = getAccuracyColor(acc);
  const progressWidth = Math.min(acc, 100);

  const getScopeColor = (scope?: string) => {
    switch (scope) {
      case 'UNIVERSAL': return colors.info;
      case 'BRANCH': return colors.accent;
      case 'SUBBRANCH': return colors.secondary;
      default: return colors.primary;
    }
  };

  const scopeColor = getScopeColor(item.category_scope);

  return (
    <View style={[
      styles.categoryRow,
      { borderBottomColor: colors.border },
      index === 0 && { borderTopWidth: 0 },
    ]}>
      {/* Rank number */}
      <View style={[styles.categoryRank, { backgroundColor: colors.surfaceVariant }]}>
        <Text style={[styles.categoryRankText, { color: colors.textSecondary }]}>
          {index + 1}
        </Text>
      </View>

      {/* Info */}
      <View style={styles.categoryInfo}>
        <View style={styles.categoryNameRow}>
          <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.category_name}
          </Text>
          {item.category_scope && (
            <View style={[styles.scopeBadge, { backgroundColor: scopeColor + '15' }]}>
              <Text style={[styles.scopeText, { color: scopeColor }]}>
                {item.category_scope === 'SUBBRANCH' ? 'Specific' : item.category_scope === 'BRANCH' ? 'Branch' : 'Common'}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.categorySubtext, { color: colors.textSecondary }]}>
          {item.questions_attempted} attempted • {item.correct_answers} correct
        </Text>

        {/* Progress bar */}
        <View style={styles.progressRow}>
          <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceVariant }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${progressWidth}%`, backgroundColor: accuracyColor },
              ]}
            />
          </View>
          <Text style={[styles.accuracyText, { color: accuracyColor }]}>
            {acc.toFixed(0)}%
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function AnalyticsScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const { data: stats, status } = useApi<UserStatistics>('/api/statistics/me/');
  const { data: categoryStats } = useApi<CategoryPerformance[]>('/api/statistics/by-category/');
  const { data: userProfile } = useApi<UserProfile>('/api/auth/user/');

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

  // Filter categories relevant to user's branch
  const userBranchName = userProfile?.branch_name;
  const userSubBranchName = userProfile?.sub_branch_name;

  const filteredCategories = categoryStats?.filter((cat) => {
    if (!cat.category_scope) return true;
    if (cat.category_scope === 'UNIVERSAL') return true;
    if (cat.category_scope === 'BRANCH') return true;
    if (cat.category_scope === 'SUBBRANCH') return true;
    return true;
  }) ?? [];

  // Sort: highest attempted first
  const sortedCategories = [...filteredCategories].sort(
    (a, b) => b.questions_attempted - a.questions_attempted
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('analytics.title')}
          </Text>
          {userBranchName && (
            <View style={styles.branchRow}>
              <MaterialCommunityIcons name="source-branch" size={14} color={colors.primary} />
              <Text style={[styles.branchLabel, { color: colors.primary }]}>
                {userBranchName}
                {userSubBranchName ? ` • ${userSubBranchName}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* ── Stats Grid ── */}
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

        {/* ── Accuracy Card ── */}
        <View style={[styles.accuracyCard, { backgroundColor: colors.surface }]}>
          <View style={styles.accuracyHeader}>
            <View style={[styles.sectionIconWrapper, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="chart-arc" size={18} color={colors.primary} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('analytics.accuracy')}
            </Text>
          </View>

          <View style={styles.accuracyContent}>
            {/* Big circle */}
            <View style={styles.accuracyCircleWrap}>
              <View style={[styles.accuracyCircleOuter, { borderColor: colors.primary + '20' }]}>
                <View style={[styles.accuracyCircleInner, { backgroundColor: colors.primary + '12' }]}>
                  <Text style={[styles.accuracyValue, { color: colors.primary }]}>
                    {accuracy.toFixed(0)}%
                  </Text>
                  <Text style={[styles.accuracySubLabel, { color: colors.textSecondary }]}>
                    accuracy
                  </Text>
                </View>
              </View>
            </View>

            {/* Breakdown */}
            <View style={styles.accuracyBreakdown}>
              <View style={[styles.accuracyBreakdownItem, { backgroundColor: colors.success + '10' }]}>
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                <View>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                    {correctAnswers.toLocaleString()}
                  </Text>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                    {t('analytics.correct')}
                  </Text>
                </View>
              </View>
              <View style={[styles.accuracyBreakdownItem, { backgroundColor: colors.error + '10' }]}>
                <MaterialCommunityIcons name="close-circle" size={20} color={colors.error} />
                <View>
                  <Text style={[styles.breakdownValue, { color: colors.textPrimary }]}>
                    {incorrectAnswers.toLocaleString()}
                  </Text>
                  <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
                    {t('analytics.incorrect')}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ── Banner Ad ── */}
        <BannerAdSafe style={{ marginVertical: 16 }} />

        {/* ── Category Performance ── */}
        <View style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
          <View style={styles.categoryCardHeader}>
            <View style={styles.accuracyHeader}>
              <View style={[styles.sectionIconWrapper, { backgroundColor: colors.warning + '15' }]}>
                <MaterialCommunityIcons name="format-list-bulleted" size={18} color={colors.warning} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {t('analytics.performanceByCategory')}
                </Text>
                {userBranchName && (
                  <Text style={[styles.categoryCardSubtitle, { color: colors.textSecondary }]}>
                    Showing your branch categories
                  </Text>
                )}
              </View>
            </View>
            <View style={[styles.countPill, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {sortedCategories.length}
              </Text>
            </View>
          </View>

          {sortedCategories.length > 0 ? (
            sortedCategories.map((item, index) => (
              <CategoryRow key={index} item={item} index={index} colors={colors} />
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

        {/* ── Tips Card ── */}
        <View style={[styles.tipsCard, {
          backgroundColor: colors.info + '10',
          borderLeftColor: colors.info,
        }]}>
          <View style={styles.accuracyHeader}>
            <View style={[styles.tipIconContainer, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="lightbulb-on" size={18} color={colors.info} />
            </View>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {t('analytics.improvementTips')}
            </Text>
          </View>
          {[
            t('analytics.tip1'),
            t('analytics.tip2'),
            t('analytics.tip3'),
          ].map((tip, i) => (
            <View key={i} style={styles.tipItem}>
              <View style={[styles.tipBullet, { backgroundColor: colors.info }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 40 },

  // Header
  header: { marginBottom: 20 },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6 },
  branchRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  branchLabel: { fontSize: 13, fontWeight: '600' },

  // Stats Grid — 2x2
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    width: '47%',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  statIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, marginTop: 3, textAlign: 'center' },

  // Accuracy Card
  accuracyCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 0,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  accuracyHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  accuracyContent: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  accuracyCircleWrap: { alignItems: 'center' },
  accuracyCircleOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyCircleInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyValue: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  accuracySubLabel: { fontSize: 11, marginTop: 2 },
  accuracyBreakdown: { flex: 1, gap: 10 },
  accuracyBreakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: 12,
  },
  breakdownValue: { fontSize: 18, fontWeight: '700' },
  breakdownLabel: { fontSize: 11, marginTop: 1 },

  // Category Card
  categoryCard: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    marginBottom: 16,
  },
  categoryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 12,
  },
  categoryCardSubtitle: { fontSize: 11, marginTop: 2 },
  countPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  countText: { fontSize: 12, fontWeight: '600' },

  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  categoryRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryRankText: { fontSize: 12, fontWeight: '700' },
  categoryInfo: { flex: 1 },
  categoryNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  categoryName: { fontSize: 14, fontWeight: '600', flex: 1 },
  scopeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  scopeText: { fontSize: 9, fontWeight: '700' },
  categorySubtext: { fontSize: 11, marginBottom: 6 },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBarTrack: {
    flex: 1,
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', borderRadius: 3 },
  accuracyText: { fontSize: 12, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  // Empty
  emptyCategory: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconWrapper: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 12,
  },
  emptyCategoryText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emptyCategorySubtext: { fontSize: 13, textAlign: 'center' },

  // Tips
  tipsCard: { borderRadius: 16, padding: 16, borderLeftWidth: 4, marginBottom: 8 },
  tipIconContainer: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  tipItem: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, marginLeft: 42 },
  tipBullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7, marginRight: 10 },
  tipText: { fontSize: 14, lineHeight: 20, flex: 1 },
});