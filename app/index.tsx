import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  TextInput,
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

  const renderListItem = ({ item }: { item: ShoppingList }) => {
    const items = itemsMap[item.id] || [];
    const total = items.length;
    const completed = items.filter((i) => i.isChecked).length;
    const progress = total > 0 ? (completed / total) * 100 : 0;

    return (
      <Pressable
        onPress={() => router.push(`/list/${item.id}`)}
        className="bg-[#16213E] border border-[#2E3D60] rounded-2xl p-5 mb-4 active:scale-[0.99] transition-all"
        style={{
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View className="flex-1 mr-3">
            <Text className="text-white text-xl font-bold tracking-tight">
              {item.name}
            </Text>
            {item.description ? (
              <Text className="text-gray-400 text-sm mt-1">{item.description}</Text>
            ) : null}
          </View>
          <Pressable
            hitSlop={12}
            onPress={(e) => {
              e.stopPropagation();
              confirmDelete(item);
            }}
            className="p-2 rounded-full hover:bg-white/10 active:bg-white/10"
          >
            <Ionicons name="trash-outline" size={18} color="#94A3B8" />
          </Pressable>
        </View>

        <View className="mt-3">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-gray-400 text-xs">
              {total === 0 ? 'No items yet' : `${completed} of ${total} completed`}
            </Text>
            <Text className="text-accent text-xs font-semibold">
              {Math.round(progress)}%
            </Text>
          </View>

          <View className="w-full bg-[#1A1A2E] h-2 rounded-full overflow-hidden">
            <View
              className="bg-accent h-full rounded-full"
              style={{ width: `${progress}%` }}
            />
          </View>
        </View>

        <View className="flex-row items-center justify-end mt-4">
          <Text className="text-accent text-sm font-semibold mr-1">View list</Text>
          <Ionicons name="chevron-forward" size={16} color="#E94560" />
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#1A1A2E]" edges={['top', 'left', 'right']}>
      <View className="flex-1 px-5 pt-3 max-w-2xl w-full mx-auto">
        {/* User bar & Actions */}
        <View className="flex-row items-center justify-between pb-4 border-b border-[#2E3D60]/50 mb-4">
          <View className="flex-1 mr-3">
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-accent/20 border border-accent/40 items-center justify-center mr-2.5">
                <Text className="text-accent text-xs font-bold">
                  {(user?.displayName || firebaseUser?.email || 'U')[0].toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-white text-base font-bold" numberOfLines={1}>
                  {user?.displayName || 'My Shopping Lists'}
                </Text>
                <Text className="text-gray-400 text-xs" numberOfLines={1}>
                  {firebaseUser?.email || ''}
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            <Pressable
              onPress={() => setModalVisible(true)}
              className="bg-accent flex-row items-center px-3.5 py-2 rounded-xl active:bg-accentHover shadow-md mr-2"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text className="text-white font-bold text-xs ml-1">New List</Text>
            </Pressable>

            <Pressable
              onPress={handleSignOut}
              hitSlop={10}
              className="p-2 rounded-xl bg-[#16213E] border border-[#2E3D60] active:bg-white/10"
              title="Sign Out"
            >
              <Ionicons name="log-out-outline" size={18} color="#94A3B8" />
            </Pressable>
          </View>
        </View>

        {/* Content */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#E94560" />
            <Text className="text-gray-400 text-sm mt-3">Connecting to Cloud Storage...</Text>
          </View>
        ) : lists.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <View className="w-16 h-16 rounded-full bg-[#16213E] items-center justify-center mb-4">
              <Ionicons name="cart-outline" size={32} color="#E94560" />
            </View>
            <Text className="text-white text-lg font-bold text-center">
              No Shopping Lists Yet
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-2 max-w-xs">
              Create your first cloud shopping list to keep track of groceries and sync across devices in real time.
            </Text>
            <Pressable
              onPress={() => setModalVisible(true)}
              className="bg-accent px-6 py-3 rounded-xl mt-6 active:bg-accentHover shadow-md"
            >
              <Text className="text-white font-bold">Create First List</Text>
            </Pressable>
          </View>
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
        <View className="flex-1 bg-black/70 items-center justify-center p-4">
          <View className="bg-[#16213E] border border-[#2E3D60] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Create Shopping List</Text>
              <Pressable onPress={() => setModalVisible(false)} className="p-1">
                <Ionicons name="close" size={24} color="#94A3B8" />
              </Pressable>
            </View>

            <Text className="text-gray-300 text-sm mb-1.5 font-medium">List Name</Text>
            <TextInput
              value={newListName}
              onChangeText={setNewListName}
              placeholder="e.g. Weekly Groceries"
              placeholderTextColor="#64748B"
              className="bg-[#1A1A2E] border border-[#2E3D60] text-white px-4 py-3 rounded-xl mb-4 font-normal"
              autoFocus
            />

            <Text className="text-gray-300 text-sm mb-1.5 font-medium">Description (Optional)</Text>
            <TextInput
              value={newListDesc}
              onChangeText={setNewListDesc}
              placeholder="e.g. Items for dinner and breakfast"
              placeholderTextColor="#64748B"
              className="bg-[#1A1A2E] border border-[#2E3D60] text-white px-4 py-3 rounded-xl mb-6 font-normal"
            />

            <View className="flex-row justify-end space-x-3">
              <Pressable
                onPress={() => setModalVisible(false)}
                className="px-5 py-3 rounded-xl bg-transparent active:bg-white/5 mr-2"
              >
                <Text className="text-gray-400 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateList}
                disabled={creating || !newListName.trim()}
                className={`px-6 py-3 rounded-xl bg-accent ${
                  !newListName.trim() ? 'opacity-50' : 'active:bg-accentHover'
                }`}
              >
                <Text className="text-white font-bold">
                  {creating ? 'Creating...' : 'Create List'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
