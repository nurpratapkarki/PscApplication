import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, FAB, IconButton, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { StudyCollection } from '../../types/contribution.types';
import { Colors } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

interface CollectionCardProps {
  collection: StudyCollection;
  onPress: () => void;
  onMenuPress: (action: string) => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection, onPress, onMenuPress }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const iconColor = collection.color_code || Colors.primary;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card style={styles.collectionCard}>
        <Card.Content style={styles.cardContent}>
          <View style={[styles.collectionIcon, { backgroundColor: iconColor + '20' }]}>
            <MaterialCommunityIcons 
              name={(collection.icon as any) || 'folder'} 
              size={28} 
              color={iconColor} 
            />
          </View>
          <View style={styles.collectionInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.collectionName} numberOfLines={1}>{collection.name}</Text>
              {collection.is_private && (
                <MaterialCommunityIcons name="lock" size={14} color={Colors.textSecondary} />
              )}
            </View>
            {collection.description && (
              <Text style={styles.collectionDescription} numberOfLines={1}>
                {collection.description}
              </Text>
            )}
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="file-document-outline" size={14} color={Colors.textTertiary} />
              <Text style={styles.metaText}>{collection.question_count} questions</Text>
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
              onPress={() => { setMenuVisible(false); onMenuPress('edit'); }} 
              title="Edit" 
              leadingIcon="pencil"
            />
            <Menu.Item 
              onPress={() => { setMenuVisible(false); onMenuPress('share'); }} 
              title="Share" 
              leadingIcon="share-variant"
            />
            <Divider />
            <Menu.Item 
              onPress={() => { setMenuVisible(false); onMenuPress('delete'); }} 
              title="Delete" 
              leadingIcon="delete"
              titleStyle={{ color: Colors.error }}
            />
          </Menu>
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );
};

export default function CollectionsScreen() {
  const router = useRouter();
  const { data: collections, status, refetch } = usePaginatedApi<StudyCollection>('/api/collections/');

  const handleCollectionPress = (collection: StudyCollection) => {
    router.push(`/profile/${collection.id}` as any);
  };

  const handleMenuPress = (collectionId: number, action: string) => {
    switch (action) {
      case 'edit':
        Alert.alert('Edit Collection', 'Edit functionality coming soon');
        break;
      case 'share':
        Alert.alert('Share Collection', 'Share functionality coming soon');
        break;
      case 'delete':
        Alert.alert(
          'Delete Collection',
          'Are you sure you want to delete this collection?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => console.log('Delete collection:', collectionId) },
          ]
        );
        break;
    }
  };

  const handleCreateCollection = () => {
    Alert.alert('Create Collection', 'Create collection functionality coming soon');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Study Collections</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Hero Card */}
      <Card style={styles.heroCard}>
        <Card.Content style={styles.heroContent}>
          <MaterialCommunityIcons name="folder-multiple" size={40} color={Colors.primary} />
          <Text style={styles.heroTitle}>Organize Your Learning</Text>
          <Text style={styles.heroSubtitle}>
            Create collections to group questions by topic, difficulty, or exam type
          </Text>
        </Card.Content>
      </Card>

      {/* Collections List */}
      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !collections || collections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="folder-open-outline" size={80} color={Colors.textTertiary} />
          <Text style={styles.emptyTitle}>No Collections Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create your first collection to organize your study materials
          </Text>
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <CollectionCard
              collection={item}
              onPress={() => handleCollectionPress(item)}
              onMenuPress={(action) => handleMenuPress(item.id, action)}
            />
          )}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateCollection}
        color={Colors.white}
      />
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
  heroCard: { 
    marginHorizontal: Spacing.base, 
    backgroundColor: Colors.primaryLight + '30', 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.lg,
  },
  heroContent: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.sm },
  heroSubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  collectionCard: { 
    backgroundColor: Colors.white, 
    borderRadius: BorderRadius.lg, 
    marginBottom: Spacing.md, 
    elevation: 2,
  },
  cardContent: { flexDirection: 'row', alignItems: 'center' },
  collectionIcon: { 
    width: 52, 
    height: 52, 
    borderRadius: 12, 
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  collectionInfo: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  collectionName: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  collectionDescription: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  metaText: { fontSize: 12, color: Colors.textTertiary, marginLeft: 4 },
  fab: { 
    position: 'absolute', 
    right: Spacing.base, 
    bottom: Spacing.xl, 
    backgroundColor: Colors.primary,
  },
});
