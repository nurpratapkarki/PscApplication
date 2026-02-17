import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Card, Text, ActivityIndicator, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserProfile, UserStatistics } from '../../types/user.types';
import { useColors } from '../../hooks/useColors';
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
  const { t } = useTranslation();
  const colors = useColors();
  const { logout } = useAuth();
  const { data: user, status: userStatus } = useApi<UserProfile>('/api/auth/user/');
  const { data: stats, status: statsStatus } = useApi<UserStatistics>('/api/statistics/me/');

  const isLoading = userStatus === 'loading' || statsStatus === 'loading';

  const handleLogout = () => {
    Alert.alert(
      t('profile.logout'),
      t('profile.logoutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { 
          text: t('profile.logout'), 
          style: 'destructive', 
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          }
        },
      ]
    );
  };

  const menuItems: MenuItem[] = [
    { 
      icon: 'account-edit', 
      title: t('profile.editProfile'), 
      subtitle: t('profile.editProfileSubtitle'), 
      route: '/profile/edit' 
    },
    { 
      icon: 'plus-circle', 
      title: t('profile.myContributions'), 
      subtitle: t('profile.myContributionsSubtitle'), 
      route: '/contribute/my-contributions' 
    },
    { 
      icon: 'cog', 
      title: t('profile.settings'), 
      subtitle: t('profile.settingsSubtitle'), 
      route: '/profile/settings' 
    },
    { 
      icon: 'help-circle', 
      title: t('profile.helpSupport'), 
      subtitle: t('profile.helpSupportSubtitle'), 
      route: '/profile/help' 
    },
    { 
      icon: 'information', 
      title: t('profile.about'), 
      subtitle: t('profile.aboutSubtitle'), 
      route: '/profile/about' 
    },
  ];

  const MenuRow = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity 
      style={styles.menuRow} 
      onPress={item.onPress || (() => item.route && router.push(item.route as any))} 
      activeOpacity={0.7}
    >
      <View style={[styles.menuIconContainer, { backgroundColor: (item.color || colors.primary) + '15' }]}>
        <MaterialCommunityIcons name={item.icon} size={22} color={item.color || colors.primary} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuTitle, { color: colors.textPrimary }, item.color && { color: item.color }]}>
          {item.title}
        </Text>
        {item.subtitle && (
          <Text style={[styles.menuSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>
        )}
      </View>
      <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loaderContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Avatar.Image 
              size={90} 
              source={{ uri: user?.profile_picture || `https://i.pravatar.cc/150?u=${user?.email}` }} 
            />
            <TouchableOpacity style={[styles.editAvatarBtn, { backgroundColor: colors.primary, borderColor: colors.background }]}>
              <MaterialCommunityIcons name="camera" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.userName, { color: colors.textPrimary }]}>
            {user?.full_name || t('profile.user')}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>{user?.email}</Text>
          {user?.branch_name && (
            <View style={[styles.branchBadge, { backgroundColor: colors.primaryLight + '30' }]}>
              <MaterialCommunityIcons name="school" size={14} color={colors.primary} />
              <Text style={[styles.branchText, { color: colors.primary }]}>{user.branch_name}</Text>
            </View>
          )}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <Card style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="fire" size={24} color={colors.error} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {stats?.study_streak_days || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('profile.dayStreak')}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="trophy" size={24} color={colors.warning} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                #{stats?.answers_rank || '-'}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('profile.rank')}
              </Text>
            </Card.Content>
          </Card>
          <Card style={[styles.statCard, { backgroundColor: colors.cardBackground }]}>
            <Card.Content style={styles.statContent}>
              <MaterialCommunityIcons name="check-circle" size={24} color={colors.success} />
              <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                {stats?.questions_answered || 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                {t('profile.answered')}
              </Text>
            </Card.Content>
          </Card>
        </View>

        {/* Menu Items */}
        <Card style={[styles.menuCard, { backgroundColor: colors.cardBackground }]}>
          {menuItems.map((item, index) => (
            <View key={item.title}>
              <MenuRow item={item} />
              {index < menuItems.length - 1 && <Divider style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </Card>

        {/* Logout Button */}
        <Card style={[styles.logoutCard, { backgroundColor: colors.cardBackground }]}>
          <TouchableOpacity style={styles.logoutRow} onPress={handleLogout} activeOpacity={0.7}>
            <View style={[styles.menuIconContainer, { backgroundColor: colors.errorLight }]}>
              <MaterialCommunityIcons name="logout" size={22} color={colors.error} />
            </View>
            <Text style={[styles.logoutText, { color: colors.error }]}>
              {t('profile.logout')}
            </Text>
          </TouchableOpacity>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  header: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatarContainer: { position: 'relative' },
  editAvatarBtn: { 
    position: 'absolute', 
    bottom: 0, 
    right: 0, 
    width: 32, 
    height: 32, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center', 
    borderWidth: 3 
  },
  userName: { fontSize: 24, fontWeight: '700', marginTop: Spacing.md },
  userEmail: { fontSize: 14 },
  branchBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: Spacing.md, 
    paddingVertical: Spacing.xs, 
    borderRadius: BorderRadius.full, 
    marginTop: Spacing.sm 
  },
  branchText: { fontSize: 12, marginLeft: Spacing.xs, fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: { flex: 1, borderRadius: BorderRadius.lg },
  statContent: { alignItems: 'center', paddingVertical: Spacing.md },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: Spacing.xs },
  statLabel: { fontSize: 11 },
  menuCard: { borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, overflow: 'hidden' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  menuIconContainer: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginRight: Spacing.md 
  },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 15, fontWeight: '600' },
  menuSubtitle: { fontSize: 12 },
  divider: { marginLeft: 68 },
  logoutCard: { borderRadius: BorderRadius.xl, overflow: 'hidden' },
  logoutRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  logoutText: { fontSize: 15, fontWeight: '600', marginLeft: Spacing.md },
});