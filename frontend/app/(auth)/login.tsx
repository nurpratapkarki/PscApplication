import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, ScrollView,
  KeyboardAvoidingView, Platform, TouchableOpacity,
} from 'react-native';
import { Text, TextInput } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
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
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: googleOAuthConfig?.expoClientId,
    iosClientId: googleOAuthConfig?.iosClientId,
    androidClientId: googleOAuthConfig?.androidClientId,
    webClientId: googleOAuthConfig?.webClientId,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const token = response.authentication?.accessToken;
      if (token) {
        (async () => {
          try {
            await googleLogin({ access_token: token });
            router.replace('/(tabs)');
          } catch { setError(t('auth.googleSignInFailed')); }
        })();
      }
    } else if (response?.type === 'error') {
      setError(t('auth.googleSignInCancelled'));
    }
  }, [response, googleLogin, router, t]);

  const handleEmailLogin = async () => {
    const trimEmail = email.trim();
    const trimPass = password.trim();
    if (!trimEmail || !trimPass) return setError(t('auth.enterBothFields'));
    setError(null);
    try {
      await login({ email: trimEmail, password: trimPass });
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : t('auth.loginFailed'));
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    if (!request) return setError(t('auth.googleNotConfigured'));
    await promptAsync();
  };

  const displayError = error || authError;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── Brand header ── */}
          <View style={styles.brandHeader}>
            <View style={styles.brandLogo}>
              <MaterialCommunityIcons name="school" size={40} color={colors.primary} />
            </View>
            <Text style={styles.brandName}>PSC Exam Prep</Text>
            <Text style={styles.brandTagline}>
              {'नेपाल लोक सेवा आयोग परीक्षा तयारी'}
            </Text>
          </View>

          {/* ── Login card ── */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>
              {t('auth.welcomeBack')}
            </Text>
            <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
              {t('auth.signInContinue')}
            </Text>

            {/* Error */}
            {displayError && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{displayError}</Text>
              </View>
            )}

            {/* Email */}
            <TextInput
              label={t('auth.emailOrUsername')}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.input, { backgroundColor: colors.surface }]}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              left={<TextInput.Icon icon="email-outline" />}
            />

            {/* Password */}
            <TextInput
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              mode="outlined"
              secureTextEntry={!showPassword}
              style={[styles.input, { backgroundColor: colors.surface }]}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            {/* Forgot password */}
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Text style={[styles.forgotText, { color: colors.primary }]}>
                {t('auth.forgotPassword')}
              </Text>
            </TouchableOpacity>

            {/* Login button */}
            <TouchableOpacity
              style={[
                styles.loginBtn,
                { backgroundColor: isLoading ? colors.primary + '80' : colors.primary },
              ]}
              onPress={handleEmailLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <MaterialCommunityIcons name="loading" size={20} color="#fff" />
              ) : (
                <MaterialCommunityIcons name="login" size={18} color="#fff" />
              )}
              <Text style={styles.loginBtnText}>{t('auth.signIn')}</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Text style={[styles.dividerText, { color: colors.textTertiary }]}>
                {t('auth.or')}
              </Text>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            {/* Google */}
            <TouchableOpacity
              style={[styles.googleBtn, { borderColor: colors.border, backgroundColor: colors.surfaceVariant }]}
              onPress={handleGoogleLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="google" size={18} color="#EA4335" />
              <Text style={[styles.googleBtnText, { color: colors.textPrimary }]}>
                {t('auth.continueWithGoogle')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── Sign up link ── */}
          <View style={styles.signupRow}>
            <Text style={styles.signupPrompt}>{t('auth.noAccount')} </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
              <Text style={styles.signupLink}>{t('auth.signUp')}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Footer ── */}
          <Text style={styles.footerText}>{t('auth.termsAgreement')}</Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 32 },

  // Brand
  brandHeader: { alignItems: 'center', paddingTop: 40, paddingBottom: 32 },
  brandLogo: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    elevation: 6, shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 10,
  },
  brandName: { fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  brandTagline: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  // Card
  card: {
    borderRadius: 24, padding: 24,
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16,
  },
  cardTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3, marginBottom: 4 },
  cardSubtitle: { fontSize: 13, marginBottom: 20 },

  // Error
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19 },

  // Inputs
  input: { marginBottom: 12 },

  // Forgot
  forgotBtn: { alignSelf: 'flex-end', marginBottom: 16, marginTop: -4 },
  forgotText: { fontSize: 13, fontWeight: '600' },

  // Login button
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14,
  },
  loginBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontSize: 12, fontWeight: '500' },

  // Google
  googleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5,
  },
  googleBtnText: { fontSize: 14, fontWeight: '600' },

  // Signup
  signupRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 24,
  },
  signupPrompt: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  signupLink: {
    fontSize: 14, fontWeight: '800', color: '#fff',
    textDecorationLine: 'underline',
  },

  // Footer
  footerText: {
    fontSize: 11, color: 'rgba(255,255,255,0.55)',
    textAlign: 'center', lineHeight: 17, marginTop: 16,
  },
});