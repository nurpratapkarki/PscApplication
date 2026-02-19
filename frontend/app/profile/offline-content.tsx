import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, Button, ActivityIndicator, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { useApi } from '../../hooks/useApi';
import { Category } from '../../types/category.types';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { apiRequest, getAccessToken } from '../../services/api/client';
import { Question } from '../../types/question.types';
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';
import {
  getCachedCategoriesMMKV,
  getCachedCategoryInfoMMKV,
  cacheQuestionsMMKV,
  clearCategoryCacheMMKV,
  clearAllQuestionCacheMMKV,
  clearAllApiCache,
  type CachedCategoryInfo,
} from '../../services/storage';

export default function OfflineContentScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const { data: categories } = useApi<Category[]>('/api/categories/for-user/');
  const [cachedCategories, setCachedCategories] = useState<CachedCategoryInfo[]>([]);
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const refreshCacheInfo = useCallback(() => {
    setCachedCategories(getCachedCategoriesMMKV());
  }, []);

  useEffect(() => {
    refreshCacheInfo();
  }, [refreshCacheInfo]);

  const isCached = (catId: number) => cachedCategories.some((c) => c.categoryId === catId);

  const getCacheInfo = (catId: number) => cachedCategories.find((c) => c.categoryId === catId);

  const handleDownload = async (category: Category) => {
    if (downloadingId !== null) return;
    setDownloadingId(category.id);
    try {
      const token = getAccessToken();
      const response = await apiRequest<{ results: Question[] }>(
        `/api/questions/?category=${category.id}&page_size=200`,
        { token: token ?? undefined },
      );
      const questions = response.results ?? response;
      cacheQuestionsMMKV(category.id, category.name_en, questions as unknown[]);
      refreshCacheInfo();
      Alert.alert(
        t('settings.downloadComplete', { defaultValue: 'Downloaded!' }),
        t('settings.downloadCompleteMsg', {
          defaultValue: '{{count}} questions saved for offline use.',
          count: Array.isArray(questions) ? questions.length : 0,
        }),
      );
    } catch {
      Alert.alert(t('common.error'), t('settings.downloadFailed', { defaultValue: 'Failed to download. Check your connection.' }));
    } finally {
      setDownloadingId(null);
    }
  };

  const handleRemove = (category: Category) => {
    Alert.alert(
      t('settings.removeOffline', { defaultValue: 'Remove Offline Data' }),
      t('settings.removeOfflineMsg', { defaultValue: 'Remove downloaded questions for "{{name}}"?', name: lf(category.name_en, category.name_np) }),
      [
        { text: t('common.cancel') },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            clearCategoryCacheMMKV(category.id);
            refreshCacheInfo();
          },
        },
      ],
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      t('settings.clearAllOffline', { defaultValue: 'Clear All Offline Data' }),
      t('settings.clearAllOfflineMsg', { defaultValue: 'This will remove all downloaded questions and cached data.' }),
      [
        { text: t('common.cancel') },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            clearAllQuestionCacheMMKV();
            clearAllApiCache();
            refreshCacheInfo();
            Alert.alert(t('settings.cacheCleared', { defaultValue: 'Cache Cleared' }));
          },
        },
      ],
    );
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings.offlineContent', { defaultValue: 'Offline Content' })}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Card.Content style={styles.summaryContent}>
            <MaterialCommunityIcons name="download-circle" size={40} color={colors.primary} />
            <View style={{ marginLeft: Spacing.md, flex: 1 }}>
              <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                {cachedCategories.length} {t('settings.categoriesSaved', { defaultValue: 'categories saved' })}
              </Text>
              <Text style={[styles.summarySubtitle, { color: colors.textSecondary }]}>
                {cachedCategories.reduce((sum, c) => sum + c.questionCount, 0)} {t('settings.questionsOffline', { defaultValue: 'questions available offline' })}
              </Text>
            </View>
            {cachedCategories.length > 0 && (
              <TouchableOpacity onPress={handleClearAll}>
                <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.error} />
              </TouchableOpacity>
            )}
          </Card.Content>
        </Card>

        {/* Downloaded categories */}
        {cachedCategories.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>{t('settings.downloaded', { defaultValue: 'Downloaded' })}</Text>
            <Card style={styles.card}>
              {cachedCategories.map((cached, index) => {
                const cat = categories?.find((c) => c.id === cached.categoryId);
                return (
                  <View key={cached.categoryId}>
                    <View style={styles.categoryRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.categoryName, { color: colors.textPrimary }]}>
                          {cat ? lf(cat.name_en, cat.name_np) : cached.categoryName}
                        </Text>
                        <Text style={[styles.categoryMeta, { color: colors.textTertiary }]}>
                          {cached.questionCount} {t('tests.questions', { defaultValue: 'questions' })} · {formatDate(cached.cachedAt)}
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => cat && handleRemove(cat)}
                        style={[styles.actionBtn, { backgroundColor: colors.errorLight }]}
                      >
                        <MaterialCommunityIcons name="close" size={18} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                    {index < cachedCategories.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  </View>
                );
              })}
            </Card>
          </>
        )}

        {/* Available to download */}
        <Text style={styles.sectionTitle}>{t('settings.availableToDownload', { defaultValue: 'Available to Download' })}</Text>
        <Card style={styles.card}>
          {categories?.filter((c) => !isCached(c.id)).map((cat, index, arr) => (
            <View key={cat.id}>
              <View style={styles.categoryRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {lf(cat.name_en, cat.name_np)}
                  </Text>
                  <Text style={[styles.categoryMeta, { color: colors.textTertiary }]}>
                    {cat.scope_type} {cat.question_count ? `· ${cat.question_count} ${t('tests.questions', { defaultValue: 'questions' })}` : ''}
                  </Text>
                </View>
                {downloadingId === cat.id ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <TouchableOpacity
                    onPress={() => handleDownload(cat)}
                    style={[styles.actionBtn, { backgroundColor: colors.primaryLight + '30' }]}
                    disabled={downloadingId !== null}
                  >
                    <MaterialCommunityIcons name="download" size={18} color={colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
              {index < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
          {(!categories || categories.filter((c) => !isCached(c.id)).length === 0) && (
            <View style={{ padding: Spacing.lg, alignItems: 'center' }}>
              <Text style={[styles.categoryMeta, { color: colors.textSecondary }]}>
                {t('settings.allDownloaded', { defaultValue: 'All categories are downloaded!' })}
              </Text>
            </View>
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  summaryCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  summaryContent: { flexDirection: 'row', alignItems: 'center' },
  summaryTitle: { fontSize: 16, fontWeight: '700' },
  summarySubtitle: { fontSize: 13 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  card: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.lg },
  categoryRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  categoryName: { fontSize: 14, fontWeight: '500' },
  categoryMeta: { fontSize: 11 },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, marginLeft: Spacing.base },
});
