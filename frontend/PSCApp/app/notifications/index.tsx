import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, ActivityIndicator, Button, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { Notification } from '../../types/contribution.types';
import { Colors, ColorScheme } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { Spacing } from '../../constants/typography';
import { markNotificationRead, markAllNotificationsRead } from '../../services/api/notifications';
import { useAuthStore } from '../../store/authStore';

type NotificationCategory = 'ALL' | 'UNREAD' | 'SYSTEM' | 'ACHIEVEMENT';

const NotificationDivider = () => <Divider style={{ marginLeft: 76 }} />;

const getNotificationIcon = (type: string): { icon: string; color: string } => {
  switch (type) {
    case 'CONTRIBUTION_APPROVED':
      return { icon: 'check-decagram', color: Colors.success };
    case 'CONTRIBUTION_REJECTED':
      return { icon: 'close-circle', color: Colors.error };
    case 'NEW_ACHIEVEMENT':
    case 'BADGE_EARNED':
      return { icon: 'trophy', color: Colors.warning };
    case 'STREAK_REMINDER':
      return { icon: 'fire', color: Colors.error };
    case 'NEW_TEST':
      return { icon: 'clipboard-text', color: Colors.primary };
    case 'LEADERBOARD_UPDATE':
      return { icon: 'chart-line', color: Colors.accent };
    case 'SYSTEM':
    case 'ANNOUNCEMENT':
      return { icon: 'bullhorn', color: Colors.secondary };
    default:
      return { icon: 'bell', color: Colors.textSecondary };
  }
};

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
};

interface NotificationItemProps {
  notification: Notification;
  onPress: (notification: Notification) => void;
  onMarkRead: (id: number) => void;
  colors: ColorScheme;
  lf: (en: string | undefined | null, np: string | undefined | null) => string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress, onMarkRead, colors, lf }) => {
  const { icon, color } = getNotificationIcon(notification.notification_type);

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      activeOpacity={0.7}
      style={[styles.notificationItem, { backgroundColor: colors.surface }, !notification.is_read && { backgroundColor: colors.primaryLight + '10' }]}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }, !notification.is_read && styles.unreadTitle]} numberOfLines={1}>
              {lf(notification.title_en, (notification as any).title_np)}
            </Text>
            {!notification.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
            {lf(notification.message_en, (notification as any).message_np)}
          </Text>
          <Text style={[styles.timeAgo, { color: colors.textTertiary }]}>{formatTimeAgo(notification.created_at)}</Text>
        </View>
        {!notification.is_read && (
          <TouchableOpacity
            style={[styles.markReadBtn, { backgroundColor: Colors.primaryLight + '30' }]}
            onPress={() => onMarkRead(notification.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="check" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const [category, setCategory] = useState<NotificationCategory>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [markingRead, setMarkingRead] = useState<number | null>(null);
  const accessToken = useAuthStore((state) => state.accessToken);

  const { data: notifications, status, refetch } = usePaginatedApi<Notification>('/api/notifications/');

  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    switch (category) {
      case 'UNREAD':
        return notifications.filter(n => !n.is_read);
      case 'SYSTEM':
        return notifications.filter(n => 
          n.notification_type === 'SYSTEM' || n.notification_type === 'ANNOUNCEMENT'
        );
      case 'ACHIEVEMENT':
        return notifications.filter(n => 
          n.notification_type === 'NEW_ACHIEVEMENT' || 
          n.notification_type === 'BADGE_EARNED' ||
          n.notification_type === 'LEADERBOARD_UPDATE'
        );
      default:
        return notifications;
    }
  }, [notifications, category]);

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleNotificationPress = (notification: Notification) => {
    // Navigate based on notification type and action_url
    if (notification.action_url) {
      router.push(notification.action_url as any);
    } else if (notification.related_question) {
      router.push(`/practice/question/${notification.related_question}`);
    } else if (notification.related_mock_test) {
      router.push(`/tests/${notification.related_mock_test}`);
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      setMarkingRead(id);
      await markNotificationRead(id, accessToken);
      await refetch();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setMarkingRead(null);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingRead(-1); // Use -1 to indicate "marking all"
      await markAllNotificationsRead(accessToken);
      await refetch();
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setMarkingRead(null);
    }
  };

  const categories: { key: NotificationCategory; label: string; icon: string }[] = [
    { key: 'ALL', label: t('notifications.all'), icon: 'bell' },
    { key: 'UNREAD', label: t('notifications.unread'), icon: 'bell-badge' },
    { key: 'ACHIEVEMENT', label: t('notifications.achievements'), icon: 'trophy' },
    { key: 'SYSTEM', label: t('notifications.system'), icon: 'bullhorn' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surfaceVariant }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={[styles.markAllButton, { backgroundColor: Colors.primaryLight + '30' }]}>
            <MaterialCommunityIcons name="check-all" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 44 }} />}
      </View>

      {/* Category Filters */}
      <View style={[styles.filterContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <FlatList
          data={categories}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterList}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <Chip
              selected={category === item.key}
              onPress={() => setCategory(item.key)}
              style={[
                styles.filterChip,
                { backgroundColor: colors.surfaceVariant },
                category === item.key && { backgroundColor: Colors.primary },
              ]}
              textStyle={[
                { color: colors.textSecondary, fontSize: 13 },
                category === item.key && { color: Colors.white },
              ]}
              icon={() => (
                <MaterialCommunityIcons
                  name={item.icon as any}
                  size={16}
                  color={category === item.key ? Colors.white : colors.textSecondary}
                />
              )}
            >
              {item.label}
            </Chip>
          )}
        />
      </View>

      {/* Notifications List */}
      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="bell-off-outline" size={80} color={colors.textTertiary} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>{t('notifications.noNotifications')}</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {category === 'UNREAD'
              ? t('notifications.allRead')
              : t('notifications.noNotificationsYet')}
          </Text>
          {category !== 'ALL' && (
            <Button
              mode="outlined"
              onPress={() => setCategory('ALL')}
              style={styles.viewAllButton}
            >
              {t('notifications.viewAllNotifications')}
            </Button>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ backgroundColor: colors.surface }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Colors.primary]}
            />
          }
          ItemSeparatorComponent={NotificationDivider}
          renderItem={({ item }) => (
            <NotificationItem
              colors={colors}
              lf={lf}
              notification={item}
              onPress={handleNotificationPress}
              onMarkRead={handleMarkRead}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.base,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.xs,
    paddingHorizontal: 6,
  },
  headerBadgeText: { fontSize: 11, fontWeight: '700', color: Colors.white },
  markAllButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  filterList: { paddingHorizontal: Spacing.base },
  filterChip: { marginRight: Spacing.sm },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: Spacing.lg,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  viewAllButton: { marginTop: Spacing.lg },
  notificationItem: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  notificationContent: { flexDirection: 'row', alignItems: 'flex-start' },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  textContainer: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  title: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  unreadTitle: { fontWeight: '700' },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.xs,
  },
  message: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 20,
  },
  timeAgo: {
    fontSize: 12,
    marginTop: Spacing.xs,
  },
  markReadBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
});
