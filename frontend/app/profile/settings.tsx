import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, Switch, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { useSettingsStore } from '../../store/settingsStore';
import { clearAllQuestionCacheMMKV, clearAllApiCache } from '../../services/storage';
import { Spacing, BorderRadius } from '../../constants/typography';

interface SettingItem {
  icon: string;
  title: string;
  subtitle?: string;
  type: 'toggle' | 'link' | 'action';
  value?: boolean;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  color?: string;
}

export default function ProfileSettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const settings = useSettingsStore();

  const handleClearCache = () => {
    Alert.alert(
      t('settings.clearCache'),
      t('settings.clearCacheConfirm'),
      [
        { text: t('common.cancel') },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => {
            try {
              clearAllQuestionCacheMMKV();
              clearAllApiCache();
              Alert.alert(t('settings.cacheCleared'));
            } catch {
              Alert.alert(t('common.error'), t('settings.clearCacheFailed'));
            }
          },
        },
      ]
    );
  };

  const settingSections: { title: string; items: SettingItem[] }[] = [
    {
      title: t('settings.notifications'),
      items: [
        { icon: 'bell', title: t('settings.pushNotifications'), subtitle: t('settings.receiveReminders'), type: 'toggle', value: settings.notificationsEnabled, onToggle: settings.setNotificationsEnabled },
        { icon: 'volume-high', title: t('settings.soundEffects'), subtitle: t('settings.playSounds'), type: 'toggle', value: settings.soundEnabled, onToggle: settings.setSoundEnabled },
      ],
    },
    {
      title: t('settings.appearance'),
      items: [
        { icon: 'theme-light-dark', title: t('settings.darkMode'), subtitle: t('settings.switchDarkTheme'), type: 'toggle', value: settings.darkMode, onToggle: settings.setDarkMode },
        { icon: 'translate', title: t('settings.language'), subtitle: t('settings.languageToggle'), type: 'link', onPress: () => router.push('/profile/preferences') },
      ],
    },
    {
      title: t('settings.dataStorage'),
      items: [
        { icon: 'download', title: t('settings.offlineContent'), subtitle: t('settings.manageDownloads'), type: 'link', onPress: () => router.push('/profile/offline-content' as any) },
        { icon: 'trash-can', title: t('settings.clearCache'), subtitle: t('settings.freeUpStorage'), type: 'action', onPress: handleClearCache, color: colors.error },
      ],
    },
    {
      title: t('settings.privacySecurity'),
      items: [
        { icon: 'lock', title: t('settings.changePassword'), type: 'link', onPress: () => router.push('/profile/change-password') },
        { icon: 'shield-check', title: t('settings.privacyPolicy'), type: 'link', onPress: () => Linking.openURL('https://pscprep.com/privacy') },
        { icon: 'file-document', title: t('settings.termsOfService'), type: 'link', onPress: () => Linking.openURL('https://pscprep.com/terms') },
      ],
    },
  ];

  const SettingRow = ({ item }: { item: SettingItem }) => (
    <TouchableOpacity style={styles.settingRow} onPress={item.type !== 'toggle' ? item.onPress : undefined} activeOpacity={item.type === 'toggle' ? 1 : 0.7}>
      <View style={[styles.settingIconContainer, { backgroundColor: (item.color || colors.primary) + '15' }]}>
        <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color || colors.primary} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>{item.title}</Text>
        {item.subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{item.subtitle}</Text>}
      </View>
      {item.type === 'toggle' ? (
        <Switch value={item.value} onValueChange={item.onToggle} color={colors.primary} />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={22} color={colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('profile.settings')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {settingSections.map((section) => (
          <View key={section.title}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
            <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
              {section.items.map((item, index) => (
                <View key={item.title}>
                  <SettingRow item={item} />
                  {index < section.items.length - 1 && <Divider style={[styles.divider, { backgroundColor: colors.border }]} />}
                </View>
              ))}
            </Card>
          </View>
        ))}

        <View style={styles.appInfo}>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>PSC Prep v1.0.0</Text>
          <Text style={[styles.appCopyright, { color: colors.textTertiary }]}>© 2025 PSC Prep Nepal</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: Spacing.sm, marginTop: Spacing.md, marginLeft: Spacing.xs },
  card: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  settingIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 12 },
  divider: { marginLeft: 64 },
  appInfo: { alignItems: 'center', marginTop: Spacing.xl },
  appVersion: { fontSize: 14 },
  appCopyright: { fontSize: 12, marginTop: Spacing.xs },
});
