import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Text, ActivityIndicator, Chip, IconButton, Menu, Divider, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useApi } from '../../../hooks/useApi';
import { usePaginatedApi } from '../../../hooks/usePaginatedApi';
import { StudyCollection } from '../../../types/contribution.types';
import { Question, DifficultyLevel } from '../../../types/question.types';
import { useColors } from '../../../hooks/useColors';
import { useLocalizedField } from '../../../hooks/useLocalizedField';
import { ColorScheme } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';
import { removeQuestionsFromCollection } from '../../../services/api/stats';
import { getAccessToken } from '../../../services/api/client';

interface QuestionItemProps {
  question: Question;
  onPress: () => void;
  onRemove: () => void;
}

const QuestionItem: React.FC<QuestionItemProps & { colors: ColorScheme; t: (key: string, options?: any) => string; lf: ReturnType<typeof useLocalizedField>; styles: ReturnType<typeof createStyles> }> = ({ question, onPress, onRemove, colors, t, lf, styles }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const getDifficultyColor = (difficulty: DifficultyLevel | null | undefined): string => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY': return colors.success;
      case 'MEDIUM': return colors.warning;
      case 'HARD': return colors.error;
      default: return colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.questionCard}>
        <Card.Content style={styles.questionContent}>
          <View style={styles.questionMain}>
            <Text style={styles.questionText} numberOfLines={2}>
              {lf(question.question_text_en, question.question_text_np)}
            </Text>
            <View style={styles.questionMeta}>
              <Chip 
                compact 
                style={[styles.difficultyChip, { backgroundColor: getDifficultyColor(question.difficulty_level) + '20' }]}
                textStyle={{ color: getDifficultyColor(question.difficulty_level), fontSize: 10 }}
              >
                {question.difficulty_level || 'MEDIUM'}
              </Chip>
              <Text style={styles.categoryText}>{question.category_name || ''}</Text>
            </View>
          </View>
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <IconButton
                icon="dots-vertical"
                size={20}
                onPress={() => setMenuVisible(true)}
              />
            }
          >
            <Menu.Item 
              onPress={() => { setMenuVisible(false); onPress(); }} 
              title={t('profile.viewDetails')} 
              leadingIcon="eye"
            />
            <Divider />
            <Menu.Item 
              onPress={() => { setMenuVisible(false); onRemove(); }} 
              title={t('common.delete')} 
              leadingIcon="delete"
              titleStyle={{ color: colors.error }}
            />
          </Menu>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export default function CollectionDetailsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const lf = useLocalizedField();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { collectionId } = useLocalSearchParams<{ collectionId: string }>();
  
  const { data: collection, status: collectionStatus } = useApi<StudyCollection>(
    collectionId ? `/api/collections/${collectionId}/` : ''
  );
  
  const { data: questions, status: questionsStatus, refetch } = usePaginatedApi<Question>(
    collectionId ? `/api/collections/${collectionId}/questions/` : ''
  );

  const handleQuestionPress = (question: Question) => {
    router.push(`/practice/question/${question.id}`);
  };

  const handleRemoveQuestion = (questionId: number) => {
    Alert.alert(
      t('profile.removeQuestion'),
      t('profile.removeQuestionConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              const token = getAccessToken();
              await removeQuestionsFromCollection(parseInt(collectionId), [questionId], token);
              refetch();
            } catch (err) {
              Alert.alert(t('common.error'), err instanceof Error ? err.message : t('profile.removeQuestionFailed'));
            }
          }
        },
      ]
    );
  };

  const handleAddQuestions = () => {
    Alert.alert(t('profile.addQuestions'), t('profile.addQuestionsSoon'));
  };

  const handleEditCollection = () => {
    Alert.alert(t('profile.editCollection'), t('profile.editCollectionSoon'));
  };

  const isLoading = collectionStatus === 'loading' || questionsStatus === 'loading';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const iconColor = collection?.color_code || colors.primary;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{t('profile.collection')}</Text>
        <TouchableOpacity onPress={handleEditCollection} style={styles.editButton}>
          <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Collection Info Card */}
      {collection && (
        <Card style={styles.infoCard}>
          <Card.Content style={styles.infoContent}>
            <View style={[styles.collectionIcon, { backgroundColor: iconColor + '20' }]}>
              <MaterialCommunityIcons 
                name={(collection.icon as any) || 'folder'} 
                size={32} 
                color={iconColor} 
              />
            </View>
            <View style={styles.collectionDetails}>
              <View style={styles.titleRow}>
                <Text style={styles.collectionName}>{collection.name}</Text>
                {collection.is_private && (
                  <Chip compact icon="lock" style={styles.privateChip}>{t('profile.private')}</Chip>
                )}
              </View>
              {collection.description && (
                <Text style={styles.collectionDescription}>{collection.description}</Text>
              )}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="file-document-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.statText}>{collection.question_count} {t('common.questions')}</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Questions List */}
      {!questions || questions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('profile.noQuestions')}</Text>
          <Text style={styles.emptySubtitle}>{t('profile.noQuestionsSubtitle')}</Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>{t('common.questions')}</Text>
              <Text style={styles.listCount}>{t('profile.itemsCount', { count: questions.length })}</Text>
            </View>
          }
          renderItem={({ item }) => (
            <QuestionItem
              question={item}
              onPress={() => handleQuestionPress(item)}
              onRemove={() => handleRemoveQuestion(item.id)}
              colors={colors}
              t={t}
              lf={lf}
              styles={styles}
            />
          )}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddQuestions}
        color={colors.white}
        label={t('profile.addQuestions')}
      />
    </SafeAreaView>
  );
}

const createStyles = (colors: ColorScheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, flex: 1, textAlign: 'center' },
  editButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: colors.primaryLight + '30', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  infoCard: { 
    marginHorizontal: Spacing.base, 
    backgroundColor: colors.cardBackground, 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.lg,
    elevation: 2,
  },
  infoContent: { flexDirection: 'row', alignItems: 'flex-start' },
  collectionIcon: { 
    width: 64, 
    height: 64, 
    borderRadius: 16, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  collectionDetails: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
  collectionName: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  privateChip: { backgroundColor: colors.surfaceVariant },
  collectionDescription: { fontSize: 14, color: colors.textSecondary, marginTop: Spacing.xs },
  statsRow: { flexDirection: 'row', marginTop: Spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 13, color: colors.textSecondary, marginLeft: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  listHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.md,
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  listCount: { fontSize: 13, color: colors.textSecondary },
  questionCard: { 
    backgroundColor: colors.cardBackground, 
    borderRadius: BorderRadius.lg, 
    marginBottom: Spacing.sm, 
    elevation: 1,
  },
  questionContent: { flexDirection: 'row', alignItems: 'center' },
  questionMain: { flex: 1 },
  questionText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },
  questionMeta: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.sm },
  difficultyChip: { height: 24 },
  categoryText: { fontSize: 12, color: colors.textSecondary },
  fab: { 
    position: 'absolute', 
    right: Spacing.base, 
    bottom: Spacing.xl, 
    backgroundColor: colors.primary,
  },
});
