import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Text, TextInput, Button, RadioButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { Question } from '../../types/question.types';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';
import { reportQuestion } from '../../services/api/questions';
import { getAccessToken } from '../../services/api/client';

type ReportReason = 'INCORRECT_ANSWER' | 'TYPO' | 'DUPLICATE' | 'INAPPROPRIATE' | 'OTHER';

interface ReportOption {
  value: ReportReason;
  label: string;
  description: string;
  icon: string;
}

export default function ReportQuestionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  
  const { data: question, status: questionStatus } = useApi<Question>(
    questionId ? `/api/questions/${questionId}/` : ''
  );
  
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reportOptions: ReportOption[] = [
    { 
      value: 'INCORRECT_ANSWER', 
      label: t('report.reasonIncorrectLabel'), 
      description: t('report.reasonIncorrectDesc'),
      icon: 'close-circle',
    },
    {
      value: 'TYPO',
      label: t('report.reasonTypoLabel'),
      description: t('report.reasonTypoDesc'),
      icon: 'alert-circle',
    },
    { 
      value: 'DUPLICATE', 
      label: t('report.reasonDuplicateLabel'), 
      description: t('report.reasonDuplicateDesc'),
      icon: 'content-copy',
    },
    { 
      value: 'INAPPROPRIATE', 
      label: t('report.reasonInappropriateLabel'), 
      description: t('report.reasonInappropriateDesc'),
      icon: 'alert-octagon',
    },
    { 
      value: 'OTHER', 
      label: t('report.reasonOtherLabel'), 
      description: t('report.reasonOtherDesc'),
      icon: 'help-circle',
    },
  ];

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert(t('common.error'), t('report.selectReason'));
      return;
    }

    setIsSubmitting(true);

    try {
      const token = getAccessToken();
      await reportQuestion(
        {
          question: parseInt(questionId),
          reason,
          description,
        },
        token
      );
      Alert.alert(
        t('report.submittedTitle'),
        t('report.submittedMessage'),
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('report.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (questionStatus === 'loading') {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('report.title')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Question Preview */}
          {question && (
            <Card style={styles.questionCard}>
              <Card.Content>
                <View style={styles.questionHeader}>
                  <MaterialCommunityIcons name="help-circle" size={20} color={colors.primary} />
                  <Text style={styles.questionLabel}>{t('report.questionBeingReported')}</Text>
                </View>
                <Text style={styles.questionText} numberOfLines={3}>
                  {lf(question.question_text_en, question.question_text_np)}
                </Text>
                <View style={styles.questionMeta}>
                  <Text style={styles.questionMetaText}>
                    {t('report.categoryLabel')}: {question.category_name}
                  </Text>
                  <Text style={styles.questionMetaText}>
                    {t('report.idLabel')}: #{question.id}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Report Reason Selection */}
          <Text style={styles.sectionTitle}>{t('report.whatsWrong')}</Text>
          <Card style={styles.reasonCard}>
            <Card.Content>
              <RadioButton.Group onValueChange={(value) => setReason(value as ReportReason)} value={reason || ''}>
                {reportOptions.map((option, index) => (
                  <React.Fragment key={option.value}>
                    {index > 0 && <View style={styles.optionDivider} />}
                    <TouchableOpacity 
                      style={[styles.reasonOption, reason === option.value && styles.reasonOptionSelected]}
                      onPress={() => setReason(option.value)}
                      activeOpacity={0.7}
                    >
                      <View style={[
                        styles.reasonIcon, 
                        { backgroundColor: (reason === option.value ? colors.primary : colors.textTertiary) + '20' }
                      ]}>
                        <MaterialCommunityIcons 
                          name={option.icon as any} 
                          size={22} 
                          color={reason === option.value ? colors.primary : colors.textTertiary} 
                        />
                      </View>
                      <View style={styles.reasonTextContainer}>
                        <Text style={[
                          styles.reasonLabel, 
                          reason === option.value && styles.reasonLabelSelected
                        ]}>
                          {option.label}
                        </Text>
                        <Text style={styles.reasonDescription}>{option.description}</Text>
                      </View>
                      <RadioButton value={option.value} color={colors.primary} />
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {/* Additional Details */}
          <Text style={styles.sectionTitle}>{t('report.additionalDetails')}</Text>
          <Card style={styles.descriptionCard}>
            <Card.Content>
              <TextInput
                mode="outlined"
                placeholder={t('report.detailsPlaceholder')}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={styles.textInput}
                outlineColor={colors.border}
                activeOutlineColor={colors.primary}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </Card.Content>
          </Card>

          {/* Guidelines */}
          <Card style={styles.guidelinesCard}>
            <Card.Content>
              <View style={styles.guidelinesHeader}>
                <MaterialCommunityIcons name="information" size={20} color={colors.info} />
                <Text style={styles.guidelinesTitle}>{t('report.guidelinesTitle')}</Text>
              </View>
              <Text style={styles.guidelineText}>• {t('report.guideline1')}</Text>
              <Text style={styles.guidelineText}>• {t('report.guideline2')}</Text>
              <Text style={styles.guidelineText}>• {t('report.guideline3')}</Text>
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomAction}>
          <Button 
            mode="contained" 
            icon="send" 
            style={styles.submitButton} 
            contentStyle={styles.submitButtonContent}
            labelStyle={styles.submitButtonLabel}
            onPress={handleSubmit}
            loading={isSubmitting}
            disabled={isSubmitting || !reason}
          >
            {t('report.submit')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: Spacing.base,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: colors.cardBackground, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  questionCard: { 
    backgroundColor: colors.primaryLight + '20', 
    borderRadius: BorderRadius.lg, 
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  questionLabel: { fontSize: 12, color: colors.primary, fontWeight: '600', marginLeft: Spacing.xs },
  questionText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  questionMeta: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  questionMetaText: { fontSize: 12, color: colors.textSecondary },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: colors.textPrimary, 
    marginBottom: Spacing.md,
  },
  reasonCard: { 
    backgroundColor: colors.cardBackground, 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.lg,
  },
  reasonOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Spacing.md,
  },
  reasonOptionSelected: { 
    backgroundColor: colors.primaryLight + '10',
    marginHorizontal: -Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  optionDivider: { height: 1, backgroundColor: colors.border },
  reasonIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: Spacing.md,
  },
  reasonTextContainer: { flex: 1 },
  reasonLabel: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  reasonLabelSelected: { fontWeight: '700', color: colors.primary },
  reasonDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  descriptionCard: { 
    backgroundColor: colors.cardBackground, 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.lg,
  },
  textInput: { backgroundColor: colors.cardBackground },
  charCount: { 
    fontSize: 11, 
    color: colors.textTertiary, 
    textAlign: 'right', 
    marginTop: Spacing.xs,
  },
  guidelinesCard: { 
    backgroundColor: colors.infoLight, 
    borderRadius: BorderRadius.lg,
  },
  guidelinesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  guidelinesTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginLeft: Spacing.xs },
  guidelineText: { fontSize: 13, color: colors.textSecondary, marginBottom: Spacing.xs, lineHeight: 18 },
  bottomAction: { 
    backgroundColor: colors.cardBackground, 
    padding: Spacing.base, 
    borderTopWidth: 1, 
    borderTopColor: colors.border,
  },
  submitButton: { borderRadius: BorderRadius.lg },
  submitButtonContent: { paddingVertical: Spacing.sm },
  submitButtonLabel: { fontSize: 16, fontWeight: '700' },
});
