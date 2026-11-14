import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShoppingItem, ShoppingList, Category } from '@/types';
import { suggestCategory } from './categories';

const LISTS_KEY = '@shopping_lists_v1';
const ITEMS_KEY = '@shopping_items_v1';

const INITIAL_LISTS: ShoppingList[] = [
  {
    id: 'list-weekly-groceries',
    name: 'Weekly Groceries',
    description: 'Essentials for this week',
    color: '#E94560',
    ownerId: 'local',
    createdAt: Date.now() - 1000 * 60 * 60 * 24 * 2,
    updatedAt: Date.now(),
  },
  {
    id: 'list-party-supplies',
    name: 'Weekend BBQ & Party',
    description: 'Drinks, snacks and BBQ ingredients',
    color: '#3B82F6',
    ownerId: 'local',
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now(),
  },
];

const INITIAL_ITEMS: ShoppingItem[] = [
  {
    id: 'item-1',
    listId: 'list-weekly-groceries',
    name: 'Fresh Milk 2L',
    quantity: 2,
    category: 'Dairy',
    isChecked: true,
    createdAt: Date.now() - 3600000,
  },
  {
    id: 'item-2',
    listId: 'list-weekly-groceries',
    name: 'Organic Bananas',
    quantity: 6,
    category: 'Fruit & Veg',
    isChecked: false,
    createdAt: Date.now() - 3000000,
  },
  {
    id: 'item-3',
    listId: 'list-weekly-groceries',
    name: 'Sourdough Bread',
    quantity: 1,
    category: 'Bakery',
    isChecked: false,
    createdAt: Date.now() - 2500000,
  },
  {
    id: 'item-4',
    listId: 'list-party-supplies',
    name: 'Sparkling Mineral Water',
    quantity: 4,
    category: 'Beverages',
    isChecked: false,
    createdAt: Date.now() - 1500000,
  },
  {
    id: 'item-5',
    listId: 'list-party-supplies',
    name: 'Angus Burger Patties',
    quantity: 8,
    category: 'Meat',
    isChecked: false,
    createdAt: Date.now() - 1000000,
  },
];

export async function getLists(): Promise<ShoppingList[]> {
  try {
    const raw = await AsyncStorage.getItem(LISTS_KEY);
    if (!raw) {
      await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(INITIAL_LISTS));
      await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(INITIAL_ITEMS));
      return INITIAL_LISTS;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load lists:', err);
    return INITIAL_LISTS;
  }
}

export async function createList(name: string, description?: string): Promise<ShoppingList> {
  const lists = await getLists();
  const newList: ShoppingList = {
    id: `list-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name: name.trim(),
    description: description?.trim() || undefined,
    color: '#E94560',
    ownerId: 'local',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  const updated = [newList, ...lists];
  await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(updated));
  return newList;
}

export async function deleteList(id: string): Promise<void> {
  const lists = await getLists();
  const filteredLists = lists.filter((l) => l.id !== id);
  await AsyncStorage.setItem(LISTS_KEY, JSON.stringify(filteredLists));

  // Also remove all items belonging to this list
  const allItems = await getAllItems();
  const filteredItems = allItems.filter((i) => i.listId !== id);
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(filteredItems));
}

async function getAllItems(): Promise<ShoppingItem[]> {
  try {
    const raw = await AsyncStorage.getItem(ITEMS_KEY);
    return raw ? JSON.parse(raw) : INITIAL_ITEMS;
  } catch {
    return INITIAL_ITEMS;
  }
}

export async function getItemsByList(listId: string): Promise<ShoppingItem[]> {
  const all = await getAllItems();
  return all.filter((i) => i.listId === listId);
}

export async function addItem(
  listId: string,
  name: string,
  quantity = 1,
  category?: Category
): Promise<ShoppingItem> {
  const all = await getAllItems();
  const detectedCategory = category || suggestCategory(name);
  const newItem: ShoppingItem = {
    id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    listId,
    name: name.trim(),
    quantity: Math.max(1, quantity),
    category: detectedCategory,
    isChecked: false,
    createdAt: Date.now(),
  };
  const updated = [newItem, ...all];
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
  return newItem;
}

export async function toggleItemChecked(itemId: string): Promise<ShoppingItem[]> {
  const all = await getAllItems();
  const updated = all.map((item) =>
    item.id === itemId ? { ...item, isChecked: !item.isChecked } : item
  );
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
  return updated;
}

export async function updateItemQuantity(itemId: string, delta: number): Promise<ShoppingItem[]> {
  const all = await getAllItems();
  const updated = all.map((item) => {
    if (item.id === itemId) {
      const newQty = Math.max(1, item.quantity + delta);
      return { ...item, quantity: newQty };
    }
    return item;
  });
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(updated));
  return updated;
}

export async function deleteItem(itemId: string): Promise<ShoppingItem[]> {
  const all = await getAllItems();
  const filtered = all.filter((item) => item.id !== itemId);
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(filtered));
  return filtered;
}

export async function clearCompletedItems(listId: string): Promise<ShoppingItem[]> {
  const all = await getAllItems();
  const filtered = all.filter((item) => !(item.listId === listId && item.isChecked));
  await AsyncStorage.setItem(ITEMS_KEY, JSON.stringify(filtered));
  return filtered;
}
