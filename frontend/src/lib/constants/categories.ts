import type { Category } from '@/lib/types/product';

export interface CategoryInfo {
  id: Category;
  name: string;
  description: string;
  icon: string; // Emoji or icon name
}

export const CATEGORIES: CategoryInfo[] = [
  {
    id: 'ELECTRONICS',
    name: 'Electronics',
    description: 'Phones, laptops, cameras, and tech accessories',
    icon: '📱',
  },
  {
    id: 'FASHION',
    name: 'Fashion',
    description: 'Clothing, shoes, and accessories',
    icon: '👗',
  },
  {
    id: 'HOME',
    name: 'Home & Garden',
    description: 'Furniture, decor, and home improvement',
    icon: '🏠',
  },
  {
    id: 'SERVICES',
    name: 'Services',
    description: 'Professional services and local help',
    icon: '🔧',
  },
  {
    id: 'SPORTS',
    name: 'Sports & Outdoors',
    description: 'Sports equipment and outdoor gear',
    icon: '⚽',
  },
  {
    id: 'BOOKS',
    name: 'Books & Media',
    description: 'Books, movies, music, and games',
    icon: '📚',
  },
  {
    id: 'TOYS',
    name: 'Toys & Games',
    description: 'Toys, board games, and collectibles',
    icon: '🎮',
  },
  {
    id: 'AUTOMOTIVE',
    name: 'Automotive',
    description: 'Car parts, accessories, and services',
    icon: '🚗',
  },
  {
    id: 'OTHER',
    name: 'Other',
    description: 'Everything else',
    icon: '📦',
  },
];

export const getCategoryInfo = (categoryId: Category): CategoryInfo => {
  return CATEGORIES.find((cat) => cat.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
};

// export const PRICE_RANGES = [
//   { label: 'Under $50', min: 0, max: 50 },
//   { label: '$50 - $100', min: 50, max: 100 },
//   { label: '$100 - $250', min: 100, max: 250 },
//   { label: '$250 - $500', min: 250, max: 500 },
//   { label: '$500+', min: 500, max: 10000 },
// ];

export const SORT_OPTIONS = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A-Z' },
] as const;
