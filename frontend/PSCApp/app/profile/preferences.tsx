import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, Switch, RadioButton, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';
import { updateUserProfile } from '../../services/api/profile';
import { getAccessToken } from '../../services/api/client';
import { useSettingsStore } from '../../store/settingsStore';

type Language = 'EN' | 'NP';
type NotificationFrequency = 'all' | 'important' | 'none';

export default function ProfilePreferencesScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const colors = useColors();
  const settings = useSettingsStore();

  // Language preferences
  const [language, setLanguage] = useState<Language>(settings.language);

  // Notification preferences
  const [streakReminders, setStreakReminders] = useState(settings.streakReminders);
  const [testReminders, setTestReminders] = useState(settings.testReminders);
  const [contributionUpdates, setContributionUpdates] = useState(settings.contributionUpdates);
  const [leaderboardUpdates, setLeaderboardUpdates] = useState(settings.leaderboardUpdates);
  const [notificationFrequency, setNotificationFrequency] = useState<NotificationFrequency>(settings.notificationFrequency);

  // Study preferences
  const [autoAdvance, setAutoAdvance] = useState(settings.autoAdvance);
  const [showExplanations, setShowExplanations] = useState(settings.showExplanations);
  const [shuffleQuestions, setShuffleQuestions] = useState(settings.shuffleQuestions);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save language to backend (only backend-supported preference)
      const token = getAccessToken();
      await updateUserProfile({ preferred_language: language }, token);

      // Save all preferences locally via Zustand + switch i18n language
      settings.setLanguage(language);
      i18n.changeLanguage(language);
      settings.setStreakReminders(streakReminders);
      settings.setTestReminders(testReminders);
      settings.setContributionUpdates(contributionUpdates);
      settings.setLeaderboardUpdates(leaderboardUpdates);
      settings.setNotificationFrequency(notificationFrequency);
      settings.setAutoAdvance(autoAdvance);
      settings.setShowExplanations(showExplanations);
      settings.setShuffleQuestions(shuffleQuestions);

      Alert.alert(t('common.success'), t('preferences.savedSuccess'), [
        { text: t('common.ok'), onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('preferences.saveFailed'));
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleItem = ({
    icon,
    title,
    subtitle,
    value,
    onToggle
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    value: boolean;
    onToggle: (value: boolean) => void;
  }) => (
    <View style={styles.toggleItem}>
      <View style={[styles.toggleIcon, { backgroundColor: Colors.primary + '15' }]}>
        <MaterialCommunityIcons name={icon as any} size={20} color={Colors.primary} />
      </View>
      <View style={styles.toggleTextContainer}>
        <Text style={[styles.toggleTitle, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle && <Text style={[styles.toggleSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch value={value} onValueChange={onToggle} color={Colors.primary} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('preferences.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Language Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('preferences.language')}</Text>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <RadioButton.Group onValueChange={(value) => setLanguage(value as Language)} value={language}>
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() => setLanguage('EN')}
                activeOpacity={0.7}
              >
                <View style={styles.radioContent}>
                  <Text style={styles.languageFlag}>🇬🇧</Text>
                  <View>
                    <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>{t('preferences.english')}</Text>
                    <Text style={[styles.radioSubtitle, { color: colors.textSecondary }]}>{t('preferences.englishSubtitle')}</Text>
                  </View>
                </View>
                <RadioButton value="EN" color={Colors.primary} />
              </TouchableOpacity>
              <Divider style={styles.divider} />
              <TouchableOpacity
                style={styles.radioItem}
                onPress={() => setLanguage('NP')}
                activeOpacity={0.7}
              >
                <View style={styles.radioContent}>
                  <Text style={styles.languageFlag}>🇳🇵</Text>
                  <View>
                    <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>{t('preferences.nepali')}</Text>
                    <Text style={[styles.radioSubtitle, { color: colors.textSecondary }]}>{t('preferences.nepaliSubtitle')}</Text>
                  </View>
                </View>
                <RadioButton value="NP" color={Colors.primary} />
              </TouchableOpacity>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Notification Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('preferences.notifications')}</Text>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <ToggleItem
              icon="fire"
              title={t('preferences.streakReminders')}
              subtitle={t('preferences.streakRemindersSubtitle')}
              value={streakReminders}
              onToggle={setStreakReminders}
            />
            <Divider style={styles.toggleDivider} />
            <ToggleItem
              icon="clipboard-text-clock"
              title={t('preferences.testReminders')}
              subtitle={t('preferences.testRemindersSubtitle')}
              value={testReminders}
              onToggle={setTestReminders}
            />
            <Divider style={styles.toggleDivider} />
            <ToggleItem
              icon="check-decagram"
              title={t('preferences.contributionUpdates')}
              subtitle={t('preferences.contributionUpdatesSubtitle')}
              value={contributionUpdates}
              onToggle={setContributionUpdates}
            />
            <Divider style={styles.toggleDivider} />
            <ToggleItem
              icon="trophy"
              title={t('preferences.leaderboardUpdates')}
              subtitle={t('preferences.leaderboardUpdatesSubtitle')}
              value={leaderboardUpdates}
              onToggle={setLeaderboardUpdates}
            />
          </Card.Content>
        </Card>

        {/* Notification Frequency */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('preferences.notificationFrequency')}</Text>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <RadioButton.Group
              onValueChange={(value) => setNotificationFrequency(value as NotificationFrequency)}
              value={notificationFrequency}
            >
              {[
                { value: 'all', label: t('preferences.allNotifications'), subtitle: t('preferences.allNotificationsSubtitle') },
                { value: 'important', label: t('preferences.importantOnly'), subtitle: t('preferences.importantOnlySubtitle') },
                { value: 'none', label: t('preferences.none'), subtitle: t('preferences.noneSubtitle') },
              ].map((option, index) => (
                <React.Fragment key={option.value}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.radioItem}
                    onPress={() => setNotificationFrequency(option.value as NotificationFrequency)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioTextContainer}>
                      <Text style={[styles.radioLabel, { color: colors.textPrimary }]}>{option.label}</Text>
                      <Text style={[styles.radioSubtitle, { color: colors.textSecondary }]}>{option.subtitle}</Text>
                    </View>
                    <RadioButton value={option.value} color={Colors.primary} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Study Preferences */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('preferences.studyPreferences')}</Text>
        <Card style={[styles.card, { backgroundColor: colors.surface }]}>
          <Card.Content>
            <ToggleItem
              icon="arrow-right-circle"
              title={t('preferences.autoAdvance')}
              subtitle={t('preferences.autoAdvanceSubtitle')}
              value={autoAdvance}
              onToggle={setAutoAdvance}
            />
            <Divider style={styles.toggleDivider} />
            <ToggleItem
              icon="information"
              title={t('preferences.showExplanations')}
              subtitle={t('preferences.showExplanationsSubtitle')}
              value={showExplanations}
              onToggle={setShowExplanations}
            />
            <Divider style={styles.toggleDivider} />
            <ToggleItem
              icon="shuffle-variant"
              title={t('preferences.shuffleQuestions')}
              subtitle={t('preferences.shuffleQuestionsSubtitle')}
              value={shuffleQuestions}
              onToggle={setShuffleQuestions}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Save Button */}
      <View style={[styles.bottomAction, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Button
          mode="contained"
          icon="content-save"
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}
          labelStyle={styles.saveButtonLabel}
          onPress={handleSave}
          loading={isSaving}
          disabled={isSaving}
        >
          {t('preferences.savePreferences')}
        </Button>
      </View>
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
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    marginLeft: Spacing.xs,
  },
  card: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  radioContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  radioTextContainer: { flex: 1 },
  languageFlag: { fontSize: 28, marginRight: Spacing.md },
  radioLabel: { fontSize: 15, fontWeight: '600' },
  radioSubtitle: { fontSize: 12 },
  divider: { marginVertical: 0 },
  toggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  toggleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  toggleTextContainer: { flex: 1 },
  toggleTitle: { fontSize: 15, fontWeight: '500' },
  toggleSubtitle: { fontSize: 12 },
  toggleDivider: { marginLeft: 52, marginVertical: Spacing.xs },
  bottomAction: {
    padding: Spacing.base,
    borderTopWidth: 1,
  },
  saveButton: { borderRadius: BorderRadius.lg },
  saveButtonContent: { paddingVertical: Spacing.sm },
  saveButtonLabel: { fontSize: 16, fontWeight: '700' },
});
