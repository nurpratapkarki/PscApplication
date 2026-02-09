import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Card, Text, ActivityIndicator, Chip, IconButton, Menu, Divider, FAB } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../../hooks/useApi';
import { usePaginatedApi } from '../../../hooks/usePaginatedApi';
import { StudyCollection } from '../../../types/contribution.types';
import { Question, DifficultyLevel } from '../../../types/question.types';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';
import { removeQuestionsFromCollection } from '../../../services/api/stats';
import { getAccessToken } from '../../../services/api/client';

interface QuestionItemProps {
  question: Question;
  onPress: () => void;
  onRemove: () => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({ question, onPress, onRemove }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const getDifficultyColor = (difficulty: DifficultyLevel | null | undefined): string => {
    switch (difficulty?.toUpperCase()) {
      case 'EASY': return Colors.success;
      case 'MEDIUM': return Colors.warning;
      case 'HARD': return Colors.error;
      default: return Colors.textSecondary;
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.questionCard}>
        <Card.Content style={styles.questionContent}>
          <View style={styles.questionMain}>
            <Text style={styles.questionText} numberOfLines={2}>
              {question.question_text_en}
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
              title="View Details" 
              leadingIcon="eye"
            />
            <Divider />
            <Menu.Item 
              onPress={() => { setMenuVisible(false); onRemove(); }} 
              title="Remove" 
              leadingIcon="delete"
              titleStyle={{ color: Colors.error }}
            />
          </Menu>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export default function CollectionDetailsScreen() {
  const router = useRouter();
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
      'Remove Question',
      'Are you sure you want to remove this question from the collection?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = getAccessToken();
              await removeQuestionsFromCollection(parseInt(collectionId), [questionId], token);
              refetch();
            } catch (err) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to remove question.');
            }
          }
        },
      ]
    );
  };

  const handleAddQuestions = () => {
    Alert.alert('Add Questions', 'Add questions functionality coming soon');
  };

  const handleEditCollection = () => {
    Alert.alert('Edit Collection', 'Edit collection functionality coming soon');
  };

  const isLoading = collectionStatus === 'loading' || questionsStatus === 'loading';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  const iconColor = collection?.color_code || Colors.primary;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Collection</Text>
        <TouchableOpacity onPress={handleEditCollection} style={styles.editButton}>
          <MaterialCommunityIcons name="pencil" size={20} color={Colors.primary} />
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
                  <Chip compact icon="lock" style={styles.privateChip}>Private</Chip>
                )}
              </View>
              {collection.description && (
                <Text style={styles.collectionDescription}>{collection.description}</Text>
              )}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="file-document-outline" size={16} color={Colors.textSecondary} />
                  <Text style={styles.statText}>{collection.question_count} questions</Text>
                </View>
              </View>
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Questions List */}
      {!questions || questions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="file-document-outline" size={80} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Questions Yet</Text>
          <Text style={styles.emptySubtitle}>
            Add questions to this collection to start studying
          </Text>
        </View>
      ) : (
        <FlatList
          data={questions}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listTitle}>Questions</Text>
              <Text style={styles.listCount}>{questions.length} items</Text>
            </View>
          }
          renderItem={({ item }) => (
            <QuestionItem
              question={item}
              onPress={() => handleQuestionPress(item)}
              onRemove={() => handleRemoveQuestion(item.id)}
            />
          )}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleAddQuestions}
        color={Colors.white}
        label="Add Questions"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, flex: 1, textAlign: 'center' },
  editButton: { 
    width: 44, 
    height: 44, 
    borderRadius: 22, 
    backgroundColor: Colors.primaryLight + '30', 
    alignItems: 'center', 
    justifyContent: 'center',
  },
  infoCard: { 
    marginHorizontal: Spacing.base, 
    backgroundColor: Colors.white, 
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
  collectionName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  privateChip: { backgroundColor: Colors.surfaceVariant },
  collectionDescription: { fontSize: 14, color: Colors.textSecondary, marginTop: Spacing.xs },
  statsRow: { flexDirection: 'row', marginTop: Spacing.md },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 13, color: Colors.textSecondary, marginLeft: 4 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  listHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.md,
  },
  listTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  listCount: { fontSize: 13, color: Colors.textSecondary },
  questionCard: { 
    backgroundColor: Colors.white, 
    borderRadius: BorderRadius.lg, 
    marginBottom: Spacing.sm, 
    elevation: 1,
  },
  questionContent: { flexDirection: 'row', alignItems: 'center' },
  questionMain: { flex: 1 },
  questionText: { fontSize: 15, color: Colors.textPrimary, lineHeight: 22 },
  questionMeta: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.sm },
  difficultyChip: { height: 24 },
  categoryText: { fontSize: 12, color: Colors.textSecondary },
  fab: { 
    position: 'absolute', 
    right: Spacing.base, 
    bottom: Spacing.xl, 
    backgroundColor: Colors.primary,
  },
});
