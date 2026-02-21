import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserStatistics } from '../../types/user.types';
import { useColors } from '../../hooks/useColors';

export default function ContributionDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { data: stats, status } = useApi<UserStatistics>('/api/statistics/me/');

  const actions = [
    {
      icon: 'plus-circle' as const,
      title: t('contribute.addNewQuestion'),
      subtitle: t('contribute.addNewQuestionSubtitle'),
      color: colors.primary,
      route: '/contribute/add-question',
    },
    {
      icon: 'clipboard-list' as const,
      title: t('contribute.myContributions'),
      subtitle: t('contribute.myContributionsSubtitle'),
      color: colors.secondary,
      route: '/contribute/my-contributions',
    },
    {
      icon: 'book-open-page-variant' as const,
      title: t('contribute.guidelines'),
      subtitle: t('contribute.guidelinesSubtitle'),
      color: colors.accent,
      route: '/contribute/guidelines',
    },
  ];

  const tips = [
    t('contribute.tip1'),
    t('contribute.tip2'),
    t('contribute.tip3'),
    t('contribute.tip4'),
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ── Hero band ── */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.heroBackBtn}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroCenter}>
            <View style={styles.heroIconCircle}>
              <Text style={styles.heroEmoji}>🤝</Text>
            </View>
            <Text style={styles.heroTitle}>{t('contribute.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('contribute.heroSubtitle')}</Text>
          </View>

          {/* Stats strip */}
          {status === 'loading' ? (
            <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" style={{ marginTop: 16 }} />
          ) : (
            <View style={styles.heroStats}>
              {[
                { icon: 'file-document-plus', value: stats?.questions_contributed || 0, label: 'Contributed', color: 'rgba(255,255,255,0.9)' },
                { icon: 'check-decagram', value: stats?.questions_made_public || 0, label: 'Approved', color: 'rgba(255,255,255,0.9)' },
                { icon: 'trophy', value: stats?.contribution_rank ? `#${stats.contribution_rank}` : '—', label: 'Rank', color: 'rgba(255,255,255,0.9)' },
              ].map((item, i) => (
                <View key={i} style={styles.heroStatItem}>
                  <Text style={styles.heroStatValue}>{item.value}</Text>
                  <Text style={styles.heroStatLabel}>{item.label}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ── Quick actions ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {t('contribute.actionsTitle')}
          </Text>
          <View style={[styles.actionsCard, { backgroundColor: colors.surface }]}>
            {actions.map((action, i) => (
              <React.Fragment key={action.route}>
                <TouchableOpacity
                  style={styles.actionRow}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.actionIconWrap, { backgroundColor: action.color + '15' }]}>
                    <MaterialCommunityIcons name={action.icon} size={22} color={action.color} />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>
                      {action.title}
                    </Text>
                    <Text style={[styles.actionSubtitle, { color: colors.textSecondary }]}>
                      {action.subtitle}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
                {i < actions.length - 1 && (
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* ── Impact card ── */}
        <View style={[styles.impactCard, { backgroundColor: colors.primary + '08', borderColor: colors.primary + '25' }]}>
          <View style={styles.impactHeader}>
            <MaterialCommunityIcons name="star-circle" size={20} color={colors.primary} />
            <Text style={[styles.impactTitle, { color: colors.primary }]}>{t('contribute.whyContribute')}</Text>
          </View>
          <Text style={[styles.impactText, { color: colors.textSecondary }]}>
            {t('contribute.impactDescription')}
          </Text>
          <View style={styles.impactStats}>
            {[
              { icon: 'account-group', label: t('contribute.impactHelpOthers') },
              { icon: 'star-circle', label: t('contribute.impactEarnXp') },
              { icon: 'certificate', label: t('contribute.impactBuildReputation') },
            ].map((item, i) => (
              <View key={i} style={styles.impactStat}>
                <MaterialCommunityIcons name={item.icon as any} size={16} color={colors.primary} />
                <Text style={[styles.impactStatText, { color: colors.textSecondary }]}>{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Tips ── */}
        <View style={[styles.tipsCard, { backgroundColor: colors.warning + '10', borderColor: colors.warning + '30' }]}>
          <View style={styles.tipsHeader}>
            <View style={[styles.tipsIconWrap, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={colors.warning} />
            </View>
            <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>
              {t('contribute.tipsTitle')}
            </Text>
          </View>
          {tips.map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipBullet, { backgroundColor: colors.warning }]} />
              <Text style={[styles.tipText, { color: colors.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },

  // Hero
  hero: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 24 },
  heroBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-start', marginBottom: 16,
  },
  heroCenter: { alignItems: 'center', marginBottom: 20 },
  heroIconCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  heroEmoji: { fontSize: 36 },
  heroTitle: {
    fontSize: 22, fontWeight: '800', color: '#fff',
    textAlign: 'center', letterSpacing: -0.3, marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 13, color: 'rgba(255,255,255,0.75)',
    textAlign: 'center', lineHeight: 20,
  },
  heroStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 16, padding: 14,
  },
  heroStatItem: { flex: 1, alignItems: 'center' },
  heroStatValue: { fontSize: 22, fontWeight: '800', color: '#fff' },
  heroStatLabel: { fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2, fontWeight: '500' },

  // Section
  section: { paddingHorizontal: 16, marginTop: 24, marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 10, letterSpacing: -0.2 },

  // Actions
  actionsCard: {
    borderRadius: 16, overflow: 'hidden',
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  actionRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 13, paddingHorizontal: 14, gap: 12,
  },
  actionIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  actionText: { flex: 1 },
  actionTitle: { fontSize: 15, fontWeight: '600' },
  actionSubtitle: { fontSize: 12, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: 66 },

  // Impact card
  impactCard: {
    marginHorizontal: 16, borderRadius: 16,
    padding: 16, borderWidth: 1, marginBottom: 14,
  },
  impactHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  impactTitle: { fontSize: 14, fontWeight: '700' },
  impactText: { fontSize: 13, lineHeight: 20, marginBottom: 14 },
  impactStats: { flexDirection: 'row', gap: 16 ,flexWrap: 'wrap' },
  impactStat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  impactStatText: { fontSize: 11, fontWeight: '500' },

  // Tips
  tipsCard: {
    marginHorizontal: 16, borderRadius: 16,
    padding: 16, borderWidth: 1,
  },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  tipsIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  tipsTitle: { fontSize: 14, fontWeight: '700' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  tipBullet: { width: 5, height: 5, borderRadius: 3, marginTop: 8 },
  tipText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
