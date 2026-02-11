import React from 'react';
import { StyleSheet, SafeAreaView, ActivityIndicator, View } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../../hooks/useApi';
import { Category } from '../../../types/category.types';
import { Colors } from '../../../constants/colors';
import { Spacing, BorderRadius } from '../../../constants/typography';

const MIN_QUESTIONS = 1;
const MAX_QUESTIONS = 50;

const PracticeSetupScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams<{ categoryId: string }>();
  const categoryId = params.categoryId;

  const { data: category, status } = useApi<Category>(
    categoryId ? `/api/categories/${categoryId}/` : '',
    !categoryId,
  );

  const [numberOfQuestions, setNumberOfQuestions] = React.useState('10');

  const questionCount = parseInt(numberOfQuestions, 10);
  const isValid = !isNaN(questionCount) && questionCount >= MIN_QUESTIONS && questionCount <= MAX_QUESTIONS;

  const handleStartPractice = () => {
    if (!categoryId || !isValid) return;
    router.push({
      pathname: `/practice/[categoryId]/question`,
      params: { categoryId, count: numberOfQuestions },
    });
  };

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator animating={true} size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading category...</Text>
      </SafeAreaView>
    );
  }

  if (status === 'error' || !category) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Stack.Screen options={{ title: 'Error' }} />
        <MaterialCommunityIcons name="alert-circle" size={60} color={Colors.error} />
        <Text style={styles.errorText}>Could not load category.</Text>
        <Button mode="contained" onPress={() => router.back()}>Go Back</Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: category.name_en }} />
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="book-open-variant" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Setup Your Practice</Text>
          <Text style={styles.subtitle}>Category: {category.name_en}</Text>
          {category.name_np && (
            <Text style={styles.subtitleNp}>{category.name_np}</Text>
          )}

          <TextInput
            label="Number of questions"
            value={numberOfQuestions}
            onChangeText={setNumberOfQuestions}
            keyboardType="number-pad"
            style={styles.input}
            mode="outlined"
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            error={numberOfQuestions !== '' && !isValid}
          />
          {numberOfQuestions !== '' && !isValid && (
            <Text style={styles.helperText}>
              Enter a number between {MIN_QUESTIONS} and {MAX_QUESTIONS}
            </Text>
          )}

          <Button
            mode="contained"
            onPress={handleStartPractice}
            style={styles.button}
            contentStyle={styles.buttonContent}
            icon="play-circle"
            disabled={!isValid}
          >
            Start Practice
          </Button>
        </Card.Content>
      </Card>
    </SafeAreaView>
  );
};

export default PracticeSetupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.base,
    backgroundColor: Colors.background,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.base,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: Spacing.base,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xl,
    elevation: 2,
    paddingVertical: Spacing.lg,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  subtitleNp: {
    fontSize: 14,
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  input: {
    marginBottom: Spacing.xs,
    backgroundColor: Colors.white,
  },
  helperText: {
    fontSize: 12,
    color: Colors.error,
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
  },
  button: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  buttonContent: {
    paddingVertical: Spacing.sm,
  },
});
