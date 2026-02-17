import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, TextInput, Button, Chip, ActivityIndicator, RadioButton, SegmentedButtons, ProgressBar } from 'react-native-paper';
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
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

type UploadMode = 'single' | 'bulk';

export default function AddQuestionScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: branches, status: branchStatus } = usePaginatedApi<Branch>('/api/branches/');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedSubBranch, setSelectedSubBranch] = useState<number | null>(null);
  const { data: categories, status: categoryStatus, execute: fetchCategories } = useApi<Category[]>(
    selectedBranch
      ? `/api/categories/for-branch/?branch=${selectedBranch.id}${selectedSubBranch ? `&sub_branch=${selectedSubBranch}` : ''}`
      : '',
    true
  );

  // Mode selection
  const [uploadMode, setUploadMode] = useState<UploadMode>('single');

  // Single question form state
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
  const [explanationNp, setExplanationNp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Bulk upload state
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ uploading: boolean; result: BulkUploadResponse | null }>({
    uploading: false,
    result: null,
  });

  // Handle branch selection
  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedSubBranch(null);
    setSelectedCategory(null);
  };

  // Handle sub-branch selection (0 means "All" / no filter)
  const handleSubBranchSelect = (subBranchId: number) => {
    setSelectedSubBranch(subBranchId === 0 ? null : subBranchId);
    setSelectedCategory(null);
  };

  // Refetch categories when branch or sub-branch changes
  React.useEffect(() => {
    if (selectedBranch) {
      fetchCategories();
    }
  }, [selectedBranch?.id, selectedSubBranch, fetchCategories, selectedBranch]);

  // Group categories by scope for display
  const groupedCategories = React.useMemo(() => {
    if (!categories) return { universal: [] as Category[], branch: [] as Category[], subbranch: [] as Category[] };
    return {
      universal: categories.filter(c => c.scope_type === 'UNIVERSAL'),
      branch: categories.filter(c => c.scope_type === 'BRANCH'),
      subbranch: categories.filter(c => c.scope_type === 'SUBBRANCH'),
    };
  }, [categories]);

  const updateAnswer = (index: number, text: string) => {
    const newAnswers = [...answers];
    newAnswers[index].text = text;
    setAnswers(newAnswers);
  };

  const setCorrectAnswer = (index: number) => {
    const newAnswers = answers.map((a, i) => ({ ...a, isCorrect: i === index }));
    setAnswers(newAnswers);
  };

  const handleSingleSubmit = async () => {
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
      await createQuestion({
        question_text_en: questionText,
        question_text_np: questionTextNp || questionText,
        category: selectedCategory.id,
        explanation_en: explanation,
        explanation_np: explanationNp || explanation,
        consent_given: true,
        answers: answers.map((a, index) => ({
          answer_text_en: a.text,
          answer_text_np: a.text,
          is_correct: a.isCorrect,
          display_order: index,
        })),
      });
      Alert.alert(t('common.success'), t('contribute.submittedForReview'), [{ text: t('common.ok'), onPress: () => router.back() }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('contribute.submitFailed');
      Alert.alert(t('common.error'), message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFilePick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [...VALID_UPLOAD_MIME_TYPES],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        
        // Validate file type using shared utility
        const validation = validateUploadFile({
          name: file.name,
          type: file.mimeType,
          size: file.size,
        });
        
        if (!validation.isValid) {
          Alert.alert(t('contribute.invalidFileTitle'), validation.error || t('contribute.invalidFileMessage'));
          return;
        }
        
        setSelectedFile(file);
        setUploadProgress({ uploading: false, result: null });
      }
    } catch {
      Alert.alert(t('common.error'), t('contribute.filePickFailed'));
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      Alert.alert(t('contribute.noFileSelectedTitle'), t('contribute.noFileSelectedMessage'));
      return;
    }
    if (!selectedCategory) {
      Alert.alert(t('contribute.missingCategoryTitle'), t('contribute.missingCategoryForBulk'));
      return;
    }

    setUploadProgress({ uploading: true, result: null });
    
    try {
      // Create a File object from the DocumentPicker result
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
      const message = err instanceof Error ? err.message : t('contribute.uploadFailedMessage');
      Alert.alert(t('common.error'), message);
      setUploadProgress({ uploading: false, result: null });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('contribute.addQuestion')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Upload Mode Selection */}
          <SegmentedButtons
            value={uploadMode}
            onValueChange={(v) => setUploadMode(v as UploadMode)}
            buttons={[
              { value: 'single', label: t('contribute.singleQuestion'), icon: 'file-document' },
              { value: 'bulk', label: t('contribute.bulkUpload'), icon: 'file-upload' },
            ]}
            style={styles.modeSelector}
          />

          {/* Branch Selection */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>{t('contribute.selectBranch')}</Text>
              {branchStatus === 'loading' ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View style={styles.chipRow}>
                  {branches?.map((branch) => (
                    <Chip
                      key={branch.id}
                      selected={selectedBranch?.id === branch.id}
                      onPress={() => handleBranchSelect(branch)}
                      style={styles.chip}
                      selectedColor={colors.primary}
                    >
                      {lf(branch.name_en, branch.name_np)}
                    </Chip>
                  ))}
                </View>
              )}

              {/* Sub-branch selection if applicable */}
              {selectedBranch?.has_sub_branches && (selectedBranch.sub_branches?.length ?? 0) > 0 && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>
                    {t('contribute.selectSubBranch', { defaultValue: 'Select Sub-Branch (optional)' })}
                  </Text>
                  <View style={styles.chipRow}>
                    <Chip
                      selected={selectedSubBranch === null}
                      onPress={() => handleSubBranchSelect(0)}
                      style={styles.chip}
                      selectedColor={colors.primary}
                    >
                      {t('common.allTests', { defaultValue: 'All' })}
                    </Chip>
                    {selectedBranch.sub_branches?.map((sb) => (
                      <Chip
                        key={sb.id}
                        selected={selectedSubBranch === sb.id}
                        onPress={() => handleSubBranchSelect(sb.id)}
                        style={styles.chip}
                        selectedColor={colors.primary}
                      >
                        {lf(sb.name_en, sb.name_np)}
                      </Chip>
                    ))}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>

          {/* Category Selection — grouped by scope */}
          {selectedBranch && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.inputLabel}>{t('contribute.selectCategory')}</Text>
                {categoryStatus === 'loading' ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <View>
                    {groupedCategories.universal.length > 0 && (
                      <>
                        <Text style={[styles.inputHint, { fontWeight: '600', color: colors.info }]}>
                          {t('practice.universalSubjects', { defaultValue: 'Common Subjects' })}
                        </Text>
                        <View style={styles.chipRow}>
                          {groupedCategories.universal.map((cat) => (
                            <Chip
                              key={cat.id}
                              selected={selectedCategory?.id === cat.id}
                              onPress={() => setSelectedCategory(cat)}
                              style={styles.chip}
                              selectedColor={colors.info}
                            >
                              {lf(cat.name_en, cat.name_np)}
                            </Chip>
                          ))}
                        </View>
                      </>
                    )}
                    {groupedCategories.branch.length > 0 && (
                      <>
                        <Text style={[styles.inputHint, { fontWeight: '600', color: colors.accent, marginTop: Spacing.sm }]}>
                          {t('practice.branchSubjects', { defaultValue: 'Service Specific' })}
                        </Text>
                        <View style={styles.chipRow}>
                          {groupedCategories.branch.map((cat) => (
                            <Chip
                              key={cat.id}
                              selected={selectedCategory?.id === cat.id}
                              onPress={() => setSelectedCategory(cat)}
                              style={styles.chip}
                              selectedColor={colors.accent}
                            >
                              {lf(cat.name_en, cat.name_np)}
                            </Chip>
                          ))}
                        </View>
                      </>
                    )}
                    {groupedCategories.subbranch.length > 0 && (
                      <>
                        <Text style={[styles.inputHint, { fontWeight: '600', color: colors.secondary, marginTop: Spacing.sm }]}>
                          {t('practice.subBranchSubjects', { defaultValue: 'Specialization' })}
                        </Text>
                        <View style={styles.chipRow}>
                          {groupedCategories.subbranch.map((cat) => (
                            <Chip
                              key={cat.id}
                              selected={selectedCategory?.id === cat.id}
                              onPress={() => setSelectedCategory(cat)}
                              style={styles.chip}
                              selectedColor={colors.secondary}
                            >
                              {lf(cat.name_en, cat.name_np)}
                            </Chip>
                          ))}
                        </View>
                      </>
                    )}
                    {categories && categories.length === 0 && (
                      <Text style={styles.inputHint}>{t('practice.noCategories')}</Text>
                    )}
                  </View>
                )}
              </Card.Content>
            </Card>
          )}

          {uploadMode === 'single' ? (
            <>
              {/* Question Text */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.inputLabel}>{t('contribute.questionTextEn')}</Text>
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
                  />
                  <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>{t('contribute.questionTextNp')}</Text>
                  <TextInput 
                    mode="outlined" 
                    placeholder={t('contribute.questionPlaceholderNp')}
                    value={questionTextNp} 
                    onChangeText={setQuestionTextNp} 
                    multiline 
                    numberOfLines={3} 
                    style={styles.textArea} 
                    outlineColor={colors.border} 
                    activeOutlineColor={colors.primary} 
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
                        onPress={() => setCorrectAnswer(index)} 
                        color={colors.success} 
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
                  />
                </Card.Content>
              </Card>
            </>
          ) : (
            <>
              {/* Bulk Upload Section */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.inputLabel}>{t('contribute.uploadFileTitle')}</Text>
                  <Text style={styles.inputHint}>
                    {t('contribute.uploadFileHint')}
                  </Text>
                  
                  <TouchableOpacity style={styles.filePickerButton} onPress={handleFilePick}>
                    <MaterialCommunityIcons 
                      name={selectedFile ? 'file-check' : 'file-upload'} 
                      size={32} 
                      color={selectedFile ? colors.success : colors.primary} 
                    />
                    <Text style={styles.filePickerText}>
                      {selectedFile ? selectedFile.name : t('contribute.selectFile')}
                    </Text>
                    {selectedFile && (
                      <Text style={styles.fileSizeText}>
                        {((selectedFile.size || 0) / 1024).toFixed(1)} KB
                      </Text>
                    )}
                  </TouchableOpacity>

                  {uploadProgress.uploading && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressText}>{t('contribute.uploading')}</Text>
                      <ProgressBar indeterminate color={colors.primary} style={styles.progressBar} />
                    </View>
                  )}

                  {uploadProgress.result && (
                    <View style={styles.resultContainer}>
                      <View style={styles.resultRow}>
                        <MaterialCommunityIcons name="check-circle" size={20} color={colors.success} />
                        <Text style={styles.resultText}>{t('contribute.uploadedCount', { count: uploadProgress.result.uploaded_count })}</Text>
                      </View>
                      {uploadProgress.result.failed_count > 0 && (
                        <View style={styles.resultRow}>
                          <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                          <Text style={[styles.resultText, { color: colors.error }]}>
                            {t('contribute.failedCount', { count: uploadProgress.result.failed_count })}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </Card.Content>
              </Card>

              {/* File Format Info */}
              <Card style={styles.infoCard}>
                <Card.Content>
                  <View style={styles.infoHeader}>
                    <MaterialCommunityIcons name="information" size={20} color={colors.info} />
                    <Text style={styles.infoTitle}>{t('contribute.fileFormatTitle')}</Text>
                  </View>
                  <Text style={styles.infoText}>• {t('contribute.fileFormatPdf')}</Text>
                  <Text style={styles.infoText}>• {t('contribute.fileFormatExcel')}</Text>
                  <Text style={styles.infoText}>• {t('contribute.fileFormatMax')}</Text>
                </Card.Content>
              </Card>
            </>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.bottomAction}>
          <Button 
            mode="contained" 
            icon={uploadMode === 'single' ? 'send' : 'upload'} 
            style={styles.submitButton} 
            contentStyle={styles.submitButtonContent} 
            labelStyle={styles.submitButtonLabel} 
            onPress={uploadMode === 'single' ? handleSingleSubmit : handleBulkUpload} 
            loading={isSubmitting || uploadProgress.uploading} 
            disabled={isSubmitting || uploadProgress.uploading || (uploadMode === 'bulk' && !selectedFile)}
          >
            {uploadMode === 'single' ? t('contribute.submitForReview') : t('contribute.uploadQuestions')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  modeSelector: { marginBottom: Spacing.lg },
  card: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: Spacing.sm },
  inputHint: { fontSize: 12, color: colors.textSecondary, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { marginBottom: Spacing.xs },
  textArea: { backgroundColor: colors.cardBackground },
  answerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  answerInput: { flex: 1, backgroundColor: colors.cardBackground },
  filePickerButton: { 
    borderWidth: 2, 
    borderColor: colors.border, 
    borderStyle: 'dashed', 
    borderRadius: BorderRadius.lg, 
    padding: Spacing.xl, 
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  filePickerText: { fontSize: 14, color: colors.textSecondary, marginTop: Spacing.sm },
  fileSizeText: { fontSize: 12, color: colors.textTertiary, marginTop: Spacing.xs },
  progressContainer: { marginTop: Spacing.lg },
  progressText: { fontSize: 14, color: colors.textSecondary, marginBottom: Spacing.sm },
  progressBar: { height: 6, borderRadius: 3 },
  resultContainer: { marginTop: Spacing.lg, padding: Spacing.md, backgroundColor: colors.surfaceVariant, borderRadius: BorderRadius.md },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  resultText: { fontSize: 14, color: colors.textPrimary, marginLeft: Spacing.sm },
  infoCard: { backgroundColor: colors.infoLight, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  infoTitle: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginLeft: Spacing.sm },
  infoText: { fontSize: 13, color: colors.textSecondary, marginBottom: Spacing.xs },
  bottomAction: { backgroundColor: colors.cardBackground, padding: Spacing.base, borderTopWidth: 1, borderTopColor: colors.border },
  submitButton: { borderRadius: BorderRadius.lg },
  submitButtonContent: { paddingVertical: Spacing.sm },
  submitButtonLabel: { fontSize: 16, fontWeight: '700' },
});
