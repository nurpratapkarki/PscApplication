import React, { useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { MockTest } from '../../types/test.types';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';

const TestCard = React.memo(function TestCard({ 
  test, 
  onPress, 
  colors, 
  lf 
}: { 
  test: MockTest; 
  onPress: () => void; 
  colors: ReturnType<typeof import('../../hooks/useColors').useColors>; 
  lf: ReturnType<typeof import('../../hooks/useLocalizedField').useLocalizedField> 
}) {
  const isOfficial = test.test_type === 'OFFICIAL';
  const iconBgColor = isOfficial ? colors.primary : colors.secondary;
  const iconName = isOfficial ? 'shield-check' : 'account-group';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.testCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.testIconContainer, { backgroundColor: iconBgColor + '15' }]}>
          <MaterialCommunityIcons name={iconName} size={24} color={iconBgColor} />
        </View>
        
        <View style={styles.testContent}>
          <Text style={[styles.testTitle, { color: colors.textPrimary }]} numberOfLines={2}>
            {lf(test.title_en, test.title_np)}
          </Text>
          <Text style={[styles.testBranch, { color: colors.textSecondary }]} numberOfLines={1}>
            {test.branch_name}
          </Text>
          
          <View style={styles.testMetaRow}>
            <View style={styles.metaBadge}>
              <MaterialCommunityIcons name="help-circle-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {test.total_questions} Questions
              </Text>
            </View>
            <View style={styles.metaBadge}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={colors.textSecondary} />
              <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                {test.duration_minutes} min
              </Text>
            </View>
          </View>
        </View>
        
        <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
});

export default function TestsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const { data: tests, status } = usePaginatedApi<MockTest>('/api/mock-tests/');

  const { officialTests, communityTests } = useMemo(() => {
    const official = tests?.filter((t) => t.test_type === 'OFFICIAL') || [];
    const community = tests?.filter((t) => t.test_type === 'COMMUNITY') || [];
    return { officialTests: official, communityTests: community };
  }, [tests]);

  if (status === 'loading') {
    return (
      <SafeAreaView style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {t('tests.mockTests')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {t('analytics.subtitle')}
          </Text>
        </View>

        {/* Quick Action Cards */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: colors.surface }]} 
            onPress={() => router.push('/tests/history')} 
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.primary + '15' }]}>
              <MaterialCommunityIcons name="history" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
              {t('tests.history')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionCard, { backgroundColor: colors.surface }]} 
            onPress={() => router.push('/tests/create')} 
            activeOpacity={0.8}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: colors.accent + '15' }]}>
              <MaterialCommunityIcons name="plus-circle" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.quickActionText, { color: colors.textPrimary }]}>
              {t('tests.createTest')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Official Tests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconWrapper, { backgroundColor: colors.primary + '15' }]}>
                <MaterialCommunityIcons name="shield-check" size={18} color={colors.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('tests.officialTests')}
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {officialTests.length}
              </Text>
            </View>
          </View>

          {officialTests.length > 0 ? (
            <View style={styles.testsContainer}>
              {officialTests.map((test) => (
                <TestCard 
                  key={test.id} 
                  test={test} 
                  onPress={() => router.push(`/tests/${test.id}`)} 
                  colors={colors} 
                  lf={lf} 
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <View style={[styles.emptyIconWrapper, { backgroundColor: colors.surfaceVariant }]}>
                <MaterialCommunityIcons name="clipboard-text-off" size={32} color={colors.textTertiary} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('tests.noOfficialTests')}
              </Text>
            </View>
          )}
        </View>

        {/* Community Tests Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <View style={[styles.sectionIconWrapper, { backgroundColor: colors.secondary + '15' }]}>
                <MaterialCommunityIcons name="account-group" size={18} color={colors.secondary} />
              </View>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                {t('tests.communityTests')}
              </Text>
            </View>
            <View style={[styles.countBadge, { backgroundColor: colors.surfaceVariant }]}>
              <Text style={[styles.countText, { color: colors.textSecondary }]}>
                {communityTests.length}
              </Text>
            </View>
          </View>

          {communityTests.length > 0 ? (
            <View style={styles.testsContainer}>
              {communityTests.map((test) => (
                <TestCard 
                  key={test.id} 
                  test={test} 
                  onPress={() => router.push(`/tests/${test.id}`)} 
                  colors={colors} 
                  lf={lf} 
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <View style={[styles.emptyIconWrapper, { backgroundColor: colors.surfaceVariant }]}>
                <MaterialCommunityIcons name="account-group-outline" size={32} color={colors.textTertiary} />
              </View>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('tests.noCommunityTests')}
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  loaderContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  scrollContent: { 
    padding: 16, 
    paddingBottom: 32 
  },

  // Header
  header: { 
    marginBottom: 20 
  },
  headerTitle: { 
    fontSize: 24, 
    fontWeight: '700', 
    letterSpacing: -0.5 
  },
  headerSubtitle: { 
    fontSize: 14, 
    marginTop: 4 
  },

  // Quick Actions
  quickActionsRow: { 
    flexDirection: 'row', 
    gap: 12, 
    marginBottom: 24 
  },
  quickActionCard: {
    flex: 1,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  quickActionText: { 
    fontSize: 14, 
    fontWeight: '600', 
    textAlign: 'center' 
  },

  // Section
  section: { 
    marginBottom: 24 
  },
  sectionHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  sectionTitleRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  sectionIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center'
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: '700' 
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  countText: { 
    fontSize: 13, 
    fontWeight: '600' 
  },

  // Tests Container
  testsContainer: { 
    gap: 12 
  },

  // Test Card
  testCard: {
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  testIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  testContent: { 
    flex: 1 
  },
  testTitle: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 4,
    lineHeight: 22
  },
  testBranch: { 
    fontSize: 13, 
    marginBottom: 8 
  },
  testMetaRow: { 
    flexDirection: 'row', 
    gap: 12 
  },
  metaBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  metaText: { 
    fontSize: 12 
  },

  // Empty State
  emptyState: {
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 20,
    alignItems: 'center'
  },
  emptyIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  emptyText: { 
    fontSize: 14, 
    textAlign: 'center' 
  }
});