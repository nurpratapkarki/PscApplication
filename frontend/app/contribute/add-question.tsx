import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, TextInput, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { useApi } from '../../hooks/useApi';
import { Branch, Category } from '../../types/category.types';
import { createQuestion, bulkUploadQuestions, BulkUploadResponse } from '../../services/api/questions';
import { validateUploadFile, VALID_UPLOAD_MIME_TYPES } from '../../utils/fileValidation';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';

interface AnswerOption { text: string; isCorrect: boolean; }
type UploadMode = 'single' | 'bulk';

// ── Reusable chip selector ────────────────────────────────────────────────────
function ChipGroup<T>({
  items,
  selected,
  onSelect,
  getKey,
  getLabel,
  activeColor,
  colors,
}: {
  items: T[];
  selected: T | null;
  onSelect: (item: T) => void;
  getKey: (item: T) => string | number;
  getLabel: (item: T) => string;
  activeColor: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={chipStyles.row}>
      {items.map(item => {
        const active = selected !== null && getKey(item) === getKey(selected as T);
        return (
          <TouchableOpacity
            key={getKey(item)}
            style={[
              chipStyles.chip,
              {
                backgroundColor: active ? activeColor + '15' : colors.surfaceVariant,
                borderColor: active ? activeColor : 'transparent',
              },
            ]}
            onPress={() => onSelect(item)}
          >
            <Text style={[chipStyles.chipText, { color: active ? activeColor : colors.textSecondary }]}>
              {getLabel(item)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const chipStyles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1.5,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
});

// ── Answer option row ─────────────────────────────────────────────────────────
function AnswerRow({
  index,
  answer,
  onChange,
  onSetCorrect,
  colors,
  t,
  disabled,
}: {
  index: number;
  answer: AnswerOption;
  onChange: (text: string) => void;
  onSetCorrect: () => void;
  colors: ReturnType<typeof useColors>;
  t: (k: string, o?: any) => string;
  disabled?: boolean;
}) {
  const label = String.fromCharCode(65 + index);
  return (
    <View style={[
      answerStyles.row,
      {
        backgroundColor: answer.isCorrect ? colors.success + '08' : colors.surface,
        borderColor: answer.isCorrect ? colors.success : colors.border,
      },
    ]}>
      <TouchableOpacity
        style={[
          answerStyles.selector,
          {
            backgroundColor: answer.isCorrect ? colors.success : colors.surfaceVariant,
            borderColor: answer.isCorrect ? colors.success : colors.border,
          },
        ]}
        onPress={onSetCorrect}
        disabled={disabled}
      >
        {answer.isCorrect
          ? <MaterialCommunityIcons name="check" size={14} color="#fff" />
          : <Text style={[answerStyles.selectorLabel, { color: colors.textSecondary }]}>{label}</Text>
        }
      </TouchableOpacity>
      <TextInput
        mode="flat"
        placeholder={t('contribute.answerOption', { option: label })}
        value={answer.text}
        onChangeText={onChange}
        style={[answerStyles.input, { backgroundColor: 'transparent' }]}
        underlineColor="transparent"
        activeUnderlineColor="transparent"
        disabled={disabled}
        dense
      />
    </View>
  );
}

const answerStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    paddingRight: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  selector: {
    width: 36, height: 44,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1.5, borderRightColor: 'inherit',
    marginRight: 4,
  },
  selectorLabel: { fontSize: 13, fontWeight: '800' },
  input: { flex: 1, fontSize: 14 },
});

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({
  title,
  icon,
  iconColor,
  colors,
  children,
}: {
  title: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor: string;
  colors: ReturnType<typeof useColors>;
  children: React.ReactNode;
}) {
  return (
    <View style={[sectionStyles.card, { backgroundColor: colors.surface }]}>
      <View style={sectionStyles.header}>
        <View style={[sectionStyles.iconWrap, { backgroundColor: iconColor + '15' }]}>
          <MaterialCommunityIcons name={icon} size={16} color={iconColor} />
        </View>
        <Text style={[sectionStyles.title, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  card: {
    borderRadius: 16, padding: 16, marginBottom: 14,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  iconWrap: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 14, fontWeight: '700' },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function AddQuestionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();

  const { data: branches, status: branchStatus } = usePaginatedApi<Branch>('/api/branches/');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedSubBranch, setSelectedSubBranch] = useState<number | null>(null);
  const { data: categories, status: categoryStatus, execute: fetchCategories } = useApi<Category[]>(
    selectedBranch
      ? `/api/categories/for-branch/?branch=${selectedBranch.id}${selectedSubBranch ? `&sub_branch=${selectedSubBranch}` : ''}`
      : '',
    true
  );

  const [uploadMode, setUploadMode] = useState<UploadMode>('single');
  const [questionText, setQuestionText] = useState('');
  const [questionTextNp, setQuestionTextNp] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [answers, setAnswers] = useState<AnswerOption[]>([
    { text: '', isCorrect: true },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
    { text: '', isCorrect: false },
  ]);
  const [explanation, setExplanation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ uploading: boolean; result: BulkUploadResponse | null }>({
    uploading: false, result: null,
  });

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedSubBranch(null);
    setSelectedCategory(null);
  };

  React.useEffect(() => {
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

  const updateAnswer = (i: number, text: string) => {
    const a = [...answers]; a[i].text = text; setAnswers(a);
  };
  const setCorrectAnswer = (i: number) => {
    setAnswers(answers.map((a, idx) => ({ ...a, isCorrect: idx === i })));
  };

  const handleSingleSubmit = async () => {
    if (!questionText.trim()) return Alert.alert(t('contribute.missingQuestionTitle'), t('contribute.missingQuestionMessage'));
    if (!selectedCategory) return Alert.alert(t('contribute.missingCategoryTitle'), t('contribute.missingCategoryMessage'));
    if (answers.some(a => !a.text.trim())) return Alert.alert(t('contribute.missingAnswersTitle'), t('contribute.missingAnswersMessage'));

    setIsSubmitting(true);
    try {
      await createQuestion({
        question_text_en: questionText,
        question_text_np: questionTextNp || questionText,
        category: selectedCategory.id,
        explanation_en: explanation,
        explanation_np: explanation,
        consent_given: true,
        answers: answers.map((a, i) => ({
          answer_text_en: a.text, answer_text_np: a.text,
          is_correct: a.isCorrect, display_order: i,
        })),
      });
      Alert.alert(t('common.success'), t('contribute.submittedForReview'), [
        { text: t('common.ok'), onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('contribute.submitFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: [...VALID_UPLOAD_MIME_TYPES], copyToCacheDirectory: true });
      if (!result.canceled && result.assets?.[0]) {
        const file = result.assets[0];
        const validation = validateUploadFile({ name: file.name, type: file.mimeType, size: file.size });
        if (!validation.isValid) return Alert.alert(t('contribute.invalidFileTitle'), validation.error || t('contribute.invalidFileMessage'));
        setSelectedFile(file);
        setUploadProgress({ uploading: false, result: null });
      }
    } catch { Alert.alert(t('common.error'), t('contribute.filePickFailed')); }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) return Alert.alert(t('contribute.noFileSelectedTitle'), t('contribute.noFileSelectedMessage'));
    if (!selectedCategory) return Alert.alert(t('contribute.missingCategoryTitle'), t('contribute.missingCategoryForBulk'));

    setUploadProgress({ uploading: true, result: null });
    try {
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();
      const file = new File([blob], selectedFile.name, { type: selectedFile.mimeType || 'application/octet-stream' });
      const result = await bulkUploadQuestions(file, selectedCategory.id);
      setUploadProgress({ uploading: false, result });
      if (result.success) {
        Alert.alert(
          t('contribute.uploadCompleteTitle'),
          t('contribute.uploadCompleteMessage', { uploaded: result.uploaded_count, failed: result.failed_count }),
          [{ text: t('common.ok'), onPress: () => router.back() }]
        );
      } else {
        Alert.alert(t('contribute.uploadFailedTitle'), result.errors?.join('\n') || t('contribute.unknownError'));
      }
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('contribute.uploadFailedMessage'));
      setUploadProgress({ uploading: false, result: null });
    }
  };

  const isLoading = uploadMode === 'single' ? isSubmitting : uploadProgress.uploading;

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
            {t('contribute.addQuestion')}
          </Text>
          <View style={{ width: 36 }} />
        </View>

        {/* ── Mode toggle ── */}
        <View style={[styles.modeToggle, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {(['single', 'bulk'] as UploadMode[]).map(mode => {
            const active = uploadMode === mode;
            return (
              <TouchableOpacity
                key={mode}
                style={[
                  styles.modeBtn,
                  { borderBottomColor: active ? colors.primary : 'transparent' },
                ]}
                onPress={() => setUploadMode(mode)}
              >
                <MaterialCommunityIcons
                  name={mode === 'single' ? 'file-document-outline' : 'file-upload-outline'}
                  size={16}
                  color={active ? colors.primary : colors.textSecondary}
                />
                <Text style={[
                  styles.modeBtnText,
                  { color: active ? colors.primary : colors.textSecondary },
                ]}>
                  {mode === 'single' ? t('contribute.singleQuestion') : t('contribute.bulkUpload')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* ── Branch selection ── */}
          <SectionCard title={t('contribute.selectBranch')} icon="source-branch" iconColor={colors.primary} colors={colors}>
            {branchStatus === 'loading' ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <ChipGroup
                items={branches ?? []}
                selected={selectedBranch}
                onSelect={handleBranchSelect}
                getKey={b => b.id}
                getLabel={b => lf(b.name_en, b.name_np)}
                activeColor={colors.primary}
                colors={colors}
              />
            )}

            {selectedBranch?.has_sub_branches && (selectedBranch.sub_branches?.length ?? 0) > 0 && (
              <View style={{ marginTop: 14 }}>
                <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                  {t('contribute.selectSubBranch', { defaultValue: 'Sub-branch (optional)' })}
                </Text>
                <View style={chipStyles.row}>
                  <TouchableOpacity
                    style={[chipStyles.chip, {
                      backgroundColor: selectedSubBranch === null ? colors.primary + '15' : colors.surfaceVariant,
                      borderColor: selectedSubBranch === null ? colors.primary : 'transparent',
                    }]}
                    onPress={() => { setSelectedSubBranch(null); setSelectedCategory(null); }}
                  >
                    <Text style={[chipStyles.chipText, { color: selectedSubBranch === null ? colors.primary : colors.textSecondary }]}>
                      {t('contribute.filterAll')}
                    </Text>
                  </TouchableOpacity>
                  {selectedBranch.sub_branches?.map(sb => (
                    <TouchableOpacity
                      key={sb.id}
                      style={[chipStyles.chip, {
                        backgroundColor: selectedSubBranch === sb.id ? colors.primary + '15' : colors.surfaceVariant,
                        borderColor: selectedSubBranch === sb.id ? colors.primary : 'transparent',
                      }]}
                      onPress={() => { setSelectedSubBranch(sb.id); setSelectedCategory(null); }}
                    >
                      <Text style={[chipStyles.chipText, { color: selectedSubBranch === sb.id ? colors.primary : colors.textSecondary }]}>
                        {lf(sb.name_en, sb.name_np)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </SectionCard>

          {/* ── Category selection ── */}
          {selectedBranch && (
            <SectionCard title={t('contribute.selectCategory')} icon="tag-outline" iconColor={colors.accent} colors={colors}>
              {categoryStatus === 'loading' ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View style={{ gap: 12 }}>
                  {groupedCategories.universal.length > 0 && (
                    <View>
                      <Text style={[styles.catGroupLabel, { color: colors.info }]}>{t('contribute.commonSubjects')}</Text>
                      <ChipGroup
                        items={groupedCategories.universal}
                        selected={selectedCategory}
                        onSelect={setSelectedCategory}
                        getKey={c => c.id}
                        getLabel={c => lf(c.name_en, c.name_np)}
                        activeColor={colors.info}
                        colors={colors}
                      />
                    </View>
                  )}
                  {groupedCategories.branch.length > 0 && (
                    <View>
                      <Text style={[styles.catGroupLabel, { color: colors.accent }]}>{t('contribute.serviceSpecific')}</Text>
                      <ChipGroup
                        items={groupedCategories.branch}
                        selected={selectedCategory}
                        onSelect={setSelectedCategory}
                        getKey={c => c.id}
                        getLabel={c => lf(c.name_en, c.name_np)}
                        activeColor={colors.accent}
                        colors={colors}
                      />
                    </View>
                  )}
                  {groupedCategories.subbranch.length > 0 && (
                    <View>
                      <Text style={[styles.catGroupLabel, { color: colors.secondary }]}>{t('contribute.specialization')}</Text>
                      <ChipGroup
                        items={groupedCategories.subbranch}
                        selected={selectedCategory}
                        onSelect={setSelectedCategory}
                        getKey={c => c.id}
                        getLabel={c => lf(c.name_en, c.name_np)}
                        activeColor={colors.secondary}
                        colors={colors}
                      />
                    </View>
                  )}
                  {categories?.length === 0 && (
                    <Text style={[styles.subLabel, { color: colors.textSecondary }]}>
                      {t('practice.noCategories')}
                    </Text>
                  )}
                </View>
              )}
            </SectionCard>
          )}

          {uploadMode === 'single' ? (
            <>
              {/* ── Question text ── */}
              <SectionCard title={t('contribute.questionTextEn')} icon="help-circle-outline" iconColor={colors.primary} colors={colors}>
                <TextInput
                  mode="outlined"
                  placeholder={t('contribute.questionPlaceholderEn')}
                  value={questionText}
                  onChangeText={setQuestionText}
                  multiline numberOfLines={4}
                  style={[styles.textArea, { backgroundColor: colors.surface }]}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                />
                <Text style={[styles.subLabel, { color: colors.textSecondary, marginTop: 12, marginBottom: 6 }]}>
                  {t('contribute.questionTextNp')} <Text style={{ color: colors.textTertiary }}>(optional)</Text>
                </Text>
                <TextInput
                  mode="outlined"
                  placeholder={t('contribute.questionPlaceholderNp')}
                  value={questionTextNp}
                  onChangeText={setQuestionTextNp}
                  multiline numberOfLines={3}
                  style={[styles.textArea, { backgroundColor: colors.surface }]}
                  outlineColor={colors.border}
                  activeOutlineColor={colors.primary}
                />
              </SectionCard>

              {/* ── Answer options ── */}
              <SectionCard title={t('contribute.answerOptions')} icon="format-list-bulleted" iconColor={colors.success} colors={colors}>
                <Text style={[styles.subLabel, { color: colors.textSecondary, marginBottom: 10 }]}>
                  {t('contribute.answerHint')}
                </Text>
                {answers.map((answer, i) => (
                  <AnswerRow
                    key={i}
                    index={i}
                    answer={answer}
                    onChange={text => updateAnswer(i, text)}
                    onSetCorrect={() => setCorrectAnswer(i)}
                    colors={colors}
                    t={t}
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
                />
              </SectionCard>
            </>
          ) : (
            <>
              {/* ── Bulk upload ── */}
              <SectionCard title={t('contribute.uploadFileTitle')} icon="file-upload-outline" iconColor={colors.accent} colors={colors}>
                <Text style={[styles.subLabel, { color: colors.textSecondary, marginBottom: 12 }]}>
                  {t('contribute.uploadFileHint')}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.filePicker,
                    {
                      borderColor: selectedFile ? colors.success : colors.border,
                      backgroundColor: selectedFile ? colors.success + '08' : colors.surfaceVariant,
                    },
                  ]}
                  onPress={handleFilePick}
                >
                  <MaterialCommunityIcons
                    name={selectedFile ? 'file-check-outline' : 'upload-outline'}
                    size={28}
                    color={selectedFile ? colors.success : colors.textTertiary}
                  />
                  <Text style={[styles.filePickerTitle, { color: selectedFile ? colors.success : colors.textPrimary }]}>
                    {selectedFile ? selectedFile.name : t('contribute.selectFile')}
                  </Text>
                  {selectedFile && (
                    <Text style={[styles.filePickerSize, { color: colors.textTertiary }]}>
                      {((selectedFile.size || 0) / 1024).toFixed(1)} KB
                    </Text>
                  )}
                  {!selectedFile && (
                    <Text style={[styles.filePickerSub, { color: colors.textTertiary }]}>
                      PDF, Excel, CSV up to 10MB
                    </Text>
                  )}
                </TouchableOpacity>

                {uploadProgress.uploading && (
                  <View style={styles.uploadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.uploadingText, { color: colors.textSecondary }]}>
                      {t('contribute.uploading')}
                    </Text>
                  </View>
                )}

                {uploadProgress.result && (
                  <View style={[styles.resultBox, { backgroundColor: colors.surfaceVariant }]}>
                    <View style={styles.resultRow}>
                      <MaterialCommunityIcons name="check-circle" size={16} color={colors.success} />
                      <Text style={[styles.resultText, { color: colors.success }]}>
                        {t('contribute.questionsUploaded', { count: uploadProgress.result.uploaded_count })}
                      </Text>
                    </View>
                    {uploadProgress.result.failed_count > 0 && (
                      <View style={styles.resultRow}>
                        <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
                        <Text style={[styles.resultText, { color: colors.error }]}>
                          {t('contribute.failedCount', { count: uploadProgress.result.failed_count })}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </SectionCard>

              {/* ── Format info ── */}
              <View style={[styles.infoBox, { backgroundColor: colors.info + '10', borderColor: colors.info + '30' }]}>
                <MaterialCommunityIcons name="information-outline" size={16} color={colors.info} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoTitle, { color: colors.info }]}>{t('contribute.acceptedFormats')}</Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {t('contribute.fileFormatPdf')} • {t('contribute.fileFormatExcel')} • {t('contribute.fileFormatMax')}
                  </Text>
                </View>
              </View>
            </>
          )}

        </ScrollView>

        {/* ── Submit bar ── */}
        <View style={[styles.submitBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: isLoading ? colors.primary + '60' : colors.primary },
            ]}
            onPress={uploadMode === 'single' ? handleSingleSubmit : handleBulkUpload}
            disabled={isLoading || (uploadMode === 'bulk' && !selectedFile)}
            activeOpacity={0.85}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons
                name={uploadMode === 'single' ? 'send' : 'upload'}
                size={18}
                color="#fff"
              />
            )}
            <Text style={styles.submitBtnText}>
              {uploadMode === 'single' ? t('contribute.submitForReview') : t('contribute.uploadQuestions')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 17, fontWeight: '700' },
  modeToggle: {
    flexDirection: 'row',
    borderBottomWidth: 1.5,
  },
  modeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderBottomWidth: 2.5,
  },
  modeBtnText: { fontSize: 14, fontWeight: '600' },
  scrollContent: { padding: 16, paddingBottom: 24 },
  subLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  catGroupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 8 },
  textArea: { fontSize: 14 },
  filePicker: {
    borderWidth: 2, borderStyle: 'dashed', borderRadius: 14,
    padding: 24, alignItems: 'center', gap: 6,
  },
  filePickerTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
  filePickerSize: { fontSize: 11 },
  filePickerSub: { fontSize: 12 },
  uploadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  uploadingText: { fontSize: 13 },
  resultBox: { borderRadius: 10, padding: 10, marginTop: 10, gap: 5 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultText: { fontSize: 13, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row', gap: 10, padding: 12,
    borderRadius: 12, borderWidth: 1, marginBottom: 8,
  },
  infoTitle: { fontSize: 12, fontWeight: '700', marginBottom: 3 },
  infoText: { fontSize: 12, lineHeight: 18 },
  submitBar: {
    padding: 14, borderTopWidth: StyleSheet.hairlineWidth,
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  submitBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});
