import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { MockTest } from '../../types/test.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const TestCard = ({ test, onPress }: { test: MockTest; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <Card style={styles.testCard}>
      <Card.Content style={styles.testCardContent}>
        <View style={[styles.testIconContainer, { backgroundColor: test.test_type === 'OFFICIAL' ? Colors.primary : Colors.secondary }]}>
          <MaterialCommunityIcons name={test.test_type === 'OFFICIAL' ? 'shield-check' : 'account-group'} size={24} color={Colors.white} />
        </View>
        <View style={styles.testInfo}>
          <Text style={styles.testTitle} numberOfLines={1}>{test.title_en}</Text>
          <Text style={styles.testSubtitle}>{test.branch_name}</Text>
          <View style={styles.testMeta}>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="help-circle-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{test.total_questions} Qs</Text>
            </View>
            <View style={styles.metaItem}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
              <Text style={styles.metaText}>{test.duration_minutes} min</Text>
            </View>
          </View>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textTertiary} />
      </Card.Content>
    </Card>
  </TouchableOpacity>
);

export default function TestsScreen() {
  const router = useRouter();
  const { data: tests, status } = usePaginatedApi<MockTest>('/api/mock-tests/');

  const { officialTests, communityTests } = useMemo(() => {
    const official = tests?.filter((t) => t.test_type === 'OFFICIAL') || [];
    const community = tests?.filter((t) => t.test_type === 'COMMUNITY') || [];
    return { officialTests: official, communityTests: community };
  }, [tests]);

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Mock Tests</Text>
          <Text style={styles.subtitle}>परीक्षा अभ्यास</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/tests/history')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="history" size={28} color={Colors.primary} />
            <Text style={styles.actionText}>History</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/tests/create')} activeOpacity={0.7}>
            <MaterialCommunityIcons name="plus-circle" size={28} color={Colors.accent} />
            <Text style={styles.actionText}>Create Test</Text>
          </TouchableOpacity>
        </View>

        {/* Official Tests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="shield-check" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Official Tests</Text>
            </View>
            <Chip compact style={styles.countChip}>{officialTests.length}</Chip>
          </View>
          {officialTests.length > 0 ? (
            officialTests.map((test) => <TestCard key={test.id} test={test} onPress={() => router.push(`/tests/${test.id}`)} />)
          ) : (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="clipboard-text-off" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No official tests available</Text>
            </View>
          )}
        </View>

        {/* Community Tests */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialCommunityIcons name="account-group" size={20} color={Colors.secondary} />
              <Text style={styles.sectionTitle}>Community Tests</Text>
            </View>
            <Chip compact style={styles.countChip}>{communityTests.length}</Chip>
          </View>
          {communityTests.length > 0 ? (
            communityTests.map((test) => <TestCard key={test.id} test={test} onPress={() => router.push(`/tests/${test.id}`)} />)
          ) : (
            <View style={styles.emptySection}>
              <MaterialCommunityIcons name="account-group-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>No community tests yet</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.primary },
  actionsRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  actionCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', elevation: 2 },
  actionText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.sm },
  section: { marginBottom: Spacing.xl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  countChip: { backgroundColor: Colors.surfaceVariant },
  testCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, elevation: 2 },
  testCardContent: { flexDirection: 'row', alignItems: 'center' },
  testIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  testInfo: { flex: 1 },
  testTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  testSubtitle: { fontSize: 13, color: Colors.textSecondary },
  testMeta: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.xs },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: Colors.textSecondary },
  emptySection: { alignItems: 'center', paddingVertical: Spacing.xl, backgroundColor: Colors.white, borderRadius: BorderRadius.lg },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.sm },
});

