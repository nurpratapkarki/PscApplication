import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

const googleOAuthConfig = Constants.expoConfig?.extra?.googleOAuth;

export default function LoginScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { login, googleLogin, isLoading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleOAuthConfig?.expoClientId,
    iosClientId: googleOAuthConfig?.iosClientId,
    androidClientId: googleOAuthConfig?.androidClientId,
    webClientId: googleOAuthConfig?.webClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { authentication } = response;
      if (authentication?.accessToken) {
        (async () => {
          try {
            await googleLogin({ access_token: authentication.accessToken });
            router.replace('/(tabs)');
          } catch {
            setError(t('auth.googleSignInFailed'));
          }
        })();
      }
    } else if (response?.type === 'error') {
      setError(t('auth.googleSignInCancelled'));
    }
  }, [response, googleLogin, router, t]);

  const handleGoogleLogin = async () => {
    setError(null);
    if (!request) {
      setError(t('auth.googleNotConfigured'));
      return;
    }
    await promptAsync();
  };

  const handleEmailLogin = async () => {
    const loginEmail = email.trim();
    const loginPassword = password.trim();

    if (!loginEmail || !loginPassword) {
      setError(t('auth.enterBothFields'));
      return;
    }

    setError(null);
    try {
      await login({ email: loginEmail, password: loginPassword });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    }
  };

  

  const displayError = error || authError;

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
          {/* Logo & Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <MaterialCommunityIcons name="school" size={60} color={Colors.white} />
            </View>
            <Text style={styles.appName}>PSC Exam Prep</Text>
            <Text style={styles.tagline}>{'\u0928\u0947\u092A\u093E\u0932 \u0932\u094B\u0915 \u0938\u0947\u0935\u093E \u0906\u092F\u094B\u0917 \u092A\u0930\u0940\u0915\u094D\u0937\u093E \u0924\u092F\u093E\u0930\u0940'}</Text>
          </View>

          {/* Login Card */}
          <View style={[styles.loginCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.welcomeText, { color: colors.textPrimary }]}>{t('auth.welcomeBack')}</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>{t('auth.signInContinue')}</Text>

            {displayError && (
              <View style={[styles.errorContainer, { backgroundColor: colors.errorLight }]}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{displayError}</Text>
              </View>
            )}

            {/* Email/Password Login Form */}
            <View style={styles.emailLoginForm}>
              <TextInput
                label={t('auth.emailOrUsername')}
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.input, { backgroundColor: colors.surface }]}
                left={<TextInput.Icon icon="email" />}
              />
              <TextInput
                label={t('auth.password')}
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={[styles.input, { backgroundColor: colors.surface }]}
                left={<TextInput.Icon icon="lock" />}
              />
              <Button
                mode="contained"
                onPress={handleEmailLogin}
                loading={isLoading}
                disabled={isLoading}
                style={styles.loginButton}
                contentStyle={styles.buttonContent}
              >
                {t('auth.signIn')}
              </Button>
            </View>

            <View style={styles.dividerContainer}>
              <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textTertiary }]}>{t('auth.or')}</Text>
              <Divider style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>

            {/* Google Sign In Button */}
            <Button
              mode="outlined"
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={[styles.googleButton, { borderColor: colors.border }]}
              contentStyle={styles.buttonContent}
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="google" size={size} color={color} />
              )}
            >
              {t('auth.continueWithGoogle')}
            </Button>

            
            
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>{t('auth.noAccount')} </Text>
            <Button
              mode="text"
              onPress={() => router.push('/(auth)/signup')}
              textColor={Colors.white}
              compact
            >
              {t('auth.signUp')}
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {t('auth.termsAgreement')}
            </Text>
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
    paddingBottom: Spacing['2xl'],
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.base,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loginCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
  errorText: {
    marginLeft: Spacing.sm,
    flex: 1,
  },
  emailLoginForm: {
    marginBottom: Spacing.base,
  },
  googleButton: {
    borderRadius: BorderRadius.lg,
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.xl,
  },
  divider: {
    flex: 1,
  },
  dividerText: {
    marginHorizontal: Spacing.base,
  },
  devButton: {
    marginTop: Spacing.base,
  },
  input: {
    marginBottom: Spacing.md,
  },
  loginButton: {
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
  },
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xl,
  },
  signUpText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  footer: {
    paddingVertical: Spacing['2xl'],
  },
  footerText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
  },
});
