import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Searchbar, Text, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { getCachedCategories } from '../../services/questionCache';
import type { Category } from '../../types';
import { Spacing, BorderRadius } from '../../constants/typography';

const PracticeCategoriesScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const { data: categories, status, error } = useApi<Category[]>('/api/categories/for-user/');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [cachedIds, setCachedIds] = useState<Set<number>>(new Set());

  // Load cached category IDs
  useEffect(() => {
    getCachedCategories().then((cached) => {
      setCachedIds(new Set(cached.map((c) => c.categoryId)));
    });
  }, []);

  useEffect(() => {
    if (categories) {
      if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        const filtered = categories.filter((category) =>
          category.name_en.toLowerCase().includes(lowercasedQuery) ||
          category.name_np.toLowerCase().includes(lowercasedQuery)
        );
        setFilteredCategories(filtered);
      } else {
        setFilteredCategories(categories);
      }
    }
  }, [searchQuery, categories]);

  const handleSelectCategory = (categoryId: number) => {
    router.navigate({ pathname: `/practice/${categoryId}` });
  };

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('practice.loadingCategories')}</Text>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={60} color={colors.error} />
        <Text style={[styles.errorText, { color: colors.textPrimary }]}>{t('practice.failedToLoadCategories')}</Text>
        <Text style={[styles.errorSubText, { color: colors.textSecondary }]}>{String(error)}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
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

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-search" size={60} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('practice.noCategories')}</Text>
          </View>
        ) : (
          filteredCategories.map((category) => (
            <TouchableOpacity key={category.id} onPress={() => handleSelectCategory(category.id)} activeOpacity={0.7}>
              <Card style={[styles.card, { backgroundColor: colors.surface }]}>
                <Card.Content style={styles.cardContent}>
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                    {category.icon && (category.icon.startsWith('http') || category.icon.startsWith('/media')) ? (
                      <Image source={{ uri: category.icon }} style={styles.categoryIcon} />
                    ) : (
                      <MaterialCommunityIcons name={(category.icon as any) || 'folder'} size={28} color={colors.primary} />
                    )}
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[styles.categoryName, { color: colors.primary }]}>
                      {lf(category.name_en, category.name_np)}
                    </Text>
                    <Text style={[styles.categoryNameNp, { color: colors.textSecondary }]}>{category.name_np}</Text>
                    {category.question_count !== undefined && (
                      <Chip compact style={[styles.countChip, { backgroundColor: colors.surfaceVariant }]} textStyle={[styles.countChipText, { color: colors.textSecondary }]}>
                        {category.question_count} {t('common.questions')}
                      </Chip>
                    )}
                  </View>
                  {cachedIds.has(category.id) && (
                    <MaterialCommunityIcons name="cloud-check-outline" size={18} color={colors.success} style={{ marginRight: Spacing.xs }} />
                  )}
                  <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  searchContainer: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  searchbar: { borderRadius: BorderRadius.lg, elevation: 2 },
  searchInput: { fontSize: 15 },
  listContainer: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing['3xl'] },
  emptyText: { fontSize: 16, marginTop: Spacing.base },
  card: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md, elevation: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  iconContainer: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md, overflow: 'hidden' },
  categoryIcon: { width: 36, height: 36, borderRadius: 4 },
  textContainer: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: '600' },
  categoryNameNp: { fontSize: 13, marginTop: 2 },
  countChip: { alignSelf: 'flex-start', marginTop: Spacing.xs },
  countChipText: { fontSize: 11 },
});
