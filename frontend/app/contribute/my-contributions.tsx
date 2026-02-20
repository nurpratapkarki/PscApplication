import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, FlatList } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, Chip, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { Contribution, ContributionStatus } from '../../types/contribution.types';
import { useColors } from '../../hooks/useColors';
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

export default function MyContributionsScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [filter, setFilter] = useState('all');
  const { data: contributions, status } = usePaginatedApi<Contribution>('/api/contributions/');
  const dateLocale = i18n.language === 'NP' ? 'ne-NP' : 'en-US';

  const getStatusColor = (status: ContributionStatus) => {
    switch (status) {
      case 'APPROVED': case 'MADE_PUBLIC': return colors.success;
      case 'REJECTED': return colors.error;
      case 'PENDING': default: return colors.warning;
    }
  };

  const getStatusIcon = (status: ContributionStatus) => {
    switch (status) {
      case 'APPROVED': case 'MADE_PUBLIC': return 'check-circle';
      case 'REJECTED': return 'close-circle';
      case 'PENDING': default: return 'clock-outline';
    }
  };

  const getStatusLabel = (status: ContributionStatus) => {
    switch (status) {
      case 'APPROVED': return t('contribute.statusApproved');
      case 'MADE_PUBLIC': return t('contribute.statusPublic');
      case 'REJECTED': return t('contribute.statusRejected');
      case 'PENDING': default: return t('contribute.statusPending');
    }
  };

  const ContributionCard = ({ contribution, onPress }: { contribution: Contribution; onPress: () => void }) => {
    const statusColor = getStatusColor(contribution.status);
    const statusIcon = getStatusIcon(contribution.status);
    const date = new Date(contribution.created_at).toLocaleDateString(dateLocale, { month: 'short', day: 'numeric', year: 'numeric' });

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <Card style={styles.contributionCard}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Chip compact style={[styles.statusChip, { backgroundColor: statusColor + '20' }]} textStyle={{ color: statusColor, fontSize: 11 }} icon={() => <MaterialCommunityIcons name={statusIcon} size={14} color={statusColor} />}>
                {getStatusLabel(contribution.status)}
              </Chip>
              {contribution.is_featured && (
                <MaterialCommunityIcons name="star" size={18} color={colors.warning} />
              )}
            </View>
            <Text style={styles.questionText} numberOfLines={2}>{contribution.question_text}</Text>
            <Text style={styles.dateText}>{date}</Text>
            {contribution.rejection_reason && (
              <View style={styles.rejectionBox}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
                <Text style={styles.rejectionText}>{contribution.rejection_reason}</Text>
              </View>
            )}
          </Card.Content>
        </Card>
      </TouchableOpacity>
    );
  };

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
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('contribute.myContributions')}</Text>
        <TouchableOpacity onPress={() => router.push('/contribute/add-question')} style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {([
            { key: 'all', label: t('contribute.filterAll') },
            { key: 'pending', label: t('contribute.filterPending') },
            { key: 'approved', label: t('contribute.filterApproved') },
            { key: 'rejected', label: t('contribute.filterRejected') },
          ] as const).map((f) => (
            <TouchableOpacity key={f.key} style={[styles.filterTab, filter === f.key && styles.filterTabActive]} onPress={() => setFilter(f.key)}>
              <Text style={[styles.filterTabText, filter === f.key && styles.filterTabTextActive]}>{f.label} ({counts[f.key as keyof typeof counts]})</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !filteredContributions || filteredContributions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('contribute.noContributions')}</Text>
          <Text style={styles.emptySubtitle}>
            {filter === 'all'
              ? t('contribute.noContributionsYet')
              : t('contribute.noFilteredContributions', { filter: t(`contribute.filter${filter.charAt(0).toUpperCase() + filter.slice(1)}`) })}
          </Text>
        </View>
      ) : (
        <FlatList data={filteredContributions} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.listContent} renderItem={({ item }) => <ContributionCard contribution={item} onPress={() => router.push(`/contribute/${item.id}/edit`)} />} />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  filterContainer: { paddingHorizontal: Spacing.base, marginBottom: Spacing.md },
  filterScroll: { gap: Spacing.sm },
  filterTab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: colors.cardBackground },
  filterTabActive: { backgroundColor: colors.primary },
  filterTabText: { fontSize: 13, color: colors.textSecondary },
  filterTabTextActive: { color: colors.white, fontWeight: '600' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
  listContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  contributionCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  statusChip: { height: 24 },
  questionText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  dateText: { fontSize: 12, color: colors.textTertiary, marginTop: Spacing.sm },
  rejectionBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.errorLight, padding: Spacing.sm, borderRadius: BorderRadius.md, marginTop: Spacing.sm, gap: Spacing.xs },
  rejectionText: { flex: 1, fontSize: 12, color: colors.error },
});
