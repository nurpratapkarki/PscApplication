import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Spacing } from '../../constants/typography';

// This page should not normally be accessed directly
// Reports are created from question screens with a specific questionId
export default function ReportIndex() {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report</Text>
        <View style={{ width: 44 }} />
      </View>
      
      <View style={styles.content}>
        <MaterialCommunityIcons name="alert-circle-outline" size={80} color={Colors.textTertiary} />
        <Text style={styles.title}>No Question Selected</Text>
        <Text style={styles.subtitle}>
          To report a question, please navigate to the question first and use the report button from there.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: Spacing.base,
  },
  backButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: Colors.white, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: Spacing.xl,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: Colors.textPrimary, 
    marginTop: Spacing.lg,
  },
  subtitle: { 
    fontSize: 14, 
    color: Colors.textSecondary, 
    textAlign: 'center', 
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
});

