import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, TextInput, Button, Avatar, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useApi } from '../../hooks/useApi';
import { UserProfile } from '../../types/user.types';
import { Branch } from '../../types/category.types';
import { updateUserProfile } from '../../services/api/profile';
import { useAuthStore } from '../../store/authStore';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

export default function EditProfileScreen() {
  const router = useRouter();
  const { data: user, status: userStatus, refetch: refetchUser } = useApi<UserProfile>('/api/auth/user/');
  const { data: branches } = useApi<Branch[]>('/api/branches/');
  const getAccessToken = useAuthStore((state) => state.getAccessToken);

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone_number || '');
  const [selectedBranch, setSelectedBranch] = useState<number | null>(user?.target_branch || null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  React.useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone_number || '');
      setSelectedBranch(user.target_branch || null);
    }
  }, [user]);

  const handlePickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to change your profile picture.');
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
      Alert.alert('Validation Error', 'Please enter your full name');
      return;
    }

    setIsSaving(true);
    try {
      const token = getAccessToken();
      if (!token) {
        throw new Error('Authentication token not found');
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
        throw new Error(errorData.detail || errorData.error || 'Failed to update profile');
      }

      // Refetch user data to update UI
      await refetchUser();
      
      Alert.alert(
        'Success', 
        'Profile updated successfully!', 
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      Alert.alert('Error', message);
      console.error('Profile update error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (userStatus === 'loading') {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
            <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
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
                  <MaterialCommunityIcons name="camera" size={20} color={Colors.white} />
                </View>
              </View>
              <Text style={styles.changePhotoText}>Tap to change photo</Text>
            </TouchableOpacity>
          </View>

          {/* Form */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>Full Name</Text>
              <TextInput 
                mode="outlined" 
                placeholder="Enter your full name" 
                value={fullName} 
                onChangeText={setFullName} 
                style={styles.textInput} 
                outlineColor={Colors.border} 
                activeOutlineColor={Colors.primary} 
                left={<TextInput.Icon icon="account" />} 
              />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput 
                mode="outlined" 
                value={user?.email || ''} 
                style={styles.textInput} 
                outlineColor={Colors.border} 
                disabled 
                left={<TextInput.Icon icon="email" />} 
              />

              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput 
                mode="outlined" 
                placeholder="Enter phone number" 
                value={phone} 
                onChangeText={setPhone} 
                keyboardType="phone-pad" 
                style={styles.textInput} 
                outlineColor={Colors.border} 
                activeOutlineColor={Colors.primary} 
                left={<TextInput.Icon icon="phone" />} 
              />
            </Card.Content>
          </Card>

          {/* Branch Selection */}
          <Card style={styles.card}>
            <Card.Content>
              <Text style={styles.inputLabel}>Preferred Branch</Text>
              <View style={styles.branchGrid}>
                {branches?.map((branch) => (
                  <Chip 
                    key={branch.id} 
                    selected={selectedBranch === branch.id} 
                    onPress={() => setSelectedBranch(branch.id)} 
                    style={styles.branchChip} 
                    selectedColor={Colors.primary}
                  >
                    {branch.name_en}
                  </Chip>
                ))}
              </View>
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
            Save Changes
          </Button>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.base },
  backButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center', elevation: 2 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scrollContent: { padding: Spacing.base, paddingBottom: 100 },
  avatarSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatarContainer: { position: 'relative' },
  changeAvatarBtn: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.background },
  changePhotoText: { fontSize: 13, color: Colors.primary, marginTop: Spacing.sm },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.xl, marginBottom: Spacing.lg, elevation: 2 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  textInput: { backgroundColor: Colors.white },
  branchGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  branchChip: { marginBottom: Spacing.xs },
  bottomAction: { backgroundColor: Colors.white, padding: Spacing.base, borderTopWidth: 1, borderTopColor: Colors.border },
  saveButton: { borderRadius: BorderRadius.lg },
  saveButtonContent: { paddingVertical: Spacing.sm },
  saveButtonLabel: { fontSize: 16, fontWeight: '700' },
});