export type Category =
  | 'Fruit & Veg'
  | 'Dairy'
  | 'Meat'
  | 'Bakery'
  | 'Pantry'
  | 'Beverages'
  | 'Household'
  | 'Other';

export interface User {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  createdAt?: any;
  pushTokens?: string[];
}

export interface ShoppingItem {
  id: string;
  listId: string;
  name: string;
  quantity: number;
  category: Category;
  isChecked: boolean;
  createdAt: number;
}

export interface ShoppingList {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  ownerEmail?: string;
  memberIds?: string[];
  memberEmails?: string[];
  color?: string;
  createdAt: number;
  updatedAt: number;
}
