import React, { useState, useCallback, useMemo } from 'react';
import {
  View, StyleSheet, FlatList, TouchableOpacity, RefreshControl,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, ActivityIndicator } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { Notification } from '../../types/contribution.types';
import { Colors } from '../../constants/colors';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { markNotificationRead, markAllNotificationsRead } from '../../services/api/notifications';
import { apiRequest } from '../../services/api/client';
import { useAuthStore } from '../../store/authStore';

type NotificationCategory = 'ALL' | 'UNREAD' | 'SYSTEM' | 'ACHIEVEMENT';

const getNotificationMeta = (type: string, colors: ReturnType<typeof useColors>) => {
  switch (type) {
    case 'CONTRIBUTION_APPROVED':
      return { icon: 'check-decagram', color: colors.success };
    case 'CONTRIBUTION_REJECTED':
      return { icon: 'close-circle', color: colors.error };
    case 'NEW_ACHIEVEMENT':
    case 'BADGE_EARNED':
      return { icon: 'trophy', color: colors.warning };
    case 'STREAK_REMINDER':
      return { icon: 'fire', color: colors.secondary };
    case 'NEW_TEST':
      return { icon: 'clipboard-text', color: colors.primary };
    case 'LEADERBOARD_UPDATE':
      return { icon: 'chart-line', color: colors.accent };
    case 'SYSTEM':
    case 'ANNOUNCEMENT':
      return { icon: 'bullhorn', color: colors.info };
    default:
      return { icon: 'bell', color: colors.textSecondary };
  }
};

const formatTimeAgo = (dateString: string): string => {
  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
};

// ── Notification Item ─────────────────────────────────────────────────────────
function NotificationItem({
  notification,
  onPress,
  onMarkRead,
  colors,
  lf,
}: {
  notification: Notification;
  onPress: (n: Notification) => void;
  onMarkRead: (id: number) => void;
  colors: ReturnType<typeof useColors>;
  lf: ReturnType<typeof useLocalizedField>;
}) {
  const { icon, color } = getNotificationMeta(notification.notification_type, colors);
  const isUnread = !notification.is_read;

  return (
    <TouchableOpacity
      onPress={() => onPress(notification)}
      activeOpacity={0.8}
      style={[
        styles.item,
        {
          backgroundColor: isUnread ? colors.primary + '06' : colors.surface,
          borderLeftColor: isUnread ? color : 'transparent',
        },
      ]}
    >
      <View style={[styles.itemIconWrap, { backgroundColor: color + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
        {isUnread && (
          <View style={[styles.itemUnreadDot, { backgroundColor: colors.primary, borderColor: colors.surface }]} />
        )}
      </View>

      <View style={styles.itemContent}>
        <View style={styles.itemTitleRow}>
          <Text
            style={[
              styles.itemTitle,
              { color: colors.textPrimary },
              isUnread && { fontWeight: '700' },
            ]}
            numberOfLines={1}
          >
            {lf(notification.title_en, (notification as any).title_np)}
          </Text>
          <Text style={[styles.itemTime, { color: colors.textTertiary }]}>
            {formatTimeAgo(notification.created_at)}
          </Text>
        </View>
        <Text style={[styles.itemMessage, { color: colors.textSecondary }]} numberOfLines={2}>
          {lf(notification.message_en, (notification as any).message_np)}
        </Text>
      </View>

      {isUnread && (
        <TouchableOpacity
          style={[styles.markReadBtn, { backgroundColor: colors.surfaceVariant }]}
          onPress={() => onMarkRead(notification.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons name="check" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────
export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const [category, setCategory] = useState<NotificationCategory>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const accessToken = useAuthStore(s => s.accessToken);

  const { data: notifications, status, refetch } = usePaginatedApi<Notification>('/api/notifications/');

  const filteredNotifications = useMemo(() => {
    if (!notifications) return [];
    switch (category) {
      case 'UNREAD': return notifications.filter(n => !n.is_read);
      case 'SYSTEM': return notifications.filter(n => n.notification_type === 'SYSTEM' || n.notification_type === 'ANNOUNCEMENT');
      case 'ACHIEVEMENT': return notifications.filter(n => ['NEW_ACHIEVEMENT', 'BADGE_EARNED', 'LEADERBOARD_UPDATE'].includes(n.notification_type));
      default: return notifications;
    }
  }, [notifications, category]);

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handlePress = async (notification: Notification) => {
    if (!notification.is_read) handleMarkRead(notification.id);
    if (notification.action_url) {
      router.push(notification.action_url as any);
    } else if (notification.related_mock_test) {
      router.push(`/tests/${notification.related_mock_test}` as any);
    } else if (notification.related_question) {
      try {
        const q = await apiRequest<{ category: number }>(`/api/questions/${notification.related_question}/`, { token: accessToken ?? undefined });
        router.push(q?.category ? `/practice/${q.category}` as any : '/practice/categories' as any);
      } catch { router.push('/practice/categories' as any); }
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await markNotificationRead(id, accessToken);
      await refetch();
    } catch { /* silent */ }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead(accessToken);
      await refetch();
    } catch { /* silent */ }
  };

  const filterTabs: { key: NotificationCategory; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
    { key: 'ALL', label: t('notifications.all'), icon: 'bell-outline' },
    { key: 'UNREAD', label: t('notifications.unread'), icon: 'bell-badge' },
    { key: 'ACHIEVEMENT', label: t('notifications.achievements'), icon: 'trophy-outline' },
    { key: 'SYSTEM', label: t('notifications.system'), icon: 'bullhorn-outline' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Hero header ── */}
      <View style={[styles.hero, { backgroundColor: colors.primary }]}>
        <View style={styles.heroTop}>
          <TouchableOpacity
            style={styles.heroBackBtn}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>

          <View style={styles.heroTitleWrap}>
            <Text style={styles.heroTitle}>{t('notifications.title')}</Text>
            {unreadCount > 0 && (
              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>

          {unreadCount > 0 ? (
            <TouchableOpacity
              style={styles.heroMarkAllBtn}
              onPress={handleMarkAllRead}
            >
              <MaterialCommunityIcons name="check-all" size={18} color={colors.primary} />
              <Text style={[styles.heroMarkAllText, { color: colors.primary }]}>
                Mark all read
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}
        </View>

        {/* Filter tabs inside hero */}
        <View style={styles.filterRow}>
          {filterTabs.map(tab => {
            const active = category === tab.key;
            const count = tab.key === 'UNREAD' ? unreadCount : null;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.filterTab,
                  { backgroundColor: active ? '#fff' : 'rgba(255,255,255,0.15)' },
                ]}
                onPress={() => setCategory(tab.key)}
              >
                <MaterialCommunityIcons
                  name={tab.icon}
                  size={13}
                  color={active ? colors.primary : 'rgba(255,255,255,0.85)'}
                />
                <Text style={[
                  styles.filterTabText,
                  { color: active ? colors.primary : 'rgba(255,255,255,0.85)' },
                ]}>
                  {tab.label}
                </Text>
                {count !== null && count > 0 && (
                  <View style={[styles.filterCount, { backgroundColor: active ? colors.primary : 'rgba(255,255,255,0.3)' }]}>
                    <Text style={[styles.filterCountText, { color: active ? '#fff' : 'rgba(255,255,255,0.9)' }]}>
                      {count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Content ── */}
      {status === 'loading' ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredNotifications.length === 0 ? (
        <View style={styles.centered}>
          <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceVariant }]}>
            <MaterialCommunityIcons name="bell-off-outline" size={36} color={colors.textTertiary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {category === 'UNREAD' ? t('notifications.allRead') : t('notifications.noNotifications')}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {category === 'ALL'
              ? t('notifications.noNotificationsYet')
              : `No ${category.toLowerCase()} notifications`}
          </Text>
          {category !== 'ALL' && (
            <TouchableOpacity
              style={[styles.viewAllBtn, { backgroundColor: colors.primary + '15' }]}
              onPress={() => setCategory('ALL')}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                View all notifications
              </Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={item => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingVertical: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ItemSeparatorComponent={() => (
            <View style={[styles.separator, { backgroundColor: colors.border }]} />
          )}
          renderItem={({ item }) => (
            <NotificationItem
              notification={item}
              onPress={handlePress}
              onMarkRead={handleMarkRead}
              colors={colors}
              lf={lf}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },

  // Hero
  hero: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 16 },
  heroTop: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 14,
  },
  heroBackBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroTitleWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  heroBadge: {
    backgroundColor: Colors.error,
    borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  heroBadgeText: { fontSize: 11, fontWeight: '800', color: '#fff' },
  heroMarkAllBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 20,
  },
  heroMarkAllText: { fontSize: 11, fontWeight: '700' },

  // Filter row
  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20,
  },
  filterTabText: { fontSize: 12, fontWeight: '600' },
  filterCount: {
    minWidth: 16, height: 16, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  filterCountText: { fontSize: 9, fontWeight: '800' },

  // Notification item
  item: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 13,
    gap: 12, borderLeftWidth: 3,
  },
  itemIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  itemUnreadDot: {
    position: 'absolute', top: -1, right: -1,
    width: 10, height: 10, borderRadius: 5, borderWidth: 2,
  },
  itemContent: { flex: 1 },
  itemTitleRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 3,
  },
  itemTitle: { fontSize: 14, fontWeight: '500', flex: 1, marginRight: 8 },
  itemTime: { fontSize: 11, flexShrink: 0 },
  itemMessage: { fontSize: 13, lineHeight: 19 },
  markReadBtn: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },

  // Separator
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 68 },

  // Empty
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySubtitle: { fontSize: 13, textAlign: 'center' },
  viewAllBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, marginTop: 4 },
  viewAllText: { fontSize: 13, fontWeight: '700' },
});