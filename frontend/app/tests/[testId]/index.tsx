import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import { MockTest } from '../../../types/test.types';
import { useColors } from '../../../hooks/useColors';
import { useLocalizedField } from '../../../hooks/useLocalizedField';
import { ColorScheme } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';

const TestDetailsScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const params = useLocalSearchParams<{ testId: string | string[] }>();

  const testId = useMemo(() => {
    if (Array.isArray(params.testId)) return params.testId[0];
    return params.testId;
  }, [params.testId]);

  const { data: test, status, error } = useApi<MockTest>(testId ? `/api/mock-tests/${testId}/` : '', !testId);

  if (!testId || status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (status === 'error' || !test) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={60} color={colors.error} />
        <Text style={styles.errorText}>{error || t('tests.failedToLoadTest')}</Text>
        <Button mode="outlined" onPress={() => router.back()}>{t('common.back')}</Button>
      </SafeAreaView>
    );
  }

  const StatItem = ({ icon, value, label }: { icon: string; value: string | number; label: string }) => (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon as any} size={28} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const localizedTitle = lf(test.title_en, test.title_np);
  const localizedDescription = lf(test.description_en, test.description_np);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Chip style={styles.typeBadge} textStyle={styles.typeBadgeText}>
            {test.test_type === 'OFFICIAL' ? t('tests.official') : t('tests.community')}
          </Chip>
        </View>

        {/* Test Info Card */}
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={test.test_type === 'OFFICIAL' ? 'shield-check' : 'account-group'} size={48} color={colors.white} />
            </View>
            <Text style={styles.title}>{localizedTitle}</Text>
            {!!test.title_np && !!test.title_en && test.title_np !== test.title_en && (
              <Text style={styles.titleNp}>{test.title_np}</Text>
            )}
            {!!localizedDescription && <Text style={styles.description}>{localizedDescription}</Text>}
            <View style={styles.branchBadge}>
              <MaterialCommunityIcons name="school" size={16} color={colors.primary} />
              <Text style={styles.branchText}>{test.branch_name}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatItem icon="help-circle-outline" value={test.total_questions} label={t('tests.questions')} />
          <StatItem icon="clock-outline" value={`${test.duration_minutes}m`} label={t('tests.duration')} />
          <StatItem icon="percent" value={`${test.pass_percentage}%`} label={t('tests.passMark')} />
          <StatItem icon="star-outline" value={test.total_marks || test.total_questions} label={t('tests.totalMarks')} />
        </View>

        {/* Instructions Preview */}
        <Card style={styles.instructionsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>{t('tests.quickInfo')}</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="check-circle" size={18} color={colors.success} />
              <Text style={styles.infoText}>{t('tests.infoSingleCorrect')}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="timer-sand" size={18} color={colors.warning} />
              <Text style={styles.infoText}>{t('tests.infoTimerStart')}</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="chart-line" size={18} color={colors.primary} />
              <Text style={styles.infoText}>{t('tests.infoInstantResults')}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Created By */}
        <View style={styles.creatorRow}>
          <Text style={styles.creatorLabel}>{t('tests.createdBy')}</Text>
          <Text style={styles.creatorName}>{test.created_by_name}</Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button mode="contained" icon="play-circle" style={styles.startButton} contentStyle={styles.startButtonContent} labelStyle={styles.startButtonLabel} onPress={() => router.push(`/tests/${testId}/instructions`)}>
          {t('tests.startTest')}
        </Button>
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: Spacing.xl },
  errorText: { fontSize: 16, color: colors.textSecondary, marginVertical: Spacing.lg, textAlign: 'center' },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  typeBadge: { backgroundColor: colors.primaryLight },
  typeBadgeText: { color: colors.primary, fontWeight: '600' },
  mainCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 3 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  titleNp: { fontSize: 16, color: colors.primary, textAlign: 'center', marginBottom: Spacing.sm },
  description: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.md },
  branchBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight + '30', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, alignSelf: 'center' },
  branchText: { fontSize: 13, color: colors.primary, marginLeft: Spacing.xs, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  statItem: { flex: 1, backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', marginHorizontal: 4, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: Spacing.xs },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  instructionsCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  infoText: { fontSize: 14, color: colors.textSecondary, marginLeft: Spacing.sm, flex: 1 },
  creatorRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  creatorLabel: { fontSize: 13, color: colors.textSecondary },
  creatorName: { fontSize: 13, color: colors.primary, fontWeight: '600', marginLeft: Spacing.xs },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.cardBackground, padding: Spacing.base, borderTopWidth: 1, borderTopColor: colors.border },
  startButton: { borderRadius: BorderRadius.lg },
  startButtonContent: { paddingVertical: Spacing.sm },
  startButtonLabel: { fontSize: 16, fontWeight: '700' },
});

export default TestDetailsScreen;
