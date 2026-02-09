import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, ActivityIndicator, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../../hooks/useApi';
import { MockTest } from '../../../types/test.types';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';

const TestInstructionsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ testId: string | string[] }>();
  const [agreed, setAgreed] = React.useState(false);

  const testId = useMemo(() => {
    if (Array.isArray(params.testId)) return params.testId[0];
    return params.testId;
  }, [params.testId]);

  const { data: test, status, error } = useApi<MockTest>(testId ? `/api/mock-tests/${testId}/` : '', !testId);

  if (!testId || status === 'loading' || status === 'idle') {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (status === 'error' || !test) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={60} color={Colors.error} />
        <Text style={styles.errorText}>{error || 'Failed to load instructions'}</Text>
        <Button mode="outlined" onPress={() => router.back()}>Go Back</Button>
      </SafeAreaView>
    );
  }

  const instructions = [
    { icon: 'help-circle-outline', text: `This test contains ${test.total_questions} questions.`, color: Colors.primary },
    { icon: 'clock-outline', text: `You have ${test.duration_minutes} minutes to complete.`, color: Colors.accent },
    { icon: 'pause-circle-outline', text: 'You cannot pause once the test begins.', color: Colors.warning },
    { icon: 'check-circle-outline', text: 'Each question has only one correct answer.', color: Colors.success },
    { icon: 'percent', text: `You need ${test.pass_percentage}% to pass.`, color: Colors.secondary },
    { icon: 'chart-line', text: 'Results shown immediately after submission.', color: Colors.primary },
    { icon: 'wifi', text: 'Ensure stable internet connection.', color: Colors.textSecondary },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Instructions</Text>
          <View style={{ width: 44 }} />
        </View>

        {/* Warning Card */}
        <Card style={styles.warningCard}>
          <Card.Content style={styles.warningContent}>
            <MaterialCommunityIcons name="alert-circle" size={32} color={Colors.warning} />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Read Carefully!</Text>
              <Text style={styles.warningSubtitle}>ध्यानपूर्वक पढ्नुहोस्!</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Test Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="help-circle" size={24} color={Colors.primary} />
            <Text style={styles.summaryValue}>{test.total_questions}</Text>
            <Text style={styles.summaryLabel}>Questions</Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="clock" size={24} color={Colors.accent} />
            <Text style={styles.summaryValue}>{test.duration_minutes}m</Text>
            <Text style={styles.summaryLabel}>Duration</Text>
          </View>
          <View style={styles.summaryItem}>
            <MaterialCommunityIcons name="target" size={24} color={Colors.success} />
            <Text style={styles.summaryValue}>{test.pass_percentage}%</Text>
            <Text style={styles.summaryLabel}>Pass Mark</Text>
          </View>
        </View>

        {/* Instructions List */}
        <Card style={styles.instructionsCard}>
          <Card.Content>
            {instructions.map((item, index) => (
              <View key={index} style={styles.instructionRow}>
                <View style={[styles.instructionIcon, { backgroundColor: item.color + '20' }]}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={styles.instructionText}>{item.text}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Agreement Checkbox */}
        <TouchableOpacity style={styles.agreementRow} onPress={() => setAgreed(!agreed)} activeOpacity={0.7}>
          <Checkbox status={agreed ? 'checked' : 'unchecked'} onPress={() => setAgreed(!agreed)} color={Colors.primary} />
          <Text style={styles.agreementText}>I have read and understood all the instructions</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button mode="contained" icon="play" style={styles.startButton} contentStyle={styles.startButtonContent} labelStyle={styles.startButtonLabel} disabled={!agreed} onPress={() => router.navigate(`/tests/${testId}/attempt`)}>
          Begin Test
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background, padding: Spacing.xl },
  errorText: { fontSize: 16, color: Colors.textSecondary, marginVertical: Spacing.lg, textAlign: 'center' },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  warningCard: { backgroundColor: Colors.warningLight, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  warningContent: { flexDirection: 'row', alignItems: 'center' },
  warningTextContainer: { marginLeft: Spacing.md },
  warningTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  warningSubtitle: { fontSize: 14, color: Colors.warning },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  summaryItem: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', marginHorizontal: 4, elevation: 2 },
  summaryValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.xs },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary },
  instructionsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  instructionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  instructionIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  instructionText: { fontSize: 14, color: Colors.textPrimary, flex: 1, lineHeight: 20 },
  agreementRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md },
  agreementText: { fontSize: 14, color: Colors.textPrimary, flex: 1, marginLeft: Spacing.sm },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  startButton: { borderRadius: BorderRadius.lg },
  startButtonContent: { paddingVertical: Spacing.sm },
  startButtonLabel: { fontSize: 16, fontWeight: '700' },
});

export default TestInstructionsScreen;