import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserStatistics } from '../../types/user.types';
import { useColors } from '../../hooks/useColors';
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

export default function ContributionDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
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
        <MaterialCommunityIcons name={icon as any} size={28} color={colors.white} />
      </View>
      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionSubtitle}>{subtitle}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{t('contribute.title')}</Text>
            <Text style={styles.subtitle}>{t('contribute.subtitle')}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Hero Card */}
        <Card style={styles.heroCard}>
          <Card.Content style={styles.heroContent}>
            <MaterialCommunityIcons name="hand-heart" size={48} color={colors.primary} />
            <Text style={styles.heroTitle}>{t('contribute.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('contribute.heroSubtitle')}</Text>
          </Card.Content>
        </Card>

        {/* Stats */}
        {status === 'loading' ? (
          <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
        ) : (
          <View style={styles.statsRow}>
            <StatCard icon="file-document-plus" value={stats?.questions_contributed || 0} label={t('contribute.statsContributed')} color={colors.primary} />
            <StatCard icon="check-decagram" value={stats?.questions_made_public || 0} label={t('contribute.statsApproved')} color={colors.success} />
            <StatCard icon="trophy" value={`#${stats?.contribution_rank || '-'}`} label={t('contribute.statsRank')} color={colors.warning} />
          </View>
        )}

        {/* Actions */}
        <Text style={styles.sectionTitle}>{t('contribute.actionsTitle')}</Text>
        <Card style={styles.actionsCard}>
          <ActionCard icon="plus-circle" title={t('contribute.addNewQuestion')} subtitle={t('contribute.addNewQuestionSubtitle')} color={colors.primary} onPress={() => router.push('/contribute/add-question')} />
          <View style={styles.divider} />
          <ActionCard icon="clipboard-list" title={t('contribute.myContributions')} subtitle={t('contribute.myContributionsSubtitle')} color={colors.secondary} onPress={() => router.push('/contribute/my-contributions')} />
          <View style={styles.divider} />
          <ActionCard icon="book-open-page-variant" title={t('contribute.guidelines')} subtitle={t('contribute.guidelinesSubtitle')} color={colors.accent} onPress={() => router.push('/contribute/guidelines')} />
        </Card>

        {/* Tips */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={24} color={colors.warning} />
              <Text style={styles.tipsTitle}>{t('contribute.tipsTitle')}</Text>
            </View>
            <Text style={styles.tipItem}>• {t('contribute.tip1')}</Text>
            <Text style={styles.tipItem}>• {t('contribute.tip2')}</Text>
            <Text style={styles.tipItem}>• {t('contribute.tip3')}</Text>
            <Text style={styles.tipItem}>• {t('contribute.tip4')}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.primary },
  heroCard: { backgroundColor: colors.primaryLight + '30', borderRadius: BorderRadius.xl, marginBottom: Spacing.lg },
  heroContent: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginTop: Spacing.md },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  loader: { marginVertical: Spacing.lg },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  statCard: { flex: 1, backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', elevation: 2 },
  statIconContainer: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.xs },
  statValue: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  statLabel: { fontSize: 11, color: colors.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.md },
  actionsCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, overflow: 'hidden' },
  actionCard: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  actionIconContainer: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  actionTextContainer: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  actionSubtitle: { fontSize: 13, color: colors.textSecondary },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 76 },
  tipsCard: { backgroundColor: colors.warningLight, borderRadius: BorderRadius.xl },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  tipsTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginLeft: Spacing.sm },
  tipItem: { fontSize: 14, color: colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
});
