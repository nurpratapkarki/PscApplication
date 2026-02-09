import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, Chip, ActivityIndicator, SegmentedButtons } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { Contribution, ContributionStatus } from '../../types/contribution.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const getStatusColor = (status: ContributionStatus) => {
  switch (status) {
    case 'APPROVED': case 'MADE_PUBLIC': return Colors.success;
    case 'REJECTED': return Colors.error;
    case 'PENDING': default: return Colors.warning;
  }
};

const getStatusIcon = (status: ContributionStatus) => {
  switch (status) {
    case 'APPROVED': case 'MADE_PUBLIC': return 'check-circle';
    case 'REJECTED': return 'close-circle';
    case 'PENDING': default: return 'clock-outline';
  }
};

const ContributionCard = ({ contribution, onPress }: { contribution: Contribution; onPress: () => void }) => {
  const statusColor = getStatusColor(contribution.status);
  const statusIcon = getStatusIcon(contribution.status);
  const date = new Date(contribution.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.contributionCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Chip compact style={[styles.statusChip, { backgroundColor: statusColor + '20' }]} textStyle={{ color: statusColor, fontSize: 11 }} icon={() => <MaterialCommunityIcons name={statusIcon} size={14} color={statusColor} />}>
              {contribution.status}
            </Chip>
            {contribution.is_featured && (
              <MaterialCommunityIcons name="star" size={18} color={Colors.warning} />
            )}
          </View>
          <Text style={styles.questionText} numberOfLines={2}>{contribution.question_text}</Text>
          <Text style={styles.dateText}>{date}</Text>
          {contribution.rejection_reason && (
            <View style={styles.rejectionBox}>
              <MaterialCommunityIcons name="alert-circle" size={14} color={Colors.error} />
              <Text style={styles.rejectionText}>{contribution.rejection_reason}</Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export default function MyContributionsScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState('all');
  const { data: contributions, status } = usePaginatedApi<Contribution>('/api/contributions/');

  const filteredContributions = contributions?.filter((c) => {
    if (filter === 'all') return true;
    if (filter === 'pending') return c.status === 'PENDING';
    if (filter === 'approved') return c.status === 'APPROVED' || c.status === 'MADE_PUBLIC';
    if (filter === 'rejected') return c.status === 'REJECTED';
    return true;
  });

  const counts = {
    all: contributions?.length || 0,
    pending: contributions?.filter((c) => c.status === 'PENDING').length || 0,
    approved: contributions?.filter((c) => c.status === 'APPROVED' || c.status === 'MADE_PUBLIC').length || 0,
    rejected: contributions?.filter((c) => c.status === 'REJECTED').length || 0,
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Contributions</Text>
        <TouchableOpacity onPress={() => router.push('/contribute/add-question')} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color={Colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
            <TouchableOpacity key={f} style={[styles.filterTab, filter === f && styles.filterTabActive]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterTabText, filter === f && styles.filterTabTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)} ({counts[f]})</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !filteredContributions || filteredContributions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={80} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Contributions</Text>
          <Text style={styles.emptySubtitle}>{filter === 'all' ? "You haven't contributed any questions yet" : `No ${filter} contributions`}</Text>
        </View>
      ) : (
        <FlatList data={filteredContributions} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.listContent} renderItem={({ item }) => <ContributionCard contribution={item} onPress={() => router.push(`/contribute/${item.id}/edit`)} />} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  filterContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  filterScroll: { gap: Spacing.sm },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: Colors.white },
  filterTabActive: { backgroundColor: Colors.primary },
  filterTabText: { fontSize: 13, color: Colors.textSecondary },
  filterTabTextActive: { color: Colors.white, fontWeight: '600' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  listContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  contributionCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  statusChip: { height: 24 },
  questionText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  dateText: { fontSize: 12, color: Colors.textTertiary, marginTop: Spacing.sm },
  rejectionBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.errorLight, padding: Spacing.sm, borderRadius: BorderRadius.md, marginTop: Spacing.sm, gap: Spacing.xs },
  rejectionText: { flex: 1, fontSize: 12, color: Colors.error },
});
