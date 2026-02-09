import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Button, Card, Text, TextInput, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { Branch } from '../../types/category.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const CreateTestScreen = () => {
  const router = useRouter();
  const { data: branches, status: branchStatus } = useApi<Branch[]>('/api/branches/');

  const [title, setTitle] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [questionCount, setQuestionCount] = useState('20');
  const [duration, setDuration] = useState('30');

  const handleGenerateTest = () => {
    if (!title || !selectedBranch) {
      Alert.alert('Missing Information', 'Please provide a title and select a branch.');
      return;
    }
    Alert.alert('Coming Soon', `Test generation for "${title}" will be available soon!`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Test</Text>
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
        <Text style={styles.stepLabel}>Step 1: Basic Details</Text>

        {/* Title Input */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.inputLabel}>Test Title</Text>
            <TextInput mode="outlined" placeholder="e.g., My Practice Test" value={title} onChangeText={setTitle} style={styles.textInput} outlineColor={Colors.border} activeOutlineColor={Colors.primary} />
          </Card.Content>
        </Card>

        {/* Branch Selection */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.inputLabel}>Select Branch</Text>
            {branchStatus === 'loading' ? (
              <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
            ) : branches && branches.length > 0 ? (
              <View style={styles.branchGrid}>
                {branches.map((branch) => (
                  <TouchableOpacity key={branch.id} style={[styles.branchCard, selectedBranch?.id === branch.id && styles.branchCardSelected]} onPress={() => setSelectedBranch(branch)} activeOpacity={0.7}>
                    <MaterialCommunityIcons name="school" size={24} color={selectedBranch?.id === branch.id ? Colors.primary : Colors.textSecondary} />
                    <Text style={[styles.branchName, selectedBranch?.id === branch.id && styles.branchNameSelected]}>{branch.name_en}</Text>
                    {selectedBranch?.id === branch.id && (
                      <View style={styles.checkIcon}>
                        <MaterialCommunityIcons name="check" size={14} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.branchName}>No branches available</Text>
            )}
          </Card.Content>
        </Card>

        {/* Test Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.inputLabel}>Test Settings</Text>
            <View style={styles.settingsRow}>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Questions</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setQuestionCount(String(Math.max(5, parseInt(questionCount) - 5)))}>
                    <MaterialCommunityIcons name="minus" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{questionCount}</Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setQuestionCount(String(Math.min(100, parseInt(questionCount) + 5)))}>
                    <MaterialCommunityIcons name="plus" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.settingItem}>
                <Text style={styles.settingLabel}>Duration (min)</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setDuration(String(Math.max(10, parseInt(duration) - 10)))}>
                    <MaterialCommunityIcons name="minus" size={20} color={Colors.primary} />
                  </TouchableOpacity>
                  <Text style={styles.counterValue}>{duration}</Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setDuration(String(Math.min(180, parseInt(duration) + 10)))}>
                    <MaterialCommunityIcons name="plus" size={20} color={Colors.primary} />
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
              <Text style={styles.summaryTitle}>Test Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Title:</Text>
                <Text style={styles.summaryValue}>{title}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Branch:</Text>
                <Text style={styles.summaryValue}>{selectedBranch.name_en}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Questions:</Text>
                <Text style={styles.summaryValue}>{questionCount}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>{duration} minutes</Text>
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button mode="contained" icon="arrow-right" style={styles.nextButton} contentStyle={styles.nextButtonContent} labelStyle={styles.nextButtonLabel} disabled={!title || !selectedBranch} onPress={handleGenerateTest}>
          Next: Select Categories
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  stepDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border },
  stepActive: { backgroundColor: Colors.primary, width: 16, height: 16, borderRadius: 8 },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.border },
  stepLabel: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.lg },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  textInput: { backgroundColor: Colors.white },
  loader: { marginVertical: Spacing.lg },
  branchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  branchCard: { width: '48%', backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', borderWidth: 2, borderColor: 'transparent' },
  branchCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '30' },
  branchName: { fontSize: 13, color: Colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' },
  branchNameSelected: { color: Colors.primary, fontWeight: '600' },
  checkIcon: { position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  settingsRow: { flexDirection: 'row', gap: Spacing.lg },
  settingItem: { flex: 1 },
  settingLabel: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm },
  counterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surfaceVariant, borderRadius: BorderRadius.lg, padding: Spacing.sm },
  counterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  summaryCard: { backgroundColor: Colors.primaryLight + '30', borderRadius: BorderRadius.xl },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: Colors.primary, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.xs },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  nextButton: { borderRadius: BorderRadius.lg },
  nextButtonContent: { paddingVertical: Spacing.sm, flexDirection: 'row-reverse' },
  nextButtonLabel: { fontSize: 16, fontWeight: '700' },
});

export default CreateTestScreen;

