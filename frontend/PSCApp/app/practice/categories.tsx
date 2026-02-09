import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Searchbar, Text, ActivityIndicator, Chip } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useApi } from '../../hooks/useApi';
import { Category } from '../../types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

const PracticeCategoriesScreen = () => {
  const router = useRouter();
  const { data: categories, status, error } = useApi<Category[]>('/api/categories/for-user/');
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (categories) {
      if (searchQuery) {
        const lowercasedQuery = searchQuery.toLowerCase();
        const filtered = categories.filter((category) =>
          category.name_en.toLowerCase().includes(lowercasedQuery) ||
          category.name_np.toLowerCase().includes(lowercasedQuery)
        );
        setFilteredCategories(filtered);
      } else {
        setFilteredCategories(categories);
      }
    }
  }, [searchQuery, categories]);

  const handleSelectCategory = (categoryId: number) => {
    router.navigate({ pathname: `/practice/${categoryId}` });
  };

  if (status === 'loading') {
    return (
      <SafeAreaView style={styles.loaderContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading categories...</Text>
      </SafeAreaView>
    );
  }

  if (status === 'error') {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <MaterialCommunityIcons name="alert-circle" size={60} color={Colors.error} />
        <Text style={styles.errorText}>Failed to load categories</Text>
        <Text style={styles.errorSubText}>{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <Stack.Screen options={{ title: 'Select Category' }} />
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search categories..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchInput}
          icon={() => <MaterialCommunityIcons name="magnify" size={22} color={Colors.textSecondary} />}
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredCategories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="folder-search" size={60} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>No categories found</Text>
          </View>
        ) : (
          filteredCategories.map((category) => (
            <TouchableOpacity key={category.id} onPress={() => handleSelectCategory(category.id)} activeOpacity={0.7}>
              <Card style={styles.card}>
                <Card.Content style={styles.cardContent}>
                  <View style={styles.iconContainer}>
                    <MaterialCommunityIcons name={(category.icon as any) || 'folder'} size={28} color={Colors.primary} />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={styles.categoryName}>{category.name_en}</Text>
                    <Text style={styles.categoryNameNp}>{category.name_np}</Text>
                    {category.question_count !== undefined && (
                      <Chip compact style={styles.countChip} textStyle={styles.countChipText}>
                        {category.question_count} questions
                      </Chip>
                    )}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={Colors.textTertiary} />
                </Card.Content>
              </Card>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PracticeCategoriesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background },
  loadingText: { marginTop: Spacing.base, color: Colors.textSecondary },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl, backgroundColor: Colors.background },
  errorText: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary, marginTop: Spacing.base },
  errorSubText: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  searchContainer: { paddingHorizontal: Spacing.base, paddingTop: Spacing.sm, paddingBottom: Spacing.md },
  searchbar: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, elevation: 2 },
  searchInput: { fontSize: 15 },
  listContainer: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.xl },
  emptyContainer: { alignItems: 'center', paddingTop: Spacing['3xl'] },
  emptyText: { fontSize: 16, color: Colors.textSecondary, marginTop: Spacing.base },
  card: { backgroundColor: Colors.white, borderRadius: BorderRadius.lg, marginBottom: Spacing.md, elevation: 2 },
  cardContent: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.md },
  iconContainer: { width: 50, height: 50, borderRadius: 25, backgroundColor: Colors.primaryLight + '20', alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md },
  textContainer: { flex: 1 },
  categoryName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  categoryNameNp: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  countChip: { alignSelf: 'flex-start', marginTop: Spacing.xs, backgroundColor: Colors.surfaceVariant },
  countChipText: { fontSize: 11, color: Colors.textSecondary },
});

