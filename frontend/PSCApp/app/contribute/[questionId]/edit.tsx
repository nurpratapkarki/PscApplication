import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Text, TextInput, Button, Chip, ActivityIndicator, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import { Question, AnswerOption as AnswerOptionType } from '../../../types/question.types';
import { Category } from '../../../types/category.types';
import { Contribution } from '../../../types/contribution.types';
import { useColors } from '../../../hooks/useColors';
import { useLocalizedField } from '../../../hooks/useLocalizedField';
import { ColorScheme } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';
import { updateQuestion, deleteQuestion } from '../../../services/api/questions';
import { getAccessToken } from '../../../services/api/client';

interface AnswerOption {
  id?: number;
  text: string;
  isCorrect: boolean;
}

export default function EditContributionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  
  const { data: contribution, status: contributionStatus } = useApi<Contribution>(
    questionId ? `/api/contributions/${questionId}/` : ''
  );
  
  const { data: question, status: questionStatus } = useApi<Question>(
    contribution?.question ? `/api/questions/${contribution.question}/` : '',
    !contribution?.question
  );
  
  const { data: categories } = useApi<Category[]>('/api/categories/');

  const [questionText, setQuestionText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerOption[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form when question data loads
  useEffect(() => {
    if (question) {
      setQuestionText(question.question_text_en);
      setSelectedCategory(question.category);
      setExplanation(question.explanation_en || '');
      if (question.answers && question.answers.length > 0) {
        setAnswers(question.answers.map((a: AnswerOptionType) => ({
          id: a.id,
          text: a.answer_text_en,
          isCorrect: a.is_correct,
        })));
      }
    }
  }, [question]);

  const updateAnswer = (index: number, text: string) => {
    const newAnswers = [...answers];
    newAnswers[index].text = text;
    setAnswers(newAnswers);
  };

  const setCorrectAnswer = (index: number) => {
    const newAnswers = answers.map((a, i) => ({ ...a, isCorrect: i === index }));
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (!questionText.trim()) {
      Alert.alert(t('contribute.missingQuestionTitle'), t('contribute.missingQuestionMessage'));
      return;
    }
    if (!selectedCategory) {
      Alert.alert(t('contribute.missingCategoryTitle'), t('contribute.missingCategoryMessage'));
      return;
    }
    if (answers.some((a) => !a.text.trim())) {
      Alert.alert(t('contribute.missingAnswersTitle'), t('contribute.missingAnswersMessage'));
      return;
    }
    
    setIsSubmitting(true);

    try {
      const token = getAccessToken();
      await updateQuestion(
        question!.id,
        {
          question_text_en: questionText,
          category: selectedCategory!,
          explanation_en: explanation,
          answers: answers.map((a, i) => ({
            id: a.id,
            answer_text_en: a.text,
            answer_text_np: a.text,
            is_correct: a.isCorrect,
            display_order: i,
          })),
        },
        token
      );
      Alert.alert(t('common.success'), t('contribute.updatedResubmitted'), [
        { text: t('common.ok'), onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('contribute.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('contribute.deleteTitle'),
      t('contribute.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const token = getAccessToken();
              await deleteQuestion(question!.id, token);
              router.back();
            } catch (err) {
              Alert.alert(t('common.error'), err instanceof Error ? err.message : t('contribute.deleteFailed'));
            }
          }
        },
      ]
    );
  };

  const isLoading = contributionStatus === 'loading' || questionStatus === 'loading';
  const isPending = contribution?.status === 'PENDING';
  const isRejected = contribution?.status === 'REJECTED';
  const canEdit = isPending || isRejected;
  const statusLabel = contribution?.status === 'REJECTED'
    ? t('contribute.statusRejected')
    : contribution?.status === 'PENDING'
      ? t('contribute.statusPending')
      : t('contribute.statusApproved');

  if (isLoading) {
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
          <Text style={styles.headerTitle}>{t('contribute.editQuestion')}</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <MaterialCommunityIcons name="delete" size={20} color={colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Status Banner */}
          {contribution && (
            <Card style={[
              styles.statusBanner,
              { 
                backgroundColor: isRejected ? colors.errorLight : 
                  isPending ? colors.warningLight : colors.successLight 
              }
            ]}>
              <Card.Content style={styles.statusContent}>
                <MaterialCommunityIcons 
                  name={isRejected ? 'alert-circle' : isPending ? 'clock-outline' : 'check-circle'} 
                  size={24} 
                  color={isRejected ? colors.error : isPending ? colors.warning : colors.success} 
                />
                <View style={styles.statusTextContainer}>
                  <Text style={[
                    styles.statusTitle,
                    { color: isRejected ? colors.error : isPending ? colors.warning : colors.success }
                  ]}>
                    {statusLabel}
                  </Text>
                  {isRejected && contribution.rejection_reason && (
                    <Text style={styles.rejectionReason}>{contribution.rejection_reason}</Text>
                  )}
                  {!canEdit && (
                    <Text style={styles.statusNote}>{t('contribute.editNotAllowed')}</Text>
                  )}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Category Selection */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>{t('contribute.selectCategory')}</Text>
              <View style={styles.chipRow}>
                {categories?.slice(0, 6).map((cat) => (
                  <Chip 
                    key={cat.id} 
                    selected={selectedCategory === cat.id} 
                    onPress={() => canEdit && setSelectedCategory(cat.id)} 
                    style={styles.chip} 
                    selectedColor={colors.primary}
                    disabled={!canEdit}
                  >
                    {lf(cat.name_en, cat.name_np)}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Question Text */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>{t('contribute.questionText')}</Text>
              <TextInput 
                mode="outlined" 
                placeholder={t('contribute.questionPlaceholderEn')}
                value={questionText} 
                onChangeText={setQuestionText} 
                multiline 
                numberOfLines={4} 
                style={styles.textArea} 
                outlineColor={colors.border} 
                activeOutlineColor={colors.primary}
                disabled={!canEdit}
              />
            </Card.Content>
          </Card>

          {/* Answer Options */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>{t('contribute.answerOptions')}</Text>
              <Text style={styles.inputHint}>{t('contribute.answerHint')}</Text>
              {answers.map((answer, index) => (
                <View key={index} style={styles.answerRow}>
                  <RadioButton 
                    value={String(index)} 
                    status={answer.isCorrect ? 'checked' : 'unchecked'} 
                    onPress={() => canEdit && setCorrectAnswer(index)} 
                    color={colors.success}
                    disabled={!canEdit}
                  />
                  <TextInput 
                    mode="outlined" 
                    placeholder={t('contribute.answerOption', { option: String.fromCharCode(65 + index) })}
                    value={answer.text} 
                    onChangeText={(text) => updateAnswer(index, text)} 
                    style={styles.answerInput} 
                    outlineColor={answer.isCorrect ? colors.success : colors.border} 
                    activeOutlineColor={answer.isCorrect ? colors.success : colors.primary} 
                    dense
                    disabled={!canEdit}
                  />
                </View>
              ))}
            </Card.Content>
          </Card>

          {/* Explanation */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>{t('contribute.explanationOptional')}</Text>
              <TextInput 
                mode="outlined" 
                placeholder={t('contribute.explanationPlaceholder')}
                value={explanation} 
                onChangeText={setExplanation} 
                multiline 
                numberOfLines={3} 
                style={styles.textArea} 
                outlineColor={colors.border} 
                activeOutlineColor={colors.primary}
                disabled={!canEdit}
              />
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Submit Button */}
        {canEdit && (
          <View style={styles.bottomAction}>
            <Button 
              mode="contained" 
              icon="send" 
              style={styles.submitButton} 
              contentStyle={styles.submitButtonContent} 
              labelStyle={styles.submitButtonLabel} 
              onPress={handleSubmit} 
              loading={isSubmitting} 
              disabled={isSubmitting}
            >
              {t('contribute.resubmitForReview')}
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
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
  deleteButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: colors.errorLight, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  statusBanner: { borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  statusContent: { flexDirection: 'row', alignItems: 'flex-start' },
  statusTextContainer: { flex: 1, marginLeft: Spacing.md },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  rejectionReason: { fontSize: 14, color: colors.textSecondary, marginTop: Spacing.xs },
  statusNote: { fontSize: 13, color: colors.textSecondary, marginTop: Spacing.xs },
  card: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: Spacing.sm },
  inputHint: { fontSize: 12, color: colors.textSecondary, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { marginBottom: Spacing.xs },
  textArea: { backgroundColor: colors.cardBackground },
  answerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  answerInput: { flex: 1, backgroundColor: colors.cardBackground },
  bottomAction: { backgroundColor: colors.cardBackground, padding: Spacing.base, borderTopWidth: 1, borderTopColor: colors.border },
  submitButton: { borderRadius: BorderRadius.lg },
  submitButtonContent: { paddingVertical: Spacing.sm },
  submitButtonLabel: { fontSize: 16, fontWeight: '700' },
});
