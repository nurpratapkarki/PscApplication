import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Text, TextInput, Button, RadioButton, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { Question } from '../../types/question.types';
import { Colors } from '../../constants/colors';
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

const reportOptions: ReportOption[] = [
  { 
    value: 'INCORRECT_ANSWER', 
    label: 'Incorrect Answer', 
    description: 'The marked correct answer is wrong',
    icon: 'close-circle',
  },
  {
    value: 'TYPO',
    label: 'Typo / Error',
    description: 'The question or explanation contains a typo or error',
    icon: 'alert-circle',
  },
  { 
    value: 'DUPLICATE', 
    label: 'Duplicate Question', 
    description: 'This question already exists in the bank',
    icon: 'content-copy',
  },
  { 
    value: 'INAPPROPRIATE', 
    label: 'Inappropriate Content', 
    description: 'Contains offensive or inappropriate material',
    icon: 'alert-octagon',
  },
  { 
    value: 'OTHER', 
    label: 'Other Issue', 
    description: 'Some other problem with this question',
    icon: 'help-circle',
  },
];

export default function ReportQuestionScreen() {
  const router = useRouter();
  const { questionId } = useLocalSearchParams<{ questionId: string }>();
  
  const { data: question, status: questionStatus } = useApi<Question>(
    questionId ? `/api/questions/${questionId}/` : ''
  );
  
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reason) {
      Alert.alert('Error', 'Please select a reason for reporting');
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
        'Report Submitted',
        'Thank you for your feedback. Our team will review this question.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (questionStatus === 'loading') {
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
          <Text style={styles.headerTitle}>Report Question</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Question Preview */}
          {question && (
            <Card style={styles.questionCard}>
              <Card.Content>
                <View style={styles.questionHeader}>
                  <MaterialCommunityIcons name="help-circle" size={20} color={Colors.primary} />
                  <Text style={styles.questionLabel}>Question being reported</Text>
                </View>
                <Text style={styles.questionText} numberOfLines={3}>
                  {question.question_text_en}
                </Text>
                <View style={styles.questionMeta}>
                  <Text style={styles.questionMetaText}>
                    Category: {question.category_name}
                  </Text>
                  <Text style={styles.questionMetaText}>
                    ID: #{question.id}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

          {/* Report Reason Selection */}
          <Text style={styles.sectionTitle}>What&apos;s wrong with this question?</Text>
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
                        { backgroundColor: (reason === option.value ? Colors.primary : Colors.textTertiary) + '20' }
                      ]}>
                        <MaterialCommunityIcons 
                          name={option.icon as any} 
                          size={22} 
                          color={reason === option.value ? Colors.primary : Colors.textTertiary} 
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
                      <RadioButton value={option.value} color={Colors.primary} />
                    </TouchableOpacity>
                  </React.Fragment>
                ))}
              </RadioButton.Group>
            </Card.Content>
          </Card>

          {/* Additional Details */}
          <Text style={styles.sectionTitle}>Additional Details (Optional)</Text>
          <Card style={styles.descriptionCard}>
            <Card.Content>
              <TextInput
                mode="outlined"
                placeholder="Provide more details about the issue..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                style={styles.textInput}
                outlineColor={Colors.border}
                activeOutlineColor={Colors.primary}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </Card.Content>
          </Card>

          {/* Guidelines */}
          <Card style={styles.guidelinesCard}>
            <Card.Content>
              <View style={styles.guidelinesHeader}>
                <MaterialCommunityIcons name="information" size={20} color={Colors.info} />
                <Text style={styles.guidelinesTitle}>Reporting Guidelines</Text>
              </View>
              <Text style={styles.guidelineText}>• Only report genuine issues with questions</Text>
              <Text style={styles.guidelineText}>• False reports may affect your account standing</Text>
              <Text style={styles.guidelineText}>• Our team reviews all reports within 48 hours</Text>
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
            Submit Report
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
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
    backgroundColor: Colors.white, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  questionCard: { 
    backgroundColor: Colors.primaryLight + '20', 
    borderRadius: BorderRadius.lg, 
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
  },
  questionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  questionLabel: { fontSize: 12, color: Colors.primary, fontWeight: '600', marginLeft: Spacing.xs },
  questionText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  questionMeta: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  questionMetaText: { fontSize: 12, color: Colors.textSecondary },
  sectionTitle: { 
    fontSize: 16, 
    fontWeight: '700', 
    color: Colors.textPrimary, 
    marginBottom: Spacing.md,
  },
  reasonCard: { 
    backgroundColor: Colors.white, 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.lg,
  },
  reasonOption: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Spacing.md,
  },
  reasonOptionSelected: { 
    backgroundColor: Colors.primaryLight + '10',
    marginHorizontal: -Spacing.base,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
  },
  optionDivider: { height: 1, backgroundColor: Colors.border },
  reasonIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: Spacing.md,
  },
  reasonTextContainer: { flex: 1 },
  reasonLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  reasonLabelSelected: { fontWeight: '700', color: Colors.primary },
  reasonDescription: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  descriptionCard: { 
    backgroundColor: Colors.white, 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.lg,
  },
  textInput: { backgroundColor: Colors.white },
  charCount: { 
    fontSize: 11, 
    color: Colors.textTertiary, 
    textAlign: 'right', 
    marginTop: Spacing.xs,
  },
  guidelinesCard: { 
    backgroundColor: Colors.infoLight, 
    borderRadius: BorderRadius.lg,
  },
  guidelinesHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  guidelinesTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginLeft: Spacing.xs },
  guidelineText: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.xs, lineHeight: 18 },
  bottomAction: { 
    backgroundColor: Colors.white, 
    padding: Spacing.base, 
    borderTopWidth: 1, 
    borderTopColor: Colors.border,
  },
  submitButton: { borderRadius: BorderRadius.lg },
  submitButtonContent: { paddingVertical: Spacing.sm },
  submitButtonLabel: { fontSize: 16, fontWeight: '700' },
});
