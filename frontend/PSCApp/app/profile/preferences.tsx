import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, Switch, RadioButton, Divider, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';
import { updateUserProfile } from '../../services/api/profile';
import { getAccessToken } from '../../services/api/client';
import { useSettingsStore } from '../../store/settingsStore';

type Language = 'EN' | 'NP';
type NotificationFrequency = 'all' | 'important' | 'none';

export default function ProfilePreferencesScreen() {
  const router = useRouter();
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

      // Save all preferences locally via Zustand
      settings.setLanguage(language);
      settings.setStreakReminders(streakReminders);
      settings.setTestReminders(testReminders);
      settings.setContributionUpdates(contributionUpdates);
      settings.setLeaderboardUpdates(leaderboardUpdates);
      settings.setNotificationFrequency(notificationFrequency);
      settings.setAutoAdvance(autoAdvance);
      settings.setShowExplanations(showExplanations);
      settings.setShuffleQuestions(shuffleQuestions);

      Alert.alert('Success', 'Preferences saved successfully!', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save preferences. Please try again.');
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
        <Text style={styles.toggleTitle}>{title}</Text>
        {subtitle && <Text style={styles.toggleSubtitle}>{subtitle}</Text>}
      </View>
      <Switch value={value} onValueChange={onToggle} color={Colors.primary} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Language Section */}
        <Text style={styles.sectionTitle}>Language / भाषा</Text>
        <Card style={styles.card}>
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
                    <Text style={styles.radioLabel}>English</Text>
                    <Text style={styles.radioSubtitle}>App interface in English</Text>
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
                    <Text style={styles.radioLabel}>नेपाली</Text>
                    <Text style={styles.radioSubtitle}>App interface in Nepali</Text>
                  </View>
                </View>
                <RadioButton value="NP" color={Colors.primary} />
              </TouchableOpacity>
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Notification Preferences */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <Card style={styles.card}>
          <Card.Content>
            <ToggleItem
              icon="fire"
              title="Streak Reminders"
              subtitle="Daily reminder to maintain your streak"
              value={streakReminders}
              onToggle={setStreakReminders}
            />
            <Divider style={styles.toggleDivider} />
            <ToggleItem
              icon="clipboard-text-clock"
              title="Test Reminders"
              subtitle="Reminders for scheduled mock tests"
              value={testReminders}
              onToggle={setTestReminders}
            />
            <Divider style={styles.toggleDivider} />
            <ToggleItem
              icon="check-decagram"
              title="Contribution Updates"
              subtitle="When your questions are reviewed"
              value={contributionUpdates}
              onToggle={setContributionUpdates}
            />
            <Divider style={styles.toggleDivider} />
            <ToggleItem
              icon="trophy"
              title="Leaderboard Updates"
              subtitle="Weekly rank changes"
              value={leaderboardUpdates}
              onToggle={setLeaderboardUpdates}
            />
          </Card.Content>
        </Card>

        {/* Notification Frequency */}
        <Text style={styles.sectionTitle}>Notification Frequency</Text>
        <Card style={styles.card}>
          <Card.Content>
            <RadioButton.Group 
              onValueChange={(value) => setNotificationFrequency(value as NotificationFrequency)} 
              value={notificationFrequency}
            >
              {[
                { value: 'all', label: 'All Notifications', subtitle: 'Receive all notifications' },
                { value: 'important', label: 'Important Only', subtitle: 'Only receive important updates' },
                { value: 'none', label: 'None', subtitle: 'Turn off all notifications' },
              ].map((option, index) => (
                <React.Fragment key={option.value}>
                  {index > 0 && <Divider style={styles.divider} />}
                  <TouchableOpacity 
                    style={styles.radioItem} 
                    onPress={() => setNotificationFrequency(option.value as NotificationFrequency)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.radioTextContainer}>
                      <Text style={styles.radioLabel}>{option.label}</Text>
                      <Text style={styles.radioSubtitle}>{option.subtitle}</Text>
                    </View>
                    <RadioButton value={option.value} color={Colors.primary} />
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </RadioButton.Group>
          </Card.Content>
        </Card>

        {/* Study Preferences */}
        <Text style={styles.sectionTitle}>Study Preferences</Text>
        <Card style={styles.card}>
          <Card.Content>
            <ToggleItem
              icon="arrow-right-circle"
              title="Auto-advance Questions"
              subtitle="Move to next question after answering"
              value={autoAdvance}
              onToggle={setAutoAdvance}
            />
            <Divider style={styles.toggleDivider} />
            <ToggleItem
              icon="information"
              title="Show Explanations"
              subtitle="Show explanations after answering"
              value={showExplanations}
              onToggle={setShowExplanations}
            />
            <Divider style={styles.toggleDivider} />
            <ToggleItem
              icon="shuffle-variant"
              title="Shuffle Questions"
              subtitle="Randomize question order in practice"
              value={shuffleQuestions}
              onToggle={setShuffleQuestions}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomAction}>
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
          Save Preferences
        </Button>
      </View>
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
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: Colors.white, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: '600', 
    color: Colors.textSecondary, 
    marginBottom: Spacing.sm, 
    marginTop: Spacing.md,
    marginLeft: Spacing.xs,
  },
  card: { 
    backgroundColor: Colors.white, 
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
  radioLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  radioSubtitle: { fontSize: 12, color: Colors.textSecondary },
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
  toggleTitle: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  toggleSubtitle: { fontSize: 12, color: Colors.textSecondary },
  toggleDivider: { marginLeft: 52, marginVertical: Spacing.xs },
  bottomAction: { 
    backgroundColor: Colors.white, 
    padding: Spacing.base, 
    borderTopWidth: 1, 
    borderTopColor: Colors.border,
  },
  saveButton: { borderRadius: BorderRadius.lg },
  saveButtonContent: { paddingVertical: Spacing.sm },
  saveButtonLabel: { fontSize: 16, fontWeight: '700' },
});
