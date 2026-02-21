import React, { useState } from 'react';
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

export default function SignUpScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const { register, isLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = (): string | null => {
    if (!email.trim()) return t('auth.emailRequired');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return t('auth.invalidEmail');
    if (!password) return t('auth.passwordRequired');
    if (password.length < 8) return t('auth.passwordMinLength');
    if (password !== confirmPassword) return t('auth.passwordsMismatch');
    return null;
  };

  const handleSignUp = async () => {
    const err = validate();
    if (err) return setError(err);
    setError(null);
    try {
      await register({
        email: email.trim(),
        password1: password,
        password2: confirmPassword,
        full_name: fullName.trim() || undefined,
      });
      router.replace('/(auth)/profile-setup');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.registrationFailed'));
    }
  };

  // Password strength
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 10 ? 2
    : 3;
  const strengthColor = ['transparent', colors.error, colors.warning, colors.success][strength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Strong'][strength];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.primary }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ── */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={20} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={styles.headerIcon}>
                <MaterialCommunityIcons name="account-plus" size={32} color={colors.primary} />
              </View>
              <Text style={styles.headerTitle}>{t('auth.createAccount')}</Text>
              <Text style={styles.headerSubtitle}>{t('auth.joinPSC')}</Text>
            </View>
          </View>

          {/* ── Form card ── */}
          <View style={[styles.card, { backgroundColor: colors.surface }]}>

            {/* Error */}
            {error && (
              <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            )}

            <TextInput
              label={`${t('auth.fullNameOptional')} (optional)`}
              value={fullName}
              onChangeText={setFullName}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              left={<TextInput.Icon icon="account-outline" />}
              autoCapitalize="words"
            />

            <TextInput
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              left={<TextInput.Icon icon="email-outline" />}
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
              outlineColor={colors.border}
              activeOutlineColor={colors.primary}
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />

            {/* Password strength */}
            {password.length > 0 && (
              <View style={styles.strengthRow}>
                <View style={styles.strengthBars}>
                  {[1, 2, 3].map(i => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        { backgroundColor: i <= strength ? strengthColor : colors.border },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.strengthLabel, { color: strengthColor }]}>
                  {strengthLabel}
                </Text>
              </View>
            )}

            <TextInput
              label={t('auth.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              mode="outlined"
              style={[styles.input, { backgroundColor: colors.surface }]}
              outlineColor={confirmPassword && confirmPassword !== password ? colors.error : colors.border}
              activeOutlineColor={colors.primary}
              secureTextEntry={!showPassword}
              left={<TextInput.Icon icon="lock-check-outline" />}
            />

            {/* Match indicator */}
            {confirmPassword.length > 0 && (
              <View style={styles.matchRow}>
                <MaterialCommunityIcons
                  name={confirmPassword === password ? 'check-circle' : 'close-circle'}
                  size={14}
                  color={confirmPassword === password ? colors.success : colors.error}
                />
                <Text style={[
                  styles.matchText,
                  { color: confirmPassword === password ? colors.success : colors.error },
                ]}>
                  {confirmPassword === password ? 'Passwords match' : 'Passwords do not match'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.signupBtn,
                { backgroundColor: isLoading ? colors.primary + '80' : colors.primary },
              ]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading
                ? <MaterialCommunityIcons name="loading" size={20} color="#fff" />
                : <MaterialCommunityIcons name="account-plus" size={18} color="#fff" />
              }
              <Text style={styles.signupBtnText}>{t('auth.createAccount')}</Text>
            </TouchableOpacity>

            {/* Terms note */}
            <Text style={[styles.termsNote, { color: colors.textTertiary }]}>
              {t('auth.termsAgreement')}
            </Text>
          </View>

          {/* ── Login link ── */}
          <View style={styles.loginRow}>
            <Text style={styles.loginPrompt}>{t('auth.haveAccount')} </Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },

  header: { paddingTop: 16, paddingBottom: 28 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  headerCenter: { alignItems: 'center' },
  headerIcon: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    elevation: 4, shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#fff', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 4 },

  card: {
    borderRadius: 24, padding: 24,
    elevation: 8, shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 16,
  },

  errorBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    padding: 12, borderRadius: 10, marginBottom: 14,
  },
  errorText: { flex: 1, fontSize: 13, lineHeight: 19 },

  input: { marginBottom: 12 },

  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: -6, marginBottom: 12 },
  strengthBars: { flexDirection: 'row', gap: 4, flex: 1 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700' },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: -6, marginBottom: 12 },
  matchText: { fontSize: 12, fontWeight: '500' },

  signupBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 15, borderRadius: 14, marginTop: 4,
  },
  signupBtnText: { fontSize: 15, fontWeight: '800', color: '#fff' },

  termsNote: { fontSize: 11, textAlign: 'center', lineHeight: 17, marginTop: 14 },

  loginRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    marginTop: 24,
  },
  loginPrompt: { fontSize: 14, color: 'rgba(255,255,255,0.75)' },
  loginLink: { fontSize: 14, fontWeight: '800', color: '#fff', textDecorationLine: 'underline' },
});