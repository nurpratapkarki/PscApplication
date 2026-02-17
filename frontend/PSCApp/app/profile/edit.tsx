import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, TextInput, Button, Avatar, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../hooks/useApi';
import { UserProfile } from '../../types/user.types';
import { Branch } from '../../types/category.types';
import { updateUserProfile } from '../../services/api/profile';
import { useAuthStore } from '../../store/authStore';
import { useColors } from '../../hooks/useColors';
import { useLocalizedField } from '../../hooks/useLocalizedField';
import { Colors, ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

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

export default function EditProfileScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: user, status: userStatus, refetch: refetchUser } = useApi<UserProfile>('/api/auth/user/');
  const { data: branches } = useApi<Branch[]>('/api/branches/');
  const getAccessToken = useAuthStore((state) => state.getAccessToken);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [selectedBranch, setSelectedBranch] = useState<number | null>(user?.target_branch || null);
  const [selectedSubBranch, setSelectedSubBranch] = useState<number | null>(user?.target_sub_branch || null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const activeBranch = React.useMemo(
    () => branches?.find(b => b.id === selectedBranch) ?? null,
    [branches, selectedBranch]
  );

  React.useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone_number || '');
      setSelectedBranch(user.target_branch || null);
      setSelectedSubBranch(user.target_sub_branch || null);
    }
  }, [user]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert(t('profile.permissionRequired'), t('profile.photoPermissionMessage'));
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    // Validate required fields
    if (!fullName.trim()) {
      Alert.alert(t('profile.validationError'), t('profile.fullNameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error(t('profile.authTokenMissing'));
      }

      // Build FormData for file upload or regular update
      const formData = new FormData();

      // Add changed fields
      if (fullName !== user?.full_name) {
        formData.append('full_name', fullName.trim());
      }
      if (phone !== user?.phone_number) {
        formData.append('phone_number', phone.trim());
      }
      if (selectedBranch !== user?.target_branch && selectedBranch !== null) {
        formData.append('target_branch', String(selectedBranch));
      }
      if (selectedSubBranch !== user?.target_sub_branch) {
        formData.append('target_sub_branch', selectedSubBranch ? String(selectedSubBranch) : '');
      }

      // Handle image upload
      if (selectedImage) {
        const filename = selectedImage.split('/').pop() || 'profile.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        // @ts-ignore - FormData accepts this format in React Native
        formData.append('profile_picture', {
          uri: selectedImage,
          name: filename,
          type,
        });
      }

      // Use fetch directly with FormData for proper multipart handling
      const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const response = await fetch(`${API_BASE_URL}/api/auth/user/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let fetch set it with boundary for FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || t('profile.updateFailed'));
      }

      // Refetch user data to update UI
      await refetchUser();
      
      Alert.alert(
        t('common.success'), 
        t('profile.profileUpdated'), 
        [{ text: t('common.ok'), onPress: () => router.back() }]
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : t('profile.updateFailed');
      Alert.alert(t('common.error'), message);
      console.error('Profile update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (userStatus === 'loading') {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('profile.editProfile')}</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity onPress={handlePickImage}>
              <View style={styles.avatarContainer}>
                <Avatar.Image 
                  size={100} 
                  source={{ 
                    uri: selectedImage || user?.profile_picture || `https://i.pravatar.cc/150?u=${user?.email}`
                  }} 
                />
                <View style={styles.changeAvatarBtn}>
                  <MaterialCommunityIcons name="camera" size={20} color={colors.white} />
                </View>
              </View>
              <Text style={styles.changePhotoText}>{t('profile.changePhoto')}</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>{t('profile.fullName')}</Text>
              <TextInput 
                mode="outlined" 
                placeholder={t('profile.fullNamePlaceholder')}
                value={fullName} 
                onChangeText={setFullName} 
                style={styles.textInput} 
                outlineColor={colors.border} 
                activeOutlineColor={colors.primary} 
                left={<TextInput.Icon icon="account" />} 
              />

              <Text style={styles.inputLabel}>{t('profile.email')}</Text>
              <TextInput 
                mode="outlined" 
                value={user?.email || ''} 
                style={styles.textInput} 
                outlineColor={colors.border} 
                disabled 
                left={<TextInput.Icon icon="email" />} 
              />

              <Text style={styles.inputLabel}>{t('profile.phoneNumber')}</Text>
              <TextInput 
                mode="outlined" 
                placeholder={t('profile.phoneNumberPlaceholder')}
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad" 
                style={styles.textInput} 
                outlineColor={colors.border} 
                activeOutlineColor={colors.primary} 
                left={<TextInput.Icon icon="phone" />} 
              />
            </Card.Content>
          </Card>

          {/* Branch Selection */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>{t('profile.preferredBranch')}</Text>
              <View style={styles.branchGrid}>
                {branches?.map((branch) => {
                  const isSelected = selectedBranch === branch.id;
                  return (
                    <TouchableOpacity
                      key={branch.id}
                      style={[styles.branchCard, isSelected && styles.branchCardSelected]}
                      onPress={() => {
                        setSelectedBranch(branch.id);
                        setSelectedSubBranch(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={getBranchIcon(branch.slug)}
                        size={24}
                        color={isSelected ? Colors.primary : colors.textSecondary}
                      />
                      <Text style={[styles.branchName, isSelected && styles.branchNameSelected]}>
                        {lf(branch.name_en, branch.name_np)}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <MaterialCommunityIcons name="check" size={14} color={colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sub-branch selection */}
              {activeBranch?.has_sub_branches && (activeBranch.sub_branches?.length ?? 0) > 0 && (
                <>
                  <Text style={[styles.inputLabel, { marginTop: Spacing.lg }]}>
                    {t('profile.preferredSubBranch', { defaultValue: 'Select Sub-Branch' })}
                  </Text>
                  <View style={styles.chipRow}>
                    {activeBranch.sub_branches?.map((sb) => (
                      <Chip
                        key={sb.id}
                        selected={selectedSubBranch === sb.id}
                        onPress={() => setSelectedSubBranch(selectedSubBranch === sb.id ? null : sb.id)}
                        style={styles.branchChip}
                        selectedColor={Colors.primary}
                      >
                        {lf(sb.name_en, sb.name_np)}
                      </Chip>
                    ))}
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.bottomAction}>
          <Button 
            mode="contained" 
            icon="content-save" 
            style={styles.saveButton} 
            contentStyle={styles.saveButtonContent} 
            labelStyle={styles.saveButtonLabel} 
            onPress={handleSave} 
            loading={isSaving} 
            disabled={isSaving}
          >
            {t('profile.saveChanges')}
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.cardBackground, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarContainer: { position: 'relative' },
  changeAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.background },
  changePhotoText: { fontSize: 13, color: colors.primary, marginTop: Spacing.sm },
  card: { backgroundColor: colors.cardBackground, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  textInput: { backgroundColor: colors.cardBackground },
  branchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  branchCard: { width: '47%', backgroundColor: colors.surfaceVariant, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center' as const, borderWidth: 2, borderColor: 'transparent' },
  branchCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '30' },
  branchName: { fontSize: 13, color: colors.textSecondary, marginTop: Spacing.xs, textAlign: 'center' as const },
  branchNameSelected: { color: colors.primary, fontWeight: '600' as const },
  checkIcon: { position: 'absolute' as const, top: 8, right: 8, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center' as const, justifyContent: 'center' as const },
  chipRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: Spacing.xs },
  branchChip: { marginBottom: Spacing.xs },
  bottomAction: { backgroundColor: colors.cardBackground, padding: Spacing.base, borderTopWidth: 1, borderTopColor: colors.border },
  saveButton: { borderRadius: BorderRadius.lg },
  saveButtonContent: { paddingVertical: Spacing.sm },
  saveButtonLabel: { fontSize: 16, fontWeight: '700' },
});
