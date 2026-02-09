import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, Switch, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
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
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [autoSync, setAutoSync] = useState(true);

  const settingSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Notifications',
      items: [
        { icon: 'bell', title: 'Push Notifications', subtitle: 'Receive study reminders', type: 'toggle', value: notifications, onToggle: setNotifications },
        { icon: 'volume-high', title: 'Sound Effects', subtitle: 'Play sounds for actions', type: 'toggle', value: soundEffects, onToggle: setSoundEffects },
      ],
    },
    {
      title: 'Appearance',
      items: [
        { icon: 'theme-light-dark', title: 'Dark Mode', subtitle: 'Switch to dark theme', type: 'toggle', value: darkMode, onToggle: setDarkMode },
        { icon: 'translate', title: 'Language', subtitle: 'English / नेपाली', type: 'link', onPress: () => Alert.alert('Coming Soon', 'Language settings will be available soon.') },
      ],
    },
    {
      title: 'Data & Storage',
      items: [
        { icon: 'sync', title: 'Auto Sync', subtitle: 'Sync progress automatically', type: 'toggle', value: autoSync, onToggle: setAutoSync },
        { icon: 'download', title: 'Offline Content', subtitle: 'Manage downloaded content', type: 'link', onPress: () => {} },
        { icon: 'trash-can', title: 'Clear Cache', subtitle: 'Free up storage space', type: 'action', onPress: () => Alert.alert('Clear Cache', 'Are you sure you want to clear the cache?', [{ text: 'Cancel' }, { text: 'Clear', style: 'destructive' }]) },
      ],
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: 'lock', title: 'Change Password', type: 'link', onPress: () => {} },
        { icon: 'shield-check', title: 'Privacy Policy', type: 'link', onPress: () => {} },
        { icon: 'file-document', title: 'Terms of Service', type: 'link', onPress: () => {} },
      ],
    },
  ];

  const SettingRow = ({ item }: { item: SettingItem }) => (
    <TouchableOpacity style={styles.settingRow} onPress={item.type !== 'toggle' ? item.onPress : undefined} activeOpacity={item.type === 'toggle' ? 1 : 0.7}>
      <View style={[styles.settingIconContainer, { backgroundColor: (item.color || Colors.primary) + '15' }]}>
        <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color || Colors.primary} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{item.title}</Text>
        {item.subtitle && <Text style={styles.settingSubtitle}>{item.subtitle}</Text>}
      </View>
      {item.type === 'toggle' ? (
        <Switch value={item.value} onValueChange={item.onToggle} color={Colors.primary} />
      ) : (
        <MaterialCommunityIcons name="chevron-right" size={22} color={Colors.textTertiary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {settingSections.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Card style={styles.card}>
              {section.items.map((item, index) => (
                <React.Fragment key={item.title}>
                  <SettingRow item={item} />
                  {index < section.items.length - 1 && <Divider style={styles.divider} />}
                </React.Fragment>
              ))}
            </Card>
          </View>
        ))}

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appVersion}>PSC Prep v1.0.0</Text>
          <Text style={styles.appCopyright}>© 2024 PSC Prep Nepal</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.sm, marginTop: Spacing.md, marginLeft: Spacing.xs },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base },
  settingIconContainer: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  settingTextContainer: { flex: 1 },
  settingTitle: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  settingSubtitle: { fontSize: 12, color: Colors.textSecondary },
  divider: { marginLeft: 64 },
  appInfo: { alignItems: 'center', marginTop: Spacing.xl },
  appVersion: { fontSize: 14, color: Colors.textSecondary },
  appCopyright: { fontSize: 12, color: Colors.textTertiary, marginTop: Spacing.xs },
});
