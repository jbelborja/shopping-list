import {
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import { ShoppingList, ShoppingItem, User } from '@/types';

// Collections
export const usersCollection = collection(db, 'users') as CollectionReference<User>;
export const userDoc = (uid: string) => doc(db, 'users', uid) as DocumentReference<User>;

export const shoppingListsCollection = collection(db, 'shopping_lists');
export const shoppingListDoc = (id: string) => doc(db, 'shopping_lists', id);

export const shoppingItemsCollection = collection(db, 'shopping_items');
export const shoppingItemDoc = (id: string) => doc(db, 'shopping_items', id);

// Realtime subscription for shopping lists owned by or shared with user
export function subscribeShoppingLists(
  userId: string,
  onUpdate: (lists: ShoppingList[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(
    shoppingListsCollection,
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const lists: ShoppingList[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        lists.push({
          id: d.id,
          name: data.name || '',
          description: data.description,
          ownerId: data.ownerId || userId,
          memberIds: data.memberIds || [],
          color: data.color || '#E94560',
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now(),
        });
      });
      onUpdate(lists);
    },
    (error) => {
      console.warn('subscribeShoppingLists error:', error);
      onError?.(error);
    }
  );
}

export async function createFirestoreList(
  userId: string,
  name: string,
  description?: string
): Promise<string> {
  const docRef = await addDoc(shoppingListsCollection, {
    name: name.trim(),
    description: description?.trim() || '',
    ownerId: userId,
    memberIds: [userId],
    color: '#E94560',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });
  return docRef.id;
}

export async function deleteFirestoreList(listId: string): Promise<void> {
  // Delete the list document
  await deleteDoc(shoppingListDoc(listId));

  // Also delete all items in this list
  const q = query(shoppingItemsCollection, where('listId', '==', listId));
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.forEach((d) => {
    batch.delete(d.ref);
  });
  await batch.commit();
}

// Realtime subscription for items within a list
export function subscribeShoppingItems(
  listId: string,
  onUpdate: (items: ShoppingItem[]) => void,
  onError?: (err: Error) => void
) {
  const q = query(
    shoppingItemsCollection,
    where('listId', '==', listId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ShoppingItem[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        items.push({
          id: d.id,
          listId: data.listId,
          name: data.name,
          quantity: data.quantity || 1,
          category: data.category || 'Other',
          isChecked: Boolean(data.isChecked),
          createdAt: data.createdAt || Date.now(),
        });
      });
      onUpdate(items);
    },
    (error) => {
      console.warn('subscribeShoppingItems error:', error);
      onError?.(error);
    }
  );
}

export async function addFirestoreListItem(
  listId: string,
  name: string,
  quantity = 1,
  category = 'Other'
): Promise<string> {
  const docRef = await addDoc(shoppingItemsCollection, {
    listId,
    name: name.trim(),
    quantity: Math.max(1, quantity),
    category,
    isChecked: false,
    createdAt: Date.now(),
  });
  return docRef.id;
}

export async function toggleFirestoreListItem(itemId: string, currentState: boolean): Promise<void> {
  await updateDoc(shoppingItemDoc(itemId), {
    isChecked: !currentState,
  });
}

export async function updateFirestoreListItemQuantity(itemId: string, newQuantity: number): Promise<void> {
  await updateDoc(shoppingItemDoc(itemId), {
    quantity: Math.max(1, newQuantity),
  });
}

export async function deleteFirestoreListItem(itemId: string): Promise<void> {
  await deleteDoc(shoppingItemDoc(itemId));
}

export async function clearCompletedFirestoreListItems(listId: string): Promise<void> {
  const q = query(
    shoppingItemsCollection,
    where('listId', '==', listId),
    where('isChecked', '==', true)
  );
  const snapshot = await getDocs(q);
  const batch = writeBatch(db);
  snapshot.forEach((d) => {
    batch.delete(d.ref);
  });
  await batch.commit();
}
