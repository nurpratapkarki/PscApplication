import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Card, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { UserProfile, UserStatistics } from '../../types/user.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';

interface MenuItem {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  route?: string;
  color?: string;
  onPress?: () => void;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { data: user, status: userStatus } = useApi<UserProfile>('/api/auth/user/');
  const { data: stats, status: statsStatus } = useApi<UserStatistics>('/api/statistics/me/');

  const isLoading = userStatus === 'loading' || statsStatus === 'loading';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        router.replace('/(auth)/login');
      }},
    ]);
  };

  const menuItems: MenuItem[] = [
    { icon: 'account-edit', title: 'Edit Profile', subtitle: 'Update your information', route: '/profile/edit' },
    { icon: 'plus-circle', title: 'My Contributions', subtitle: 'Questions you have contributed', route: '/contribute/my-contributions' },
    { icon: 'cog', title: 'Settings', subtitle: 'App preferences', route: '/profile/settings' },
    { icon: 'help-circle', title: 'Help & Support', subtitle: 'FAQs and contact', route: '/profile/help' },
    { icon: 'information', title: 'About', subtitle: 'App version and info', route: '/profile/about' },
  ];

  const MenuRow = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity style={styles.menuRow} onPress={item.onPress || (() => item.route && router.push(item.route as any))} activeOpacity={0.7}>
      <View style={[styles.menuIconContainer, { backgroundColor: (item.color || Colors.primary) + '15' }]}>
        <MaterialCommunityIcons name={item.icon} size={22} color={item.color || Colors.primary} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, item.color && { color: item.color }]}>{item.title}</Text>
        {item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Avatar.Image size={90} source={{ uri: user?.profile_picture || `https://i.pravatar.cc/150?u=${user?.email}` }} />
            <TouchableOpacity style={styles.editAvatarBtn}>
              <MaterialCommunityIcons name="camera" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          {user?.branch_name && (
            <View style={styles.branchBadge}>
              <MaterialCommunityIcons name="school" size={14} color={Colors.primary} />
              <Text style={styles.branchText}>{user.branch_name}</Text>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="fire" size={24} color={Colors.error} />
              <Text style={styles.statValue}>{stats?.study_streak_days || 0}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="trophy" size={24} color={Colors.warning} />
              <Text style={styles.statValue}>#{stats?.contribution_rank || '-'}</Text>
              <Text style={styles.statLabel}>Rank</Text>
            </Card.Content>
          </Card>
          <Card style={styles.statCard}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
              <Text style={styles.statValue}>{stats?.questions_answered || 0}</Text>
              <Text style={styles.statLabel}>Answered</Text>
            </Card.Content>
          </Card>
        </View>

        {/* Menu Items */}
        <Card style={styles.menuCard}>
          {menuItems.map((item, index) => (
            <View key={item.title}>
              <MenuRow item={item} />
              {index < menuItems.length - 1 && <Divider style={styles.divider} />}
            </View>
          ))}
        </Card>

        {/* Logout Button */}
        <Card style={styles.logoutCard}>
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.menuIconContainer, { backgroundColor: Colors.errorLight }]}>
              <MaterialCommunityIcons name="logout" size={22} color={Colors.error} />
            </View>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  header: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarContainer: { position: 'relative' },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.background },
  userName: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md },
  userEmail: { fontSize: 14, color: Colors.textSecondary },
  branchBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primaryLight + '30', paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.full, marginTop: Spacing.sm },
  branchText: { fontSize: 12, color: Colors.primary, marginLeft: Spacing.xs, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { flex: 1, backgroundColor: Colors.white, borderRadius: BorderRadius.lg },
  statContent: { alignItems: 'center', paddingVertical: Spacing.md },
  statValue: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.xs },
  statLabel: { fontSize: 11, color: Colors.textSecondary },
  menuCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  menuIconContainer: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  menuSubtitle: { fontSize: 12, color: Colors.textSecondary },
  divider: { marginLeft: 68 },
  logoutCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden' },
  logoutRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  logoutText: { fontSize: 15, fontWeight: '600', color: Colors.error, marginLeft: Spacing.md },
});

