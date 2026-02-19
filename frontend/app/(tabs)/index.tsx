import React from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity, RefreshControl } from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserStatistics } from '../../types/user.types';
import { useColors } from '../../hooks/useColors';


interface QuickAction {
  id: string;
  titleKey: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  colorKey: 'primary' | 'accent' | 'secondary' | 'warning';
  route: string;
}

const quickActions: QuickAction[] = [
  { id: '1', titleKey: 'home.practice', icon: 'book-open-variant', colorKey: 'primary', route: '/practice/categories' },
  { id: '2', titleKey: 'home.mockTest', icon: 'clipboard-text-clock', colorKey: 'accent', route: '/(tabs)/tests' },
  { id: '3', titleKey: 'home.contribute', icon: 'plus-circle', colorKey: 'secondary', route: '/contribute' },
  { id: '4', titleKey: 'home.leaderboard', icon: 'trophy', colorKey: 'warning', route: '/(tabs)/leaderboard' },
];

function CompactStatItem({ icon, value, label, color, textColor, subColor }: { icon: string; value: string | number; label: string; color: string; textColor: string; subColor: string }) {
  return (
    <View style={styles.statItem}>
      <View style={[styles.statIconSmall, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={16} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={[styles.statValueCompact, { color: textColor }]}>{value}</Text>
        <Text style={[styles.statLabelCompact, { color: subColor }]}>{label}</Text>
      </View>
    </View>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { data: stats, status, refetch } = useApi<UserStatistics>('/api/statistics/me/');
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[colors.primary]} 
            tintColor={colors.primary} 
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: colors.textPrimary }]}>{t('home.greeting')}</Text>
            <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>{t('home.welcomeText')}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => router.push('/notifications')} 
            style={[styles.notificationBtn, { backgroundColor: colors.surface }]} 
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="bell-outline" size={22} color={colors.textPrimary} />
            <View style={[styles.notificationBadge, { backgroundColor: colors.error }]} />
          </TouchableOpacity>
        </View>

        {/* Compact Stats Card */}
        <TouchableOpacity 
          style={[styles.statsCard, { backgroundColor: colors.surface }]} 
          onPress={() => router.push('/(tabs)/analytics')}
          activeOpacity={0.95}
        >
          <View style={styles.statsHeader}>
            <Text style={[styles.statsTitle, { color: colors.textPrimary }]}>{t('home.yourProgress')}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textSecondary} />
          </View>
          
          {status === 'loading' ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={styles.statsGrid}>
              <CompactStatItem
                icon="fire"
                value={stats?.study_streak_days || 0}
                label={t('home.dayStreak')}
                color={colors.secondary}
                textColor={colors.textPrimary}
                subColor={colors.textSecondary}
              />
              <CompactStatItem
                icon="check-circle"
                value={stats?.questions_answered || 0}
                label={t('home.answered')}
                color={colors.success}
                textColor={colors.textPrimary}
                subColor={colors.textSecondary}
              />
              <CompactStatItem
                icon="percent"
                value={`${Number(stats?.accuracy_percentage ?? 0).toFixed(0)}%`}
                label={t('home.accuracy')}
                color={colors.primary}
                textColor={colors.textPrimary}
                subColor={colors.textSecondary}
              />
              <CompactStatItem
                icon="trophy"
                value={stats?.mock_tests_completed || 0}
                label={t('home.tests')}
                color={colors.warning}
                textColor={colors.textPrimary}
                subColor={colors.textSecondary}
              />
            </View>
          )}
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.actionsSection}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('home.quickActions')}</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity 
                key={action.id} 
                style={[styles.actionCard, { backgroundColor: colors.surface }]} 
                onPress={() => router.push(action.route as any)} 
                activeOpacity={0.8}
              >
                <View style={[styles.actionIconContainer, { backgroundColor: colors[action.colorKey] }]}>
                  <MaterialCommunityIcons name={action.icon} size={24} color={colors.white} />
                </View>
                <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{t(action.titleKey)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Continue Learning Card */}
        <TouchableOpacity 
          style={[styles.continueCard, { 
            backgroundColor: colors.surface,
            borderColor: colors.primaryLight + '20' 
          }]} 
          onPress={() => router.push('/practice/categories')}
          activeOpacity={0.9}
        >
          <View style={[styles.continueIconWrapper, { backgroundColor: colors.primaryLight + '15' }]}>
            <MaterialCommunityIcons name="book-open-page-variant" size={28} color={colors.primary} />
          </View>
          <View style={styles.continueContent}>
            <Text style={[styles.continueTitle, { color: colors.textPrimary }]}>{t('home.continueLearning')}</Text>
            <Text style={[styles.continueSubtitle, { color: colors.textSecondary }]}>{t('home.pickUpWhereLeft')}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Daily Tip */}
        <View style={[styles.tipCard, { 
          backgroundColor: colors.warning + '15',
          borderLeftColor: colors.warning 
        }]}>
          <View style={styles.tipHeader}>
            <View style={[styles.tipIconContainer, { backgroundColor: colors.surface }]}>
              <MaterialCommunityIcons name="lightbulb-on-outline" size={20} color={colors.warning} />
            </View>
            <Text style={[styles.tipTitle, { color: colors.textPrimary }]}>{t('home.dailyTip')}</Text>
          </View>
          <Text style={[styles.tipText, { color: colors.textSecondary }]}>{t('home.dailyTipText')}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },
  
  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  welcomeText: { fontSize: 14, marginTop: 4 },
  notificationBtn: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  notificationBadge: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },

  // Compact Stats Card
  statsCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  statsTitle: { fontSize: 16, fontWeight: '700' },
  loaderContainer: { paddingVertical: 20, alignItems: 'center' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  statItem: { width: '50%', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 6, paddingVertical: 8 },
  statIconSmall: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  statContent: { flex: 1 },
  statValueCompact: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
  statLabelCompact: { fontSize: 11, marginTop: 1 },

  // Actions Section
  actionsSection: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  actionsGrid: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between', // important
},

actionCard: { 
  width: '48%',           // clean 2 columns
  borderRadius: 16,
  padding: 20,
  alignItems: 'center',
  marginBottom: 12,       // vertical spacing only
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 8,
  elevation: 2
},

  actionIconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionTitle: { fontSize: 14, fontWeight: '600', textAlign: 'center' },

  // Continue Learning Card
  continueCard: { 
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2
  },
  continueIconWrapper: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  continueContent: { flex: 1 },
  continueTitle: { fontSize: 15, fontWeight: '600', marginBottom: 2 },
  continueSubtitle: { fontSize: 13 },

  // Tip Card
  tipCard: { borderRadius: 16, padding: 16, borderLeftWidth: 4 },
  tipHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  tipIconContainer: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  tipTitle: { fontSize: 14, fontWeight: '600' },
  tipText: { fontSize: 14, lineHeight: 20, marginLeft: 40 },
});