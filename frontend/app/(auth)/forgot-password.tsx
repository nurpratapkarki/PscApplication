import React, { useState, useRef } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TextInput as RNTextInput } from 'react-native';
import { Text, Button, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';
import { forgotPassword, verifyOtp, resetPassword } from '../../services/api/auth';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();

  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const otpInputRef = useRef<RNTextInput>(null);

  const handleRequestOtp = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      setError(t('auth.emailRequired'));
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(trimmed);
      setEmail(trimmed);
      setStep('otp');
      setSuccessMsg(t('auth.forgotPasswordOtpSent'));
      setTimeout(() => otpInputRef.current?.focus(), 300);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.forgotPasswordFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const trimmedOtp = otp.trim();
    if (!trimmedOtp) {
      setError(t('auth.otpRequired'));
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      const res = await verifyOtp(email, trimmedOtp);
      setResetToken(res.reset_token);
      setStep('reset');
      setSuccessMsg(t('auth.otpVerified'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.otpInvalid'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!password1) {
      setError(t('auth.passwordRequired'));
      return;
    }
    if (password1.length < 8) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    if (password1 !== password2) {
      setError(t('auth.passwordsMismatch'));
      return;
    }
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    try {
      await resetPassword({
        email,
        reset_token: resetToken,
        new_password1: password1,
        new_password2: password2,
      });
      setSuccessMsg(t('auth.passwordResetSuccess'));
      setTimeout(() => router.replace('/(auth)/login'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.passwordResetFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getStepIcon = (): string => {
    switch (step) {
      case 'email': return 'email-outline';
      case 'otp': return 'shield-key-outline';
      case 'reset': return 'lock-reset';
    }
  };

  const getStepTitle = (): string => {
    switch (step) {
      case 'email': return t('auth.forgotPasswordTitle');
      case 'otp': return t('auth.enterOtpTitle');
      case 'reset': return t('auth.newPasswordTitle');
    }
  };

  const getStepSubtitle = (): string => {
    switch (step) {
      case 'email': return t('auth.forgotPasswordSubtitle');
      case 'otp': return t('auth.enterOtpSubtitle', { email });
      case 'reset': return t('auth.newPasswordSubtitle');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name={getStepIcon() as any} size={48} color={Colors.white} />
            </View>
            <Text style={styles.headerTitle}>{getStepTitle()}</Text>
            <Text style={styles.headerSubtitle}>{getStepSubtitle()}</Text>

            {/* Step indicators */}
            <View style={styles.stepRow}>
              {(['email', 'otp', 'reset'] as Step[]).map((s, i) => (
                <View
                  key={s}
                  style={[
                    styles.stepDot,
                    { backgroundColor: step === s || (['email', 'otp', 'reset'].indexOf(step) > i) ? Colors.white : 'rgba(255,255,255,0.3)' },
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Card */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {error && (
              <View style={[styles.msgContainer, { backgroundColor: colors.errorLight }]}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.msgText, { color: colors.error }]}>{error}</Text>
              </View>
            )}
            {successMsg && (
              <View style={[styles.msgContainer, { backgroundColor: Colors.successLight }]}>
                <MaterialCommunityIcons name="check-circle" size={20} color={Colors.success} />
                <Text style={[styles.msgText, { color: Colors.success }]}>{successMsg}</Text>
              </View>
            )}

            {step === 'email' && (
              <>
                <TextInput
                  label={t('auth.email')}
                  value={email}
                  onChangeText={setEmail}
                  mode="outlined"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoFocus
                  style={[styles.input, { backgroundColor: colors.surface }]}
                  left={<TextInput.Icon icon="email" />}
                  onSubmitEditing={handleRequestOtp}
                />
                <Button
                  mode="contained"
                  onPress={handleRequestOtp}
                  loading={loading}
                  disabled={loading}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                >
                  {t('auth.sendResetCode')}
                </Button>
              </>
            )}

            {step === 'otp' && (
              <>
                <TextInput
                  ref={otpInputRef}
                  label={t('auth.otpCode')}
                  value={otp}
                  onChangeText={setOtp}
                  mode="outlined"
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, { backgroundColor: colors.surface }]}
                  left={<TextInput.Icon icon="numeric" />}
                  onSubmitEditing={handleVerifyOtp}
                />
                <Button
                  mode="contained"
                  onPress={handleVerifyOtp}
                  loading={loading}
                  disabled={loading}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                >
                  {t('auth.verifyCode')}
                </Button>
                <Button
                  mode="text"
                  onPress={() => { setStep('email'); setOtp(''); setError(null); setSuccessMsg(null); }}
                  textColor={Colors.primary}
                  compact
                  style={styles.secondaryButton}
                >
                  {t('auth.resendCode')}
                </Button>
              </>
            )}

            {step === 'reset' && (
              <>
                <TextInput
                  label={t('auth.newPassword')}
                  value={password1}
                  onChangeText={setPassword1}
                  mode="outlined"
                  secureTextEntry
                  style={[styles.input, { backgroundColor: colors.surface }]}
                  left={<TextInput.Icon icon="lock" />}
                />
                <TextInput
                  label={t('auth.confirmNewPassword')}
                  value={password2}
                  onChangeText={setPassword2}
                  mode="outlined"
                  secureTextEntry
                  style={[styles.input, { backgroundColor: colors.surface }]}
                  left={<TextInput.Icon icon="lock-check" />}
                  onSubmitEditing={handleResetPassword}
                />
                <Button
                  mode="contained"
                  onPress={handleResetPassword}
                  loading={loading}
                  disabled={loading}
                  style={styles.actionButton}
                  contentStyle={styles.buttonContent}
                >
                  {t('auth.resetPassword')}
                </Button>
              </>
            )}
          </View>

          {/* Back to Login */}
          <View style={styles.backContainer}>
            <Button
              mode="text"
              onPress={() => router.back()}
              textColor={Colors.white}
              icon="arrow-left"
            >
              {t('auth.backToLogin')}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
    paddingBottom: Spacing.xl,
  },
  iconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: Spacing.base,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: Spacing.base,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  msgContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
  msgText: {
    marginLeft: Spacing.sm,
    flex: 1,
    fontSize: 13,
  },
  input: {
    marginBottom: Spacing.md,
  },
  actionButton: {
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
  secondaryButton: {
    marginTop: Spacing.sm,
  },
  backContainer: {
    alignItems: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
});
