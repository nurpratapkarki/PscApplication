import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import { usePaginatedApi } from '../../../hooks/usePaginatedApi';
import { Question, AnswerOption as AnswerOptionType } from '../../../types/question.types';
import { Branch, Category } from '../../../types/category.types';
import { Contribution } from '../../../types/contribution.types';
import { useColors } from '../../../hooks/useColors';
import { useLocalizedField } from '../../../hooks/useLocalizedField';
import { updateQuestion, deleteQuestion } from '../../../services/api/questions';
import { getAccessToken } from '../../../services/api/client';

interface AnswerOption { id?: number; text: string; isCorrect: boolean; }

// ─── reuse chip/section/answerRow components from add-question ──────────────
// (inline them here since they're in the same design system)

function SectionCard({
  title, icon, iconColor, colors, children,
}: {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={[cardSt.card, { backgroundColor: colors.surface }]}>
      <View style={cardSt.header}>
        <View style={[cardSt.iconWrap, { backgroundColor: iconColor + '15' }]}>
          <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={[cardSt.title, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const cardSt = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700' },
});

function AnswerRow({
  index, answer, onChange, onSetCorrect, colors, t, disabled,
}: {
  index: number; answer: AnswerOption;
  onChange: (text: string) => void; onSetCorrect: () => void;
  colors: ReturnType<typeof useColors>; t: (k: string, o?: any) => string; disabled?: boolean;
}) {
  const label = String.fromCharCode(65 + index);
  return (
    <View style={[
      arSt.row,
      { backgroundColor: answer.isCorrect ? colors.success + '08' : colors.surface, borderColor: answer.isCorrect ? colors.success : colors.border },
    ]}>
      <TouchableOpacity
        style={[arSt.selector, { backgroundColor: answer.isCorrect ? colors.success : colors.surfaceVariant, borderColor: answer.isCorrect ? colors.success : colors.border }]}
        onPress={onSetCorrect} disabled={disabled}
      >
        {answer.isCorrect
          ? <MaterialCommunityIcons name="check" size={14} color="#fff" />
          : <Text style={[arSt.selectorLabel, { color: colors.textSecondary }]}>{label}</Text>}
      </TouchableOpacity>
      <TextInput
        mode="flat" placeholder={t('contribute.answerOption', { option: label })}
        value={answer.text} onChangeText={onChange}
        style={[arSt.input, { backgroundColor: 'transparent' }]}
        underlineColor="transparent" activeUnderlineColor="transparent"
        disabled={disabled} dense
      />
    </View>
  );
}

const arSt = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1.5, paddingRight: 12, marginBottom: 8, overflow: 'hidden' },
  selector: { width: 36, height: 44, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1.5, borderRightColor: 'inherit', marginRight: 4 },
  selectorLabel: { fontSize: 13, fontWeight: '800' },
  input: { flex: 1, fontSize: 14 },
});

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function EditContributionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const { questionId } = useLocalSearchParams<{ questionId: string }>();

  const { data: contribution, status: contributionStatus } = useApi<Contribution>(
    questionId ? `/api/contributions/${questionId}/` : ''
  );
  const { data: question, status: questionStatus } = useApi<Question>(
    contribution?.question ? `/api/questions/${contribution.question}/` : '',
    !contribution?.question
  );
  const { data: branches } = usePaginatedApi<Branch>('/api/branches/');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedSubBranch, setSelectedSubBranch] = useState<number | null>(null);
  const { data: categories, status: categoryStatus, execute: fetchCategories } = useApi<Category[]>(
    selectedBranch
      ? `/api/categories/for-branch/?branch=${selectedBranch.id}${selectedSubBranch ? `&sub_branch=${selectedSubBranch}` : ''}`
      : '',
    true
  );

  const [questionText, setQuestionText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerOption[]>([
    { text: '', isCorrect: true }, { text: '', isCorrect: false },
    { text: '', isCorrect: false }, { text: '', isCorrect: false },
  ]);
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

 useEffect(() => {
  if (!question) return;

  setQuestionText(question.question_text_en ?? "");
  setSelectedCategory(question.category ?? "");
  setExplanation(question.explanation_en ?? "");

  const answersArray: AnswerOptionType[] = question.answers ?? [];

  if (answersArray.length > 0) {
    setAnswers(
      answersArray.map((a) => ({
        id: a.id,
        text: a.answer_text_en ?? "",
        isCorrect: a.is_correct ?? false,
      }))
    );
  } else {
    setAnswers([]); // prevent undefined state
  }
}, [question]);

  useEffect(() => {
    if (branches?.length && !selectedBranch) setSelectedBranch(branches[0]);
  }, [branches, selectedBranch]);

  useEffect(() => {
    if (selectedBranch) fetchCategories();
  }, [selectedBranch?.id, selectedSubBranch, fetchCategories, selectedBranch]);

  const groupedCategories = React.useMemo(() => {
    if (!categories) return { universal: [] as Category[], branch: [] as Category[], subbranch: [] as Category[] };
    return {
      universal: categories.filter(c => c.scope_type === 'UNIVERSAL'),
      branch: categories.filter(c => c.scope_type === 'BRANCH'),
      subbranch: categories.filter(c => c.scope_type === 'SUBBRANCH'),
    };
  }, [categories]);

  const setCorrectAnswer = (i: number) => {
    setAnswers(answers.map((a, idx) => ({ ...a, isCorrect: idx === i })));
  };
  const updateAnswer = (i: number, text: string) => {
    const a = [...answers]; a[i].text = text; setAnswers(a);
  };

  const handleSubmit = async () => {
    if (!questionText.trim()) return Alert.alert(t('contribute.missingQuestionTitle'), t('contribute.missingQuestionMessage'));
    if (!selectedCategory) return Alert.alert(t('contribute.missingCategoryTitle'), t('contribute.missingCategoryMessage'));
    if (answers.some(a => !a.text.trim())) return Alert.alert(t('contribute.missingAnswersTitle'), t('contribute.missingAnswersMessage'));

    setIsSubmitting(true);
    try {
      const token = getAccessToken();
      await updateQuestion(question!.id, {
        question_text_en: questionText,
        category: selectedCategory!,
        explanation_en: explanation,
        answers: answers.map((a, i) => ({
          id: a.id, answer_text_en: a.text, answer_text_np: a.text,
          is_correct: a.isCorrect, display_order: i,
        })),
      }, token);
      Alert.alert(t('common.success'), t('contribute.updatedResubmitted'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('contribute.updateFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(t('contribute.deleteTitle'), t('contribute.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'), style: 'destructive',
        onPress: async () => {
          try {
            await deleteQuestion(question!.id, getAccessToken());
            router.back();
          } catch (err) {
            Alert.alert(t('common.error'), err instanceof Error ? err.message : t('contribute.deleteFailed'));
          }
        },
      },
    ]);
  };

  const isLoading = contributionStatus === 'loading' || questionStatus === 'loading';
  const isPending = contribution?.status === 'PENDING';
  const isRejected = contribution?.status === 'REJECTED';
  const isApproved = !isPending && !isRejected;
  const canEdit = isPending || isRejected;

  const statusMeta = isRejected
    ? { color: colors.error, icon: 'close-circle' as const, label: 'Rejected', bg: colors.error + '10' }
    : isPending
    ? { color: colors.warning, icon: 'clock-outline' as const, label: 'Under Review', bg: colors.warning + '10' }
    : { color: colors.success, icon: 'check-circle' as const, label: 'Approved', bg: colors.success + '10' };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* ── Top bar ── */}
        <View style={[styles.topBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: colors.surfaceVariant }]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.topBarTitle, { color: colors.textPrimary }]}>
            {t('contribute.editQuestion')}
          </Text>
          {canEdit ? (
            <TouchableOpacity
              style={[styles.deleteBtn, { backgroundColor: colors.error + '15' }]}
              onPress={handleDelete}
            >
              <MaterialCommunityIcons name="delete-outline" size={18} color={colors.error} />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Status banner ── */}
          {contribution && (
            <View style={[styles.statusBanner, { backgroundColor: statusMeta.bg, borderColor: statusMeta.color + '30' }]}>
              <View style={[styles.statusIconWrap, { backgroundColor: statusMeta.color + '20' }]}>
                <MaterialCommunityIcons name={statusMeta.icon} size={20} color={statusMeta.color} />
              </View>
              <View style={styles.statusText}>
                <Text style={[styles.statusLabel, { color: statusMeta.color }]}>
                  {statusMeta.label}
                </Text>
                {isRejected && contribution.rejection_reason && (
                  <Text style={[styles.statusReason, { color: colors.textSecondary }]}>
                    {contribution.rejection_reason}
                  </Text>
                )}
                {isApproved && (
                  <Text style={[styles.statusReason, { color: colors.textSecondary }]}>
                    {t('contribute.editNotAllowed')}
                  </Text>
                )}
                {isPending && (
                  <Text style={[styles.statusReason, { color: colors.textSecondary }]}>
                    Your question is being reviewed by our team.
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* ── Branch selection ── */}
          <SectionCard title={t('contribute.selectBranch')} icon="source-branch" iconColor={colors.primary} colors={colors}>
            <View style={chipSt.row}>
              {branches?.map(branch => {
                const active = selectedBranch?.id === branch.id;
                return (
                  <TouchableOpacity
                    key={branch.id}
                    style={[chipSt.chip, {
                      backgroundColor: active ? colors.primary + '15' : colors.surfaceVariant,
                      borderColor: active ? colors.primary : 'transparent',
                      opacity: canEdit ? 1 : 0.6,
                    }]}
                    onPress={() => {
                      if (!canEdit) return;
                      setSelectedBranch(branch);
                      setSelectedSubBranch(null);
                      setSelectedCategory(null);
                    }}
                  >
                    <Text style={[chipSt.text, { color: active ? colors.primary : colors.textSecondary }]}>
                      {lf(branch.name_en, branch.name_np)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </SectionCard>

          {/* ── Category ── */}
          {selectedBranch && (
            <SectionCard title={t('contribute.selectCategory')} icon="tag-outline" iconColor={colors.accent} colors={colors}>
              {categoryStatus === 'loading' ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View style={{ gap: 10 }}>
                  {[
                    { items: groupedCategories.universal, color: colors.info, label: 'Common Subjects' },
                    { items: groupedCategories.branch, color: colors.accent, label: 'Service Specific' },
                    { items: groupedCategories.subbranch, color: colors.secondary, label: 'Specialization' },
                  ].filter(g => g.items.length > 0).map((group, gi) => (
                    <View key={gi}>
                      <Text style={[styles.catLabel, { color: group.color }]}>{group.label}</Text>
                      <View style={chipSt.row}>
                        {group.items.map(cat => {
                          const active = selectedCategory === cat.id;
                          return (
                            <TouchableOpacity
                              key={cat.id}
                              style={[chipSt.chip, {
                                backgroundColor: active ? group.color + '15' : colors.surfaceVariant,
                                borderColor: active ? group.color : 'transparent',
                                opacity: canEdit ? 1 : 0.6,
                              }]}
                              onPress={() => canEdit && setSelectedCategory(cat.id)}
                            >
                              <Text style={[chipSt.text, { color: active ? group.color : colors.textSecondary }]}>
                                {lf(cat.name_en, cat.name_np)}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </SectionCard>
          )}

          {/* ── Question text ── */}
          <SectionCard title={t('contribute.questionText')} icon="help-circle-outline" iconColor={colors.primary} colors={colors}>
            <TextInput
              mode="outlined"
              placeholder={t('contribute.questionPlaceholderEn')}
              value={questionText}
              onChangeText={setQuestionText}
              multiline numberOfLines={4}
              style={[styles.textArea, { backgroundColor: colors.surface }]}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              disabled={!canEdit}
            />
          </SectionCard>

          {/* ── Answers ── */}
          <SectionCard title={t('contribute.answerOptions')} icon="format-list-bulleted" iconColor={colors.success} colors={colors}>
            <Text style={[styles.hint, { color: colors.textSecondary }]}>
              {t('contribute.answerHint')}
            </Text>
            {answers.map((answer, i) => (
              <AnswerRow
                key={i} index={i} answer={answer}
                onChange={text => updateAnswer(i, text)}
                onSetCorrect={() => setCorrectAnswer(i)}
                colors={colors} t={t} disabled={!canEdit}
              />
            ))}
          </SectionCard>

          {/* ── Explanation ── */}
          <SectionCard title={`${t('contribute.explanationOptional')} (optional)`} icon="lightbulb-outline" iconColor={colors.warning} colors={colors}>
            <TextInput
              mode="outlined"
              placeholder={t('contribute.explanationPlaceholder')}
              value={explanation}
              onChangeText={setExplanation}
              multiline numberOfLines={3}
              style={[styles.textArea, { backgroundColor: colors.surface }]}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              disabled={!canEdit}
            />
          </SectionCard>

        </ScrollView>

        {/* ── Submit bar ── */}
        {canEdit && (
          <View style={[styles.submitBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: isSubmitting ? colors.primary + '60' : colors.primary }]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting
                ? <ActivityIndicator size="small" color="#fff" />
                : <MaterialCommunityIcons name="send" size={18} color="#fff" />
              }
              <Text style={styles.submitBtnText}>
                {t('contribute.resubmitForReview')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const chipSt = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5 },
  text: { fontSize: 13, fontWeight: '600' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '700' },
  deleteBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: 16, paddingBottom: 24 },

  // Status banner
  statusBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 14,
  },
  statusIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  statusText: { flex: 1 },
  statusLabel: { fontSize: 14, fontWeight: '700', marginBottom: 3 },
  statusReason: { fontSize: 13, lineHeight: 19 },

  catLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 7 },
  textArea: { fontSize: 14 },
  hint: { fontSize: 12, marginBottom: 10 },
  submitBar: { padding: 14, borderTopWidth: StyleSheet.hairlineWidth },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});