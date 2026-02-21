import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { Text, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { useApi } from '../../hooks/useApi';
import { Branch, SubBranch } from '../../types/category.types';
import { updateUserProfile } from '../../services/api/profile';
import { getAccessToken } from '../../services/api/client';

type Step = 'branch' | 'subbranch' | 'complete';

const getBranchIcon = (slug: string): keyof typeof MaterialCommunityIcons.glyphMap => {
  const icons: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
    'administrative-service': 'account-tie',
    'engineering-service': 'hard-hat',
    'health-service': 'hospital-box',
    'education-service': 'school',
    'judicial-service': 'gavel',
    'agriculture-service': 'sprout',
    'forest-service': 'tree',
    'audit-service': 'calculator',
    'foreign-affairs-service': 'earth',
    'miscellaneous-service': 'folder-multiple',
  };
  return icons[slug] || 'folder';
};

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const [step, setStep] = useState<Step>('branch');
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
      await updateUserProfile(
        { target_branch: selectedBranch!.id, target_sub_branch: selectedSubBranch?.id ?? null },
        getAccessToken()
      );
      router.replace('/(tabs)');
    } catch (err) {
      Alert.alert(t('common.error'), err instanceof Error ? err.message : t('auth.profileSetup.saveFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = step === 'branch' ? !!selectedBranch
    : step === 'subbranch' ? !!selectedSubBranch
    : true;

  // Step metadata
  const steps: { key: Step; label: string }[] = [
    { key: 'branch', label: 'Service' },
    { key: 'subbranch', label: 'Specialty' },
    { key: 'complete', label: 'Done' },
  ];
  const stepIndex = steps.findIndex(s => s.key === step);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>

      {/* ── Progress header ── */}
      <View style={[styles.progressHeader, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          Step {stepIndex + 1} of {steps.length}
        </Text>
        <View style={styles.progressTrack}>
          {steps.map((s, i) => (
            <React.Fragment key={s.key}>
              <View style={[
                styles.progressDot,
                {
                  backgroundColor: i <= stepIndex ? colors.primary : colors.border,
                  transform: [{ scale: i === stepIndex ? 1.2 : 1 }],
                },
              ]}>
                {i < stepIndex && (
                  <MaterialCommunityIcons name="check" size={10} color="#fff" />
                )}
              </View>
              {i < steps.length - 1 && (
                <View style={[
                  styles.progressLine,
                  { backgroundColor: i < stepIndex ? colors.primary : colors.border },
                ]} />
              )}
            </React.Fragment>
          ))}
        </View>
        <Text style={[styles.progressStepName, { color: colors.primary }]}>
          {steps[stepIndex].label}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* ── Branch selection ── */}
        {step === 'branch' && (
          <View>
            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              {t('auth.profileSetup.selectBranchTitle')}
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              {t('auth.profileSetup.selectBranchSubtitle')}
            </Text>

            {status === 'loading' && (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            )}
            {status === 'error' && (
              <Text style={[styles.errorText, { color: colors.error }]}>
                {t('auth.profileSetup.loadBranchesFailed', { error })}
              </Text>
            )}

            <View style={styles.branchGrid}>
              {branches?.map(branch => {
                const selected = selectedBranch?.id === branch.id;
                return (
                  <TouchableOpacity
                    key={branch.id}
                    style={[
                      styles.branchCard,
                      {
                        backgroundColor: selected ? colors.primary + '08' : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleBranchSelect(branch)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.branchIconWrap,
                      { backgroundColor: selected ? colors.primary : colors.surfaceVariant },
                    ]}>
                      <MaterialCommunityIcons
                        name={getBranchIcon(branch.slug)}
                        size={24}
                        color={selected ? '#fff' : colors.textSecondary}
                      />
                    </View>

                    <View style={styles.branchText}>
                      <Text style={[styles.branchName, { color: colors.textPrimary }]}>
                        {lf(branch.name_en, branch.name_np)}
                      </Text>
                      {branch.name_en !== branch.name_np && (
                        <Text style={[styles.branchNameNp, { color: colors.textSecondary }]}>
                          {branch.name_np}
                        </Text>
                      )}
                      {branch.description_en && (
                        <Text style={[styles.branchDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                          {lf(branch.description_en, branch.description_np)}
                        </Text>
                      )}
                      {branch.has_sub_branches && (
                        <View style={[styles.subBranchBadge, { backgroundColor: colors.accent + '15' }]}>
                          <Text style={[styles.subBranchBadgeText, { color: colors.accent }]}>
                            {branch.sub_branches?.length} specializations
                          </Text>
                        </View>
                      )}
                    </View>

                    {selected && (
                      <MaterialCommunityIcons name="check-circle" size={22} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Sub-branch selection ── */}
        {step === 'subbranch' && (
          <View>
            <TouchableOpacity
              style={styles.backLink}
              onPress={() => setStep('branch')}
            >
              <MaterialCommunityIcons name="arrow-left" size={16} color={colors.primary} />
              <Text style={[styles.backLinkText, { color: colors.primary }]}>
                {t('auth.profileSetup.backToBranches')}
              </Text>
            </TouchableOpacity>

            <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>
              {t('auth.profileSetup.selectSubBranchTitle')}
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              {t('auth.profileSetup.selectSubBranchSubtitle', {
                branch: lf(selectedBranch?.name_en || '', selectedBranch?.name_np || ''),
              })}
            </Text>

            {/* Skip option */}
            <TouchableOpacity
              style={[
                styles.subBranchRow,
                {
                  backgroundColor: selectedSubBranch === null ? colors.surfaceVariant : colors.surface,
                  borderColor: selectedSubBranch === null ? colors.primary : colors.border,
                },
              ]}
              onPress={() => { setSelectedSubBranch(null); }}
            >
              <View style={[styles.subBranchIcon, { backgroundColor: colors.surfaceVariant }]}>
                <MaterialCommunityIcons name="asterisk" size={16} color={colors.textSecondary} />
              </View>
              <View style={styles.subBranchText}>
                <Text style={[styles.subBranchName, { color: colors.textPrimary }]}>
                  All / General
                </Text>
                <Text style={[styles.subBranchNameNp, { color: colors.textSecondary }]}>
                  Skip specialization
                </Text>
              </View>
              {selectedSubBranch === null && (
                <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
              )}
            </TouchableOpacity>

            <View style={{ gap: 8, marginTop: 8 }}>
              {selectedBranch?.sub_branches?.map(sb => {
                const selected = selectedSubBranch?.id === sb.id;
                return (
                  <TouchableOpacity
                    key={sb.id}
                    style={[
                      styles.subBranchRow,
                      {
                        backgroundColor: selected ? colors.primary + '08' : colors.surface,
                        borderColor: selected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedSubBranch(sb)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.subBranchIcon,
                      { backgroundColor: selected ? colors.primary : colors.surfaceVariant },
                    ]}>
                      <MaterialCommunityIcons
                        name="star-four-points-small"
                        size={16}
                        color={selected ? '#fff' : colors.textSecondary}
                      />
                    </View>
                    <View style={styles.subBranchText}>
                      <Text style={[styles.subBranchName, { color: colors.textPrimary }]}>
                        {lf(sb.name_en, sb.name_np)}
                      </Text>
                      {sb.name_en !== sb.name_np && (
                        <Text style={[styles.subBranchNameNp, { color: colors.textSecondary }]}>
                          {sb.name_np}
                        </Text>
                      )}
                    </View>
                    {selected && (
                      <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Complete ── */}
        {step === 'complete' && (
          <View style={styles.completeWrap}>
            <View style={[styles.completeIcon, { backgroundColor: colors.success + '15' }]}>
              <MaterialCommunityIcons name="check-circle" size={64} color={colors.success} />
            </View>
            <Text style={[styles.completeTitle, { color: colors.textPrimary }]}>
              {t('auth.profileSetup.completeTitle')}
            </Text>
            <Text style={[styles.completeSubtitle, { color: colors.textSecondary }]}>
              {t('auth.profileSetup.completeSubtitle')}
            </Text>

            {/* Summary */}
            <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.summaryRow}>
                <MaterialCommunityIcons name="source-branch" size={16} color={colors.primary} />
                <View>
                  <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                    {t('auth.profileSetup.selectedBranch')}
                  </Text>
                  <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                    {lf(selectedBranch?.name_en || '', selectedBranch?.name_np || '')}
                  </Text>
                </View>
              </View>
              {selectedSubBranch && (
                <View style={[styles.summaryRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, marginTop: 10, paddingTop: 10 }]}>
                  <MaterialCommunityIcons name="star-four-points-small" size={16} color={colors.accent} />
                  <View>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      {t('auth.profileSetup.selectedSubBranch')}
                    </Text>
                    <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>
                      {lf(selectedSubBranch.name_en, selectedSubBranch.name_np)}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <Text style={[styles.completeDesc, { color: colors.textSecondary }]}>
              {t('auth.profileSetup.completeDesc')}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* ── Bottom CTA ── */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.ctaBtn,
            { backgroundColor: canProceed ? colors.primary : colors.border },
          ]}
          onPress={step === 'complete' ? handleComplete : handleNext}
          disabled={!canProceed || isSubmitting}
          activeOpacity={0.85}
        >
          {isSubmitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <MaterialCommunityIcons
                name={step === 'complete' ? 'rocket-launch' : 'arrow-right'}
                size={18}
                color="#fff"
              />
          }
          <Text style={styles.ctaBtnText}>
            {step === 'complete'
              ? t('auth.profileSetup.startLearning')
              : t('auth.profileSetup.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Progress header
  progressHeader: {
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  progressLabel: { fontSize: 11, fontWeight: '500' },
  progressTrack: { flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  progressLine: { flex: 1, height: 2, marginHorizontal: 4 },
  progressStepName: { fontSize: 12, fontWeight: '700' },

  scrollContent: { padding: 20, paddingBottom: 100 },

  stepTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  stepSubtitle: { fontSize: 13, lineHeight: 20, marginBottom: 20 },
  loaderWrap: { alignItems: 'center', paddingVertical: 40 },
  errorText: { textAlign: 'center', marginTop: 20, fontSize: 14 },

  // Branch cards
  branchGrid: { gap: 10 },
  branchCard: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, padding: 14, borderWidth: 1.5, gap: 12,
    elevation: 1, shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  branchIconWrap: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  branchText: { flex: 1 },
  branchName: { fontSize: 15, fontWeight: '700' },
  branchNameNp: { fontSize: 12, marginTop: 1 },
  branchDesc: { fontSize: 12, lineHeight: 17, marginTop: 3 },
  subBranchBadge: {
    alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 8, marginTop: 5,
  },
  subBranchBadgeText: { fontSize: 10, fontWeight: '700' },

  // Back link
  backLink: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 16 },
  backLinkText: { fontSize: 13, fontWeight: '600' },

  // Sub-branch rows
  subBranchRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 14, padding: 12, borderWidth: 1.5, gap: 10,
    marginBottom: 0,
  },
  subBranchIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  subBranchText: { flex: 1 },
  subBranchName: { fontSize: 14, fontWeight: '600' },
  subBranchNameNp: { fontSize: 12, marginTop: 1 },

  // Complete
  completeWrap: { alignItems: 'center', paddingVertical: 20 },
  completeIcon: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  completeTitle: { fontSize: 26, fontWeight: '800', letterSpacing: -0.3, marginBottom: 6 },
  completeSubtitle: { fontSize: 15, marginBottom: 24, textAlign: 'center' },
  summaryCard: {
    width: '100%', borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  summaryLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 },
  summaryValue: { fontSize: 16, fontWeight: '700' },
  completeDesc: { fontSize: 13, textAlign: 'center', lineHeight: 20 },

  // Bottom bar
  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: 16, borderTopWidth: StyleSheet.hairlineWidth,
  },
  ctaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  ctaBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },
});