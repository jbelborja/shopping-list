import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingItem, ShoppingList, Category } from '@/types';
import { CATEGORIES, suggestCategory } from '@/lib/categories';
import {
  getLists,
  getItemsByList,
  addItem,
  toggleItemChecked,
  updateItemQuantity,
  deleteItem,
  clearCompletedItems,
} from '@/lib/storage';

export default function ListDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState<Category | 'All'>('All');

  // Add Item Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<Category>('Other');
  const [userSelectedCategory, setUserSelectedCategory] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const allLists = await getLists();
      const list = allLists.find((l) => l.id === id);
      setCurrentList(list || null);

      const listItems = await getItemsByList(id);
      setItems(listItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      await addItem(id, itemName, itemQuantity, selectedCategory);
      setItemName('');
      setItemQuantity(1);
      setSelectedCategory('Other');
      setUserSelectedCategory(false);
      setModalVisible(false);
      await loadData();
    } catch (err) {
      console.error('Error adding item', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (itemId: string) => {
    await toggleItemChecked(itemId);
    loadData();
  };

  const handleQuantity = async (itemId: string, delta: number) => {
    await updateItemQuantity(itemId, delta);
    loadData();
  };

  const handleDelete = async (itemId: string) => {
    await deleteItem(itemId);
    loadData();
  };

  const handleClearCompleted = async () => {
    if (!id) return;
    await clearCompletedItems(id);
    loadData();
  };

  const filteredItems = items.filter((item) => {
    if (filterCategory === 'All') return true;
    return item.category === filterCategory;
  });

  const completedCount = items.filter((i) => i.isChecked).length;
  const totalCount = items.length;

  return (
    <SafeAreaView className="flex-1 bg-[#1A1A2E]" edges={['left', 'right', 'bottom']}>
      <View className="flex-1 px-5 pt-3 max-w-2xl w-full mx-auto">
        {/* Header Bar */}
        <View className="flex-row items-center justify-between pb-4 border-b border-[#2E3D60]/50 mb-4">
          <View className="flex-row items-center flex-1 mr-2">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-2 rounded-xl active:bg-white/10"
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </Pressable>
            <View className="flex-1">
              <Text className="text-white text-2xl font-bold tracking-tight" numberOfLines={1}>
                {currentList?.name || 'Shopping List'}
              </Text>
              <Text className="text-gray-400 text-xs mt-0.5">
                {totalCount === 0
                  ? '0 items'
                  : `${completedCount} of ${totalCount} completed`}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center space-x-2">
            {completedCount > 0 && (
              <Pressable
                onPress={handleClearCompleted}
                className="px-3 py-2 rounded-lg bg-[#2E3D60]/50 active:bg-[#2E3D60] mr-2"
              >
                <Text className="text-gray-300 text-xs font-medium">Clear done</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => setModalVisible(true)}
              className="bg-accent flex-row items-center px-3.5 py-2 rounded-xl active:bg-accentHover shadow-md"
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text className="text-white font-bold text-xs ml-1">Add Item</Text>
            </Pressable>
          </View>
        </View>

        {/* Category Horizontal Filter */}
        <View className="mb-4">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="flex-row"
            contentContainerStyle={{ paddingVertical: 4 }}
          >
            <Pressable
              onPress={() => setFilterCategory('All')}
              className={`px-3.5 py-1.5 rounded-full mr-2 border ${
                filterCategory === 'All'
                  ? 'bg-accent border-accent'
                  : 'bg-[#16213E] border-[#2E3D60]'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  filterCategory === 'All' ? 'text-white' : 'text-gray-400'
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
                  className={`px-3 py-1.5 rounded-full mr-2 border ${
                    isSelected
                      ? 'bg-accent border-accent'
                      : 'bg-[#16213E] border-[#2E3D60]'
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      isSelected ? 'text-white' : 'text-gray-400'
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
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#E94560" />
            <Text className="text-gray-400 text-sm mt-3">Loading items...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View className="flex-1 items-center justify-center px-4">
            <View className="w-16 h-16 rounded-full bg-[#16213E] items-center justify-center mb-3">
              <Ionicons name="basket-outline" size={30} color="#E94560" />
            </View>
            <Text className="text-white text-lg font-bold text-center">
              {totalCount === 0 ? 'No items in this list' : 'No items in this category'}
            </Text>
            <Text className="text-gray-400 text-sm text-center mt-1 max-w-xs">
              {totalCount === 0
                ? 'Tap "Add Item" above to add products with auto-categorization.'
                : 'Switch back to "All" to view your whole list.'}
            </Text>
          </View>
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
                      ? 'bg-[#16213E]/50 border-[#2E3D60]/40 opacity-60'
                      : 'bg-[#16213E] border-[#2E3D60]'
                  }`}
                >
                  {/* Left: Checkbox & Name */}
                  <Pressable
                    onPress={() => handleToggle(item.id)}
                    className="flex-row items-center flex-1 mr-3"
                  >
                    <View
                      className={`w-6 h-6 rounded-md items-center justify-center mr-3 border ${
                        item.isChecked
                          ? 'bg-accent border-accent'
                          : 'border-gray-500 bg-transparent'
                      }`}
                    >
                      {item.isChecked && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </View>

                    <View className="flex-1">
                      <Text
                        className={`text-base font-semibold ${
                          item.isChecked
                            ? 'text-gray-400 line-through'
                            : 'text-white'
                        }`}
                      >
                        {item.name}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <View
                          className="px-2 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${catInfo?.color || '#6B7280'}20`,
                          }}
                        >
                          <Text
                            className="text-[11px] font-medium"
                            style={{ color: catInfo?.color || '#9CA3AF' }}
                          >
                            {item.category}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </Pressable>

                  {/* Right: Quantity Stepper & Delete */}
                  <View className="flex-row items-center">
                    <View className="flex-row items-center bg-[#1A1A2E] rounded-xl border border-[#2E3D60] px-1 py-0.5 mr-2">
                      <Pressable
                        onPress={() => handleQuantity(item.id, -1)}
                        className="w-7 h-7 items-center justify-center rounded-lg active:bg-white/10"
                      >
                        <Ionicons name="remove" size={14} color="#94A3B8" />
                      </Pressable>
                      <Text className="text-white text-xs font-bold px-2">
                        {item.quantity}
                      </Text>
                      <Pressable
                        onPress={() => handleQuantity(item.id, 1)}
                        className="w-7 h-7 items-center justify-center rounded-lg active:bg-white/10"
                      >
                        <Ionicons name="add" size={14} color="#94A3B8" />
                      </Pressable>
                    </View>

                    <Pressable
                      onPress={() => handleDelete(item.id)}
                      hitSlop={10}
                      className="p-2 rounded-full hover:bg-white/10 active:bg-white/10"
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
        <View className="flex-1 bg-black/70 items-center justify-center p-4">
          <View className="bg-[#16213E] border border-[#2E3D60] rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-xl font-bold">Add Item</Text>
              <Pressable onPress={() => setModalVisible(false)} className="p-1">
                <Ionicons name="close" size={24} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Item Name */}
            <Text className="text-gray-300 text-sm mb-1.5 font-medium">Item Name</Text>
            <TextInput
              value={itemName}
              onChangeText={handleNameChange}
              placeholder="e.g. Apples, Milk, Olive Oil"
              placeholderTextColor="#64748B"
              className="bg-[#1A1A2E] border border-[#2E3D60] text-white px-4 py-3 rounded-xl mb-4 font-normal"
              autoFocus
            />

            {/* Quantity */}
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-gray-300 text-sm font-medium">Quantity</Text>
              <View className="flex-row items-center bg-[#1A1A2E] rounded-xl border border-[#2E3D60] px-2 py-1">
                <Pressable
                  onPress={() => setItemQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 items-center justify-center rounded-lg active:bg-white/10"
                >
                  <Ionicons name="remove" size={16} color="#FFFFFF" />
                </Pressable>
                <Text className="text-white text-base font-bold px-4">
                  {itemQuantity}
                </Text>
                <Pressable
                  onPress={() => setItemQuantity((q) => q + 1)}
                  className="w-8 h-8 items-center justify-center rounded-lg active:bg-white/10"
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </View>

            {/* Category selection */}
            <Text className="text-gray-300 text-sm mb-2 font-medium">
              Category {!userSelectedCategory && itemName ? '(Auto-detected)' : ''}
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
                    className={`px-3 py-1.5 rounded-xl border ${
                      isSelected
                        ? 'bg-accent border-accent'
                        : 'bg-[#1A1A2E] border-[#2E3D60]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-semibold ${
                        isSelected ? 'text-white' : 'text-gray-300'
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
              <Pressable
                onPress={() => setModalVisible(false)}
                className="px-5 py-3 rounded-xl bg-transparent active:bg-white/5 mr-2"
              >
                <Text className="text-gray-400 font-semibold">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleAddItem}
                disabled={submitting || !itemName.trim()}
                className={`px-6 py-3 rounded-xl bg-accent ${
                  !itemName.trim() ? 'opacity-50' : 'active:bg-accentHover'
                }`}
              >
                <Text className="text-white font-bold">
                  {submitting ? 'Adding...' : 'Add Item'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
