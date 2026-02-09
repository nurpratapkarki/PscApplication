import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { UserStatistics } from '../../types/user.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

export default function ContributionDashboardScreen() {
  const router = useRouter();
  const { data: stats, status } = useApi<UserStatistics>('/api/statistics/me/');

  const StatCard = ({ icon, value, label, color }: { icon: string; value: string | number; label: string; color: string }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '20' }]}>
        <MaterialCommunityIcons name={icon as any} size={24} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const ActionCard = ({ icon, title, subtitle, color, onPress }: { icon: string; title: string; subtitle: string; color: string; onPress: () => void }) => (
    <TouchableOpacity style={styles.actionCard} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.actionIconContainer, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon as any} size={28} color={Colors.white} />
      </View>
      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>Contribute</Text>
            <Text style={styles.subtitle}>योगदान गर्नुहोस्</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Hero Card */}
        <Card style={styles.heroCard}>
          <Card.Content style={styles.heroContent}>
            <MaterialCommunityIcons name="hand-heart" size={48} color={Colors.primary} />
            <Text style={styles.heroTitle}>Help Build Nepal&apos;s Largest PSC Question Bank</Text>
            <Text style={styles.heroSubtitle}>Your contributions help thousands of aspirants prepare for their exams</Text>
          </Card.Content>
        </Card>

        {/* Stats */}
        {status === 'loading' ? (
          <ActivityIndicator size="small" color={Colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.statsRow}>
            <StatCard icon="file-document-plus" value={stats?.questions_contributed || 0} label="Contributed" color={Colors.primary} />
            <StatCard icon="check-decagram" value={stats?.questions_made_public || 0} label="Approved" color={Colors.success} />
            <StatCard icon="trophy" value={`#${stats?.contribution_rank || '-'}`} label="Rank" color={Colors.warning} />
          </View>
        )}

        {/* Actions */}
        <Text style={styles.sectionTitle}>What would you like to do?</Text>
        <Card style={styles.actionsCard}>
          <ActionCard icon="plus-circle" title="Add New Question" subtitle="Contribute a new question to the bank" color={Colors.primary} onPress={() => router.push('/contribute/add-question')} />
          <View style={styles.divider} />
          <ActionCard icon="clipboard-list" title="My Contributions" subtitle="View and manage your contributions" color={Colors.secondary} onPress={() => router.push('/contribute/my-contributions')} />
          <View style={styles.divider} />
          <ActionCard icon="book-open-page-variant" title="Contribution Guidelines" subtitle="Learn how to contribute effectively" color={Colors.accent} onPress={() => {}} />
        </Card>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={24} color={Colors.warning} />
              <Text style={styles.tipsTitle}>Tips for Quality Contributions</Text>
            </View>
            <Text style={styles.tipItem}>• Ensure questions are from authentic PSC sources</Text>
            <Text style={styles.tipItem}>• Provide clear and accurate answer options</Text>
            <Text style={styles.tipItem}>• Add explanations to help learners understand</Text>
            <Text style={styles.tipItem}>• Double-check for spelling and grammar errors</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.primary },
  heroCard: { backgroundColor: Colors.primaryLight + '30', borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  heroContent: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center', marginTop: Spacing.md },
  heroSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  loader: { marginVertical: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', elevation: 2 },
  statIconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  actionsCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, overflow: 'hidden' },
  actionCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  actionIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  actionTextContainer: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  actionSubtitle: { fontSize: 13, color: Colors.textSecondary },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 76 },
  tipsCard: { backgroundColor: Colors.warningLight, borderRadius: BorderRadius.xl },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  tipsTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginLeft: Spacing.sm },
  tipItem: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
});
