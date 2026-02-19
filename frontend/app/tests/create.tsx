import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Card, Text, TextInput, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { Branch, Category } from '../../types/category.types';
import { MockTest } from '../../types/test.types';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { Colors, ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const getBranchIcon = (slug: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    'administrative-service': 'account-tie',
    'engineering-service': 'hard-hat',
    'health-service': 'hospital-box',
    'education-service': 'school',
    'judicial-service': 'gavel',
    'agriculture-service': 'sprout',
    'forest-service': 'tree',
    'audit-service': 'calculator',
    'foreign-affairs-service': 'earth',
    'miscellaneous-service': 'folder-multiple',
  };
  return icons[slug] || 'folder';
};

type Step = 'details' | 'categories' | 'review';

const CreateTestScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: branches, status: branchStatus } = useApi<Branch[]>('/api/branches/');

  // Step state
  const [step, setStep] = useState<Step>('details');
  const [title, setTitle] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedSubBranch, setSelectedSubBranch] = useState<number | null>(null);
  const [duration, setDuration] = useState('30');
  const [testType, setTestType] = useState<'CUSTOM' | 'COMMUNITY'>('CUSTOM');

  // Category distribution
  const [categoryDist, setCategoryDist] = useState<Record<number, number>>({});

  // Fetch categories for selected branch
  const categoryEndpoint = selectedBranch
    ? `/api/categories/for-branch/?branch=${selectedBranch.id}${selectedSubBranch ? `&sub_branch=${selectedSubBranch}` : ''}`
    : '';
  const { data: categories, status: catStatus } = useApi<Category[]>(categoryEndpoint, !selectedBranch);

  // Generate test API
  const { execute: generateTest, status: generateStatus } = useApi<MockTest>(
    '/api/mock-tests/generate/',
    true,
    { method: 'POST' },
  );

  // Auto-distribute evenly when categories load
  useEffect(() => {
    if (categories && categories.length > 0 && Object.keys(categoryDist).length === 0) {
      const perCat = Math.max(1, Math.floor(20 / categories.length));
      const dist: Record<number, number> = {};
      categories.forEach((cat) => {
        dist[cat.id] = perCat;
      });
      setCategoryDist(dist);
    }
  }, [categories]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalDistributed = Object.values(categoryDist).reduce((s, v) => s + v, 0);

  const updateCategoryCount = (catId: number, delta: number) => {
    setCategoryDist((prev) => {
      const current = prev[catId] ?? 0;
      const next = Math.max(0, current + delta);
      return { ...prev, [catId]: next };
    });
  };

  const handleNext = () => {
    if (step === 'details') {
      if (!title || !selectedBranch) {
        Alert.alert(t('tests.missingInfoTitle'), t('tests.missingInfoMessage'));
        return;
      }
      setStep('categories');
    } else if (step === 'categories') {
      if (totalDistributed === 0) {
        Alert.alert(t('common.error'), t('tests.selectAtLeastOneCategory', { defaultValue: 'Select at least one category with questions.' }));
        return;
      }
      setStep('review');
    }
  };

  const handleBack = () => {
    if (step === 'categories') setStep('details');
    else if (step === 'review') setStep('categories');
    else router.back();
  };

  const handleGenerate = async () => {
    if (!selectedBranch || generateStatus === 'loading') return;

    // Build category_distribution as { "categoryId": count }
    const distribution: Record<string, number> = {};
    Object.entries(categoryDist).forEach(([id, count]) => {
      if (count > 0) distribution[id] = count;
    });

    try {
      const test = await generateTest({
        title_en: title,
        branch_id: selectedBranch.id,
        sub_branch_id: selectedSubBranch,
        category_distribution: distribution,
        duration_minutes: parseInt(duration) || 30,
        total_questions: totalDistributed,
        test_type: testType,
      });

      Alert.alert(
        t('tests.testCreated', { defaultValue: 'Test Created!' }),
        t('tests.testCreatedMsg', { defaultValue: 'Your test has been generated successfully.' }),
        [
          {
            text: t('tests.startNow', { defaultValue: 'Start Now' }),
            onPress: () => router.replace(`/tests/${test.id}` as any),
          },
          {
            text: t('common.ok'),
            onPress: () => router.back(),
          },
        ],
      );
    } catch {
      Alert.alert(t('common.error'), t('tests.generationFailed', { defaultValue: 'Failed to generate test. Make sure enough questions exist for selected categories.' }));
    }
  };

  const stepIndex = step === 'details' ? 0 : step === 'categories' ? 1 : 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tests.createTest')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          {[0, 1, 2].map((i) => (
            <React.Fragment key={i}>
              {i > 0 && <View style={[styles.stepLine, i <= stepIndex && { backgroundColor: colors.primary }]} />}
              <View style={[styles.stepDot, i <= stepIndex && styles.stepActive]} />
            </React.Fragment>
          ))}
        </View>
        <Text style={styles.stepLabel}>
          {step === 'details' && t('tests.stepBasicDetails')}
          {step === 'categories' && t('tests.stepSelectCategories', { defaultValue: 'Select Categories' })}
          {step === 'review' && t('tests.stepReview', { defaultValue: 'Review & Generate' })}
        </Text>

        {/* ─── Step 1: Details ─── */}
        {step === 'details' && (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.inputLabel}>{t('tests.testTitle')}</Text>
                <TextInput mode="outlined" placeholder={t('tests.testTitlePlaceholder')} value={title} onChangeText={setTitle} style={styles.textInput} outlineColor={colors.border} activeOutlineColor={colors.primary} />
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.inputLabel}>{t('tests.selectBranch')}</Text>
                {branchStatus === 'loading' ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                ) : branches && branches.length > 0 ? (
                  <>
                    <View style={styles.branchGrid}>
                      {branches.map((branch) => (
                        <TouchableOpacity
                          key={branch.id}
                          style={[styles.branchCard, selectedBranch?.id === branch.id && styles.branchCardSelected]}
                          onPress={() => { setSelectedBranch(branch); setSelectedSubBranch(null); setCategoryDist({}); }}
                          activeOpacity={0.7}
                        >
                          <MaterialCommunityIcons name={getBranchIcon(branch.slug)} size={24} color={selectedBranch?.id === branch.id ? Colors.primary : colors.textSecondary} />
                          <Text style={[styles.branchName, selectedBranch?.id === branch.id && styles.branchNameSelected]}>{lf(branch.name_en, branch.name_np)}</Text>
                          {selectedBranch?.id === branch.id && (
                            <View style={styles.checkIcon}>
                              <MaterialCommunityIcons name="check" size={14} color={colors.white} />
                            </View>
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>

                    {selectedBranch?.has_sub_branches && (selectedBranch.sub_branches?.length ?? 0) > 0 && (
                      <View style={{ marginTop: Spacing.md }}>
                        <Text style={[styles.inputLabel, { marginBottom: Spacing.sm }]}>
                          {t('tests.selectSubBranch', { defaultValue: 'Sub-Branch (optional)' })}
                        </Text>
                        <View style={styles.subBranchRow}>
                          <Chip selected={selectedSubBranch === null} onPress={() => { setSelectedSubBranch(null); setCategoryDist({}); }} selectedColor={Colors.primary}>
                            {t('common.allTests', { defaultValue: 'All' })}
                          </Chip>
                          {selectedBranch.sub_branches?.map((sb) => (
                            <Chip key={sb.id} selected={selectedSubBranch === sb.id} onPress={() => { setSelectedSubBranch(sb.id); setCategoryDist({}); }} selectedColor={Colors.primary}>
                              {lf(sb.name_en, sb.name_np)}
                            </Chip>
                          ))}
                        </View>
                      </View>
                    )}
                  </>
                ) : (
                  <Text style={styles.branchName}>{t('tests.noBranches')}</Text>
                )}
              </Card.Content>
            </Card>

            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.inputLabel}>{t('tests.testSettings')}</Text>
                <View style={styles.settingsRow}>
                  <View style={styles.settingItem}>
                    <Text style={styles.settingLabel}>{t('tests.durationMinutes')}</Text>
                    <View style={styles.counterRow}>
                      <TouchableOpacity style={styles.counterBtn} onPress={() => setDuration(String(Math.max(10, parseInt(duration) - 10)))}>
                        <MaterialCommunityIcons name="minus" size={20} color={colors.primary} />
                      </TouchableOpacity>
                      <Text style={styles.counterValue}>{duration}</Text>
                      <TouchableOpacity style={styles.counterBtn} onPress={() => setDuration(String(Math.min(180, parseInt(duration) + 10)))}>
                        <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <Text style={[styles.settingLabel, { marginTop: Spacing.lg }]}>
                  {t('tests.testVisibility', { defaultValue: 'Test Visibility' })}
                </Text>
                <View style={styles.typeToggleRow}>
                  <TouchableOpacity
                    style={[styles.typeToggle, testType === 'CUSTOM' && styles.typeToggleActive]}
                    onPress={() => setTestType('CUSTOM')}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="lock" size={18} color={testType === 'CUSTOM' ? colors.white : colors.textSecondary} />
                    <Text style={[styles.typeToggleText, testType === 'CUSTOM' && styles.typeToggleTextActive]}>
                      {t('tests.personalOnly', { defaultValue: 'Only Me' })}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.typeToggle, testType === 'COMMUNITY' && styles.typeToggleActive]}
                    onPress={() => setTestType('COMMUNITY')}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons name="earth" size={18} color={testType === 'COMMUNITY' ? colors.white : colors.textSecondary} />
                    <Text style={[styles.typeToggleText, testType === 'COMMUNITY' && styles.typeToggleTextActive]}>
                      {t('tests.community', { defaultValue: 'Community' })}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.typeHint}>
                  {testType === 'CUSTOM'
                    ? t('tests.personalHint', { defaultValue: 'Only you can see and take this test.' })
                    : t('tests.communityHint', { defaultValue: 'Everyone can see and take this test.' })}
                </Text>
              </Card.Content>
            </Card>
          </>
        )}

        {/* ─── Step 2: Category Distribution ─── */}
        {step === 'categories' && (
          <>
            <Card style={styles.card}>
              <Card.Content>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md }}>
                  <Text style={styles.inputLabel}>{t('tests.categoryDistribution', { defaultValue: 'Question Distribution' })}</Text>
                  <Text style={[styles.settingLabel, { color: totalDistributed > 0 ? colors.primary : colors.error }]}>
                    {t('tests.totalQuestions', { defaultValue: 'Total: {{count}}', count: totalDistributed })}
                  </Text>
                </View>

                {catStatus === 'loading' ? (
                  <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
                ) : categories && categories.length > 0 ? (
                  categories.map((cat) => (
                    <View key={cat.id} style={styles.categoryRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.categoryName, { color: colors.textPrimary }]} numberOfLines={1}>
                          {lf(cat.name_en, cat.name_np)}
                        </Text>
                        <Text style={[styles.categoryMeta, { color: colors.textTertiary }]}>
                          {cat.scope_type} {cat.question_count ? `(${cat.question_count} ${t('tests.available', { defaultValue: 'available' })})` : ''}
                        </Text>
                      </View>
                      <View style={styles.counterRow}>
                        <TouchableOpacity style={styles.counterBtnSmall} onPress={() => updateCategoryCount(cat.id, -1)}>
                          <MaterialCommunityIcons name="minus" size={16} color={colors.primary} />
                        </TouchableOpacity>
                        <Text style={[styles.counterValueSmall, { color: colors.textPrimary }]}>{categoryDist[cat.id] ?? 0}</Text>
                        <TouchableOpacity style={styles.counterBtnSmall} onPress={() => updateCategoryCount(cat.id, 1)}>
                          <MaterialCommunityIcons name="plus" size={16} color={colors.primary} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={[styles.branchName, { color: colors.textSecondary }]}>
                    {t('tests.noCategoriesForBranch', { defaultValue: 'No categories found for this branch.' })}
                  </Text>
                )}
              </Card.Content>
            </Card>
          </>
        )}

        {/* ─── Step 3: Review ─── */}
        {step === 'review' && (
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.summaryTitle}>{t('tests.summaryTitle')}</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tests.summaryTitleLabel')}</Text>
                <Text style={styles.summaryValue}>{title}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tests.summaryBranch')}</Text>
                <Text style={styles.summaryValue}>{selectedBranch ? lf(selectedBranch.name_en, selectedBranch.name_np) : ''}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tests.summaryQuestions')}</Text>
                <Text style={styles.summaryValue}>{totalDistributed}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tests.summaryDuration')}</Text>
                <Text style={styles.summaryValue}>{duration} {t('tests.minutes')}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tests.testVisibility', { defaultValue: 'Visibility' })}</Text>
                <Text style={styles.summaryValue}>
                  {testType === 'COMMUNITY' ? t('tests.community', { defaultValue: 'Community' }) : t('tests.personalOnly', { defaultValue: 'Only Me' })}
                </Text>
              </View>

              <Text style={[styles.inputLabel, { marginTop: Spacing.lg }]}>
                {t('tests.categoryBreakdown', { defaultValue: 'Category Breakdown' })}
              </Text>
              {categories?.filter((c) => (categoryDist[c.id] ?? 0) > 0).map((cat) => (
                <View key={cat.id} style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{lf(cat.name_en, cat.name_np)}</Text>
                  <Text style={styles.summaryValue}>{categoryDist[cat.id]}</Text>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        {step === 'review' ? (
          <Button
            mode="contained"
            icon="auto-fix"
            style={styles.nextButton}
            contentStyle={styles.nextButtonContent}
            labelStyle={styles.nextButtonLabel}
            onPress={handleGenerate}
            loading={generateStatus === 'loading'}
            disabled={generateStatus === 'loading'}
            buttonColor={colors.success}
          >
            {t('tests.generateTest', { defaultValue: 'Generate Test' })}
          </Button>
        ) : (
          <Button
            mode="contained"
            icon="arrow-right"
            style={styles.nextButton}
            contentStyle={styles.nextButtonContent}
            labelStyle={styles.nextButtonLabel}
            disabled={step === 'details' ? (!title || !selectedBranch) : totalDistributed === 0}
            onPress={handleNext}
          >
            {t('tests.next', { defaultValue: 'Next' })}
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
};

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.border },
  stepActive: { backgroundColor: colors.primary, width: 16, height: 16, borderRadius: 8 },
  stepLine: { width: 40, height: 2, backgroundColor: colors.border },
  stepLabel: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  card: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: Spacing.md },
  textInput: { backgroundColor: colors.cardBackground },
  loader: { marginVertical: Spacing.lg },
  branchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  subBranchRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  branchCard: { width: '48%', backgroundColor: colors.surfaceVariant, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  branchCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '30' },
  branchName: { fontSize: 13, color: colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  branchNameSelected: { color: colors.primary, fontWeight: '600' },
  checkIcon: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  settingsRow: { flexDirection: 'row', gap: Spacing.lg },
  settingItem: { flex: 1 },
  settingLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: Spacing.sm },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceVariant, borderRadius: BorderRadius.lg, padding: Spacing.sm, minWidth: 110 },
  counterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center' },
  counterBtnSmall: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  counterValueSmall: { fontSize: 15, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  categoryName: { fontSize: 14, fontWeight: '500' },
  categoryMeta: { fontSize: 11 },
  summaryCard: { backgroundColor: colors.primaryLight + '30', borderRadius: BorderRadius.xl },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.cardBackground, padding: Spacing.base, borderTopWidth: 1, borderTopColor: colors.border },
  nextButton: { borderRadius: BorderRadius.lg },
  nextButtonContent: { paddingVertical: Spacing.sm, flexDirection: 'row-reverse' },
  nextButtonLabel: { fontSize: 16, fontWeight: '700' },
  typeToggleRow: { flexDirection: 'row', gap: Spacing.sm },
  typeToggle: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: Spacing.md, borderRadius: BorderRadius.lg, backgroundColor: colors.surfaceVariant },
  typeToggleActive: { backgroundColor: colors.primary },
  typeToggleText: { fontSize: 14, fontWeight: '600', color: colors.textSecondary },
  typeToggleTextActive: { color: colors.white },
  typeHint: { fontSize: 12, color: colors.textTertiary, marginTop: Spacing.sm },
});

export default CreateTestScreen;
