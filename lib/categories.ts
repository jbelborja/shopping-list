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
  'Fruit & Veg': [
    'apple', 'banana', 'tomato', 'potato', 'carrot', 'onion', 'fruit', 'veg', 'salad', 'lettuce', 'berry', 'strawberry', 'lemon', 'orange', 'avocado',
    'manzana', 'platano', 'plátano', 'tomate', 'patata', 'papa', 'zanahoria', 'cebolla', 'fruta', 'verdura', 'ensalada', 'lechuga', 'fresa', 'limon', 'limón', 'naranja', 'aguacate', 'pera', 'uva', 'sandia', 'sandía', 'melon', 'melón'
  ],
  'Dairy': [
    'milk', 'cheese', 'yogurt', 'butter', 'egg', 'cream', 'parmesan', 'mozzarella',
    'leche', 'queso', 'yogur', 'mantequilla', 'huevo', 'huevos', 'nata', 'parmesano', 'mozzarella', 'cuajada'
  ],
  'Meat': [
    'chicken', 'beef', 'pork', 'steak', 'ham', 'bacon', 'sausage', 'turkey', 'fish', 'salmon', 'tuna',
    'pollo', 'ternera', 'cerdo', 'filete', 'jamon', 'jamón', 'bacon', 'salchicha', 'salchichas', 'pavo', 'pescado', 'salmon', 'salmón', 'atun', 'atún', 'carne', 'merluza', 'gambas'
  ],
  'Bakery': [
    'bread', 'bagel', 'croissant', 'bun', 'muffin', 'bakery', 'toast', 'baguette', 'cake', 'cookies',
    'pan', 'croissant', 'bollo', 'magdalena', 'magdalenas', 'tostada', 'tarta', 'galleta', 'galletas', 'bizcocho', 'empanada'
  ],
  'Pantry': [
    'pasta', 'rice', 'flour', 'sugar', 'salt', 'oil', 'pantry', 'sauce', 'cereal', 'beans', 'lentils', 'spice', 'pepper',
    'pasta', 'arroz', 'harina', 'azucar', 'azúcar', 'sal', 'aceite', 'despensa', 'salsa', 'tomate frito', 'cereales', 'legumbres', 'alubias', 'lentejas', 'garbanzos', 'especias', 'pimienta'
  ],
  'Beverages': [
    'water', 'juice', 'soda', 'coke', 'beer', 'wine', 'coffee', 'tea', 'drink',
    'agua', 'zumo', 'refresco', 'coca', 'cerveza', 'vino', 'cafe', 'café', 'te', 'té', 'bebida'
  ],
  'Household': [
    'soap', 'shampoo', 'paper', 'cleaner', 'detergent', 'bleach', 'sponge', 'trash', 'napkin', 'tissue',
    'jabon', 'jabón', 'champu', 'champú', 'papel', 'limpiador', 'detergente', 'lejia', 'lejía', 'esponja', 'estropajo', 'basura', 'servilleta', 'panuelo', 'pañuelo', 'suavizante'
  ],
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

export function getCategoryLabel(category: Category | string, t: (path: string) => string): string {
  const translated = t(`categories.${category}`);
  return translated.startsWith('categories.') ? category : translated;
}
