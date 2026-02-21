import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Avatar, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserProfile, UserStatistics } from '../../types/user.types';
import { useColors } from '../../hooks/useColors';
import { Spacing,  } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';

interface MenuItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  route?: string;
  color?: string;
  onPress?: () => void;
}

// ── XP Level Progress ─────────────────────────────────────────────────────────
const XP_PER_LEVEL = 1000;

function LevelBadge({
  level,
  xp,
  colors,
}: {
  level: number;
  xp: number;
  colors: ReturnType<typeof useColors>;
}) {
  const progress = (xp % XP_PER_LEVEL) / XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - (xp % XP_PER_LEVEL);

  return (
    <View style={[levelStyles.container, { backgroundColor: colors.surface }]}>
      <View style={levelStyles.left}>
        <View style={[levelStyles.badge, { backgroundColor: colors.primary }]}>
          <Text style={levelStyles.badgeText}>Lv.{level}</Text>
        </View>
        <View>
          <Text style={[levelStyles.xpText, { color: colors.textPrimary }]}>
            {xp.toLocaleString()} XP
          </Text>
          <Text style={[levelStyles.nextText, { color: colors.textSecondary }]}>
            {xpToNext} to Level {level + 1}
          </Text>
        </View>
      </View>
      <View style={[levelStyles.track, { backgroundColor: colors.surfaceVariant }]}>
        <View
          style={[
            levelStyles.fill,
            { width: `${progress * 100}%`, backgroundColor: colors.primary },
          ]}
        />
      </View>
    </View>
  );
}

const levelStyles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: Spacing.base,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: { fontSize: 13, fontWeight: '800', color: '#fff' },
  xpText: { fontSize: 15, fontWeight: '700' },
  nextText: { fontSize: 11, marginTop: 1 },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 3 },
});

// ── Stat Pill ─────────────────────────────────────────────────────────────────
function StatPill({
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
    <View style={[pillStyles.pill, { backgroundColor: colors.surface }]}>
      <View style={[pillStyles.iconWrap, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon} size={18} color={color} />
      </View>
      <Text style={[pillStyles.value, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[pillStyles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

const pillStyles = StyleSheet.create({
  pill: {
    flex: 1,
    alignItems: 'center',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  value: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  label: { fontSize: 10, marginTop: 2, textAlign: 'center' },
});

// ── Menu Group ────────────────────────────────────────────────────────────────
function MenuGroup({
  items,
  colors,
  router,
}: {
  items: MenuItem[];
  colors: ReturnType<typeof useColors>;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <View style={[groupStyles.card, { backgroundColor: colors.surface }]}>
      {items.map((item, index) => (
        <React.Fragment key={item.title}>
          <TouchableOpacity
            style={groupStyles.row}
            onPress={item.onPress || (() => item.route && router.push(item.route as any))}
            activeOpacity={0.7}
          >
            <View
              style={[
                groupStyles.iconWrap,
                { backgroundColor: (item.color || colors.primary) + '15' },
              ]}
            >
              <MaterialCommunityIcons
                name={item.icon}
                size={20}
                color={item.color || colors.primary}
              />
            </View>
            <View style={groupStyles.textWrap}>
              <Text
                style={[
                  groupStyles.title,
                  { color: item.color || colors.textPrimary },
                ]}
              >
                {item.title}
              </Text>
              {item.subtitle && (
                <Text style={[groupStyles.subtitle, { color: colors.textSecondary }]}>
                  {item.subtitle}
                </Text>
              )}
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={colors.textTertiary}
            />
          </TouchableOpacity>
          {index < items.length - 1 && (
            <View style={[groupStyles.divider, { backgroundColor: colors.border }]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}

const groupStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600' },
  subtitle: { fontSize: 12, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 66 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { logout } = useAuth();

  const { data: user, status: userStatus, refetch: refetchUser } =
    useApi<UserProfile>('/api/auth/user/');
  const { data: stats, status: statsStatus, refetch: refetchStats } =
    useApi<UserStatistics>('/api/statistics/me/');

  useFocusEffect(
    useCallback(() => {
      refetchUser();
      refetchStats();
    }, [refetchUser, refetchStats])
  );

  const isLoading = userStatus === 'loading' || statsStatus === 'loading';

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('profile.logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const accountItems: MenuItem[] = [
    {
      icon: 'account-edit',
      title: t('profile.editProfile'),
      subtitle: t('profile.editProfileSubtitle'),
      route: '/profile/edit',
    },
    {
      icon: 'plus-circle',
      title: t('profile.myContributions'),
      subtitle: t('profile.myContributionsSubtitle'),
      route: '/contribute/my-contributions',
    },
  ];

  const appItems: MenuItem[] = [
    {
      icon: 'book-open-page-variant',
      title: t('notes.library', { defaultValue: 'Notes Library' }),
      subtitle: t('notes.librarySubtitle', { defaultValue: 'Read contributed notes in-app' }),
      route: '/profile/notes',
    },
    {
      icon: 'cog',
      title: t('profile.settings'),
      subtitle: t('profile.settingsSubtitle'),
      route: '/profile/settings',
    },
    {
      icon: 'help-circle',
      title: t('profile.helpSupport'),
      subtitle: t('profile.helpSupportSubtitle'),
      route: '/profile/help',
    },
    {
      icon: 'information',
      title: t('profile.about'),
      subtitle: t('profile.aboutSubtitle'),
      route: '/profile/about',
    },
  ];

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const accuracy = Number(stats?.accuracy_percentage ?? 0);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero Header ── */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          {/* Avatar */}
          <View style={styles.avatarWrap}>
            {user?.profile_picture ? (
              <Avatar.Image size={88} source={{ uri: user.profile_picture }} />
            ) : (
              <Avatar.Text
                size={88}
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
                labelStyle={{ color: '#fff', fontWeight: '800', fontSize: 28 }}
              />
            )}
            <TouchableOpacity
              style={[styles.cameraBtn, { backgroundColor: colors.primary, borderColor: '#fff' }]}
              onPress={() => router.push('/profile/edit')}
            >
              <MaterialCommunityIcons name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <Text style={styles.heroName}>{user?.full_name || t('profile.user')}</Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>

          {/* Branch pill */}
          {user?.branch_name && (
            <View style={styles.heroBranchPill}>
              <MaterialCommunityIcons name="school" size={12} color="rgba(255,255,255,0.9)" />
              <Text style={styles.heroBranchText}>
                {user.branch_name}
                {user.sub_branch_name ? ` • ${user.sub_branch_name}` : ''}
              </Text>
            </View>
          )}
        </View>

        {/* ── XP / Level strip ── */}
        <View style={styles.levelWrap}>
          <LevelBadge
            level={user?.level ?? 1}
            xp={user?.experience_points ?? 0}
            colors={colors}
          />
        </View>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          <StatPill
            icon="fire"
            value={stats?.study_streak_days || 0}
            label={t('profile.dayStreak')}
            color={colors.secondary}
            colors={colors}
          />
          <StatPill
            icon="trophy"
            value={stats?.answers_rank ? `#${stats.answers_rank}` : '—'}
            label={t('profile.rank')}
            color={colors.warning}
            colors={colors}
          />
          <StatPill
            icon="help-circle"
            value={stats?.questions_answered || 0}
            label={t('profile.answered')}
            color={colors.primary}
            colors={colors}
          />
          <StatPill
            icon="check-decagram"
            value={`${accuracy.toFixed(0)}%`}
            label={t('analytics.accuracy')}
            color={colors.success}
            colors={colors}
          />
        </View>

        {/* ── Account section ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            ACCOUNT
          </Text>
          <MenuGroup items={accountItems} colors={colors} router={router} />
        </View>

        {/* ── App section ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            APP
          </Text>
          <MenuGroup items={appItems} colors={colors} router={router} />
        </View>

        {/* ── Logout ── */}
        <View style={styles.section}>
          <View style={[groupStyles.card, { backgroundColor: colors.surface }]}>
            <TouchableOpacity
              style={groupStyles.row}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <View style={[groupStyles.iconWrap, { backgroundColor: colors.error + '15' }]}>
                <MaterialCommunityIcons name="logout" size={20} color={colors.error} />
              </View>
              <Text style={[groupStyles.title, { color: colors.error, flex: 1 }]}>
                {t('profile.logout')}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.error + '60'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Version ── */}
        <Text style={[styles.version, { color: colors.textTertiary }]}>
          PSC Prep v1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingBottom: 48,
    paddingHorizontal: Spacing.base,
  },
  avatarWrap: { position: 'relative', marginBottom: 12 },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  heroEmail: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    marginBottom: 10,
  },
  heroBranchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBranchText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },

  // Level strip — overlaps hero bottom
  levelWrap: { marginTop: -28, marginHorizontal: Spacing.base, marginBottom: 12 },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: Spacing.base,
    marginBottom: 24,
  },

  // Sections
  section: { paddingHorizontal: Spacing.base, marginBottom: 16 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },

  // Version
  version: { textAlign: 'center', fontSize: 12, marginTop: 8, marginBottom: 16 },
});
