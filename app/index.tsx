import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingList, ShoppingItem } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { logOut } from '@/lib/auth';
import { Button, Card, Input, EmptyState, Badge } from '@/components/ui';
import {
  subscribeShoppingLists,
  createFirestoreList,
  deleteFirestoreList,
  subscribeShoppingItems,
} from '@/lib/firestore';

export default function ListsScreen() {
  const router = useRouter();
  const { user, firebaseUser } = useAuth();

  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, ShoppingItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [newListDesc, setNewListDesc] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!firebaseUser) return;

    setLoading(true);
    const unsubLists = subscribeShoppingLists(
      firebaseUser.uid,
      (fetchedLists) => {
        setLists(fetchedLists);
        setLoading(false);

        // Subscribe to items for each list to show real-time progress
        fetchedLists.forEach((l) => {
          subscribeShoppingItems(l.id, (items) => {
            setItemsMap((prev) => ({ ...prev, [l.id]: items }));
          });
        });
      },
      (err) => {
        console.error('Error fetching lists:', err);
        setLoading(false);
      }
    );

    return () => unsubLists();
  }, [firebaseUser]);

  const handleCreateList = async () => {
    if (!newListName.trim() || !firebaseUser) return;
    setCreating(true);
    try {
      const listId = await createFirestoreList(firebaseUser.uid, newListName, newListDesc);
      setNewListName('');
      setNewListDesc('');
      setModalVisible(false);
      router.push(`/list/${listId}`);
    } catch (e) {
      console.error('Failed to create list', e);
    } finally {
      setCreating(false);
    }
  };

  const confirmDelete = (list: ShoppingList) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Are you sure you want to delete "${list.name}"?`)) {
        handleDeleteList(list.id);
      }
    } else {
      Alert.alert(
        'Delete List',
        `Are you sure you want to delete "${list.name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDeleteList(list.id) },
        ]
      );
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await deleteFirestoreList(id);
    } catch (err) {
      console.error('Failed to delete list', err);
    }
  };

  const handleSignOut = async () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Do you want to sign out?')) {
        await logOut();
      }
    } else {
      Alert.alert('Sign Out', 'Do you want to sign out?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => logOut() },
      ]);
    }
  };

  const totalItemsCount = Object.values(itemsMap).reduce(
    (sum, items) => sum + items.length,
    0
  );
  const totalCompletedCount = Object.values(itemsMap).reduce(
    (sum, items) => sum + items.filter((i) => i.isChecked).length,
    0
  );

  const renderListItem = ({ item }: { item: ShoppingList }) => {
    const items = itemsMap[item.id] || [];
    const total = items.length;
    const completed = items.filter((i) => i.isChecked).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;
    const isAllDone = total > 0 && completed === total;

    return (
      <Card
        onPress={() => router.push(`/list/${item.id}`)}
        className="mb-4 bg-slate-900/90 border-slate-800 p-5 rounded-2xl"
      >
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center">
              <Text className="text-white text-lg font-bold tracking-tight mr-2.5">
                {item.name}
              </Text>
              {isAllDone && (
                <Badge label="Completed" variant="success" size="sm" />
              )}
            </View>
            {item.description ? (
              <Text className="text-slate-400 text-xs mt-1 leading-4">
                {item.description}
              </Text>
            ) : null}
          </View>
          <Pressable
            hitSlop={12}
            onPress={(e) => {
              e.stopPropagation();
              confirmDelete(item);
            }}
            className="p-2 rounded-xl hover:bg-slate-800 active:bg-slate-700 transition-colors"
          >
            <Ionicons name="trash-outline" size={17} color="#94A3B8" />
          </Pressable>
        </View>

        {/* Progress bar */}
        <View className="mt-2 pt-3 border-t border-slate-800/60">
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-slate-400 text-xs font-medium">
              {total === 0 ? 'Empty list' : `${completed} of ${total} items checked`}
            </Text>
            <Text className="text-indigo-400 text-xs font-semibold">
              {Math.round(progress)}%
            </Text>
          </View>

          <View className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full transition-all ${
                isAllDone ? 'bg-emerald-500' : 'bg-indigo-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        {/* Card Footer */}
        <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-800/60">
          <Text className="text-slate-500 text-[11px]">
            {new Date(item.createdAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          <View className="flex-row items-center">
            <Text className="text-indigo-400 text-xs font-semibold mr-1">Open list</Text>
            <Ionicons name="arrow-forward" size={14} color="#818CF8" />
          </View>
        </View>
      </Card>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-5 pt-3 max-w-2xl w-full mx-auto">
        {/* User Profile Header */}
        <View className="flex-row items-center justify-between pb-4 border-b border-slate-800/80 mb-5">
          <View className="flex-row items-center flex-1 mr-3">
            <View className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 items-center justify-center mr-3 shadow-sm">
              <Text className="text-indigo-300 text-sm font-bold">
                {(user?.displayName || firebaseUser?.email || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View className="flex-1">
              <Text className="text-white text-base font-bold tracking-tight" numberOfLines={1}>
                {user?.displayName || 'My Shopping'}
              </Text>
              <Text className="text-slate-400 text-xs" numberOfLines={1}>
                {firebaseUser?.email || ''}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            <Button
              title="New List"
              onPress={() => setModalVisible(true)}
              variant="primary"
              size="sm"
              leftIcon={<Ionicons name="add" size={16} color="#FFFFFF" />}
              className="mr-2"
            />
            <Pressable
              onPress={handleSignOut}
              hitSlop={10}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 transition-colors"
              title="Sign Out"
            >
              <Ionicons name="log-out-outline" size={18} color="#94A3B8" />
            </Pressable>
          </View>
        </View>

        {/* Stats overview cards */}
        {lists.length > 0 && (
          <View className="flex-row gap-3 mb-5">
            <View className="flex-1 bg-slate-900/70 border border-slate-800/70 rounded-2xl p-3.5">
              <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Lists
              </Text>
              <Text className="text-white text-2xl font-black mt-1">
                {lists.length}
              </Text>
            </View>
            <View className="flex-1 bg-slate-900/70 border border-slate-800/70 rounded-2xl p-3.5">
              <Text className="text-slate-400 text-xs font-medium uppercase tracking-wider">
                Items Checked
              </Text>
              <Text className="text-emerald-400 text-2xl font-black mt-1">
                {totalCompletedCount}
                <Text className="text-slate-500 text-sm font-normal"> / {totalItemsCount}</Text>
              </Text>
            </View>
          </View>
        )}

        {/* Main Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-slate-400 text-sm mt-3 font-medium">Syncing with Cloud...</Text>
          </View>
        ) : lists.length === 0 ? (
          <EmptyState
            icon="basket-outline"
            title="No Shopping Lists Yet"
            subtitle="Create your first shopping list to track items and collaborate in real time."
            action={{
              label: 'Create First List',
              onPress: () => setModalVisible(true),
            }}
          />
        ) : (
          <FlatList
            data={lists}
            keyExtractor={(item) => item.id}
            renderItem={renderListItem}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* Create List Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 items-center justify-center p-4">
          <View className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl shadow-black/50">
            <View className="flex-row items-center justify-between mb-5">
              <View className="flex-row items-center">
                <View className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/30 items-center justify-center mr-2.5">
                  <Ionicons name="list" size={18} color="#818CF8" />
                </View>
                <Text className="text-white text-lg font-bold">New Shopping List</Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} className="p-1 rounded-lg hover:bg-slate-800">
                <Ionicons name="close" size={22} color="#94A3B8" />
              </Pressable>
            </View>

            <Input
              label="List Title"
              value={newListName}
              onChangeText={setNewListName}
              placeholder="e.g. Weekly Groceries, BBQ Party"
              autoFocus
            />

            <Input
              label="Description (Optional)"
              value={newListDesc}
              onChangeText={setNewListDesc}
              placeholder="e.g. Essentials for the weekend"
            />

            <View className="flex-row justify-end space-x-3 mt-4">
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="ghost"
                size="md"
                className="mr-2"
              />
              <Button
                title={creating ? 'Creating...' : 'Create List'}
                onPress={handleCreateList}
                disabled={creating || !newListName.trim()}
                loading={creating}
                variant="primary"
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
