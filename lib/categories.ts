import { Category } from '@/types';

export const CATEGORIES: { label: Category; icon: string; color: string }[] = [
  { label: 'Fruit & Veg', icon: 'nutrition-outline', color: '#10B981' },
  { label: 'Dairy', icon: 'water-outline', color: '#3B82F6' },
  { label: 'Meat', icon: 'restaurant-outline', color: '#EF4444' },
  { label: 'Bakery', icon: 'cafe-outline', color: '#F59E0B' },
  { label: 'Pantry', icon: 'file-tray-stacked-outline', color: '#8B5CF6' },
  { label: 'Beverages', icon: 'wine-outline', color: '#06B6D4' },
  { label: 'Household', icon: 'home-outline', color: '#EC4899' },
  { label: 'Other', icon: 'cube-outline', color: '#6B7280' },
];

const KEYWORD_MAP: Record<Category, string[]> = {
  'Fruit & Veg': ['apple', 'banana', 'tomato', 'potato', 'carrot', 'onion', 'fruit', 'veg', 'salad', 'lettuce', 'berry', 'strawberry', 'lemon', 'orange', 'avocado'],
  'Dairy': ['milk', 'cheese', 'yogurt', 'butter', 'egg', 'cream', 'parmesan', 'mozzarella'],
  'Meat': ['chicken', 'beef', 'pork', 'steak', 'ham', 'bacon', 'sausage', 'turkey', 'fish', 'salmon', 'tuna'],
  'Bakery': ['bread', 'bagel', 'croissant', 'bun', 'muffin', 'bakery', 'toast', 'baguette', 'cake', 'cookies'],
  'Pantry': ['pasta', 'rice', 'flour', 'sugar', 'salt', 'oil', 'pantry', 'sauce', 'cereal', 'beans', 'lentils', 'spice', 'pepper'],
  'Beverages': ['water', 'juice', 'soda', 'coke', 'beer', 'wine', 'coffee', 'tea', 'drink'],
  'Household': ['soap', 'shampoo', 'paper', 'cleaner', 'detergent', 'bleach', 'sponge', 'trash', 'napkin', 'tissue'],
  'Other': [],
};

export function suggestCategory(itemName: string): Category {
  const lower = itemName.trim().toLowerCase();
  for (const [category, keywords] of Object.entries(KEYWORD_MAP) as [Category, string[]][]) {
    if (keywords.some((k) => lower.includes(k))) {
      return category;
    }
  }
  return 'Other';
}
