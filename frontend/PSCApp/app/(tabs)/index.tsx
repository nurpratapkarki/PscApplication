import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, RefreshControl } from 'react-native';
import { Card, Text, Button, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserStatistics } from '../../types/user.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

interface QuickAction {
  id: string;
  titleKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  route: string;
}

const quickActions: QuickAction[] = [
  { id: '1', titleKey: 'home.practice', icon: 'book-open-variant', color: Colors.primary, route: '/practice/categories' },
  { id: '2', titleKey: 'home.mockTest', icon: 'clipboard-text-clock', color: Colors.accent, route: '/(tabs)/tests' },
  { id: '3', titleKey: 'home.contribute', icon: 'plus-circle', color: Colors.secondary, route: '/contribute' },
  { id: '4', titleKey: 'home.leaderboard', icon: 'trophy', color: Colors.warning, route: '/(tabs)/leaderboard' },
];

function StatCard({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
const MemoStatCard = React.memo(StatCard);

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { data: stats, status, refetch } = useApi<UserStatistics>('/api/statistics/me/');
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.primary]} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{t('home.greeting')}</Text>
            <Text style={styles.welcomeText}>{t('home.welcomeText')}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/notifications')} style={styles.notificationBtn}>
            <MaterialCommunityIcons name="bell-outline" size={24} color={Colors.textPrimary} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.statsHeader}>
              <Text style={styles.sectionTitle}>{t('home.yourProgress')}</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/analytics')}>
                <Text style={styles.viewAllText}>{t('home.viewDetails')}</Text>
              </TouchableOpacity>
            </View>
            {status === 'loading' ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.statsGrid}>
                <MemoStatCard icon="fire" value={stats?.study_streak_days || 0} label={t('home.dayStreak')} color={Colors.error} />
                <MemoStatCard icon="check-circle" value={stats?.questions_answered || 0} label={t('home.answered')} color={Colors.success} />
                <MemoStatCard icon="percent" value={`${Number(stats?.accuracy_percentage ?? 0).toFixed(0)}%`} label={t('home.accuracy')} color={Colors.primary} />
                <MemoStatCard icon="trophy" value={stats?.mock_tests_completed || 0} label={t('home.tests')} color={Colors.warning} />
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>{t('home.quickActions')}</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action) => (
            <TouchableOpacity key={action.id} style={styles.actionCard} onPress={() => router.push(action.route as any)} activeOpacity={0.7}>
              <View style={[styles.actionIconContainer, { backgroundColor: action.color }]}>
                <MaterialCommunityIcons name={action.icon} size={28} color={Colors.white} />
              </View>
              <Text style={styles.actionTitle}>{t(action.titleKey)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Learning */}
        <Card style={styles.continueCard}>
          <Card.Content style={styles.continueContent}>
            <View style={styles.continueLeft}>
              <MaterialCommunityIcons name="book-clock" size={40} color={Colors.primary} />
            </View>
            <View style={styles.continueCenter}>
              <Text style={styles.continueTitle}>{t('home.continueLearning')}</Text>
              <Text style={styles.continueSubtitle}>{t('home.pickUpWhereLeft')}</Text>
            </View>
            <Button mode="contained" compact onPress={() => router.push('/practice/categories')} style={styles.continueButton}>
              {t('home.resume')}
            </Button>
          </Card.Content>
        </Card>

        {/* Daily Tip */}
        <Card style={styles.tipCard}>
          <Card.Content>
            <View style={styles.tipHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={24} color={Colors.warning} />
              <Text style={styles.tipTitle}>{t('home.dailyTip')}</Text>
            </View>
            <Text style={styles.tipText}>{t('home.dailyTipText')}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xl },
  greeting: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  welcomeText: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  notificationBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  notificationBadge: { position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.error },
  statsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.xl, elevation: 2 },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  viewAllText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  loader: { marginVertical: Spacing.xl },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  statCard: { alignItems: 'center', flex: 1 },
  statIconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginTop: Spacing.md, marginBottom: Spacing.xl },
  actionCard: { width: '47%', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.base, alignItems: 'center', elevation: 2 },
  actionIconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  actionTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  continueCard: { backgroundColor: Colors.primaryLight + '30', borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  continueContent: { flexDirection: 'row', alignItems: 'center' },
  continueLeft: { marginRight: Spacing.md },
  continueCenter: { flex: 1 },
  continueTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  continueSubtitle: { fontSize: 13, color: Colors.textSecondary },
  continueButton: { borderRadius: BorderRadius.md },
  tipCard: { backgroundColor: Colors.warningLight, borderRadius: BorderRadius.lg },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  tipTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginLeft: Spacing.sm },
  tipText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 20 },
});
