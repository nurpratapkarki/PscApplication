import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Card, Text, TextInput, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { Branch } from '../../types/category.types';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const CreateTestScreen = () => {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: branches, status: branchStatus } = useApi<Branch[]>('/api/branches/');

  const [title, setTitle] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [questionCount, setQuestionCount] = useState('20');
  const [duration, setDuration] = useState('30');

  const handleGenerateTest = () => {
    if (!title || !selectedBranch) {
      Alert.alert(t('tests.missingInfoTitle'), t('tests.missingInfoMessage'));
      return;
    }
    Alert.alert(t('common.comingSoon'), t('tests.generationSoon', { title }));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('tests.createTest')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Step Indicator */}
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepActive]} />
          <View style={styles.stepLine} />
          <View style={styles.stepDot} />
          <View style={styles.stepLine} />
          <View style={styles.stepDot} />
        </View>
        <Text style={styles.stepLabel}>{t('tests.stepBasicDetails')}</Text>

        {/* Title Input */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.inputLabel}>{t('tests.testTitle')}</Text>
            <TextInput mode="outlined" placeholder={t('tests.testTitlePlaceholder')} value={title} onChangeText={setTitle} style={styles.textInput} outlineColor={colors.border} activeOutlineColor={colors.primary} />
          </Card.Content>
        </Card>

        {/* Branch Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.inputLabel}>{t('tests.selectBranch')}</Text>
            {branchStatus === 'loading' ? (
              <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
            ) : branches && branches.length > 0 ? (
              <View style={styles.branchGrid}>
                {branches.map((branch) => (
                  <TouchableOpacity key={branch.id} style={[styles.branchCard, selectedBranch?.id === branch.id && styles.branchCardSelected]} onPress={() => setSelectedBranch(branch)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="school" size={24} color={selectedBranch?.id === branch.id ? colors.primary : colors.textSecondary} />
                    <Text style={[styles.branchName, selectedBranch?.id === branch.id && styles.branchNameSelected]}>{lf(branch.name_en, branch.name_np)}</Text>
                    {selectedBranch?.id === branch.id && (
                      <View style={styles.checkIcon}>
                        <MaterialCommunityIcons name="check" size={14} color={colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.branchName}>{t('tests.noBranches')}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Test Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.inputLabel}>{t('tests.testSettings')}</Text>
            <View style={styles.settingsRow}>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>{t('tests.questions')}</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setQuestionCount(String(Math.max(5, parseInt(questionCount) - 5)))}>
                    <MaterialCommunityIcons name="minus" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{questionCount}</Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setQuestionCount(String(Math.min(100, parseInt(questionCount) + 5)))}>
                    <MaterialCommunityIcons name="plus" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
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
          </Card.Content>
        </Card>

        {/* Summary */}
        {title && selectedBranch && (
          <Card style={styles.summaryCard}>
            <Card.Content>
              <Text style={styles.summaryTitle}>{t('tests.summaryTitle')}</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tests.summaryTitleLabel')}</Text>
                <Text style={styles.summaryValue}>{title}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tests.summaryBranch')}</Text>
                <Text style={styles.summaryValue}>{lf(selectedBranch.name_en, selectedBranch.name_np)}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tests.summaryQuestions')}</Text>
                <Text style={styles.summaryValue}>{questionCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t('tests.summaryDuration')}</Text>
                <Text style={styles.summaryValue}>{duration} {t('tests.minutes')}</Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button mode="contained" icon="arrow-right" style={styles.nextButton} contentStyle={styles.nextButtonContent} labelStyle={styles.nextButtonLabel} disabled={!title || !selectedBranch} onPress={handleGenerateTest}>
          {t('tests.nextSelectCategories')}
        </Button>
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
  branchCard: { width: '48%', backgroundColor: colors.surfaceVariant, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  branchCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '30' },
  branchName: { fontSize: 13, color: colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  branchNameSelected: { color: colors.primary, fontWeight: '600' },
  checkIcon: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  settingsRow: { flexDirection: 'row', gap: Spacing.lg },
  settingItem: { flex: 1 },
  settingLabel: { fontSize: 14, color: colors.textSecondary, marginBottom: Spacing.sm },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surfaceVariant, borderRadius: BorderRadius.lg, padding: Spacing.sm },
  counterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  summaryCard: { backgroundColor: colors.primaryLight + '30', borderRadius: BorderRadius.xl },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: colors.primary, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  summaryLabel: { fontSize: 14, color: colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.cardBackground, padding: Spacing.base, borderTopWidth: 1, borderTopColor: colors.border },
  nextButton: { borderRadius: BorderRadius.lg },
  nextButtonContent: { paddingVertical: Spacing.sm, flexDirection: 'row-reverse' },
  nextButtonLabel: { fontSize: 16, fontWeight: '700' },
});

export default CreateTestScreen;
