import React, { useMemo, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { useApi } from '../../hooks/useApi';
import { MockTest } from '../../types/test.types';
import { UserProfile } from '../../types/user.types';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { BannerAdSafe } from '../../components/ads/BannerAdSafe';

type TestFilter = 'ALL' | 'MY_BRANCH' | 'OFFICIAL' | 'COMMUNITY' | 'CUSTOM';

const getTestIcon = (type: string): { icon: string; color: (c: any) => string } => {
  switch (type) {
    case 'OFFICIAL': return { icon: 'shield-check', color: (c: any) => c.primary };
    case 'COMMUNITY': return { icon: 'account-group', color: (c: any) => c.secondary };
    default: return { icon: 'account-circle', color: (c: any) => c.accent };
  }
};

const TestCard = React.memo(function TestCard({
  test,
  onPress,
  colors,
  lf,
  isPreferred,
  t,
}: {
  test: MockTest;
  onPress: () => void;
  colors: ReturnType<typeof import('../../hooks/useColors').useColors>;
  lf: ReturnType<typeof import('../../hooks/useLocalizedField').useLocalizedField>;
  isPreferred: boolean;
  t: (key: string) => string;
}) {
  const { icon: iconName, color: getColor } = getTestIcon(test.test_type);
  const iconBgColor = getColor(colors);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[
        styles.testCard,
        { backgroundColor: colors.surface },
        isPreferred && { borderLeftWidth: 3, borderLeftColor: colors.primary },
      ]}>
        <View style={[styles.testIconContainer, { backgroundColor: iconBgColor + '15' }]}>
          <MaterialCommunityIcons name={iconName as any} size={24} color={iconBgColor} />
        </View>

        <View style={styles.testContent}>
          <View style={styles.testTitleRow}>
            <Text style={[styles.testTitle, { color: colors.textPrimary }]} numberOfLines={2}>
              {lf(test.title_en, test.title_np)}
            </Text>
            {isPreferred && (
              <View style={[styles.preferredBadge, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="star" size={10} color={colors.primary} />
                <Text style={[styles.preferredText, { color: colors.primary }]}>{t('tests.yourBranch')}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.testBranch, { color: colors.textSecondary }]} numberOfLines={1}>
            {test.branch_name}
          </Text>
          <View style={styles.testMetaRow}>
            <View style={styles.metaBadge}>
              <MaterialCommunityIcons name="help-circle-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {test.total_questions} {t('tests.questions')}
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {test.duration_minutes} {t('tests.minutes')}
              </Text>
            </View>
          </View>
        </View>

        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
});

// ── Tab Toggle (reusing leaderboard pattern) ──────────────────────────────────
const FilterToggle = ({
  value,
  onChange,
  colors,
  counts,
  t,
}: {
  value: TestFilter;
  onChange: (v: TestFilter) => void;
  colors: ReturnType<typeof import('../../hooks/useColors').useColors>;
  counts: Record<TestFilter, number>;
  t: (key: string) => string;
}) => {
  const tabs: { key: TestFilter; label: string; icon: string }[] = [
    { key: 'ALL', label: t('common.allTests'), icon: 'view-grid' },
    { key: 'MY_BRANCH', label: t('tests.myBranch'), icon: 'star' },
    { key: 'OFFICIAL', label: t('tests.official'), icon: 'shield-check' },
    { key: 'COMMUNITY', label: t('tests.community'), icon: 'account-group' },
    { key: 'CUSTOM', label: t('tests.myTests'), icon: 'account-circle' },
  ];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.filterRow}
    >
      {tabs.map((tab) => {
        const active = value === tab.key;
        // Hide My Branch tab if no branch tests exist
        if (tab.key === 'MY_BRANCH' && counts.MY_BRANCH === 0) return null;
        // Hide My Tests tab if no custom tests
        if (tab.key === 'CUSTOM' && counts.CUSTOM === 0) return null;
        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.filterChip,
              {
                backgroundColor: active ? colors.primary : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={14}
              color={active ? colors.white : colors.textSecondary}
            />
            <Text style={[
              styles.filterChipText,
              { color: active ? colors.white : colors.textSecondary },
            ]}>
              {tab.label}
            </Text>
            {counts[tab.key] > 0 && (
              <View style={[
                styles.filterCount,
                { backgroundColor: active ? 'rgba(255,255,255,0.25)' : colors.surfaceVariant },
              ]}>
                <Text style={[
                  styles.filterCountText,
                  { color: active ? colors.white : colors.textSecondary },
                ]}>
                  {counts[tab.key]}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function TestsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();

  const { data: tests, status } = usePaginatedApi<MockTest>('/api/mock-tests/');
  const { data: userProfile } = useApi<UserProfile>('/api/auth/user/');

  const [filter, setFilter] = useState<TestFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const userBranch = userProfile?.target_branch ?? userProfile?.branch ?? null;
  const userSubBranch = userProfile?.target_sub_branch ?? null;

  // ── Sorting: user's branch tests first ───────────────────────────────────
  const sortedTests = useMemo(() => {
    if (!tests) return [];
    return [...tests].sort((a, b) => {
      const aMatch = a.branch === userBranch ? 2 : 0 +
        (a.sub_branch === userSubBranch && userSubBranch ? 1 : 0);
      const bMatch = b.branch === userBranch ? 2 : 0 +
        (b.sub_branch === userSubBranch && userSubBranch ? 1 : 0);
      return bMatch - aMatch;
    });
  }, [tests, userBranch, userSubBranch]);

  // ── Counts per filter tab ─────────────────────────────────────────────────
  const counts = useMemo((): Record<TestFilter, number> => {
    if (!sortedTests) return { ALL: 0, MY_BRANCH: 0, OFFICIAL: 0, COMMUNITY: 0, CUSTOM: 0 };
    return {
      ALL: sortedTests.length,
      MY_BRANCH: sortedTests.filter(t => t.branch === userBranch).length,
      OFFICIAL: sortedTests.filter(t => t.test_type === 'OFFICIAL').length,
      COMMUNITY: sortedTests.filter(t => t.test_type === 'COMMUNITY').length,
      CUSTOM: sortedTests.filter(t => t.test_type === 'CUSTOM').length,
    };
  }, [sortedTests, userBranch]);

  // ── Filtered + searched list ──────────────────────────────────────────────
  const filteredTests = useMemo(() => {
    let result = sortedTests;

    // Apply tab filter
    switch (filter) {
      case 'MY_BRANCH':
        result = result.filter(t => t.branch === userBranch);
        break;
      case 'OFFICIAL':
        result = result.filter(t => t.test_type === 'OFFICIAL');
        break;
      case 'COMMUNITY':
        result = result.filter(t => t.test_type === 'COMMUNITY');
        break;
      case 'CUSTOM':
        result = result.filter(t => t.test_type === 'CUSTOM');
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t =>
        t.title_en.toLowerCase().includes(q) ||
        t.title_np?.toLowerCase().includes(q) ||
        t.branch_name?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [sortedTests, filter, searchQuery, userBranch]);

  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Header ── */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              {t('tests.mockTests')}
            </Text>
            {userProfile?.branch_name && (
              <Text style={[styles.headerBranch, { color: colors.textSecondary }]}>
                {userProfile.branch_name}
              </Text>
            )}
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/tests/history')}
            >
              <MaterialCommunityIcons name="history" size={20} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.surface }]}
              onPress={() => router.push('/tests/create')}
            >
              <MaterialCommunityIcons name="plus" size={20} color={colors.accent} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search bar */}
        <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            placeholder={t('tests.searchTests', { defaultValue: 'Search tests...' })}
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter toggle */}
        <FilterToggle
          value={filter}
          onChange={setFilter}
          colors={colors}
          counts={counts}
          t={t}
        />
      </View>

      {/* ── Test List ── */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredTests.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
            <View style={[styles.emptyIconWrapper, { backgroundColor: colors.surfaceVariant }]}>
              <MaterialCommunityIcons name="clipboard-search-outline" size={36} color={colors.textTertiary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {searchQuery ? t('tests.noResults') : t('tests.noTestsAvailable')}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery
                ? t('tests.noResultsForQuery', { query: searchQuery })
                : t('tests.checkBackLater')}
            </Text>
          </View>
        ) : (
          <View style={styles.testsContainer}>
            {filteredTests.map((test, index) => {
              const isPreferred = test.branch === userBranch;
              return (
                <React.Fragment key={test.id}>
                  <TestCard
                    test={test}
                    onPress={() => router.push(`/tests/${test.id}`)}
                    colors={colors}
                    lf={lf}
                    isPreferred={isPreferred}
                    t={t}
                  />
                  {/* Banner ad after every 8th test card */}
                  {(index + 1) % 8 === 0 && (
                    <BannerAdSafe style={{ marginVertical: 8 }} />
                  )}
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16, paddingBottom: 32 },

  // Header
  header: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerTitle: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  headerBranch: { fontSize: 13, marginTop: 2 },
  headerActions: { flexDirection: 'row', gap: 8 },
  headerActionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 12,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },

  // Filter chips
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 12 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontWeight: '600' },
  filterCount: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  filterCountText: { fontSize: 11, fontWeight: '700' },

  // Tests
  testsContainer: { gap: 12 },
  testCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  testIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  testContent: { flex: 1 },
  testTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 4 },
  testTitle: { fontSize: 15, fontWeight: '600', flex: 1, lineHeight: 22 },
  preferredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  preferredText: { fontSize: 9, fontWeight: '700' },
  testBranch: { fontSize: 13, marginBottom: 8 },
  testMetaRow: { flexDirection: 'row', gap: 12 },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12 },

  // Empty
  emptyState: {
    borderRadius: 16,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 24,
  },
  emptyIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  emptyText: { fontSize: 14, textAlign: 'center' },
});
