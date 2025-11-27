// Product and Service types based on PROJECT_SPEC.md

export type ProductType = 'PRODUCT' | 'SERVICE';

export type ProductStatus = 'ACTIVE' | 'SUSPENDED' | 'REPORTED' | 'DELETED' | 'BANNED' | 'DEACTIVATED';

export type IncidentStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'APPEALED';

export type Category =
  | 'ELECTRONICS'
  | 'FASHION'
  | 'HOME'
  | 'SERVICES'
  | 'SPORTS'
  | 'BOOKS'
  | 'TOYS'
  | 'AUTOMOTIVE'
  | 'OTHER';

// Image type from backend
export interface ProductImage {
  id: number;
  url: string;
  productId: number;
}

export interface ProductIncidents {
  id: number;
  comment: string;
  dateReported?: string; // ISO date string
  status: IncidentStatus;
}

export interface Product {
  id: number;
  code: string;
  name: string;
  description: string;
  images: ProductImage[]; // Array of image objects from backend
  price: number;
  address: string | null;
  latitude?: number | null;
  longitude?: number | null;
  availability: boolean;
  type: ProductType;
  category: Category;
  status: ProductStatus;
  publishDate: string; // ISO date string
  userId?: string | null; // Optional - will be populated from backend
  sellerName?: string; // Optional - for display
  serviceHours?: string | null; // Optional - for services (e.g., "Mon-Fri 9AM-5PM")
  incidents?: ProductIncidents[];
  // Like functionality
  hasLiked?: boolean; // Whether current user has liked this product
  likesCount?: number; // Total number of likes
}

export interface Service extends Product {
  type: 'SERVICE';
  serviceHours?: string; // e.g., "Mon-Fri 9AM-5PM"
}

// Filter options for products
export interface ProductFilters {
  category?: Category | 'all';
  type?: ProductType | 'all';
  minPrice?: number;
  maxPrice?: number;
  availability?: boolean;
  search?: string;
  status?: ProductStatus;
  nearbyMode?: boolean;
  nearbyRadius?: number;
}

// Sort options
export type SortOption = 'recent' | 'price-asc' | 'price-desc' | 'name';

// API Response types
export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
}

export interface ProductDetailResponse extends Product {
  sellerEmail?: string;
  sellerPhone?: string;
  reports?: number;
  views?: number;
}
