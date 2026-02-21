import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ActivityIndicator, View, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import { useColors } from '../../../hooks/useColors';
import { useLocalizedField } from '../../../hooks/useLocalizedField';
import { Category } from '../../../types/category.types';
import { cacheQuestions, getCachedCategoryInfo, clearCategoryCache, CachedCategoryInfo } from '../../../services/questionCache';
import { downloadCategoryQuestions } from '../../../services/offlineQuestions';
import { ColorScheme } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 50;

const PracticeSetupScreen = () => {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ categoryId: string }>();
  const categoryId = params.categoryId;

  const { data: category, status } = useApi<Category>(
    categoryId ? `/api/categories/${categoryId}/` : '',
    !categoryId,
  );

  const [numberOfQuestions, setNumberOfQuestions] = React.useState('10');
  const [cacheInfo, setCacheInfo] = useState<CachedCategoryInfo | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'downloading' | 'done' | 'error'>('idle');

  // Check cache status on mount
  useEffect(() => {
    if (!categoryId) return;
    getCachedCategoryInfo(Number(categoryId)).then(setCacheInfo);
  }, [categoryId]);

  const handleDownload = useCallback(async () => {
    if (!categoryId) return;
    setDownloadStatus('downloading');
    try {
      const questions = await downloadCategoryQuestions(Number(categoryId));
      const categoryName = category
        ? lf(category.name_en, category.name_np)
        : cacheInfo?.categoryName ?? `Category ${categoryId}`;

      await cacheQuestions(Number(categoryId), categoryName, questions);
      const info = await getCachedCategoryInfo(Number(categoryId));
      setCacheInfo(info);
      setDownloadStatus('done');
    } catch {
      setDownloadStatus('error');
    }
  }, [categoryId, category, cacheInfo?.categoryName, lf]);

  const handleRemoveDownload = useCallback(async () => {
    if (!categoryId) return;
    await clearCategoryCache(Number(categoryId));
    setCacheInfo(null);
    setDownloadStatus('idle');
  }, [categoryId]);

  const questionCount = parseInt(numberOfQuestions, 10);
  const isValid = !isNaN(questionCount) && questionCount >= MIN_QUESTIONS && questionCount <= MAX_QUESTIONS;

  const handleStartPractice = () => {
    if (!categoryId || !isValid) return;
    const offlineCategoryName = category
      ? lf(category.name_en, category.name_np)
      : cacheInfo?.categoryName ?? `Category ${categoryId}`;

    router.push({
      pathname: `/practice/[categoryId]/question`,
      params: { categoryId, count: numberOfQuestions, categoryName: offlineCategoryName },
    });
  };

  if (status === 'loading' && !cacheInfo) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator animating={true} size="large" color={colors.primary} />
        <Text style={styles.loadingText}>{t('practice.loadingCategory')}</Text>
      </SafeAreaView>
    );
  }

  if (!category && !cacheInfo) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Stack.Screen options={{ title: t('common.error') }} />
        <MaterialCommunityIcons name="alert-circle" size={60} color={colors.error} />
        <Text style={styles.errorText}>{t('practice.couldNotLoadCategory')}</Text>
        <Button mode="contained" onPress={() => router.back()}>{t('common.back')}</Button>
      </SafeAreaView>
    );
  }

  const localizedName = category
    ? lf(category.name_en, category.name_np)
    : cacheInfo?.categoryName ?? `Category ${categoryId}`;
  const secondaryName = category
    ? (i18n.language === 'NP' ? category.name_en : category.name_np)
    : '';

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: localizedName }} />
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={48} color={colors.primary} />
          </View>
          <Text style={styles.title}>{t('practice.setupPractice')}</Text>
          <Text style={styles.subtitle}>{t('practice.category')}: {localizedName}</Text>
          {!!secondaryName && secondaryName !== localizedName && (
            <Text style={styles.subtitleNp}>{secondaryName}</Text>
          )}

          <TextInput
            label={t('practice.numberOfQuestions')}
            value={numberOfQuestions}
            onChangeText={setNumberOfQuestions}
            keyboardType="number-pad"
            style={styles.input}
            mode="outlined"
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            error={numberOfQuestions !== '' && !isValid}
          />
          {numberOfQuestions !== '' && !isValid && (
            <Text style={styles.helperText}>
              {t('practice.validationRange', { min: MIN_QUESTIONS, max: MAX_QUESTIONS })}
            </Text>
          )}

          {/* Offline download section */}
          <View style={styles.offlineSection}>
            {cacheInfo ? (
              <View style={styles.cachedRow}>
                <View style={styles.cachedInfo}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
                  <View style={{ marginLeft: Spacing.sm, flex: 1 }}>
                    <Text style={styles.cachedLabel}>{t('offline.downloaded')}</Text>
                    <Text style={styles.cachedMeta}>
                      {t('offline.questionsDownloaded', { count: cacheInfo.questionCount })}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleRemoveDownload} hitSlop={8}>
                  <MaterialCommunityIcons name="close-circle-outline" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.downloadButton, downloadStatus === 'downloading' && { opacity: 0.6 }]}
                onPress={handleDownload}
                disabled={downloadStatus === 'downloading'}
                activeOpacity={0.7}
              >
                {downloadStatus === 'downloading' ? (
                  <ActivityIndicator size={16} color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons name="download-circle-outline" size={20} color={colors.primary} />
                )}
                <Text style={styles.downloadLabel}>
                  {downloadStatus === 'downloading' ? t('offline.downloading') : t('offline.downloadForOffline')}
                </Text>
              </TouchableOpacity>
            )}
            {downloadStatus === 'error' && (
              <Text style={styles.downloadError}>{t('offline.downloadFailed')}</Text>
            )}
          </View>

          <Button
            mode="contained"
            onPress={handleStartPractice}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon="play-circle"
            disabled={!isValid}
          >
            {t('practice.startPractice')}
          </Button>
        </Card.Content>
      </Card>
    </SafeAreaView>
  );
};

export default PracticeSetupScreen;

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.base,
    backgroundColor: colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: Spacing.base,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: colors.background,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: Spacing.base,
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: BorderRadius.xl,
    elevation: 2,
    paddingVertical: Spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitleNp: {
    fontSize: 14,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  input: {
    marginBottom: Spacing.xs,
    backgroundColor: colors.cardBackground,
  },
  helperText: {
    fontSize: 12,
    color: colors.error,
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  offlineSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cachedRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  cachedInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    flex: 1,
  },
  cachedLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.success,
  },
  cachedMeta: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 1,
  },
  downloadButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  downloadLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: colors.primary,
  },
  downloadError: {
    fontSize: 11,
    color: colors.error,
    textAlign: 'center' as const,
    marginTop: Spacing.xs,
  },
  button: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
});
