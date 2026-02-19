import React, { useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Card, Text, ActivityIndicator, FAB, IconButton, Menu, Divider } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { usePaginatedApi } from '../../hooks/usePaginatedApi';
import { StudyCollection } from '../../types/contribution.types';
import { useColors } from '../../hooks/useColors';
import { ColorScheme } from '../../constants/colors';
import { Spacing, BorderRadius } from '../../constants/typography';

interface CollectionCardProps {
  collection: StudyCollection;
  onPress: () => void;
  onMenuPress: (action: string) => void;
}

const CollectionCard: React.FC<CollectionCardProps & { colors: ColorScheme; t: (key: string) => string; styles: ReturnType<typeof createStyles> }> = ({ collection, onPress, onMenuPress, colors, t, styles }) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const iconColor = collection.color_code || colors.primary;

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
                <MaterialCommunityIcons name="lock" size={14} color={colors.textSecondary} />
              )}
            </View>
            {collection.description && (
              <Text style={styles.collectionDescription} numberOfLines={1}>
                {collection.description}
              </Text>
            )}
            <View style={styles.metaRow}>
              <MaterialCommunityIcons name="file-document-outline" size={14} color={colors.textTertiary} />
              <Text style={styles.metaText}>{collection.question_count} {t('common.questions')}</Text>
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
              title={t('common.edit')} 
              leadingIcon="pencil"
            />
            <Menu.Item 
              onPress={() => { setMenuVisible(false); onMenuPress('share'); }} 
              title={t('common.share')} 
              leadingIcon="share-variant"
            />
            <Divider />
            <Menu.Item 
              onPress={() => { setMenuVisible(false); onMenuPress('delete'); }} 
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

export default function CollectionsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const colors = useColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const { data: collections, status, refetch } = usePaginatedApi<StudyCollection>('/api/collections/');

  const handleCollectionPress = (collection: StudyCollection) => {
    router.push(`/profile/${collection.id}` as any);
  };

  const handleMenuPress = (collectionId: number, action: string) => {
    switch (action) {
      case 'edit':
        Alert.alert(t('profile.editCollection'), t('profile.editCollectionSoon'));
        break;
      case 'share':
        Alert.alert(t('profile.shareCollection'), t('profile.shareCollectionSoon'));
        break;
      case 'delete':
        Alert.alert(
          t('profile.deleteCollection'),
          t('profile.deleteCollectionConfirm'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            { text: t('common.delete'), style: 'destructive', onPress: () => console.log('Delete collection:', collectionId) },
          ]
        );
        break;
    }
  };

  const handleCreateCollection = () => {
    Alert.alert(t('profile.createCollection'), t('profile.createCollectionSoon'));
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('profile.collections')}</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Hero Card */}
      <Card style={styles.heroCard}>
        <Card.Content style={styles.heroContent}>
          <MaterialCommunityIcons name="folder-multiple" size={40} color={colors.primary} />
          <Text style={styles.heroTitle}>{t('profile.collectionsHeroTitle')}</Text>
          <Text style={styles.heroSubtitle}>{t('profile.collectionsHeroSubtitle')}</Text>
        </Card.Content>
      </Card>

      {/* Collections List */}
      {status === 'loading' ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : !collections || collections.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="folder-open-outline" size={80} color={colors.textTertiary} />
          <Text style={styles.emptyTitle}>{t('profile.noCollections')}</Text>
          <Text style={styles.emptySubtitle}>{t('profile.noCollectionsSubtitle')}</Text>
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
              colors={colors}
              t={t}
              styles={styles}
            />
          )}
        />
      )}

      {/* FAB */}
      <FAB
        icon="plus"
        style={styles.fab}
        onPress={handleCreateCollection}
        color={colors.white}
      />
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
  heroCard: { 
    marginHorizontal: Spacing.base, 
    backgroundColor: colors.primaryLight + '30', 
    borderRadius: BorderRadius.xl, 
    marginBottom: Spacing.lg,
  },
  heroContent: { alignItems: 'center', paddingVertical: Spacing.lg },
  heroTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: Spacing.sm },
  heroSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary, marginTop: Spacing.lg },
  emptySubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: Spacing.xs },
  listContent: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  collectionCard: { 
    backgroundColor: colors.cardBackground, 
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
  collectionName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  collectionDescription: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', marginTop: Spacing.xs },
  metaText: { fontSize: 12, color: colors.textTertiary, marginLeft: 4 },
  fab: { 
    position: 'absolute', 
    right: Spacing.base, 
    bottom: Spacing.xl, 
    backgroundColor: colors.primary,
  },
});
