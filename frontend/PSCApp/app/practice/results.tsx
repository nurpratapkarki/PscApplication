import React from 'react';
import { View, StyleSheet, ScrollView, Share } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Button, Card, Text, ProgressBar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const PracticeResultsScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const score = params.score ? parseInt(params.score as string, 10) : 0;
  const total = params.total ? parseInt(params.total as string, 10) : 0;
  const percentage = total > 0 ? score / total : 0;
  const percentageDisplay = Math.round(percentage * 100);

  const getResultMessage = () => {
    if (percentage >= 0.9) return { title: 'Excellent!', subtitle: 'उत्कृष्ट!', icon: 'trophy', color: Colors.success };
    if (percentage >= 0.7) return { title: 'Good Job!', subtitle: 'राम्रो!', icon: 'thumb-up', color: Colors.primary };
    if (percentage >= 0.5) return { title: 'Keep Practicing', subtitle: 'अभ्यास जारी राख्नुहोस्', icon: 'book-open-variant', color: Colors.warning };
    return { title: 'Need Improvement', subtitle: 'सुधार आवश्यक छ', icon: 'school', color: Colors.error };
  };

  const result = getResultMessage();

  const handleShare = async () => {
    try {
      await Share.share({
        message: `I scored ${score}/${total} (${percentageDisplay}%) on PSC Exam Prep! 📚`,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Results', headerBackVisible: false }} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Result Header */}
        <View style={[styles.resultHeader, { backgroundColor: result.color }]}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={result.icon as any} size={60} color={Colors.white} />
          </View>
          <Text style={styles.resultTitle}>{result.title}</Text>
          <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
        </View>

        {/* Score Card */}
        <Card style={styles.scoreCard}>
          <Card.Content>
            <View style={styles.scoreCircle}>
              <Text style={styles.scorePercentage}>{percentageDisplay}%</Text>
              <Text style={styles.scoreLabel}>Score</Text>
            </View>
            <ProgressBar progress={percentage} color={result.color} style={styles.progressBar} />
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="check-circle" size={24} color={Colors.success} />
                <Text style={styles.statValue}>{score}</Text>
                <Text style={styles.statLabel}>Correct</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="close-circle" size={24} color={Colors.error} />
                <Text style={styles.statValue}>{total - score}</Text>
                <Text style={styles.statLabel}>Incorrect</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <MaterialCommunityIcons name="help-circle" size={24} color={Colors.textSecondary} />
                <Text style={styles.statValue}>{total}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button mode="contained" icon="repeat" onPress={() => router.back()} style={styles.primaryButton} contentStyle={styles.buttonContent}>
            Practice Again
          </Button>
          <View style={styles.secondaryActions}>
            <Button mode="outlined" icon="share-variant" onPress={handleShare} style={styles.secondaryButton}>
              Share
            </Button>
            <Button mode="outlined" icon="home" onPress={() => router.replace('/(tabs)')} style={styles.secondaryButton}>
              Home
            </Button>
          </View>
        </View>

        {/* Tips Card */}
        <Card style={styles.tipsCard}>
          <Card.Content>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons name="lightbulb-on" size={24} color={Colors.warning} />
              <Text style={styles.tipsTitle}>Tips for Improvement</Text>
            </View>
            <Text style={styles.tipText}>• Review incorrect answers and understand the explanations</Text>
            <Text style={styles.tipText}>• Practice regularly with different categories</Text>
            <Text style={styles.tipText}>• Focus on your weak areas identified in analytics</Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PracticeResultsScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollContent: { paddingBottom: Spacing['2xl'] },
  resultHeader: { alignItems: 'center', paddingVertical: Spacing['3xl'], paddingHorizontal: Spacing.xl, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.base },
  resultTitle: { fontSize: 28, fontWeight: '700', color: Colors.white },
  resultSubtitle: { fontSize: 18, color: 'rgba(255,255,255,0.9)', marginTop: Spacing.xs },
  scoreCard: { marginHorizontal: Spacing.base, marginTop: -40, backgroundColor: Colors.white, borderRadius: BorderRadius.xl, elevation: 4 },
  scoreCircle: { alignItems: 'center', marginBottom: Spacing.lg },
  scorePercentage: { fontSize: 48, fontWeight: '700', color: Colors.textPrimary },
  scoreLabel: { fontSize: 14, color: Colors.textSecondary },
  progressBar: { height: 8, borderRadius: 4, marginBottom: Spacing.xl },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.xs },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  statDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  actionsContainer: { padding: Spacing.base, marginTop: Spacing.lg },
  primaryButton: { borderRadius: BorderRadius.lg, marginBottom: Spacing.md },
  buttonContent: { paddingVertical: Spacing.sm },
  secondaryActions: { flexDirection: 'row', gap: Spacing.md },
  secondaryButton: { flex: 1, borderRadius: BorderRadius.lg },
  tipsCard: { marginHorizontal: Spacing.base, marginTop: Spacing.lg, backgroundColor: Colors.warningLight, borderRadius: BorderRadius.lg },
  tipsHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  tipsTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginLeft: Spacing.sm },
  tipText: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 20 },
});

