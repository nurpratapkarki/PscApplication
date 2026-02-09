import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../../hooks/useApi';
import { MockTest } from '../../../types/test.types';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';

const TestDetailsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ testId: string | string[] }>();

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
        <Text style={styles.errorText}>{error || 'Failed to load test'}</Text>
        <Button mode="outlined" onPress={() => router.back()}>Go Back</Button>
      </SafeAreaView>
    );
  }

  const StatItem = ({ icon, value, label }: { icon: string; value: string | number; label: string }) => (
    <View style={styles.statItem}>
      <MaterialCommunityIcons name={icon as any} size={28} color={Colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with back button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Chip style={styles.typeBadge} textStyle={styles.typeBadgeText}>
            {test.test_type === 'OFFICIAL' ? 'Official' : 'Community'}
          </Chip>
        </View>

        {/* Test Info Card */}
        <Card style={styles.mainCard}>
          <Card.Content>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={test.test_type === 'OFFICIAL' ? 'shield-check' : 'account-group'} size={48} color={Colors.white} />
            </View>
            <Text style={styles.title}>{test.title_en}</Text>
            <Text style={styles.titleNp}>{test.title_np}</Text>
            <Text style={styles.description}>{test.description_en}</Text>
            <View style={styles.branchBadge}>
              <MaterialCommunityIcons name="school" size={16} color={Colors.primary} />
              <Text style={styles.branchText}>{test.branch_name}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatItem icon="help-circle-outline" value={test.total_questions} label="Questions" />
          <StatItem icon="clock-outline" value={`${test.duration_minutes}m`} label="Duration" />
          <StatItem icon="percent" value={`${test.pass_percentage}%`} label="Pass Mark" />
          <StatItem icon="star-outline" value={test.total_marks || test.total_questions} label="Total Marks" />
        </View>

        {/* Instructions Preview */}
        <Card style={styles.instructionsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Quick Info</Text>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="check-circle" size={18} color={Colors.success} />
              <Text style={styles.infoText}>Each question has one correct answer</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="timer-sand" size={18} color={Colors.warning} />
              <Text style={styles.infoText}>Timer starts once you begin</Text>
            </View>
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="chart-line" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>Results shown immediately after submission</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Created By */}
        <View style={styles.creatorRow}>
          <Text style={styles.creatorLabel}>Created by:</Text>
          <Text style={styles.creatorName}>{test.created_by_name}</Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <Button mode="contained" icon="play-circle" style={styles.startButton} contentStyle={styles.startButtonContent} labelStyle={styles.startButtonLabel} onPress={() => router.push(`/tests/${testId}/instructions`)}>
          Start Test
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
  typeBadge: { backgroundColor: Colors.primaryLight },
  typeBadgeText: { color: Colors.primary, fontWeight: '600' },
  mainCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 3 },
  iconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.md },
  title: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
  titleNp: { fontSize: 16, color: Colors.primary, textAlign: 'center', marginBottom: Spacing.sm },
  description: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: Spacing.md },
  branchBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.primaryLight + '30', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, alignSelf: 'center' },
  branchText: { fontSize: 13, color: Colors.primary, marginLeft: Spacing.xs, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  statItem: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', marginHorizontal: 4, elevation: 2 },
  statValue: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.xs },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  instructionsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  infoText: { fontSize: 14, color: Colors.textSecondary, marginLeft: Spacing.sm, flex: 1 },
  creatorRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  creatorLabel: { fontSize: 13, color: Colors.textSecondary },
  creatorName: { fontSize: 13, color: Colors.primary, fontWeight: '600', marginLeft: Spacing.xs },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  startButton: { borderRadius: BorderRadius.lg },
  startButtonContent: { paddingVertical: Spacing.sm },
  startButtonLabel: { fontSize: 16, fontWeight: '700' },
});

export default TestDetailsScreen;