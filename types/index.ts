export type Category =
  | 'Fruit & Veg'
  | 'Dairy'
  | 'Meat'
  | 'Bakery'
  | 'Pantry'
  | 'Beverages'
  | 'Household'
  | 'Other';

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
  color?: string;
  createdAt: number;
  updatedAt: number;
}
