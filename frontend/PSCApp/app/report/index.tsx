import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../hooks/useColors';
import { ColorScheme } from '../../constants/colors';
import { Spacing } from '../../constants/typography';

// This page should not normally be accessed directly
// Reports are created from question screens with a specific questionId
export default function ReportIndex() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('report.title')}</Text>
        <View style={{ width: 44 }} />
      </View>
      
      <View style={styles.content}>
        <MaterialCommunityIcons name="alert-circle-outline" size={80} color={colors.textTertiary} />
        <Text style={styles.title}>{t('report.noQuestionTitle')}</Text>
        <Text style={styles.subtitle}>{t('report.noQuestionSubtitle')}</Text>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
    backgroundColor: colors.cardBackground, 
    alignItems: 'center', 
    justifyContent: 'center', 
    elevation: 2,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  content: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: Spacing.xl,
  },
  title: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: colors.textPrimary, 
    marginTop: Spacing.lg,
  },
  subtitle: { 
    fontSize: 14, 
    color: colors.textSecondary, 
    textAlign: 'center', 
    marginTop: Spacing.sm,
    lineHeight: 22,
  },
});
