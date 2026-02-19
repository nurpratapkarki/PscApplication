import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, HelperText } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { register, isLoading: authLoading, error: authError } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = (): string | null => {
    if (!email.trim()) return t('auth.emailRequired');
    if (!password) return t('auth.passwordRequired');
    if (password.length < 8) return t('auth.passwordMinLength');
    if (password !== confirmPassword) return t('auth.passwordsMismatch');
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return t('auth.invalidEmail');
    return null;
  };

  const handleSignUp = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      await register({
        email: email.trim(),
        password1: password,
        password2: confirmPassword,
        full_name: fullName.trim() || undefined,
      });

      // Registration successful + auto-logged in - go to profile setup or home
      router.replace('/(auth)/profile-setup');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : t('auth.registrationFailed');
      setError(errorMessage);
    } finally {
      setIsLoading(false);
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
        >
          {/* Header */}
          <View style={styles.header}>
            <MaterialCommunityIcons name="account-plus" size={64} color={Colors.white} />
            <Text style={styles.title}>{t('auth.createAccount')}</Text>
            <Text style={styles.subtitle}>{t('auth.joinPSC')}</Text>
          </View>

          {/* Form */}
          <View style={[styles.formContainer, { backgroundColor: colors.surface }]}>
            {error && (
              <HelperText type="error" visible={!!error} style={[styles.errorText, { backgroundColor: colors.errorLight }]}>
                {error}
              </HelperText>
            )}

            <TextInput
              label={t('auth.fullNameOptional')}
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              left={<TextInput.Icon icon="account" />}
              autoCapitalize="words"
            />

            <TextInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              left={<TextInput.Icon icon="email" />}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <TextInput
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            <TextInput
              label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-check" />}
            />

            <Button
              mode="contained"
              onPress={handleSignUp}
              loading={isLoading}
              disabled={isLoading}
              style={styles.signUpButton}
              contentStyle={styles.buttonContent}
            >
              {t('auth.createAccount')}
            </Button>
          </View>

          {/* Back to Login */}
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>{t('auth.haveAccount')} </Text>
            <Button
              mode="text"
              onPress={() => router.back()}
              textColor={Colors.white}
              compact
            >
              {t('auth.signIn')}
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
    paddingTop: Spacing['2xl'],
    paddingBottom: Spacing.xl,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginTop: Spacing.base,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: Spacing.xs,
  },
  formContainer: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    elevation: 4,
  },
  errorText: {
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    fontSize: 14,
  },
  input: {
    marginBottom: Spacing.md,
  },
  signUpButton: {
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
  loginContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
    paddingBottom: Spacing['2xl'],
  },
  loginText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});
