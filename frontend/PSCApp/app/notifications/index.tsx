import React, { useState, useCallback, useMemo } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, ActivityIndicator, Button, Chip, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { Notification } from '../../types/contribution.types';
import { Colors } from '../../constants/colors';
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
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onPress, onMarkRead }) => {
  const { icon, color } = getNotificationIcon(notification.notification_type);

  return (
    <TouchableOpacity 
      onPress={() => onPress(notification)} 
      activeOpacity={0.7}
      style={[styles.notificationItem, !notification.is_read && styles.unreadItem]}
    >
      <View style={styles.notificationContent}>
        <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
          <MaterialCommunityIcons name={icon as any} size={24} color={color} />
        </View>
        <View style={styles.textContainer}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, !notification.is_read && styles.unreadTitle]} numberOfLines={1}>
              {notification.title_en}
            </Text>
            {!notification.is_read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {notification.message_en}
          </Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(notification.created_at)}</Text>
        </View>
        {!notification.is_read && (
          <TouchableOpacity 
            style={styles.markReadBtn} 
            onPress={() => onMarkRead(notification.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="check" size={18} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen() {
  const router = useRouter();
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
    { key: 'ALL', label: 'All', icon: 'bell' },
    { key: 'UNREAD', label: 'Unread', icon: 'bell-badge' },
    { key: 'ACHIEVEMENT', label: 'Achievements', icon: 'trophy' },
    { key: 'SYSTEM', label: 'System', icon: 'bullhorn' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllButton}>
            <MaterialCommunityIcons name="check-all" size={24} color={Colors.primary} />
          </TouchableOpacity>
        )}
        {unreadCount === 0 && <View style={{ width: 44 }} />}
      </View>

      {/* Category Filters */}
      <View style={styles.filterContainer}>
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
              style={[styles.filterChip, category === item.key && styles.filterChipSelected]}
              textStyle={[styles.filterChipText, category === item.key && styles.filterChipTextSelected]}
              icon={() => (
                <MaterialCommunityIcons 
                  name={item.icon as any} 
                  size={16} 
                  color={category === item.key ? Colors.white : Colors.textSecondary} 
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
          <MaterialCommunityIcons name="bell-off-outline" size={80} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Notifications</Text>
          <Text style={styles.emptySubtitle}>
            {category === 'UNREAD' 
              ? "You've read all your notifications" 
              : "You don't have any notifications yet"}
          </Text>
          {category !== 'ALL' && (
            <Button 
              mode="outlined" 
              onPress={() => setCategory('ALL')} 
              style={styles.viewAllButton}
            >
              View All Notifications
            </Button>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
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
  container: { flex: 1, backgroundColor: Colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: Colors.surfaceVariant, 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  headerTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
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
    backgroundColor: Colors.primaryLight + '30', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  filterContainer: { 
    backgroundColor: Colors.white, 
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterList: { paddingHorizontal: Spacing.base },
  filterChip: { 
    marginRight: Spacing.sm, 
    backgroundColor: Colors.surfaceVariant,
  },
  filterChipSelected: { backgroundColor: Colors.primary },
  filterChipText: { color: Colors.textSecondary, fontSize: 13 },
  filterChipTextSelected: { color: Colors.white },
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
    color: Colors.textPrimary, 
    marginTop: Spacing.lg,
  },
  emptySubtitle: { 
    fontSize: 14, 
    color: Colors.textSecondary, 
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  viewAllButton: { marginTop: Spacing.lg },
  listContent: { backgroundColor: Colors.white },
  notificationItem: { 
    paddingHorizontal: Spacing.base, 
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
  },
  unreadItem: { backgroundColor: Colors.primaryLight + '10' },
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
    color: Colors.textPrimary, 
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
    color: Colors.textSecondary, 
    marginTop: 2,
    lineHeight: 20,
  },
  timeAgo: { 
    fontSize: 12, 
    color: Colors.textTertiary, 
    marginTop: Spacing.xs,
  },
  markReadBtn: { 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    backgroundColor: Colors.primaryLight + '30', 
    alignItems: 'center', 
    justifyContent: 'center',
    marginLeft: Spacing.sm,
  },
  divider: { marginLeft: 76 },
});
