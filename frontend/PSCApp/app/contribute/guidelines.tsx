import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

interface GuidelineItem {
  icon: string;
  title: string;
  description: string;
  color: string;
}

export default function ContributionGuidelinesScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);

  const dosItems: GuidelineItem[] = [
    { icon: 'check-circle', title: t('guidelines.doOriginal'), description: t('guidelines.doOriginalDesc'), color: colors.success },
    { icon: 'check-circle', title: t('guidelines.doBilingual'), description: t('guidelines.doBilingualDesc'), color: colors.success },
    { icon: 'check-circle', title: t('guidelines.doExplanation'), description: t('guidelines.doExplanationDesc'), color: colors.success },
    { icon: 'check-circle', title: t('guidelines.doAccurate'), description: t('guidelines.doAccurateDesc'), color: colors.success },
    { icon: 'check-circle', title: t('guidelines.doRelevant'), description: t('guidelines.doRelevantDesc'), color: colors.success },
  ];

  const dontsItems: GuidelineItem[] = [
    { icon: 'close-circle', title: t('guidelines.dontCopy'), description: t('guidelines.dontCopyDesc'), color: colors.error },
    { icon: 'close-circle', title: t('guidelines.dontAmbiguous'), description: t('guidelines.dontAmbiguousDesc'), color: colors.error },
    { icon: 'close-circle', title: t('guidelines.dontDuplicate'), description: t('guidelines.dontDuplicateDesc'), color: colors.error },
    { icon: 'close-circle', title: t('guidelines.dontIncomplete'), description: t('guidelines.dontIncompleteDesc'), color: colors.error },
  ];

  const formatSteps = [
    { step: '1', text: t('guidelines.step1') },
    { step: '2', text: t('guidelines.step2') },
    { step: '3', text: t('guidelines.step3') },
    { step: '4', text: t('guidelines.step4') },
    { step: '5', text: t('guidelines.step5') },
  ];

  const GuidelineRow = ({ item }: { item: GuidelineItem }) => (
    <View style={styles.guidelineRow}>
      <MaterialCommunityIcons name={item.icon as any} size={20} color={item.color} style={styles.guidelineIcon} />
      <View style={styles.guidelineTextContainer}>
        <Text style={styles.guidelineTitle}>{item.title}</Text>
        <Text style={styles.guidelineDesc}>{item.description}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <View>
            <Text style={styles.title}>{t('guidelines.title')}</Text>
            <Text style={styles.subtitle}>{t('guidelines.subtitle')}</Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        {/* Intro Card */}
        <Card style={styles.introCard}>
          <Card.Content style={styles.introContent}>
            <MaterialCommunityIcons name="book-open-page-variant" size={40} color={colors.primary} />
            <Text style={styles.introTitle}>{t('guidelines.introTitle')}</Text>
            <Text style={styles.introText}>{t('guidelines.introText')}</Text>
          </Card.Content>
        </Card>

        {/* Do's */}
        <Text style={styles.sectionTitle}>{t('guidelines.dosTitle')}</Text>
        <Card style={styles.card}>
          {dosItems.map((item, index) => (
            <View key={index}>
              <GuidelineRow item={item} />
              {index < dosItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        {/* Don'ts */}
        <Text style={styles.sectionTitle}>{t('guidelines.dontsTitle')}</Text>
        <Card style={styles.card}>
          {dontsItems.map((item, index) => (
            <View key={index}>
              <GuidelineRow item={item} />
              {index < dontsItems.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </Card>

        {/* Format Steps */}
        <Text style={styles.sectionTitle}>{t('guidelines.formatTitle')}</Text>
        <Card style={styles.card}>
          <Card.Content>
            {formatSteps.map((item, index) => (
              <View key={index} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>{item.step}</Text>
                </View>
                <Text style={styles.stepText}>{item.text}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>

        {/* Review Process */}
        <Card style={styles.reviewCard}>
          <Card.Content>
            <View style={styles.reviewHeader}>
              <MaterialCommunityIcons name="shield-check" size={24} color={colors.info} />
              <Text style={styles.reviewTitle}>{t('guidelines.reviewTitle')}</Text>
            </View>
            <Text style={styles.reviewText}>{t('guidelines.reviewText')}</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing['3xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  title: { fontSize: 24, fontWeight: '700', color: colors.textPrimary },
  subtitle: { fontSize: 14, color: colors.primary },
  introCard: { backgroundColor: colors.primaryLight + '30', borderRadius: BorderRadius.xl, marginBottom: Spacing.xl },
  introContent: { alignItems: 'center', paddingVertical: Spacing.lg },
  introTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginTop: Spacing.md },
  introText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs, lineHeight: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginBottom: Spacing.md },
  card: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, overflow: 'hidden' },
  guidelineRow: { flexDirection: 'row', padding: Spacing.base, alignItems: 'flex-start' },
  guidelineIcon: { marginTop: 2 },
  guidelineTextContainer: { flex: 1, marginLeft: Spacing.md },
  guidelineTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  guidelineDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 2, lineHeight: 18 },
  divider: { height: 1, backgroundColor: colors.border, marginLeft: 52 },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.md },
  stepBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  stepNumber: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  stepText: { flex: 1, fontSize: 14, color: colors.textPrimary, lineHeight: 20, marginTop: 3 },
  reviewCard: { backgroundColor: colors.infoLight, borderRadius: BorderRadius.xl },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  reviewTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginLeft: Spacing.sm },
  reviewText: { fontSize: 14, color: colors.textSecondary, lineHeight: 20 },
});
