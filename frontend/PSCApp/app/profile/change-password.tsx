import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text, TextInput, Button } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { changePassword } from '../../services/api/auth';
import { ApiError } from '../../services/api/client';
import { Spacing, BorderRadius } from '../../constants/typography';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword1, setNewPassword1] = useState('');
  const [newPassword2, setNewPassword2] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validate = (): string | null => {
    if (!oldPassword) return t('settings.currentPasswordRequired');
    if (!newPassword1) return t('settings.newPasswordRequired');
    if (newPassword1.length < 8) return t('settings.passwordMinLength');
    if (newPassword1 !== newPassword2) return t('settings.passwordsMismatch');
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setLoading(true);
    try {
      await changePassword({
        old_password: oldPassword,
        new_password1: newPassword1,
        new_password2: newPassword2,
      });
      Alert.alert(
        t('settings.passwordChanged'),
        t('settings.passwordChangedMsg'),
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : t('common.error');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: colors.surface }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{t('settings.changePassword')}</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
          <View style={[styles.iconContainer, { backgroundColor: colors.primary + '15' }]}>
            <MaterialCommunityIcons name="lock-reset" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('settings.changePasswordDesc')}
          </Text>

          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.errorLight }]}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            </View>
          ) : null}

          <TextInput
            label={t('settings.currentPassword')}
            value={oldPassword}
            onChangeText={setOldPassword}
            secureTextEntry={!showOld}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            textColor={colors.textPrimary}
            right={
              <TextInput.Icon
                icon={showOld ? 'eye-off' : 'eye'}
                onPress={() => setShowOld(!showOld)}
              />
            }
          />

          <TextInput
            label={t('settings.newPassword')}
            value={newPassword1}
            onChangeText={setNewPassword1}
            secureTextEntry={!showNew}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            textColor={colors.textPrimary}
            right={
              <TextInput.Icon
                icon={showNew ? 'eye-off' : 'eye'}
                onPress={() => setShowNew(!showNew)}
              />
            }
          />

          <TextInput
            label={t('settings.confirmNewPassword')}
            value={newPassword2}
            onChangeText={setNewPassword2}
            secureTextEntry={!showNew}
            mode="outlined"
            style={styles.input}
            outlineColor={colors.border}
            activeOutlineColor={colors.primary}
            textColor={colors.textPrimary}
          />

          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={styles.submitButton}
            icon="check"
          >
            {t('settings.changePassword')}
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  scrollContent: { padding: Spacing.base },
  card: { borderRadius: BorderRadius.xl, padding: Spacing.xl, elevation: 2 },
  iconContainer: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: Spacing.md },
  description: { fontSize: 14, textAlign: 'center', marginBottom: Spacing.lg, lineHeight: 20 },
  errorBox: { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, borderRadius: BorderRadius.md, marginBottom: Spacing.md, gap: Spacing.xs },
  errorText: { fontSize: 13, flex: 1 },
  input: { marginBottom: Spacing.md },
  submitButton: { marginTop: Spacing.sm, borderRadius: BorderRadius.lg },
});
