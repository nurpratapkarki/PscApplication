import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Text, TextInput, Button, Chip, ActivityIndicator, RadioButton } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../../hooks/useApi';
import { Question, AnswerOption as AnswerOptionType } from '../../../types/question.types';
import { Category } from '../../../types/category.types';
import { Contribution } from '../../../types/contribution.types';
import { Colors } from '../../../constants/colors';
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
      Alert.alert('Success!', 'Your question has been updated and resubmitted for review.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Contribution',
      'Are you sure you want to delete this contribution? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = getAccessToken();
              await deleteQuestion(question!.id, token);
              router.back();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to delete question. Please try again.');
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

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Question</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <MaterialCommunityIcons name="delete" size={20} color={Colors.error} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Status Banner */}
          {contribution && (
            <Card style={[
              styles.statusBanner,
              { 
                backgroundColor: isRejected ? Colors.errorLight : 
                  isPending ? Colors.warningLight : Colors.successLight 
              }
            ]}>
              <Card.Content style={styles.statusContent}>
                <MaterialCommunityIcons 
                  name={isRejected ? 'alert-circle' : isPending ? 'clock-outline' : 'check-circle'} 
                  size={24} 
                  color={isRejected ? Colors.error : isPending ? Colors.warning : Colors.success} 
                />
                <View style={styles.statusTextContainer}>
                  <Text style={[
                    styles.statusTitle,
                    { color: isRejected ? Colors.error : isPending ? Colors.warning : Colors.success }
                  ]}>
                    {contribution.status}
                  </Text>
                  {isRejected && contribution.rejection_reason && (
                    <Text style={styles.rejectionReason}>{contribution.rejection_reason}</Text>
                  )}
                  {!canEdit && (
                    <Text style={styles.statusNote}>This question cannot be edited as it has been approved.</Text>
                  )}
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Category Selection */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.chipRow}>
                {categories?.slice(0, 6).map((cat) => (
                  <Chip 
                    key={cat.id} 
                    selected={selectedCategory === cat.id} 
                    onPress={() => canEdit && setSelectedCategory(cat.id)} 
                    style={styles.chip} 
                    selectedColor={Colors.primary}
                    disabled={!canEdit}
                  >
                    {cat.name_en}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>

          {/* Question Text */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>Question Text</Text>
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
                disabled={!canEdit}
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
                    onPress={() => canEdit && setCorrectAnswer(index)} 
                    color={Colors.success}
                    disabled={!canEdit}
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
                    disabled={!canEdit}
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
              Resubmit for Review
            </Button>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: Colors.white, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  deleteButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: Colors.errorLight, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  statusBanner: { borderRadius: BorderRadius.lg, marginBottom: Spacing.lg },
  statusContent: { flexDirection: 'row', alignItems: 'flex-start' },
  statusTextContainer: { flex: 1, marginLeft: Spacing.md },
  statusTitle: { fontSize: 16, fontWeight: '700' },
  rejectionReason: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.xs },
  statusNote: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.xs },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.sm },
  inputHint: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.md },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  chip: { marginBottom: Spacing.xs },
  textArea: { backgroundColor: Colors.white },
  answerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  answerInput: { flex: 1, backgroundColor: Colors.white },
  bottomAction: { backgroundColor: Colors.white, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  submitButton: { borderRadius: BorderRadius.lg },
  submitButtonContent: { paddingVertical: Spacing.sm },
  submitButtonLabel: { fontSize: 16, fontWeight: '700' },
});
