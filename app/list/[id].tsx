import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingItem, ShoppingList, Category } from '@/types';
import { CATEGORIES, suggestCategory } from '@/lib/categories';
import { Button, Card, Badge, Input, EmptyState } from '@/components/ui';
import {
  subscribeShoppingItems,
  addFirestoreListItem,
  toggleFirestoreListItem,
  updateFirestoreListItemQuantity,
  deleteFirestoreListItem,
  clearCompletedFirestoreListItems,
  shoppingListDoc,
} from '@/lib/firestore';
import { onSnapshot } from 'firebase/firestore';

import { useAuth } from '@/hooks/useAuth';
import { ShareListModal } from '@/components/ShareListModal';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { firebaseUser } = useAuth();

  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');
  const [shareModalVisible, setShareModalVisible] = useState(false);

  // Add Item Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Other');
  const [userSelectedCategory, setUserSelectedCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id) return;

    setLoading(true);

    const unsubDoc = onSnapshot(shoppingListDoc(id), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCurrentList({
          id: snap.id,
          name: data.name || '',
          description: data.description,
          ownerId: data.ownerId,
          ownerEmail: data.ownerEmail,
          memberIds: data.memberIds || [],
          memberEmails: data.memberEmails || [],
          color: data.color || '#6366F1',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      }
    });

    const unsubItems = subscribeShoppingItems(
      id,
      (fetchedItems) => {
        setItems(fetchedItems);
        setLoading(false);
      },
      (err) => {
        console.error('Error subscribing to items:', err);
        setLoading(false);
      }
    );

    return () => {
      unsubDoc();
      unsubItems();
    };
  }, [id]);

  const handleNameChange = (text: string) => {
    setItemName(text);
    if (!userSelectedCategory) {
      const suggested = suggestCategory(text);
      setSelectedCategory(suggested);
    }
  };

  const handleAddItem = async () => {
    if (!itemName.trim() || !id) return;
    setSubmitting(true);
    try {
      await addFirestoreListItem(id, itemName, itemQuantity, selectedCategory);
      setItemName('');
      setItemQuantity(1);
      setSelectedCategory('Other');
      setUserSelectedCategory(false);
      setModalVisible(false);
    } catch (err) {
      console.error('Error adding item', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (item: ShoppingItem) => {
    await toggleFirestoreListItem(item.id, item.isChecked);
  };

  const handleQuantity = async (item: ShoppingItem, delta: number) => {
    await updateFirestoreListItemQuantity(item.id, item.quantity + delta);
  };

  const handleDelete = async (itemId: string) => {
    await deleteFirestoreListItem(itemId);
  };

  const handleClearCompleted = async () => {
    if (!id) return;
    await clearCompletedFirestoreListItems(id);
  };

  const filteredItems = items.filter((item) => {
    if (filterCategory === 'All') return true;
    return item.category === filterCategory;
  });

  const completedCount = items.filter((i) => i.isChecked).length;
  const totalCount = items.length;

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['left', 'right', 'bottom']}>
      <View className="flex-1 px-5 pt-2 max-w-2xl w-full mx-auto">
        {/* Header Bar */}
        <View className="flex-row items-center justify-between pb-4 border-b border-slate-800/80 mb-4">
          <View className="flex-row items-center flex-1 mr-3">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 transition-colors"
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-xl font-bold tracking-tight" numberOfLines={1}>
                {currentList?.name || 'Shopping List'}
              </Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                {totalCount === 0
                  ? '0 items'
                  : `${completedCount} of ${totalCount} completed`}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            <Pressable
              onPress={() => setShareModalVisible(true)}
              className="flex-row items-center px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700"
            >
              <Ionicons name="people-outline" size={16} color="#818CF8" />
              <Text className="text-xs font-semibold text-slate-200 ml-1.5">Share</Text>
              {(currentList?.memberEmails?.length || 0) > 1 && (
                <View className="ml-1.5 px-1.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30">
                  <Text className="text-[10px] font-bold text-indigo-400">
                    {currentList?.memberEmails?.length}
                  </Text>
                </View>
              )}
            </Pressable>

            {completedCount > 0 && (
              <Button
                title="Clear checked"
                onPress={handleClearCompleted}
                variant="ghost"
                size="sm"
                className="text-slate-400"
              />
            )}
            <Button
              title="Add Item"
              onPress={() => setModalVisible(true)}
              variant="primary"
              size="sm"
              leftIcon={<Ionicons name="add" size={16} color="#FFFFFF" />}
            />
          </View>
        </View>

        {/* Category Horizontal Filter Pills */}
        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
            contentContainerStyle={{ paddingVertical: 2 }}
          >
            <Pressable
              onPress={() => setFilterCategory('All')}
              className={`px-3.5 py-1.5 rounded-xl mr-2 border transition-all ${
                filterCategory === 'All'
                  ? 'bg-indigo-600 border-indigo-500 shadow-sm shadow-indigo-600/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filterCategory === 'All' ? 'text-white' : 'text-slate-400'
                }`}
              >
                All ({totalCount})
              </Text>
            </Pressable>

            {CATEGORIES.map((cat) => {
              const count = items.filter((i) => i.category === cat.label).length;
              if (count === 0 && filterCategory !== cat.label) return null;
              const isSelected = filterCategory === cat.label;
              return (
                <Pressable
                  key={cat.label}
                  onPress={() => setFilterCategory(cat.label)}
                  className={`px-3.5 py-1.5 rounded-xl mr-2 border transition-all ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-500 shadow-sm shadow-indigo-600/30'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-white' : 'text-slate-400'
                    }`}
                  >
                    {cat.label} ({count})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Items List */}
        {loading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-slate-400 text-sm mt-3 font-medium">Loading items...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon="basket-outline"
            title={totalCount === 0 ? 'No items in this list' : 'No items match this category'}
            subtitle={
              totalCount === 0
                ? 'Tap "Add Item" above to add products with smart auto-categorization.'
                : 'Switch back to "All" to view all items in this list.'
            }
            action={
              totalCount === 0
                ? {
                    label: 'Add First Item',
                    onPress: () => setModalVisible(true),
                  }
                : undefined
            }
          />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
            renderItem={({ item }) => {
              const catInfo = CATEGORIES.find((c) => c.label === item.category);
              return (
                <View
                  className={`flex-row items-center justify-between p-4 mb-3 rounded-2xl border transition-all ${
                    item.isChecked
                      ? 'bg-slate-900/40 border-slate-800/40 opacity-50'
                      : 'bg-slate-900/90 border-slate-800 shadow-sm hover:border-slate-700'
                  }`}
                >
                  {/* Left: Checkbox & Name */}
                  <Pressable
                    onPress={() => handleToggle(item)}
                    className="flex-row items-center flex-1 mr-3"
                  >
                    <View
                      className={`w-6 h-6 rounded-lg items-center justify-center mr-3 border transition-colors ${
                        item.isChecked
                          ? 'bg-emerald-500 border-emerald-400'
                          : 'border-slate-600 bg-slate-800/80 hover:border-indigo-400'
                      }`}
                    >
                      {item.isChecked && (
                        <Ionicons name="checkmark-bold" size={14} color="#FFFFFF" />
                      )}
                    </View>

                    <View className="flex-1">
                      <Text
                        className={`text-base font-semibold tracking-tight ${
                          item.isChecked
                            ? 'text-slate-500 line-through'
                            : 'text-white'
                        }`}
                      >
                        {item.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Badge
                          label={item.category}
                          customColor={catInfo?.color || '#94A3B8'}
                          size="sm"
                        />
                      </View>
                    </View>
                  </Pressable>

                  {/* Right: Quantity Stepper & Delete */}
                  <View className="flex-row items-center">
                    <View className="flex-row items-center bg-slate-950 rounded-xl border border-slate-800 px-1 py-0.5 mr-2">
                      <Pressable
                        onPress={() => handleQuantity(item, -1)}
                        className="w-7 h-7 items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors"
                      >
                        <Ionicons name="remove" size={14} color="#94A3B8" />
                      </Pressable>
                      <Text className="text-white text-xs font-bold px-2">
                        {item.quantity}
                      </Text>
                      <Pressable
                        onPress={() => handleQuantity(item, 1)}
                        className="w-7 h-7 items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors"
                      >
                        <Ionicons name="add" size={14} color="#94A3B8" />
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => handleDelete(item.id)}
                      hitSlop={10}
                      className="p-2 rounded-xl hover:bg-slate-800 active:bg-slate-700 transition-colors"
                    >
                      <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                    </Pressable>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>

      {/* Add Item Modal */}
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
                  <Ionicons name="basket" size={18} color="#818CF8" />
                </View>
                <Text className="text-white text-lg font-bold">Add Item</Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} className="p-1 rounded-lg hover:bg-slate-800">
                <Ionicons name="close" size={22} color="#94A3B8" />
              </Pressable>
            </View>

            <Input
              label="Item Name"
              value={itemName}
              onChangeText={handleNameChange}
              placeholder="e.g. Organic Bananas, Sourdough Bread"
              autoFocus
            />

            {/* Quantity */}
            <View className="flex-row items-center justify-between mb-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <Text className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                Quantity
              </Text>
              <View className="flex-row items-center bg-slate-900 rounded-xl border border-slate-800 px-2 py-1">
                <Pressable
                  onPress={() => setItemQuantity((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors"
                >
                  <Ionicons name="remove" size={14} color="#FFFFFF" />
                </Pressable>
                <Text className="text-white text-sm font-bold px-3">
                  {itemQuantity}
                </Text>
                <Pressable
                  onPress={() => setItemQuantity((q) => q + 1)}
                  className="w-7 h-7 items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700 transition-colors"
                >
                  <Ionicons name="add" size={14} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {/* Category selection */}
            <Text className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              Category {!userSelectedCategory && itemName ? '(Auto-suggested)' : ''}
            </Text>
            <View className="flex-row flex-wrap gap-2 mb-6">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.label;
                return (
                  <Pressable
                    key={cat.label}
                    onPress={() => {
                      setSelectedCategory(cat.label);
                      setUserSelectedCategory(true);
                    }}
                    className={`px-3 py-1.5 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 shadow-sm shadow-indigo-600/30'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Action buttons */}
            <View className="flex-row justify-end space-x-3">
              <Button
                title="Cancel"
                onPress={() => setModalVisible(false)}
                variant="ghost"
                size="md"
                className="mr-2"
              />
              <Button
                title={submitting ? 'Adding...' : 'Add Item'}
                onPress={handleAddItem}
                disabled={submitting || !itemName.trim()}
                loading={submitting}
                variant="primary"
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Share List Modal */}
      <ShareListModal
        visible={shareModalVisible}
        onClose={() => setShareModalVisible(false)}
        list={currentList}
        currentUserId={firebaseUser?.uid || ''}
        currentUserEmail={firebaseUser?.email || ''}
        onListLeft={() => router.replace('/')}
      />
    </SafeAreaView>
  );
}
