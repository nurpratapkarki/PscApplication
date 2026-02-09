import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, TextInput, Button, Chip, ActivityIndicator, RadioButton, SegmentedButtons, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { Branch, Category } from '../../types/category.types';
import { createQuestion, bulkUploadQuestions, BulkUploadResponse } from '../../services/api/questions';
import { validateUploadFile, VALID_UPLOAD_MIME_TYPES } from '../../utils/fileValidation';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

interface AnswerOption {
  text: string;
  isCorrect: boolean;
}

type UploadMode = 'single' | 'bulk';

export default function AddQuestionScreen() {
  const router = useRouter();
  const { data: branches, status: branchStatus } = usePaginatedApi<Branch>('/api/branches/');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const { data: categories, status: categoryStatus, execute: fetchCategories } = usePaginatedApi<Category>(
    selectedBranch ? `/api/categories/?target_branch=${selectedBranch.id}` : '', 
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
    setSelectedCategory(null);
    fetchCategories();
  };

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
      Alert.alert('Missing Question', 'Please enter the question text.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Missing Category', 'Please select a category.');
      return;
    }
    if (answers.some((a) => !a.text.trim())) {
      Alert.alert('Missing Answers', 'Please fill in all answer options.');
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
      Alert.alert('Success!', 'Your question has been submitted for review.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit question';
      Alert.alert('Error', message);
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
          Alert.alert('Invalid File', validation.error || 'Invalid file type');
          return;
        }
        
        setSelectedFile(file);
        setUploadProgress({ uploading: false, result: null });
      }
    } catch {
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleBulkUpload = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a PDF or Excel file first.');
      return;
    }
    if (!selectedCategory) {
      Alert.alert('Missing Category', 'Please select a category for the questions.');
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
          'Upload Complete!',
          `Successfully uploaded ${result.uploaded_count} questions.${result.failed_count > 0 ? ` ${result.failed_count} failed.` : ''}`,
          [{ text: 'OK', onPress: () => router.back() }]
        );
      } else {
        Alert.alert('Upload Failed', result.errors?.join('\n') || 'Unknown error occurred');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      Alert.alert('Error', message);
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
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Add Question</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Upload Mode Selection */}
          <SegmentedButtons
            value={uploadMode}
            onValueChange={(v) => setUploadMode(v as UploadMode)}
            buttons={[
              { value: 'single', label: 'Single Question', icon: 'file-document' },
              { value: 'bulk', label: 'Bulk Upload', icon: 'file-upload' },
            ]}
            style={styles.modeSelector}
          />

          {/* Branch Selection */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>Select Branch</Text>
              {branchStatus === 'loading' ? (
                <ActivityIndicator size="small" color={Colors.primary} />
              ) : (
                <View style={styles.chipRow}>
                  {branches?.map((branch) => (
                    <Chip 
                      key={branch.id} 
                      selected={selectedBranch?.id === branch.id} 
                      onPress={() => handleBranchSelect(branch)} 
                      style={styles.chip} 
                      selectedColor={Colors.primary}
                    >
                      {branch.name_en}
                    </Chip>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>

          {/* Category Selection */}
          {selectedBranch && (
            <Card style={styles.card}>
              <Card.Content>
                <Text style={styles.inputLabel}>Select Category</Text>
                {categoryStatus === 'loading' ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <View style={styles.chipRow}>
                    {categories?.slice(0, 8).map((cat) => (
                      <Chip 
                        key={cat.id} 
                        selected={selectedCategory?.id === cat.id} 
                        onPress={() => setSelectedCategory(cat)} 
                        style={styles.chip} 
                        selectedColor={Colors.primary}
                      >
                        {cat.name_en}
                      </Chip>
                    ))}
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
                  <Text style={styles.inputLabel}>Question Text (English)</Text>
                  <TextInput 
                    mode="outlined" 
                    placeholder="Enter your question here..." 
                    value={questionText} 
                    onChangeText={setQuestionText} 
                    multiline 
                    numberOfLines={4} 
                    style={styles.textArea} 
                    outlineColor={Colors.border} 
                    activeOutlineColor={Colors.primary} 
                  />
                  <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>Question Text (Nepali - Optional)</Text>
                  <TextInput 
                    mode="outlined" 
                    placeholder="नेपालीमा प्रश्न लेख्नुहोस्..." 
                    value={questionTextNp} 
                    onChangeText={setQuestionTextNp} 
                    multiline 
                    numberOfLines={3} 
                    style={styles.textArea} 
                    outlineColor={Colors.border} 
                    activeOutlineColor={Colors.primary} 
                  />
                </Card.Content>
              </Card>

              {/* Answer Options */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.inputLabel}>Answer Options</Text>
                  <Text style={styles.inputHint}>Tap the radio button to mark the correct answer</Text>
                  {answers.map((answer, index) => (
                    <View key={index} style={styles.answerRow}>
                      <RadioButton 
                        value={String(index)} 
                        status={answer.isCorrect ? 'checked' : 'unchecked'} 
                        onPress={() => setCorrectAnswer(index)} 
                        color={Colors.success} 
                      />
                      <TextInput 
                        mode="outlined" 
                        placeholder={`Option ${String.fromCharCode(65 + index)}`} 
                        value={answer.text} 
                        onChangeText={(text) => updateAnswer(index, text)} 
                        style={styles.answerInput} 
                        outlineColor={answer.isCorrect ? Colors.success : Colors.border} 
                        activeOutlineColor={answer.isCorrect ? Colors.success : Colors.primary} 
                        dense 
                      />
                    </View>
                  ))}
                </Card.Content>
              </Card>

              {/* Explanation */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.inputLabel}>Explanation (Optional)</Text>
                  <TextInput 
                    mode="outlined" 
                    placeholder="Explain why this is the correct answer..." 
                    value={explanation} 
                    onChangeText={setExplanation} 
                    multiline 
                    numberOfLines={3} 
                    style={styles.textArea} 
                    outlineColor={Colors.border} 
                    activeOutlineColor={Colors.primary} 
                  />
                </Card.Content>
              </Card>
            </>
          ) : (
            <>
              {/* Bulk Upload Section */}
              <Card style={styles.card}>
                <Card.Content>
                  <Text style={styles.inputLabel}>Upload Questions File</Text>
                  <Text style={styles.inputHint}>
                    Upload a PDF or Excel file containing questions. Only .pdf, .xlsx, and .xls files are accepted.
                  </Text>
                  
                  <TouchableOpacity style={styles.filePickerButton} onPress={handleFilePick}>
                    <MaterialCommunityIcons 
                      name={selectedFile ? 'file-check' : 'file-upload'} 
                      size={32} 
                      color={selectedFile ? Colors.success : Colors.primary} 
                    />
                    <Text style={styles.filePickerText}>
                      {selectedFile ? selectedFile.name : 'Tap to select a file'}
                    </Text>
                    {selectedFile && (
                      <Text style={styles.fileSizeText}>
                        {((selectedFile.size || 0) / 1024).toFixed(1)} KB
                      </Text>
                    )}
                  </TouchableOpacity>

                  {uploadProgress.uploading && (
                    <View style={styles.progressContainer}>
                      <Text style={styles.progressText}>Uploading...</Text>
                      <ProgressBar indeterminate color={Colors.primary} style={styles.progressBar} />
                    </View>
                  )}

                  {uploadProgress.result && (
                    <View style={styles.resultContainer}>
                      <View style={styles.resultRow}>
                        <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
                        <Text style={styles.resultText}>{uploadProgress.result.uploaded_count} questions uploaded</Text>
                      </View>
                      {uploadProgress.result.failed_count > 0 && (
                        <View style={styles.resultRow}>
                          <MaterialCommunityIcons name="alert-circle" size={20} color={Colors.error} />
                          <Text style={[styles.resultText, { color: Colors.error }]}>
                            {uploadProgress.result.failed_count} failed
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
                    <MaterialCommunityIcons name="information" size={20} color={Colors.info} />
                    <Text style={styles.infoTitle}>File Format Requirements</Text>
                  </View>
                  <Text style={styles.infoText}>• PDF: Questions should be clearly formatted with answers marked</Text>
                  <Text style={styles.infoText}>• Excel: Use columns for Question, Options A-D, Correct Answer, Explanation</Text>
                  <Text style={styles.infoText}>• Maximum file size: 10MB</Text>
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
            {uploadMode === 'single' ? 'Submit for Review' : 'Upload Questions'}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  modeSelector: { marginBottom: Spacing.lg },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  inputHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { marginBottom: Spacing.xs },
  textArea: { backgroundColor: Colors.white },
  answerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  answerInput: { flex: 1, backgroundColor: Colors.white },
  filePickerButton: { 
    borderWidth: 2, 
    borderColor: Colors.border, 
    borderStyle: 'dashed', 
    borderRadius: BorderRadius.lg, 
    padding: Spacing.xl, 
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  filePickerText: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.sm },
  fileSizeText: { fontSize: 12, color: Colors.textTertiary, marginTop: Spacing.xs },
  progressContainer: { marginTop: Spacing.lg },
  progressText: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm },
  progressBar: { height: 6, borderRadius: 3 },
  resultContainer: { marginTop: Spacing.lg, padding: Spacing.md, backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.md },
  resultRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs },
  resultText: { fontSize: 14, color: Colors.textPrimary, marginLeft: Spacing.sm },
  infoCard: { backgroundColor: Colors.infoLight, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  infoHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  infoTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginLeft: Spacing.sm },
  infoText: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.xs },
  bottomAction: { backgroundColor: Colors.white, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  submitButton: { borderRadius: BorderRadius.lg },
  submitButtonContent: { paddingVertical: Spacing.sm },
  submitButtonLabel: { fontSize: 16, fontWeight: '700' },
});
