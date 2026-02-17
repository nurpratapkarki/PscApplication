import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { useColors } from '../../hooks/useColors';
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

interface ActivityItem {
  id: number;
  user_name: string;
  profile_picture: string | null;
  action_type: 'QUESTION_ADDED' | 'TEST_COMPLETED' | 'ACHIEVEMENT' | 'CONTRIBUTION_APPROVED';
  description: string;
  created_at: string;
}

const getActivityIcon = (type: ActivityItem['action_type'], colors: ColorScheme) => {
  switch (type) {
    case 'QUESTION_ADDED': return { icon: 'file-document-plus', color: colors.primary };
    case 'TEST_COMPLETED': return { icon: 'clipboard-check', color: colors.success };
    case 'ACHIEVEMENT': return { icon: 'trophy', color: colors.warning };
    case 'CONTRIBUTION_APPROVED': return { icon: 'check-decagram', color: colors.accent };
    default: return { icon: 'bell', color: colors.textSecondary };
  }
};

const formatTimeAgo = (dateString: string, t: (key: string, options?: any) => string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return t('community.justNow');
  if (diffMins < 60) return t('community.minutesAgo', { count: diffMins });
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return t('community.hoursAgo', { count: diffHours });
  const diffDays = Math.floor(diffHours / 24);
  return t('community.daysAgo', { count: diffDays });
};

const ActivityCard = ({ activity, colors, t, styles }: { activity: ActivityItem; colors: ColorScheme; t: (key: string, options?: any) => string; styles: ReturnType<typeof createStyles> }) => {
  const { icon, color } = getActivityIcon(activity.action_type, colors);

  return (
    <Card style={styles.activityCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.avatarContainer}>
          <Avatar.Image size={44} source={{ uri: activity.profile_picture || `https://i.pravatar.cc/100?u=${activity.user_name}` }} />
          <View style={[styles.actionBadge, { backgroundColor: color }]}>
            <MaterialCommunityIcons name={icon as any} size={12} color={colors.white} />
          </View>
        </View>
        <View style={styles.activityInfo}>
          <Text style={styles.userName}>{activity.user_name}</Text>
          <Text style={styles.description}>{activity.description}</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(activity.created_at, t)}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

export default function LiveFeedScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  // Using the correct API endpoint - /api/daily-activity/ is the backend endpoint
  const { data: activities, status, refetch } = usePaginatedApi<ActivityItem>('/api/daily-activity/');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('community.liveFeed')}</Text>
        <TouchableOpacity onPress={() => refetch?.()} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Live Indicator */}
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>{t('community.liveActivity')}</Text>
      </View>

      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !activities || activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="pulse" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('community.noActivity')}</Text>
          <Text style={styles.emptySubtitle}>{t('community.activityAppearHere')}</Text>
        </View>
      ) : (
        <FlatList data={activities} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.listContent} renderItem={({ item }) => <ActivityCard activity={item} colors={colors} t={t} styles={styles} />} />
      )}
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  refreshButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, backgroundColor: colors.successLight },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.success, marginRight: Spacing.xs },
  liveText: { fontSize: 13, fontWeight: '600', color: colors.success },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary },
  listContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  activityCard: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, elevation: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarContainer: { position: 'relative' },
  actionBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.cardBackground },
  activityInfo: { flex: 1, marginLeft: Spacing.md },
  userName: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  description: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
  timeAgo: { fontSize: 12, color: colors.textTertiary, marginTop: Spacing.xs },
});
