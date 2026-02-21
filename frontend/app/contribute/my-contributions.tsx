import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { Contribution, ContributionStatus } from '../../types/contribution.types';
import { useColors } from '../../hooks/useColors';

type FilterKey = 'all' | 'pending' | 'approved' | 'rejected';

const getStatusMeta = (
  status: ContributionStatus,
  colors: ReturnType<typeof useColors>,
  t: (key: string) => string
) => {
  switch (status) {
    case 'APPROVED':
    case 'MADE_PUBLIC':
      return { color: colors.success, icon: 'check-circle', label: status === 'MADE_PUBLIC' ? t('contribute.statusPublic') : t('contribute.statusApproved') };
    case 'REJECTED':
      return { color: colors.error, icon: 'close-circle', label: t('contribute.statusRejected') };
    default:
      return { color: colors.warning, icon: 'clock-outline', label: t('contribute.statusPending') };
  }
};

function ContributionCard({
  contribution,
  onPress,
  colors,
  t,
  dateLocale,
}: {
  contribution: Contribution;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
  t: (k: string, opts?: any) => string;
  dateLocale: string;
}) {
  const meta = getStatusMeta(contribution.status, colors, t);
  const date = new Date(contribution.created_at).toLocaleDateString(dateLocale, {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[
        cardStyles.card,
        { backgroundColor: colors.surface, borderLeftColor: meta.color },
      ]}
    >
      <View style={cardStyles.top}>
        {/* Status badge */}
        <View style={[cardStyles.badge, { backgroundColor: meta.color + '15' }]}>
          <MaterialCommunityIcons name={meta.icon as any} size={12} color={meta.color} />
          <Text style={[cardStyles.badgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>

        <View style={cardStyles.topRight}>
          {contribution.is_featured && (
            <MaterialCommunityIcons name="star" size={16} color={colors.warning} />
          )}
          <Text style={[cardStyles.date, { color: colors.textTertiary }]}>{date}</Text>
        </View>
      </View>

      <Text style={[cardStyles.questionText, { color: colors.textPrimary }]} numberOfLines={2}>
        {contribution.question_text}
      </Text>

      {contribution.rejection_reason && (
        <View style={[cardStyles.rejectionBox, { backgroundColor: colors.error + '10', borderColor: colors.error + '30' }]}>
          <MaterialCommunityIcons name="alert-circle-outline" size={13} color={colors.error} />
          <Text style={[cardStyles.rejectionText, { color: colors.error }]} numberOfLines={2}>
            {contribution.rejection_reason}
          </Text>
        </View>
      )}

      <View style={cardStyles.footer}>
        <Text style={[cardStyles.footerAction, { color: colors.primary }]}>
          {contribution.status === 'REJECTED' ? t('contribute.resubmitForReview') : t('profile.viewDetails')} →
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 3,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: { fontSize: 11, fontWeight: '700' },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  date: { fontSize: 11 },
  questionText: { fontSize: 14, lineHeight: 21, fontWeight: '500', marginBottom: 8 },
  rejectionBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  rejectionText: { flex: 1, fontSize: 12, lineHeight: 18 },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(0,0,0,0.06)', paddingTop: 8 },
  footerAction: { fontSize: 12, fontWeight: '600' },
});

export default function MyContributionsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const [filter, setFilter] = useState<FilterKey>('all');
  const { data: contributions, status } = usePaginatedApi<Contribution>('/api/contributions/');
  const dateLocale = i18n.language === 'NP' ? 'ne-NP' : 'en-US';

  const counts: Record<FilterKey, number> = {
    all: contributions?.length || 0,
    pending: contributions?.filter(c => c.status === 'PENDING').length || 0,
    approved: contributions?.filter(c => c.status === 'APPROVED' || c.status === 'MADE_PUBLIC').length || 0,
    rejected: contributions?.filter(c => c.status === 'REJECTED').length || 0,
  };

  const filteredContributions = contributions?.filter(c => {
    if (filter === 'all') return true;
    if (filter === 'pending') return c.status === 'PENDING';
    if (filter === 'approved') return c.status === 'APPROVED' || c.status === 'MADE_PUBLIC';
    if (filter === 'rejected') return c.status === 'REJECTED';
    return true;
  });

  const filterTabs: { key: FilterKey; label: string; color: string }[] = [
    { key: 'all', label: t('contribute.filterAll'), color: colors.primary },
    { key: 'pending', label: t('contribute.filterPending'), color: colors.warning },
    { key: 'approved', label: t('contribute.filterApproved'), color: colors.success },
    { key: 'rejected', label: t('contribute.filterRejected'), color: colors.error },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Hero Header ── */}
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.heroBackBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>{t('contribute.myContributions')}</Text>
            <Text style={styles.heroSubtitle}>{t('contribute.questionsSubmitted', { count: counts.all })}</Text>
          </View>
          <TouchableOpacity
            style={styles.heroAddBtn}
            onPress={() => router.push('/contribute/add-question')}
          >
            <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Summary pills */}
        <View style={styles.summaryRow}>
          {[
            { label: t('contribute.filterApproved'), value: counts.approved, color: colors.success },
            { label: t('contribute.filterPending'), value: counts.pending, color: colors.warning },
            { label: t('contribute.filterRejected'), value: counts.rejected, color: colors.error },
          ].map((item, i) => (
            <View key={i} style={[styles.summaryPill, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={styles.summaryValue}>{item.value}</Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── Filter tabs ── */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {filterTabs.map(tab => {
            const active = filter === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: active ? tab.color + '15' : 'transparent',
                    borderColor: active ? tab.color : 'transparent',
                  },
                ]}
                onPress={() => setFilter(tab.key)}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: active ? tab.color : colors.textSecondary },
                ]}>
                  {tab.label}
                </Text>
                <View style={[
                  styles.filterCount,
                  { backgroundColor: active ? tab.color : colors.surfaceVariant },
                ]}>
                  <Text style={[
                    styles.filterCountText,
                    { color: active ? '#fff' : colors.textSecondary },
                  ]}>
                    {counts[tab.key]}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Content ── */}
      {status === 'loading' ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !filteredContributions || filteredContributions.length === 0 ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="file-document-outline" size={36} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {filter === 'all'
              ? t('contribute.noContributions')
              : t('contribute.noContributionsForFilter', { filter: t(`contribute.filter${filter[0].toUpperCase()}${filter.slice(1)}`) })}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {filter === 'all'
              ? t('contribute.noContributionsYet')
              : t('contribute.noQuestionsForFilter', { filter: t(`contribute.filter${filter[0].toUpperCase()}${filter.slice(1)}`) })}
          </Text>
          {filter === 'all' && (
            <TouchableOpacity
              style={[styles.emptyAction, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/contribute/add-question')}
            >
              <MaterialCommunityIcons name="plus" size={16} color="#fff" />
              <Text style={styles.emptyActionText}>{t('contribute.addFirstQuestion')}</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredContributions}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ContributionCard
              contribution={item}
              onPress={() => router.push(`/contribute/${item.id}/edit`)}
              colors={colors}
              t={t}
              dateLocale={dateLocale}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },

  // Hero
  hero: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 20 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  heroBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitleWrap: { flex: 1 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  heroAddBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  summaryRow: { flexDirection: 'row', gap: 8 },
  summaryPill: {
    flex: 1, alignItems: 'center', paddingVertical: 10,
    borderRadius: 12,
  },
  summaryValue: { fontSize: 20, fontWeight: '800', color: '#fff' },
  summaryLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },

  // Filter bar
  filterBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterScroll: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingVertical: 10 },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterTabText: { fontSize: 13, fontWeight: '600' },
  filterCount: {
    minWidth: 20, height: 18,
    borderRadius: 9,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterCountText: { fontSize: 10, fontWeight: '700' },

  // List
  listContent: { padding: 16, paddingBottom: 32 },

  // Empty
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },
  emptyAction: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 20, paddingVertical: 11,
    borderRadius: 12, marginTop: 8,
  },
  emptyActionText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
