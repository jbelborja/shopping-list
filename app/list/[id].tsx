import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ShoppingItem, ShoppingList, Category } from '@/types';
import { CATEGORIES, suggestCategory, getCategoryLabel } from '@/lib/categories';
import { Button, Card, Badge, Input, EmptyState } from '@/components/ui';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useTranslation } from '@/lib/i18n';
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
  const rawParams = useLocalSearchParams<{ id: string }>();
  const id = Array.isArray(rawParams.id) ? rawParams.id[0] : rawParams.id;
  const router = useRouter();
  const { firebaseUser } = useAuth();
  const { t } = useTranslation();

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

    const unsubDoc = onSnapshot(
      shoppingListDoc(id),
      (snap) => {
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
      },
      (err) => {
        console.warn('Error listening to list doc:', err);
      }
    );

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
    const trimmedName = itemName.trim();
    const currentQty = itemQuantity;
    const currentCat = selectedCategory;

    setItemName('');
    setItemQuantity(1);
    setSelectedCategory('Other');
    setUserSelectedCategory(false);
    setModalVisible(false);

    try {
      const newItemId = await addFirestoreListItem(id, trimmedName, currentQty, currentCat);
      setItems((prev) => {
        if (prev.some((item) => item.id === newItemId)) return prev;
        const newItem: ShoppingItem = {
          id: newItemId,
          listId: id,
          name: trimmedName,
          quantity: Math.max(1, currentQty),
          category: currentCat,
          isChecked: false,
          createdAt: Date.now(),
        };
        return [newItem, ...prev];
      });
    } catch (e: any) {
      console.error('Failed to add item', e);
      Alert.alert(t('common.error') || 'Error', e?.message || 'Failed to add item to Firestore');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleItem = async (itemId: string, currentState: boolean) => {
    setItems((prev) =>
      prev.map((i) => (i.id === itemId ? { ...i, isChecked: !currentState } : i))
    );
    try {
      await toggleFirestoreListItem(itemId, currentState);
    } catch (e) {
      console.error('Failed to toggle item', e);
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, isChecked: currentState } : i))
      );
    }
  };

  const handleUpdateQuantity = async (itemId: string, newQty: number) => {
    if (newQty <= 0) {
      setItems((prev) => prev.filter((i) => i.id !== itemId));
      try {
        await deleteFirestoreListItem(itemId);
      } catch (e) {
        console.error('Failed to delete item', e);
      }
    } else {
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i))
      );
      try {
        await updateFirestoreListItemQuantity(itemId, newQty);
      } catch (e) {
        console.error('Failed to update quantity', e);
      }
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await deleteFirestoreListItem(itemId);
    } catch (e) {
      console.error('Failed to delete item', e);
    }
  };

  const handleClearCompleted = async () => {
    if (!id) return;
    setItems((prev) => prev.filter((i) => !i.isChecked));
    try {
      await clearCompletedFirestoreListItems(id);
    } catch (e) {
      console.error('Failed to clear completed items', e);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterCategory === 'All') return true;
    return item.category === filterCategory;
  });

  const completedCount = items.filter((i) => i.isChecked).length;
  const totalCount = items.length;

  const ownerEmail = (currentList?.ownerEmail || '').toLowerCase().trim();
  const rawMembers = currentList?.memberEmails || [];
  const allCollaborators = Array.from(
    new Set(
      [ownerEmail, ...rawMembers]
        .map((e) => e.toLowerCase().trim())
        .filter((e) => e.length > 0)
    )
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-950" edges={['top', 'left', 'right', 'bottom']}>
      <View className="flex-1 px-4 pt-2 max-w-2xl w-full mx-auto">
        {/* Top Navigation Bar */}
        <View className="flex-row items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
          <View className="flex-row items-center flex-1 mr-3 min-w-0">
            <Pressable
              onPress={() => router.back()}
              className="mr-3 p-2 -ml-1 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 active:bg-slate-700 transition-colors"
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
            <View className="flex-1 min-w-0">
              <Text className="text-white text-xl font-bold tracking-tight" numberOfLines={1}>
                {currentList?.name || t('listDetail.title')}
              </Text>
            </View>
          </View>
          <LanguageToggle />
        </View>

        {/* Collaborators Bar */}
        <View className="mb-3 bg-slate-900/80 border border-slate-800 rounded-2xl p-3">
          <View className="flex-row items-center justify-between mb-2">
            <View className="flex-row items-center">
              <Ionicons name="people-outline" size={15} color="#818CF8" />
              <Text className="text-slate-300 text-xs font-bold ml-1.5 uppercase tracking-wider">
                {t('listDetail.sharedWith')} ({allCollaborators.length})
              </Text>
            </View>
            <Pressable
              onPress={() => setShareModalVisible(true)}
              className="flex-row items-center px-2.5 py-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 hover:bg-indigo-600/30 active:bg-indigo-600/40"
            >
              <Ionicons name="person-add-outline" size={13} color="#818CF8" />
              <Text className="text-xs font-semibold text-indigo-400 ml-1">
                {t('listDetail.share')}
              </Text>
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {allCollaborators.map((email) => {
              const isListOwner = email.toLowerCase() === ownerEmail.toLowerCase();
              const isMe = email.toLowerCase() === (firebaseUser?.email || '').toLowerCase();
              const initial = (email[0] || '?').toUpperCase();
              const displayName = email.split('@')[0];

              return (
                <View
                  key={email}
                  className={`flex-row items-center mr-2 px-2.5 py-1 rounded-xl border ${
                    isListOwner
                      ? 'bg-amber-500/10 border-amber-500/30'
                      : isMe
                      ? 'bg-indigo-500/10 border-indigo-500/30'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <View
                    className={`w-4 h-4 rounded-full items-center justify-center mr-1.5 ${
                      isListOwner ? 'bg-amber-500/30' : isMe ? 'bg-indigo-500/30' : 'bg-slate-800'
                    }`}
                  >
                    <Text
                      className={`text-[9px] font-bold ${
                        isListOwner ? 'text-amber-300' : isMe ? 'text-indigo-300' : 'text-slate-300'
                      }`}
                    >
                      {initial}
                    </Text>
                  </View>
                  <Text className="text-xs text-slate-200 font-medium" numberOfLines={1}>
                    {displayName} {isListOwner ? '👑' : ''} {isMe ? t('share.you') : ''}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>

        {/* Progress & Action Controls Row */}
        <View className="flex-row items-center justify-between mb-3 gap-2">
          <View className="flex-1 min-w-0 mr-2">
            <Text className="text-slate-400 text-xs font-medium" numberOfLines={1}>
              {totalCount === 0
                ? t('lists.emptyList')
                : t('listDetail.progress', { completed: completedCount, total: totalCount })}
            </Text>
          </View>

          <View className="flex-row items-center gap-2 shrink-0">
            {completedCount > 0 && (
              <Button
                title={t('listDetail.clearChecked')}
                onPress={handleClearCompleted}
                variant="ghost"
                size="sm"
                className="text-slate-400"
              />
            )}
            <Button
              title={t('listDetail.addItem')}
              onPress={() => setModalVisible(true)}
              variant="primary"
              size="sm"
              leftIcon={<Ionicons name="add" size={16} color="#FFFFFF" />}
            />
          </View>
        </View>

        {/* Category Horizontal Filter Pills */}
        <View className="mb-3">
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
                {t('listDetail.allCategories')}
              </Text>
            </Pressable>

            {CATEGORIES.map((cat) => {
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
                    {getCategoryLabel(cat.label, t)}
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
            <Text className="text-slate-400 text-sm mt-3 font-medium">{t('common.loading')}</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <EmptyState
            icon="cart-outline"
            title={t('listDetail.emptyTitle')}
            subtitle={t('listDetail.emptySubtitle')}
            action={{
              label: t('listDetail.addItem'),
              onPress: () => setModalVisible(true),
            }}
          />
        ) : (
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => {
              const catObj = CATEGORIES.find((c) => c.label === item.category) || CATEGORIES[7];
              return (
                <Card
                  className={`mb-3 p-4 rounded-2xl border transition-all ${
                    item.isChecked
                      ? 'bg-slate-900/40 border-slate-800/40 opacity-70'
                      : 'bg-slate-900/90 border-slate-800'
                  }`}
                >
                  <View className="flex-row items-center justify-between">
                    {/* Checkbox & Item Name */}
                    <Pressable
                      onPress={() => handleToggleItem(item.id, item.isChecked)}
                      className="flex-row items-center flex-1 mr-2 min-w-0"
                    >
                      <View
                        className={`w-6 h-6 rounded-lg items-center justify-center mr-3 shrink-0 border transition-colors ${
                          item.isChecked
                            ? 'bg-emerald-500 border-emerald-400 shadow-sm shadow-emerald-500/20'
                            : 'border-slate-700 bg-slate-950/60'
                        }`}
                      >
                        {item.isChecked && (
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        )}
                      </View>
                      <View className="flex-1 min-w-0">
                        <Text
                          numberOfLines={2}
                          className={`text-base font-semibold leading-5 ${
                            item.isChecked
                              ? 'line-through text-slate-500'
                              : 'text-slate-100'
                          }`}
                        >
                          {item.name}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <View
                            className="w-2 h-2 rounded-full mr-1.5 shrink-0"
                            style={{ backgroundColor: catObj.color }}
                          />
                          <Text className="text-slate-400 text-[11px] font-medium" numberOfLines={1}>
                            {getCategoryLabel(item.category, t)}
                          </Text>
                        </View>
                      </View>
                    </Pressable>

                    {/* Quantity Stepper & Delete */}
                    <View className="flex-row items-center space-x-1.5 shrink-0">
                      <View className="flex-row items-center bg-slate-950/80 rounded-xl border border-slate-800/80 px-1.5 py-1">
                        <Pressable
                          onPress={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700"
                        >
                          <Ionicons name="remove" size={13} color="#94A3B8" />
                        </Pressable>
                        <Text className="text-white text-xs font-bold px-1.5">
                          {item.quantity}
                        </Text>
                        <Pressable
                          onPress={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 items-center justify-center rounded-lg hover:bg-slate-800 active:bg-slate-700"
                        >
                          <Ionicons name="add" size={13} color="#94A3B8" />
                        </Pressable>
                      </View>

                      <Pressable
                        onPress={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg hover:bg-slate-800 active:bg-slate-700 ml-0.5"
                      >
                        <Ionicons name="trash-outline" size={16} color="#64748B" />
                      </Pressable>
                    </View>
                  </View>
                </Card>
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
                <Text className="text-white text-lg font-bold">{t('listDetail.addItemModalTitle')}</Text>
              </View>
              <Pressable onPress={() => setModalVisible(false)} className="p-1 rounded-lg hover:bg-slate-800">
                <Ionicons name="close" size={22} color="#94A3B8" />
              </Pressable>
            </View>

            <Input
              label={t('listDetail.itemNameLabel')}
              value={itemName}
              onChangeText={handleNameChange}
              placeholder={t('listDetail.itemNamePlaceholder')}
              autoFocus
            />

            {/* Quantity */}
            <View className="flex-row items-center justify-between mb-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3">
              <Text className="text-slate-300 text-xs font-semibold uppercase tracking-wider">
                {t('listDetail.quantityLabel')}
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
              {t('listDetail.categoryLabel')} {!userSelectedCategory && itemName ? ` ${t('listDetail.autoCategory')}` : ''}
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
                      {getCategoryLabel(cat.label, t)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Action buttons */}
            <View className="flex-row justify-end space-x-3">
              <Button
                title={t('common.cancel')}
                onPress={() => setModalVisible(false)}
                variant="ghost"
                size="md"
                className="mr-2"
              />
              <Button
                title={submitting ? t('listDetail.adding') : t('listDetail.addItem')}
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
