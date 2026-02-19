import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, SectionList, View, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Searchbar, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { getCachedCategories } from '../../services/questionCache';
import type { Category } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

type ScopeFilter = 'ALL' | 'UNIVERSAL' | 'BRANCH' | 'SUBBRANCH';

const getScopeIcon = (scope: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  switch (scope) {
    case 'UNIVERSAL': return 'earth';
    case 'BRANCH': return 'source-branch';
    case 'SUBBRANCH': return 'source-fork';
    default: return 'folder';
  }
};

const getScopeColor = (scope: string) => {
  switch (scope) {
    case 'UNIVERSAL': return Colors.info;
    case 'BRANCH': return Colors.accent;
    case 'SUBBRANCH': return Colors.secondary;
    default: return Colors.textSecondary;
  }
};

const getCategoryIcon = (category: Category): keyof typeof MaterialCommunityIcons.glyphMap => {
  if (category.icon && !category.icon.startsWith('http') && !category.icon.startsWith('/media')) {
    return category.icon as keyof typeof MaterialCommunityIcons.glyphMap;
  }
  const slugIcons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    'general-knowledge': 'lightbulb-on',
    'constitution-of-nepal': 'book-open-page-variant',
    'current-affairs': 'newspaper',
    'lok-sewa-regulations': 'file-document',
    'nepali-language-grammar': 'translate',
    'english-language': 'alphabetical',
    'quantitative-aptitude': 'calculator-variant',
    'reasoning-mental-ability': 'head-cog',
    'computer-knowledge': 'laptop',
    'good-governance-ethics': 'shield-check',
    'geography-of-nepal': 'map',
    'history-of-nepal': 'clock-outline',
    'public-administration': 'office-building',
    'engineering-mathematics': 'function-variant',
    'public-health': 'hospital-box',
    'education-policy-planning': 'school',
    'legal-system-nepal': 'gavel',
    'agricultural-science': 'sprout',
    'forest-management-ecology': 'tree',
    'accounting-auditing': 'calculator',
    'international-relations-diplomacy': 'earth',
  };
  return slugIcons[category.slug] || 'folder';
};

const PracticeCategoriesScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const { data: categories, status, error } = useApi<Category[]>('/api/categories/for-user/');
  const [searchQuery, setSearchQuery] = useState('');
  const [scopeFilter, setScopeFilter] = useState<ScopeFilter>('ALL');
  const [cachedIds, setCachedIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    getCachedCategories().then((cached) => {
      setCachedIds(new Set(cached.map((c) => c.categoryId)));
    });
  }, []);

  const sections = useMemo(() => {
    if (!categories) return [];

    let filtered = categories;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((c) =>
        c.name_en.toLowerCase().includes(q) ||
        c.name_np.toLowerCase().includes(q)
      );
    }

    if (scopeFilter !== 'ALL') {
      filtered = filtered.filter((c) => c.scope_type === scopeFilter);
    }

    const groups: Record<string, Category[]> = {
      UNIVERSAL: [],
      BRANCH: [],
      SUBBRANCH: [],
    };

    for (const cat of filtered) {
      const scope = cat.scope_type || 'UNIVERSAL';
      if (groups[scope]) {
        groups[scope].push(cat);
      }
    }

    const sectionData: { title: string; scope: string; subtitle: string; data: Category[] }[] = [];

    if (groups.UNIVERSAL.length > 0) {
      sectionData.push({
        title: t('practice.universalSubjects', { defaultValue: 'Common Subjects' }),
        scope: 'UNIVERSAL',
        subtitle: t('practice.universalDesc', { defaultValue: 'Applicable to all exam types' }),
        data: groups.UNIVERSAL,
      });
    }

    if (groups.BRANCH.length > 0) {
      sectionData.push({
        title: t('practice.branchSubjects', { defaultValue: 'Service Specific' }),
        scope: 'BRANCH',
        subtitle: t('practice.branchDesc', { defaultValue: 'For your selected service branch' }),
        data: groups.BRANCH,
      });
    }

    if (groups.SUBBRANCH.length > 0) {
      sectionData.push({
        title: t('practice.subBranchSubjects', { defaultValue: 'Specialization' }),
        scope: 'SUBBRANCH',
        subtitle: t('practice.subBranchDesc', { defaultValue: 'For your specific post/specialization' }),
        data: groups.SUBBRANCH,
      });
    }

    return sectionData;
  }, [categories, searchQuery, scopeFilter, t]);

  const totalCount = categories?.length || 0;
  const scopeCounts = useMemo(() => {
    if (!categories) return { UNIVERSAL: 0, BRANCH: 0, SUBBRANCH: 0 };
    return {
      UNIVERSAL: categories.filter(c => c.scope_type === 'UNIVERSAL').length,
      BRANCH: categories.filter(c => c.scope_type === 'BRANCH').length,
      SUBBRANCH: categories.filter(c => c.scope_type === 'SUBBRANCH').length,
    };
  }, [categories]);

  const handleSelectCategory = (categoryId: number) => {
    router.navigate({ pathname: `/practice/${categoryId}` });
  };

  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: t('practice.selectCategory') }} />
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('practice.loadingCategories')}</Text>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: t('practice.selectCategory') }} />
        <MaterialCommunityIcons name="alert-circle" size={60} color={Colors.error} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>{t('practice.failedToLoadCategories')}</Text>
        <Text style={[styles.errorSubText, { color: colors.textSecondary }]}>{String(error)}</Text>
      </SafeAreaView>
    );
  }

  const filters: { key: ScopeFilter; label: string; count: number }[] = [
    { key: 'ALL', label: t('common.allTests', { defaultValue: 'All' }), count: totalCount },
    { key: 'UNIVERSAL', label: t('practice.common', { defaultValue: 'Common' }), count: scopeCounts.UNIVERSAL },
    { key: 'BRANCH', label: t('practice.service', { defaultValue: 'Service' }), count: scopeCounts.BRANCH },
    { key: 'SUBBRANCH', label: t('practice.specialization', { defaultValue: 'Specific' }), count: scopeCounts.SUBBRANCH },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: t('practice.selectCategory') }} />

      <View style={styles.searchContainer}>
        <Searchbar
          placeholder={t('practice.searchCategories')}
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchbar, { backgroundColor: colors.surface }]}
          inputStyle={[styles.searchInput, { color: colors.textPrimary }]}
          icon={() => <MaterialCommunityIcons name="magnify" size={22} color={colors.textSecondary} />}
        />
      </View>

      {/* Scope Filter Chips */}
      <View style={[styles.filterRow, { borderBottomColor: colors.border }]}>
        {filters.map((f) => {
          const isActive = scopeFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setScopeFilter(f.key)}
              style={[
                styles.filterPill,
                { backgroundColor: isActive ? Colors.primary : colors.surfaceVariant },
              ]}
            >
              <Text style={[
                styles.filterPillText,
                { color: isActive ? Colors.white : colors.textSecondary },
              ]}>
                {f.label} ({f.count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconBg, { backgroundColor: getScopeColor(section.scope) + '20' }]}>
                <MaterialCommunityIcons name={getScopeIcon(section.scope)} size={18} color={getScopeColor(section.scope)} />
              </View>
              <View>
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textTertiary }]}>{section.subtitle}</Text>
              </View>
            </View>
          </View>
        )}
        renderItem={({ item: category }) => {
          const iconName = getCategoryIcon(category);
          const hasImage = category.icon && (category.icon.startsWith('http') || category.icon.startsWith('/media'));
          const scopeColor = getScopeColor(category.scope_type);

          return (
            <TouchableOpacity onPress={() => handleSelectCategory(category.id)} activeOpacity={0.7}>
              <View style={[styles.card, { backgroundColor: colors.surface, borderLeftColor: scopeColor }]}>
                <View style={[styles.iconContainer, { backgroundColor: scopeColor + '15' }]}>
                  {hasImage ? (
                    <Image source={{ uri: category.icon! }} style={styles.categoryIcon} />
                  ) : (
                    <MaterialCommunityIcons name={iconName} size={26} color={scopeColor} />
                  )}
                </View>
                <View style={styles.textContainer}>
                  <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {lf(category.name_en, category.name_np)}
                  </Text>
                  <Text style={[styles.categoryNameNp, { color: colors.textSecondary }]} numberOfLines={1}>
                    {category.name_np}
                  </Text>
                  <View style={styles.metaRow}>
                    {category.question_count !== undefined && (
                      <View style={[styles.countBadge, { backgroundColor: colors.surfaceVariant }]}>
                        <MaterialCommunityIcons name="help-circle-outline" size={12} color={colors.textSecondary} />
                        <Text style={[styles.countText, { color: colors.textSecondary }]}>
                          {category.question_count}
                        </Text>
                      </View>
                    )}
                    {cachedIds.has(category.id) && (
                      <View style={[styles.cachedBadge, { backgroundColor: Colors.success + '15' }]}>
                        <MaterialCommunityIcons name="cloud-check" size={12} color={Colors.success} />
                        <Text style={[styles.cachedText, { color: Colors.success }]}>
                          {t('practice.offline', { defaultValue: 'Offline' })}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-search" size={60} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('practice.noCategories')}</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default PracticeCategoriesScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Spacing.base },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  errorText: { fontSize: 18, fontWeight: '600', marginTop: Spacing.base },
  errorSubText: { fontSize: 14, textAlign: 'center' },
  searchContainer: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.sm },
  searchbar: { borderRadius: BorderRadius.lg, elevation: 2 },
  searchInput: { fontSize: 15 },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.md,
    gap: Spacing.xs,
  },
  filterPill: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
  },
  filterPillText: { fontSize: 12, fontWeight: '600' },
  listContainer: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  sectionHeader: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  sectionSubtitle: { fontSize: 12, marginTop: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    elevation: 1,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
    overflow: 'hidden',
  },
  categoryIcon: { width: 34, height: 34, borderRadius: 4 },
  textContainer: { flex: 1 },
  categoryName: { fontSize: 15, fontWeight: '600' },
  categoryNameNp: { fontSize: 12, marginTop: 1 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  countText: { fontSize: 11, fontWeight: '500' },
  cachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  cachedText: { fontSize: 11, fontWeight: '500' },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing['3xl'] },
  emptyText: { fontSize: 16, marginTop: Spacing.base },
});
