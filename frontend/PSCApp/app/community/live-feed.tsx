import React from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

interface ActivityItem {
  id: number;
  user_name: string;
  profile_picture: string | null;
  action_type: 'QUESTION_ADDED' | 'TEST_COMPLETED' | 'ACHIEVEMENT' | 'CONTRIBUTION_APPROVED';
  description: string;
  created_at: string;
}

const getActivityIcon = (type: ActivityItem['action_type']) => {
  switch (type) {
    case 'QUESTION_ADDED': return { icon: 'file-document-plus', color: Colors.primary };
    case 'TEST_COMPLETED': return { icon: 'clipboard-check', color: Colors.success };
    case 'ACHIEVEMENT': return { icon: 'trophy', color: Colors.warning };
    case 'CONTRIBUTION_APPROVED': return { icon: 'check-decagram', color: Colors.accent };
    default: return { icon: 'bell', color: Colors.textSecondary };
  }
};

const formatTimeAgo = (dateString: string) => {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

const ActivityCard = ({ activity }: { activity: ActivityItem }) => {
  const { icon, color } = getActivityIcon(activity.action_type);

  return (
    <Card style={styles.activityCard}>
      <Card.Content style={styles.cardContent}>
        <View style={styles.avatarContainer}>
          <Avatar.Image size={44} source={{ uri: activity.profile_picture || `https://i.pravatar.cc/100?u=${activity.user_name}` }} />
          <View style={[styles.actionBadge, { backgroundColor: color }]}>
            <MaterialCommunityIcons name={icon as any} size={12} color={Colors.white} />
          </View>
        </View>
        <View style={styles.activityInfo}>
          <Text style={styles.userName}>{activity.user_name}</Text>
          <Text style={styles.description}>{activity.description}</Text>
          <Text style={styles.timeAgo}>{formatTimeAgo(activity.created_at)}</Text>
        </View>
      </Card.Content>
    </Card>
  );
};

export default function LiveFeedScreen() {
  const router = useRouter();
  // Using the correct API endpoint - /api/daily-activity/ is the backend endpoint
  const { data: activities, status, refetch } = usePaginatedApi<ActivityItem>('/api/daily-activity/');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Feed</Text>
        <TouchableOpacity onPress={() => refetch?.()} style={styles.refreshButton}>
          <MaterialCommunityIcons name="refresh" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Live Indicator */}
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>Live Activity</Text>
      </View>

      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !activities || activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="pulse" size={80} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Activity Yet</Text>
          <Text style={styles.emptySubtitle}>Community activity will appear here</Text>
        </View>
      ) : (
        <FlatList data={activities} keyExtractor={(item) => String(item.id)} contentContainerStyle={styles.listContent} renderItem={({ item }) => <ActivityCard activity={item} />} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  refreshButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.sm, backgroundColor: Colors.successLight },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success, marginRight: Spacing.xs },
  liveText: { fontSize: 13, fontWeight: '600', color: Colors.success },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary },
  listContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  activityCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, elevation: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'flex-start' },
  avatarContainer: { position: 'relative' },
  actionBadge: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  activityInfo: { flex: 1, marginLeft: Spacing.md },
  userName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  description: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  timeAgo: { fontSize: 12, color: Colors.textTertiary, marginTop: Spacing.xs },
});
