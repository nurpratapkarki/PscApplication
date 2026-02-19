import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const APP_VERSION = '1.0.0';

const FEATURES = [
  { icon: 'book-open-variant', key: 'about.featurePractice' },
  { icon: 'clipboard-text', key: 'about.featureMockTests' },
  { icon: 'translate', key: 'about.featureBilingual' },
  { icon: 'trophy', key: 'about.featureLeaderboard' },
  { icon: 'chart-line', key: 'about.featureAnalytics' },
  { icon: 'account-group', key: 'about.featureCommunity' },
] as const;

export default function AboutScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();

  const openLink = (url: string) => {
    Linking.openURL(url).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('about.title')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* App Logo & Info */}
        <View style={styles.appHeader}>
          <View style={[styles.logoContainer, { backgroundColor: Colors.primary }]}>
            <MaterialCommunityIcons name="school" size={48} color="#fff" />
          </View>
          <Text style={[styles.appName, { color: colors.textPrimary }]}>PSC Exam Prep</Text>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>
            {t('about.version')} {APP_VERSION}
          </Text>
          <View style={[styles.tagBadge, { backgroundColor: Colors.primary + '15' }]}>
            <Text style={[styles.tagText, { color: Colors.primary }]}>
              {t('about.madeInNepal')}
            </Text>
          </View>
        </View>

        {/* Description */}
        <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Card.Content>
            <Text style={[styles.descriptionText, { color: colors.textPrimary }]}>
              {t('about.appDescription')}
            </Text>
          </Card.Content>
        </Card>

        {/* Features */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('about.features')}
        </Text>
        <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          {FEATURES.map((feature, index) => (
            <View key={feature.key}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: Colors.primary + '15' }]}>
                  <MaterialCommunityIcons name={feature.icon as any} size={20} color={Colors.primary} />
                </View>
                <Text style={[styles.featureText, { color: colors.textPrimary }]}>
                  {t(feature.key)}
                </Text>
              </View>
              {index < FEATURES.length - 1 && (
                <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </Card>

        {/* Developer */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
          {t('about.developer')}
        </Text>
        <Card style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <Card.Content style={styles.devContent}>
            <View style={[styles.devAvatar, { backgroundColor: Colors.primary }]}>
              <Text style={styles.devInitials}>NK</Text>
            </View>
            <Text style={[styles.devName, { color: colors.textPrimary }]}>
              {t('about.developerName')}
            </Text>
            <Text style={[styles.devRole, { color: colors.textSecondary }]}>
              {t('about.developerRole')}
            </Text>

            <View style={styles.devLinks}>
              <TouchableOpacity
                style={[styles.devLinkBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => openLink('https://github.com/nurpratapkarki')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="github" size={20} color={colors.textPrimary} />
                <Text style={[styles.devLinkText, { color: colors.textPrimary }]}>GitHub</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.devLinkBtn, { backgroundColor: colors.surfaceVariant }]}
                onPress={() => openLink('mailto:nurpratapkarki@gmail.com')}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="email" size={20} color={colors.textPrimary} />
                <Text style={[styles.devLinkText, { color: colors.textPrimary }]}>Email</Text>
              </TouchableOpacity>
            </View>
          </Card.Content>
        </Card>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.copyright, { color: colors.textTertiary }]}>
            {t('about.copyright')}
          </Text>
        </View>
      </ScrollView>
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
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },

  // App header
  appHeader: { alignItems: 'center', paddingVertical: Spacing.xl },
  logoContainer: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  appName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  appVersion: { fontSize: 14, marginTop: Spacing.xs },
  tagBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  tagText: { fontSize: 12, fontWeight: '600' },

  // Cards
  card: { borderRadius: BorderRadius.xl, overflow: 'hidden', marginBottom: Spacing.sm },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
    marginLeft: Spacing.xs,
  },
  descriptionText: { fontSize: 14, lineHeight: 22 },

  // Features
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  featureText: { fontSize: 14, fontWeight: '500', flex: 1 },
  divider: { marginLeft: 64 },

  // Developer
  devContent: { alignItems: 'center', paddingVertical: Spacing.xl },
  devAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  devInitials: { fontSize: 28, fontWeight: '800', color: '#fff' },
  devName: { fontSize: 20, fontWeight: '700' },
  devRole: { fontSize: 14, marginTop: Spacing.xs },
  devLinks: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  devLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  devLinkText: { fontSize: 14, fontWeight: '600' },

  // Footer
  footer: { alignItems: 'center', marginTop: Spacing.xl, paddingBottom: Spacing.xl },
  copyright: { fontSize: 12 },
});
