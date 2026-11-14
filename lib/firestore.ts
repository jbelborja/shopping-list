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
  arrayUnion,
  arrayRemove,
  limit,
  CollectionReference,
  DocumentReference,
} from 'firebase/firestore';
import { db } from './firebase';
import { ShoppingList, ShoppingItem, User } from '@/types';

// Re-export setDoc for auth/sync helpers
export { setDoc };

// Collections
export const usersCollection = collection(db, 'users') as CollectionReference<User>;
export const userDoc = (uid: string) => doc(db, 'users', uid) as DocumentReference<User>;

export const shoppingListsCollection = collection(db, 'shopping_lists');
export const shoppingListDoc = (id: string) => doc(db, 'shopping_lists', id);

export const shoppingItemsCollection = collection(db, 'shopping_items');
export const shoppingItemDoc = (id: string) => doc(db, 'shopping_items', id);

function parseListDoc(d: { id: string; data: () => any }): ShoppingList {
  const data = d.data();
  return {
    id: d.id,
    name: data.name || '',
    description: data.description,
    ownerId: data.ownerId || '',
    ownerEmail: data.ownerEmail,
    memberIds: data.memberIds || [],
    memberEmails: data.memberEmails || [],
    color: data.color || '#6366F1',
    createdAt: data.createdAt || Date.now(),
    updatedAt: data.updatedAt || Date.now(),
  };
}

// Realtime subscription for shopping lists owned by or shared with user
export function subscribeShoppingLists(
  userId: string,
  userEmail: string | null | undefined,
  onUpdate: (lists: ShoppingList[]) => void,
  onError?: (err: Error) => void
) {
  const ownedMap = new Map<string, ShoppingList>();
  const sharedMap = new Map<string, ShoppingList>();

  const emit = () => {
    const combined = new Map<string, ShoppingList>();
    // Add owned lists
    ownedMap.forEach((l, id) => combined.set(id, l));
    // Add shared lists
    sharedMap.forEach((l, id) => combined.set(id, l));

    const sorted = Array.from(combined.values()).sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0)
    );
    onUpdate(sorted);
  };

  // 1. Listen for lists owned by userId
  const qOwned = query(
    shoppingListsCollection,
    where('ownerId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  const unsubOwned = onSnapshot(
    qOwned,
    (snapshot) => {
      ownedMap.clear();
      snapshot.forEach((d) => {
        ownedMap.set(d.id, parseListDoc(d));
      });
      emit();
    },
    (err) => {
      console.warn('subscribeShoppingLists owned error:', err);
      onError?.(err);
    }
  );

  // 2. If userEmail is provided, also listen for lists where memberEmails contains userEmail
  let unsubShared = () => {};
  const normalizedEmail = userEmail ? userEmail.trim().toLowerCase() : null;

  if (normalizedEmail) {
    const qShared = query(
      shoppingListsCollection,
      where('memberEmails', 'array-contains', normalizedEmail)
    );

    unsubShared = onSnapshot(
      qShared,
      (snapshot) => {
        sharedMap.clear();
        snapshot.forEach((d) => {
          sharedMap.set(d.id, parseListDoc(d));
        });
        emit();
      },
      (err) => {
        console.warn('subscribeShoppingLists shared error:', err);
        // Non-blocking for owned lists
      }
    );
  }

  return () => {
    unsubOwned();
    unsubShared();
  };
}

export async function createFirestoreList(
  userId: string,
  userEmail: string | null | undefined,
  name: string,
  description?: string
): Promise<string> {
  const emailNorm = userEmail ? userEmail.trim().toLowerCase() : '';
  const memberEmails = emailNorm ? [emailNorm] : [];

  const docRef = await addDoc(shoppingListsCollection, {
    name: name.trim(),
    description: description?.trim() || '',
    ownerId: userId,
    ownerEmail: emailNorm,
    memberIds: [userId],
    memberEmails,
    color: '#6366F1',
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

// Share list with a user by email
export async function shareListWithEmail(
  listId: string,
  targetEmail: string
): Promise<{ success: boolean; message: string }> {
  const emailNorm = targetEmail.trim().toLowerCase();
  if (!emailNorm || !emailNorm.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }

  // Get current list document to verify state
  const listSnap = await getDoc(shoppingListDoc(listId));
  if (!listSnap.exists()) {
    throw new Error('List not found.');
  }
  const data = listSnap.data();
  const currentEmails: string[] = data.memberEmails || [];
  if (currentEmails.map((e) => e.toLowerCase()).includes(emailNorm)) {
    return { success: true, message: 'This user is already a member.' };
  }

  // Search if user exists in registered users collection
  const qUser = query(usersCollection, where('email', '==', emailNorm), limit(1));
  const userSnap = await getDocs(qUser);
  const matchedUid = !userSnap.empty ? userSnap.docs[0].id : null;

  const updateData: Record<string, any> = {
    memberEmails: arrayUnion(emailNorm),
    updatedAt: Date.now(),
  };

  if (matchedUid) {
    updateData.memberIds = arrayUnion(matchedUid);
  }

  await updateDoc(shoppingListDoc(listId), updateData);
  return {
    success: true,
    message: matchedUid
      ? `List shared with ${emailNorm}.`
      : `List shared with ${emailNorm}. They will see this list when they sign in.`,
  };
}

// Remove member from list (by owner)
export async function removeMemberFromList(
  listId: string,
  targetEmail: string
): Promise<void> {
  const emailNorm = targetEmail.trim().toLowerCase();
  const qUser = query(usersCollection, where('email', '==', emailNorm), limit(1));
  const userSnap = await getDocs(qUser);
  const matchedUid = !userSnap.empty ? userSnap.docs[0].id : null;

  const updateData: Record<string, any> = {
    memberEmails: arrayRemove(emailNorm),
    updatedAt: Date.now(),
  };

  if (matchedUid) {
    updateData.memberIds = arrayRemove(matchedUid);
  }

  await updateDoc(shoppingListDoc(listId), updateData);
}

// Leave a shared list (by member)
export async function leaveSharedList(
  listId: string,
  userId: string,
  userEmail: string
): Promise<void> {
  const emailNorm = userEmail.trim().toLowerCase();
  await updateDoc(shoppingListDoc(listId), {
    memberIds: arrayRemove(userId),
    memberEmails: arrayRemove(emailNorm),
    updatedAt: Date.now(),
  });
}
