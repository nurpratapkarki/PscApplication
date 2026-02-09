import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Text, Button, Card, RadioButton, ActivityIndicator, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';
import { useApi } from '../../hooks/useApi';
import { Branch, SubBranch } from '../../types/category.types';
import { updateUserProfile } from '../../services/api/profile';
import { getAccessToken } from '../../services/api/client';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const [step, setStep] = useState<'branch' | 'subbranch' | 'complete'>('branch');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedSubBranch, setSelectedSubBranch] = useState<SubBranch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: branches, status, error } = useApi<Branch[]>('/api/branches/');

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedSubBranch(null);
  };

  const handleNext = () => {
    if (step === 'branch' && selectedBranch) {
      if (selectedBranch.has_sub_branches && (selectedBranch.sub_branches?.length ?? 0) > 0) {
        setStep('subbranch');
      } else {
        setStep('complete');
      }
    } else if (step === 'subbranch') {
      setStep('complete');
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      const token = getAccessToken();
      await updateUserProfile(
        {
          target_branch: selectedBranch!.id,
          target_sub_branch: selectedSubBranch?.id ?? null,
        },
        token
      );
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderBranchSelection = () => (
    <View style={styles.selectionContainer}>
      <Text style={styles.stepTitle}>Select Your Target Branch</Text>
      <Text style={styles.stepSubtitle}>
        कृपया आफ्नो लक्षित शाखा छान्नुहोस्
      </Text>

      {status === 'loading' && (
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      )}

      {status === 'error' && (
        <Text style={styles.errorText}>Failed to load branches: {error}</Text>
      )}

      {branches && (
        <View style={styles.cardsContainer}>
          {branches.map((branch) => (
            <TouchableOpacity
              key={branch.id}
              onPress={() => handleBranchSelect(branch)}
              activeOpacity={0.7}
            >
              <Card
                style={[
                  styles.branchCard,
                  selectedBranch?.id === branch.id && styles.selectedCard,
                ]}
              >
                <Card.Content style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View
                      style={[
                        styles.iconCircle,
                        selectedBranch?.id === branch.id && styles.selectedIconCircle,
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={getBranchIcon(branch.slug)}
                        size={28}
                        color={selectedBranch?.id === branch.id ? Colors.white : Colors.primary}
                      />
                    </View>
                    <RadioButton
                      value={String(branch.id)}
                      status={selectedBranch?.id === branch.id ? 'checked' : 'unchecked'}
                      onPress={() => handleBranchSelect(branch)}
                      color={Colors.primary}
                    />
                  </View>
                  <Text style={styles.branchName}>{branch.name_en}</Text>
                  <Text style={styles.branchNameNp}>{branch.name_np}</Text>
                  {branch.description_en && (
                    <Text style={styles.branchDesc} numberOfLines={2}>
                      {branch.description_en}
                    </Text>
                  )}
                  {branch.has_sub_branches && (
                    <Chip
                      compact
                      style={styles.subBranchChip}
                      textStyle={styles.subBranchChipText}
                    >
                      {branch.sub_branches?.length || 0} Sub-branches
                    </Chip>
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );

  const renderSubBranchSelection = () => (
    <View style={styles.selectionContainer}>
      <Text style={styles.stepTitle}>Select Your Specialization</Text>
      <Text style={styles.stepSubtitle}>
        Choose your specific area under {selectedBranch?.name_en}
      </Text>

      <View style={styles.cardsContainer}>
        {selectedBranch?.sub_branches?.map((subBranch) => (
          <TouchableOpacity
            key={subBranch.id}
            onPress={() => setSelectedSubBranch(subBranch)}
            activeOpacity={0.7}
          >
            <Card
              style={[
                styles.subBranchCard,
                selectedSubBranch?.id === subBranch.id && styles.selectedCard,
              ]}
            >
              <Card.Content style={styles.subCardContent}>
                <View style={styles.subCardLeft}>
                  <Text style={styles.subBranchName}>{subBranch.name_en}</Text>
                  <Text style={styles.subBranchNameNp}>{subBranch.name_np}</Text>
                </View>
                <RadioButton
                  value={String(subBranch.id)}
                  status={selectedSubBranch?.id === subBranch.id ? 'checked' : 'unchecked'}
                  onPress={() => setSelectedSubBranch(subBranch)}
                  color={Colors.primary}
                />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      <Button mode="text" onPress={() => setStep('branch')} style={styles.backButton}>
        ← Back to Branches
      </Button>
    </View>
  );

  const renderComplete = () => (
    <View style={styles.completeContainer}>
      <View style={styles.successIcon}>
        <MaterialCommunityIcons name="check-circle" size={80} color={Colors.success} />
      </View>
      <Text style={styles.completeTitle}>You&apos;re All Set!</Text>
      <Text style={styles.completeSubtitle}>तपाईंको प्रोफाइल तयार छ!</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Selected Branch:</Text>
        <Text style={styles.summaryValue}>{selectedBranch?.name_en}</Text>
        {selectedSubBranch && (
          <>
            <Text style={styles.summaryLabel}>Specialization:</Text>
            <Text style={styles.summaryValue}>{selectedSubBranch.name_en}</Text>
          </>
        )}
      </View>

      <Text style={styles.completeDesc}>
        You can change these preferences anytime from your profile settings.
      </Text>
    </View>
  );

  const getBranchIcon = (slug: string): keyof typeof MaterialCommunityIcons.glyphMap => {
    const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
      'nasu': 'account-tie',
      'kharidar': 'clipboard-account',
      'technical': 'cog',
      'engineering': 'hard-hat',
      'health': 'hospital-box',
      'education': 'school',
    };
    return icons[slug] || 'folder';
  };

  const canProceed = () => {
    if (step === 'branch') return !!selectedBranch;
    if (step === 'subbranch') return !!selectedSubBranch;
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, step !== 'complete' && styles.activeDot]} />
        <View style={styles.progressLine} />
        <View style={[styles.progressDot, step === 'subbranch' || step === 'complete' ? styles.activeDot : {}]} />
        <View style={styles.progressLine} />
        <View style={[styles.progressDot, step === 'complete' && styles.activeDot]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 'branch' && renderBranchSelection()}
        {step === 'subbranch' && renderSubBranchSelection()}
        {step === 'complete' && renderComplete()}
      </ScrollView>

      {/* Bottom Action Button */}
      <View style={styles.bottomAction}>
        <Button
          mode="contained"
          onPress={step === 'complete' ? handleComplete : handleNext}
          disabled={!canProceed() || isSubmitting}
          loading={isSubmitting}
          style={styles.actionButton}
          contentStyle={styles.actionButtonContent}
        >
          {step === 'complete' ? 'Start Learning' : 'Continue'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  progressContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing.lg, paddingHorizontal: Spacing['2xl'],
  },
  progressDot: {
    width: 12, height: 12, borderRadius: 6, backgroundColor: Colors.border,
  },
  activeDot: { backgroundColor: Colors.primary, width: 14, height: 14, borderRadius: 7 },
  progressLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: Spacing.sm },
  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  selectionContainer: { flex: 1 },
  stepTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  stepSubtitle: { fontSize: 14, color: Colors.textSecondary, marginBottom: Spacing.xl },
  loader: { marginTop: Spacing['2xl'] },
  errorText: { color: Colors.error, textAlign: 'center', marginTop: Spacing.xl },
  cardsContainer: { gap: Spacing.md },
  branchCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, borderWidth: 2, borderColor: 'transparent' },
  selectedCard: { borderColor: Colors.primary, backgroundColor: Colors.infoLight },
  cardContent: { padding: Spacing.base },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  iconCircle: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center' },
  selectedIconCircle: { backgroundColor: Colors.primary },
  branchName: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  branchNameNp: { fontSize: 14, color: Colors.primary, marginBottom: Spacing.xs },
  branchDesc: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.sm },
  subBranchChip: { alignSelf: 'flex-start', backgroundColor: Colors.accentLight },
  subBranchChipText: { fontSize: 11, color: Colors.accentDark },
  subBranchCard: { backgroundColor: Colors.white, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: 'transparent' },
  subCardContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subCardLeft: { flex: 1 },
  subBranchName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  subBranchNameNp: { fontSize: 13, color: Colors.textSecondary },
  backButton: { marginTop: Spacing.lg },
  completeContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing['2xl'] },
  successIcon: { marginBottom: Spacing.xl },
  completeTitle: { fontSize: 28, fontWeight: '700', color: Colors.textPrimary },
  completeSubtitle: { fontSize: 18, color: Colors.primary, marginBottom: Spacing.xl },
  summaryCard: { backgroundColor: Colors.white, padding: Spacing.xl, borderRadius: BorderRadius.lg, width: '100%', marginBottom: Spacing.xl },
  summaryLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: Spacing.xs },
  summaryValue: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  completeDesc: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  bottomAction: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.white, padding: Spacing.xl, borderTopWidth: 1, borderTopColor: Colors.border },
  actionButton: { borderRadius: BorderRadius.lg },
  actionButtonContent: { paddingVertical: Spacing.sm },
});
