import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Text, ActivityIndicator, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserStatistics, UserProfile } from '../../types/user.types';
import { useColors } from '../../hooks/useColors';
import { BannerAdSafe } from '../../components/ads/BannerAdSafe';

interface QuickAction {
  id: string;
  titleKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  colorKey: 'primary' | 'accent' | 'secondary' | 'warning';
  route: string;
  descKey: string;
}

const quickActions: QuickAction[] = [
  {
    id: '1',
    titleKey: 'home.practice',
    descKey: 'home.practiceDesc',
    icon: 'book-open-variant',
    colorKey: 'primary',
    route: '/practice/categories',
  },
  {
    id: '2',
    titleKey: 'home.mockTest',
    descKey: 'home.mockTestDesc',
    icon: 'clipboard-text-clock',
    colorKey: 'accent',
    route: '/(tabs)/tests',
  },
  {
    id: '3',
    titleKey: 'home.contribute',
    descKey: 'home.contributeDesc',
    icon: 'plus-circle',
    colorKey: 'secondary',
    route: '/contribute',
  },
  {
    id: '4',
    titleKey: 'home.leaderboard',
    descKey: 'home.leaderboardDesc',
    icon: 'trophy',
    colorKey: 'warning',
    route: '/(tabs)/leaderboard',
  },
  {
    id: '5',
    titleKey: 'home.notes',
    descKey: 'home.notesDesc',
    icon: 'note-multiple',
    colorKey: 'secondary',
    route: '/profile/notes',
  },
];

// ── Greeting based on time ────────────────────────────────────────────────────
function getGreeting(t: (key: string) => string): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('home.goodMorning');
  if (hour < 17) return t('home.goodAfternoon');
  return t('home.goodEvening');
}

// ── Streak flame with intensity ───────────────────────────────────────────────
function StreakBadge({
  days,
  colors,
  t,
}: {
  days: number;
  colors: ReturnType<typeof useColors>;
  t: (key: string) => string;
}) {
  const intensity = days >= 30 ? '🔥🔥' : days >= 7 ? '🔥' : '✨';
  return (
    <View style={[streakStyles.badge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
      <Text style={streakStyles.flame}>{intensity}</Text>
      <View>
        <Text style={streakStyles.days}>{days}</Text>
        <Text style={streakStyles.label}>{t('leaderboard.dayStreak')}</Text>
      </View>
    </View>
  );
}

const streakStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  flame: { fontSize: 20 },
  days: { fontSize: 18, fontWeight: '800', color: '#fff', lineHeight: 20 },
  label: { fontSize: 10, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
});

// ── Mini stat ─────────────────────────────────────────────────────────────────
function MiniStat({
  icon,
  value,
  label,
  color,
  colors,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  value: string | number;
  label: string;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={[miniStyles.stat, { backgroundColor: colors.surface }]}>
      <View style={[miniStyles.iconWrap, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={16} color={color} />
      </View>
      <Text style={[miniStyles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[miniStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const miniStyles = StyleSheet.create({
  stat: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  value: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
  label: { fontSize: 9, marginTop: 1, textAlign: 'center', fontWeight: '500' },
});

// ── Action Card ───────────────────────────────────────────────────────────────
function ActionCard({
  action,
  colors,
  onPress,
  t,
}: {
  action: QuickAction;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  t: (key: string, opts?: any) => string;
}) {
  const color = colors[action.colorKey];
  return (
    <TouchableOpacity
      style={[actionStyles.card, { backgroundColor: colors.surface }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[actionStyles.iconWrap, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={action.icon} size={22} color={color} />
      </View>
      <View style={actionStyles.text}>
        <Text style={[actionStyles.title, { color: colors.textPrimary }]}>
          {t(action.titleKey)}
        </Text>
        <Text style={[actionStyles.desc, { color: colors.textSecondary }]} numberOfLines={1}>
          {t(action.descKey, { defaultValue: '' })}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={18} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

const actionStyles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700' },
  desc: { fontSize: 12, marginTop: 1 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { data: stats, status, refetch } = useApi<UserStatistics>('/api/statistics/me/');
  const { data: user } = useApi<UserProfile>('/api/auth/user/');
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const firstName = user?.full_name?.split(' ')[0] ?? '';
  const accuracy = Number(stats?.accuracy_percentage ?? 0);
  const streakDays = stats?.study_streak_days || 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {/* ── Hero Band ── */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={styles.heroTop}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroGreeting}>{getGreeting(t)}</Text>
              <Text style={styles.heroName} numberOfLines={1}>
                {firstName || t('home.greeting')} 👋
              </Text>
              {user?.branch_name && (
                <View style={styles.heroBranch}>
                  <MaterialCommunityIcons
                    name="school"
                    size={11}
                    color="rgba(255,255,255,0.75)"
                  />
                  <Text style={styles.heroBranchText}>{user.branch_name}</Text>
                </View>
              )}
            </View>

            <View style={styles.heroRight}>
              {/* Notification bell */}
              <TouchableOpacity
                onPress={() => router.push('/notifications')}
                style={styles.bellBtn}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="bell-outline" size={22} color="#fff" />
                <View style={styles.bellDot} />
              </TouchableOpacity>

              {/* Avatar */}
              {user?.profile_picture ? (
                <Avatar.Image size={44} source={{ uri: user.profile_picture }} />
              ) : (
                <Avatar.Text
                  size={44}
                  label={
                    user?.full_name
                      ? user.full_name
                          .trim()
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()
                      : '?'
                  }
                  style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
                  labelStyle={{ color: '#fff', fontWeight: '800', fontSize: 16 }}
                />
              )}
            </View>
          </View>

          {/* Streak badge */}
          {streakDays > 0 && (
            <StreakBadge days={streakDays} colors={colors} t={t} />
          )}
        </View>

        {/* ── Stats strip (overlaps hero) ── */}
        <View style={styles.statsStrip}>
          {status === 'loading' ? (
            <View style={[styles.statsLoading, { backgroundColor: colors.surface }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.statsRow}
              onPress={() => router.push('/(tabs)/analytics')}
              activeOpacity={0.9}
            >
              <MiniStat
                icon="help-circle"
                value={stats?.questions_answered || 0}
                label={t('analytics.answered')}
                color={colors.primary}
                colors={colors}
              />
              <MiniStat
                icon="percent"
                value={`${accuracy.toFixed(0)}%`}
                label={t('analytics.accuracy')}
                color={colors.success}
                colors={colors}
              />
              <MiniStat
                icon="clipboard-check"
                value={stats?.mock_tests_completed || 0}
                label={t('home.testsDone')}
                color={colors.accent}
                colors={colors}
              />
              <MiniStat
                icon="trophy"
                value={stats?.answers_rank ? `#${stats.answers_rank}` : '—'}
                label={t('profile.rank')}
                color={colors.warning}
                colors={colors}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('home.quickActions')}
          </Text>
          <View style={styles.actionsList}>
            {quickActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                colors={colors}
                t={t}
                onPress={() => router.push(action.route as any)}
              />
            ))}
          </View>
        </View>

        {/* ── Banner Ad ── */}
        <BannerAdSafe style={{ marginBottom: 20 }} />

        {/* ── Continue Learning ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('home.continueLearning')}
          </Text>
          <TouchableOpacity
            style={[styles.continueCard, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/practice/categories')}
            activeOpacity={0.9}
          >
            <View style={styles.continueLeft}>
              <Text style={styles.continueTitle}>{t('home.pickUpWhereLeft')}</Text>
              <Text style={styles.continueSubtitle}>
                {t('home.practiceDesc', { defaultValue: 'Practice questions by category' })}
              </Text>
              <View style={styles.continueBtn}>
                <Text style={styles.continueBtnText}>{t('home.startPracticing')}</Text>
                <MaterialCommunityIcons name="arrow-right" size={14} color={colors.primary} />
              </View>
            </View>
            <View style={styles.continueIconCircle}>
              <MaterialCommunityIcons
                name="book-open-page-variant"
                size={36}
                color="rgba(255,255,255,0.3)"
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* ── Daily Tip ── */}
        <View style={[styles.tipCard, {
          backgroundColor: colors.warning + '12',
          borderLeftColor: colors.warning,
        }]}>
          <View style={styles.tipHeader}>
            <View style={[styles.tipIcon, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>
              {t('home.dailyTip')}
            </Text>
          </View>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>
            {t('home.dailyTipText')}
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Hero
  hero: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: 44,
    gap: 14,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLeft: { flex: 1, paddingRight: 12 },
  heroGreeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    marginBottom: 2,
  },
  heroName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  heroBranch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 5,
  },
  heroBranchText: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.75)',
    fontWeight: '500',
  },
  heroRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF4444',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },

  // Stats strip — overlaps hero
  statsStrip: {
    marginTop: -28,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  statsLoading: {
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    elevation: 3,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: -0.2,
  },

  // Actions list
  actionsList: { gap: 10 },

  // Continue card
  continueCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  continueLeft: { flex: 1 },
  continueTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  continueSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 14,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  continueBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  continueIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  // Tip card
  tipCard: {
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipTitle: { fontSize: 14, fontWeight: '700' },
  tipText: { fontSize: 13, lineHeight: 20, marginLeft: 38 },
});
