import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Text, Avatar, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useColors } from '../../hooks/useColors';
import { Spacing, BorderRadius } from '../../constants/typography';

const { width } = Dimensions.get('window');

type RankingType = 'answers' | 'contributions';

interface RankingEntry {
  rank: number;
  user_name: string;
  profile_picture: string | null;
  questions_answered: number;
  correct_answers: number;
  accuracy_percentage: number;
  questions_contributed: number;
  study_streak_days: number;
  mock_tests_completed: number;
}

interface RankingsResponse {
  type: RankingType;
  label: string;
  my_entry: RankingEntry | null;
  top_users: RankingEntry[];
}

// Medal colors — same in both themes since they sit on the primary navy band
const MEDAL = ['#F5A623', '#9B9B9B', '#CD7F32'] as const;

const initials = (name: string) => {
  const parts = name.trim().split(' ');
  return parts.length >= 2
    ? (parts[0][0] + parts[1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

// ─── Tab Toggle ───────────────────────────────────────────────────────────────

const TabToggle = ({
  value,
  onChange,
  colors,
  t,
}: {
  value: RankingType;
  onChange: (v: RankingType) => void;
  colors: ReturnType<typeof useColors>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) => (
  <View style={[tabStyles.container, { backgroundColor: 'rgba(0,0,0,0.2)' }]}>
    {(['answers', 'contributions'] as RankingType[]).map((tab) => {
      const active = value === tab;
      return (
        <TouchableOpacity
          key={tab}
          onPress={() => onChange(tab)}
          style={[
            tabStyles.tab,
            active && { backgroundColor: colors.white },
          ]}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={tab === 'answers' ? 'help-circle' : 'file-document-plus'}
            size={14}
            color={active ? colors.primaryDark : 'rgba(255,255,255,0.85)'}
          />
          <Text
            style={[
              tabStyles.label,
              { color: active ? colors.primaryDark : 'rgba(255,255,255,0.85)' },
              active && { fontWeight: '700' },
            ]}
          >
            {tab === 'answers' ? t('leaderboard.mostAnswered') : t('leaderboard.topContributors')}
          </Text>
        </TouchableOpacity>
      );
    })}
  </View>
);

const tabStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 9,
  },
  label: { fontSize: 13, fontWeight: '500' },
});

// ─── Podium Card ─────────────────────────────────────────────────────────────

const PodiumCard = ({
  entry,
  position,
  rankingType,
  colors,
  t,
}: {
  entry: RankingEntry;
  position: 1 | 2 | 3;
  rankingType: RankingType;
  colors: ReturnType<typeof useColors>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) => {
  const isFirst = position === 1;
  const medalColor = MEDAL[position - 1];
  const avatarSize = isFirst ? 68 : 52;
  const primaryValue =
    rankingType === 'answers'
      ? entry.questions_answered
      : entry.questions_contributed;

  return (
    <View style={[podiumStyles.card, isFirst && podiumStyles.cardFirst]}>
      {/* medal ring */}
      <View
        style={[
          podiumStyles.medalRing,
          {
            borderColor: medalColor,
            width: avatarSize + 8,
            height: avatarSize + 8,
            borderRadius: (avatarSize + 8) / 2,
          },
        ]}
      >
        {entry.profile_picture ? (
          <Avatar.Image size={avatarSize} source={{ uri: entry.profile_picture }} />
        ) : (
          <Avatar.Text
            size={avatarSize}
            label={initials(entry.user_name)}
            style={{ backgroundColor: medalColor + 'CC' }}
            labelStyle={{ color: '#fff', fontWeight: '700' }}
          />
        )}
      </View>

      {/* position badge */}
      <View
        style={[
          podiumStyles.badge,
          { backgroundColor: medalColor, borderColor: 'rgba(0,0,0,0.15)' },
        ]}
      >
        {isFirst ? (
          <MaterialCommunityIcons name="crown" size={12} color="#fff" />
        ) : (
          <Text style={podiumStyles.badgeText}>{position}</Text>
        )}
      </View>

      {/* name — white because it's always on the navy hero band */}
      <Text style={podiumStyles.name} numberOfLines={1}>
        {entry.user_name}
      </Text>

      <View style={[podiumStyles.scoreChip, { backgroundColor: medalColor + '35' }]}>
        <Text style={[podiumStyles.scoreValue, { color: medalColor }]}>
          {primaryValue.toLocaleString()}
        </Text>
      </View>

      <Text style={podiumStyles.accuracy}>
        {rankingType === 'answers'
          ? `${entry.accuracy_percentage}% ${t('leaderboard.accuracyShort')}`
          : `${entry.study_streak_days} ${t('leaderboard.dayStreak')}`}
      </Text>
    </View>
  );
};

const podiumStyles = StyleSheet.create({
  card: {
    alignItems: 'center',
    width: (width - 48) / 3,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  cardFirst: {
    marginBottom: 24,
  },
  medalRing: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -10,
  },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
    borderWidth: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fff',
  },
  // white is correct — always sits on navy primary band
  name: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  scoreChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  accuracy: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '500',
  },
});

// ─── Rank Row (rank 4+) ───────────────────────────────────────────────────────

const RankRow = ({
  entry,
  rankingType,
  isMe,
  colors,
  t,
}: {
  entry: RankingEntry;
  rankingType: RankingType;
  isMe: boolean;
  colors: ReturnType<typeof useColors>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) => {
  const primaryValue =
    rankingType === 'answers'
      ? entry.questions_answered
      : entry.questions_contributed;
  const primaryLabel = rankingType === 'answers' ? t('leaderboard.answeredShort') : t('leaderboard.contributedShort');
  const secondary =
    rankingType === 'answers'
      ? `${entry.accuracy_percentage}% ${t('leaderboard.accuracyShort')} • ${entry.mock_tests_completed} ${t('leaderboard.tests')}`
      : `${entry.questions_answered} ${t('leaderboard.answered')} • ${entry.study_streak_days} ${t('leaderboard.dayStreak')}`;

  return (
    <View
      style={[
        rowStyles.row,
        { borderBottomColor: colors.border },
        isMe && { backgroundColor: colors.primary + '0F' },
      ]}
    >
      <Text style={[rowStyles.rank, { color: colors.textTertiary }]}>
        {entry.rank}
      </Text>

      {entry.profile_picture ? (
        <Avatar.Image size={40} source={{ uri: entry.profile_picture }} />
      ) : (
        <Avatar.Text
          size={40}
          label={initials(entry.user_name)}
          style={{ backgroundColor: colors.primary + '25' }}
          labelStyle={{ color: colors.primary, fontWeight: '700', fontSize: 13 }}
        />
      )}

      <View style={rowStyles.info}>
        <View style={rowStyles.nameRow}>
          <Text
            style={[rowStyles.name, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {entry.user_name}
          </Text>
          {isMe && (
            <View style={[rowStyles.youPill, { backgroundColor: colors.primary }]}>
              <Text style={rowStyles.youText}>{t('leaderboard.you')}</Text>
            </View>
          )}
        </View>
        <Text style={[rowStyles.secondary, { color: colors.textSecondary }]}>
          {secondary}
        </Text>
      </View>

      <View style={rowStyles.scoreBox}>
        <Text style={[rowStyles.scoreValue, { color: colors.primary }]}>
          {primaryValue.toLocaleString()}
        </Text>
        <Text style={[rowStyles.scoreLabel, { color: colors.textTertiary }]}>
          {primaryLabel}
        </Text>
      </View>
    </View>
  );
};

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    gap: 12,
  },
  rank: {
    width: 28,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  info: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  secondary: { fontSize: 11, marginTop: 3 },
  youPill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  youText: { fontSize: 9, fontWeight: '800', color: '#fff', letterSpacing: 0.5 },
  scoreBox: { alignItems: 'flex-end' },
  scoreValue: { fontSize: 18, fontWeight: '800' },
  scoreLabel: { fontSize: 10, marginTop: 1 },
});

// ─── My Rank Banner ───────────────────────────────────────────────────────────

const MyRankBanner = ({
  entry,
  rankingType,
  colors,
  t,
}: {
  entry: RankingEntry;
  rankingType: RankingType;
  colors: ReturnType<typeof useColors>;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) => {
  const primaryValue =
    rankingType === 'answers'
      ? entry.questions_answered
      : entry.questions_contributed;

  return (
    <View
      style={[
        bannerStyles.banner,
        { backgroundColor: colors.primary, shadowColor: colors.primary },
      ]}
    >
      <View style={bannerStyles.left}>
        <Text style={bannerStyles.label}>{t('leaderboard.yourRank').toUpperCase()}</Text>
        <Text style={bannerStyles.rankNum}>#{entry.rank}</Text>
      </View>

      <View style={bannerStyles.divider} />

      <View style={bannerStyles.mid}>
        {entry.profile_picture ? (
          <Avatar.Image size={36} source={{ uri: entry.profile_picture }} />
        ) : (
          <Avatar.Text
            size={36}
            label={initials(entry.user_name)}
            style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
            labelStyle={{ color: '#fff', fontWeight: '700' }}
          />
        )}
        <Text style={bannerStyles.name} numberOfLines={1}>
          {entry.user_name}
        </Text>
      </View>

      <View style={bannerStyles.divider} />

      <View style={bannerStyles.right}>
        <Text style={bannerStyles.scoreVal}>
          {primaryValue.toLocaleString()}
        </Text>
        <Text style={bannerStyles.scoreLabel}>
          {rankingType === 'answers' ? t('leaderboard.answered') : t('leaderboard.contributed')}
        </Text>
      </View>
    </View>
  );
};

const bannerStyles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    gap: 12,
  },
  left: { alignItems: 'center', minWidth: 52 },
  label: {
    fontSize: 8,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
  },
  rankNum: { fontSize: 26, fontWeight: '800', color: '#fff' },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  mid: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontSize: 14, fontWeight: '600', color: '#fff', flex: 1 },
  right: { alignItems: 'flex-end', minWidth: 56 },
  scoreVal: { fontSize: 20, fontWeight: '800', color: '#fff' },
  scoreLabel: { fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LeaderboardScreen() {
  const { t } = useTranslation();
  const colors = useColors();
  const [rankingType, setRankingType] = useState<RankingType>('answers');

  const { data, status } = useApi<RankingsResponse>(
    `/api/rankings/?type=${rankingType}`,
  );

  const topUsers = data?.top_users ?? [];
  const myEntry = data?.my_entry ?? null;
  const myRank = myEntry?.rank ?? 0;

  // current user already visible somewhere in the top list?
  const myEntryVisible = myRank >= 1 && myRank <= topUsers.length;

  const podium = topUsers.slice(0, 3);
  const rest = topUsers.slice(3);

  // display order: 2nd left, 1st center, 3rd right
  const podiumOrdered = [podium[1], podium[0], podium[2]].filter(
    (e): e is RankingEntry => !!e,
  );

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: colors.background }}
      edges={['top']}
    >
      {/* ── Hero / header band ── */}
      <View style={[heroStyles.hero, { backgroundColor: colors.primary }]}>
        <View style={heroStyles.titleRow}>
          <MaterialCommunityIcons
            name="trophy"
            size={22}
            color="rgba(255,255,255,0.9)"
          />
          <Text style={heroStyles.title}>{t('leaderboard.title')}</Text>
        </View>
        <Text style={heroStyles.subtitle}>
          {rankingType === 'answers'
            ? t('leaderboard.topSolversSubtitle')
            : t('leaderboard.topContributorsSubtitle')}
        </Text>

        <TabToggle value={rankingType} onChange={setRankingType} colors={colors} t={t} />

        {/* Podium — inside hero band, only if there's at least 1 user */}
        {topUsers.length > 0 && (
          <View style={heroStyles.podiumRow}>
            {podiumOrdered.map((entry) => {
              const pos =
                entry.rank === podium[0]?.rank
                  ? 1
                  : entry.rank === podium[1]?.rank
                  ? 2
                  : 3;
              return (
                <PodiumCard
                  t={t}
                  key={entry.rank}
                  entry={entry}
                  position={pos as 1 | 2 | 3}
                  rankingType={rankingType}
                  colors={colors}
                />
              );
            })}
          </View>
        )}
      </View>

      {/* ── Body ── */}
      {status === 'loading' ? (
        <View style={bodyStyles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : topUsers.length === 0 ? (
        <View style={bodyStyles.center}>
          <View
            style={[
              bodyStyles.emptyIconWrap,
              { backgroundColor: colors.surfaceVariant },
            ]}
          >
            <MaterialCommunityIcons
              name="trophy-outline"
              size={48}
              color={colors.textTertiary}
            />
          </View>
          <Text style={[bodyStyles.emptyTitle, { color: colors.textPrimary }]}>
            {t('leaderboard.noData')}
          </Text>
          <Text style={[bodyStyles.emptySub, { color: colors.textSecondary }]}>
            {rankingType === 'answers'
              ? t('leaderboard.noDataAnswers')
              : t('leaderboard.noDataContributions')}
          </Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={bodyStyles.scroll}
        >
          {/* My rank banner — only when not already in the visible list */}
          {myEntry && !myEntryVisible && (
            <MyRankBanner
              t={t}
              entry={myEntry}
              rankingType={rankingType}
              colors={colors}
            />
          )}

          {/* Section header for the rows below podium */}
          {rest.length > 0 && (
            <View
              style={[
                bodyStyles.sectionHeader,
                { borderBottomColor: colors.border },
              ]}
            >
              <Text
                style={[bodyStyles.sectionLabel, { color: colors.textSecondary }]}
              >
                {t('leaderboard.rankingsSection').toUpperCase()}
              </Text>
              <View
                style={[
                  bodyStyles.countPill,
                  { backgroundColor: colors.primary + '15' },
                ]}
              >
                <Text style={[bodyStyles.countText, { color: colors.primary }]}>
                  {t('leaderboard.usersCount', { count: topUsers.length })}
                </Text>
              </View>
            </View>
          )}

          {/* Rank 4+ list */}
          <View
            style={[
              bodyStyles.listCard,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            {rest.map((entry) => (
              <RankRow
                t={t}
                key={entry.rank}
                entry={entry}
                rankingType={rankingType}
                isMe={entry.rank === myRank}
                colors={colors}
              />
            ))}

            {/* When total users ≤ 3, all are in the podium — show a small note */}
            {rest.length === 0 && topUsers.length > 0 && (
              <View style={bodyStyles.topOnlyNote}>
                <MaterialCommunityIcons
                  name="information-outline"
                  size={16}
                  color={colors.textTertiary}
                />
                <Text
                  style={[bodyStyles.topOnlyText, { color: colors.textTertiary }]}
                >
                  {t('leaderboard.onlyRanked', { count: topUsers.length })}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const heroStyles = StyleSheet.create({
  hero: {
    paddingTop: Spacing.base,
    paddingBottom: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: Spacing.base,
    marginBottom: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  podiumRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.base,
  },
});

const bodyStyles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptySub: {
    fontSize: 14,
    textAlign: 'center',
  },
  scroll: {
    paddingTop: Spacing.base,
    paddingBottom: 60,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  countPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  countText: {
    fontSize: 11,
    fontWeight: '600',
  },
  listCard: {
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  topOnlyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: Spacing.base,
  },
  topOnlyText: {
    fontSize: 13,
  },
});