import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, Button, TextInput, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';
import { useAuth } from '../../hooks/useAuth';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// Hardcoded credentials for development/testing purposes
const DEV_CREDENTIALS = {
  username: 'admin',
  password: 'admin',
};

const googleOAuthConfig = Constants.expoConfig?.extra?.googleOAuth;

export default function LoginScreen() {
  const router = useRouter();
  const { regularLogin, googleLogin, devLogin, isLoading, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: googleOAuthConfig?.expoClientId,
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
            setError('Google sign-in failed. Please try again.');
          }
        })();
      }
    } else if (response?.type === 'error') {
      setError('Google sign-in was cancelled or failed.');
    }
  }, [response]);

  const handleGoogleLogin = async () => {
    setError(null);
    if (!request) {
      setError('Google login is not yet configured. Please use Email Login or Sign Up.');
      return;
    }
    await promptAsync();
  };

  const handleEmailLogin = async () => {
    const loginEmail = email.trim();
    const loginPassword = password.trim();

    if (!loginEmail || !loginPassword) {
      setError('Please enter both email and password.');
      return;
    }

    setError(null);
    try {
      await regularLogin(loginEmail, loginPassword);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
    }
  };

  const handleDevLogin = async () => {
    // Use hardcoded credentials for quick testing (dev mode only)
    setError(null);
    try {
      await devLogin(DEV_CREDENTIALS.username, DEV_CREDENTIALS.password);
      router.replace('/(tabs)');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Dev login failed.');
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
            <Text style={styles.tagline}>नेपाल लोक सेवा आयोग परीक्षा तयारी</Text>
          </View>

          {/* Login Card */}
          <View style={styles.loginCard}>
            <Text style={styles.welcomeText}>Welcome Back!</Text>
            <Text style={styles.subText}>Sign in to continue your preparation</Text>

            {displayError && (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={20} color={Colors.error} />
                <Text style={styles.errorText}>{displayError}</Text>
              </View>
            )}

            {/* Email/Password Login Form */}
            <View style={styles.emailLoginForm}>
              <TextInput
                label="Email or Username"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                style={styles.input}
                left={<TextInput.Icon icon="email" />}
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                mode="outlined"
                secureTextEntry
                style={styles.input}
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
                Sign In
              </Button>
            </View>

            <View style={styles.dividerContainer}>
              <Divider style={styles.divider} />
              <Text style={styles.dividerText}>or</Text>
              <Divider style={styles.divider} />
            </View>

            {/* Google Sign In Button */}
            <Button
              mode="outlined"
              onPress={handleGoogleLogin}
              disabled={isLoading}
              style={styles.googleButton}
              contentStyle={styles.buttonContent}
              icon={({ size, color }) => (
                <MaterialCommunityIcons name="google" size={size} color={color} />
              )}
            >
              Continue with Google
            </Button>

            {/* Dev Login Button (for quick testing) */}
            {__DEV__ && (
              <Button
                mode="text"
                onPress={handleDevLogin}
                disabled={isLoading}
                style={styles.devButton}
                textColor={Colors.textTertiary}
              >
                Quick Dev Login (admin/admin)
              </Button>
            )}
          </View>

          {/* Sign Up Link */}
          <View style={styles.signUpContainer}>
            <Text style={styles.signUpText}>Don&apos;t have an account? </Text>
            <Button
              mode="text"
              onPress={() => router.push('/(auth)/signup')}
              textColor={Colors.white}
              compact
            >
              Sign Up
            </Button>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By continuing, you agree to our{' '}
              <Text style={styles.linkText}>Terms of Service</Text> and{' '}
              <Text style={styles.linkText}>Privacy Policy</Text>
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
    backgroundColor: Colors.white,
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
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.errorLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.base,
  },
  errorText: {
    color: Colors.error,
    marginLeft: Spacing.sm,
    flex: 1,
  },
  emailLoginForm: {
    marginBottom: Spacing.base,
  },
  googleButton: {
    borderColor: Colors.border,
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
    backgroundColor: Colors.border,
  },
  dividerText: {
    marginHorizontal: Spacing.base,
    color: Colors.textTertiary,
  },
  devButton: {
    marginTop: Spacing.base,
  },
  input: {
    marginBottom: Spacing.md,
    backgroundColor: Colors.white,
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
  linkText: {
    color: Colors.white,
    textDecorationLine: 'underline',
  },
});
