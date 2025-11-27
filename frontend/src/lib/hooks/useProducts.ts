import { useQuery } from '@tanstack/react-query';
import type { ProductFilters, SortOption, Category, Product } from '@/lib/types/product';
import { productApi } from '@/lib/api/products';

/**
 * Apply filters to products array
 */
function applyFilters(products: Product[], filters?: ProductFilters): Product[] {
  let filtered = [...products];

  if (!filters) return filtered;

  // Filter by category
  if (filters.category && filters.category !== 'all') {
    filtered = filtered.filter((p) => p.category === filters.category);
  }

  // Filter by type
  if (filters.type && filters.type !== 'all') {
    filtered = filtered.filter((p) => p.type === filters.type);
  }

  // Filter by price range
  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
  }

  // Filter by availability
  if (filters.availability !== undefined) {
    filtered = filtered.filter((p) => p.availability === filters.availability);
  }

  // Filter by search term
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(searchLower) ||
        p.description.toLowerCase().includes(searchLower)
    );
  }

  // Filter by status
  if (filters.status) {
    filtered = filtered.filter((p) => p.status === filters.status);
  }

  return filtered;
}

/**
 * Apply sorting to products array
 */
function applySorting(products: Product[], sort?: SortOption): Product[] {
  if (!sort) return products;

  const sorted = [...products];

  sorted.sort((a, b) => {
    switch (sort) {
      case 'recent':
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      case 'price-asc':
        return a.price - b.price;
      case 'price-desc':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return 0;
    }
  });

  return sorted;
}

/**
 * Hook to get all products with filtering and sorting
 * Filtering and sorting are done on the frontend
 */
export function useProducts(filters?: ProductFilters, sort?: SortOption) {
  return useQuery({
    queryKey: ['products', filters, sort],
    queryFn: async () => {
      // Fetch all products from backend
      const allProducts = await productApi.getProducts();

      // Apply filters on frontend
      let products = applyFilters(allProducts, filters);

      // Apply sorting on frontend
      products = applySorting(products, sort);

      return products;
    },
  });
}

/**
 * Hook to get products liked by the current user with filtering and sorting
 * Filtering and sorting are done on the frontend
 */
export function useProductsLiked(filters?: ProductFilters, sort?: SortOption, liked?: boolean) {
  return useQuery({
    queryKey: ['likedProducts', filters, sort],
    queryFn: async () => {
      // Fetch all products from backend
      const allProducts = await productApi.getProducts();

      // Apply filters on frontend
      let products = applyFilters(allProducts, filters);

      // Apply sorting on frontend
      products = applySorting(products, sort);

      // If liked filter is set, filter products that are liked by the user
      if (liked) {
        products = products.filter((p) => p.hasLiked);
      }

      return products;
    },
  });
}

/**
 * Hook to get featured products
 */
export function useFeaturedProducts() {
  const filters: ProductFilters = {
    category: 'all',
    type: 'all',
    minPrice: 0,
    maxPrice: 10000,
    availability: true,
  }
  const sorting: SortOption = 'price-desc';
  const products = useProducts(filters, sorting);
  return products.data ? products.data.slice(0, 4) : [];
}

/**
 * Hook to get recent products
 */
export function useRecentProducts() {
  const filters: ProductFilters = {
    category: 'all',
    type: 'all',
    minPrice: 0,
    maxPrice: 10000,
    availability: true,
  }
  const sorting: SortOption = 'recent';
  const products = useProducts(filters, sorting);
  return products.data ? products.data.slice(0, 4) : [];
}

/**
 * Hook to get products by specific category
 */
export function useProductsByCategory(cat: Category) {
  const filters: ProductFilters = {
    category: cat,
    type: 'all',
    minPrice: 0,
    maxPrice: 10000,
    availability: true,
  }
  const sorting: SortOption = 'price-desc';
  const products = useProducts(filters, sorting);
  return products.data ? products.data.slice(0, 4) : [];
}

/**
 * Hook to get single product by code
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const response = await productApi.getProduct(id);
      return response;
    },
    enabled: !!id,
  });
}

/**
 * Hook to get single product by code
 */
export function useProductByUser(id: string, filters?: ProductFilters, sort?: SortOption) {
  return useQuery({
    queryKey: ['userProducts', id, filters, sort],
    queryFn: async () => {
      // Fetch all products from backend
      const allProductsByUser = await productApi.getProductByUser(id);

      // Apply filters on frontend
      let products = applyFilters(allProductsByUser, filters);

      // Apply sorting on frontend
      products = applySorting(products, sort);

      return products;
    },
    enabled: !!id,
  });
}

/**
 * Hook to get products by status (e.g., ACTIVE, REPORTED, SUSPENDED, DELETED)
 * Used for moderation pages to filter products by their status
 */
export function useProductsByStatus(status: string, filters?: ProductFilters, sort?: SortOption) {
  return useQuery({
    queryKey: ['products', 'status', status, filters, sort],
    queryFn: async () => {
      // Fetch products by status from backend
      const products = await productApi.getProductsByStatus(status);

      // Apply filters on frontend
      let filteredProducts = applyFilters(products, filters);

      // Apply sorting on frontend
      filteredProducts = applySorting(filteredProducts, sort);

      return filteredProducts;
    },
    enabled: !!status,
  });
}

/**
 * Hook to get products near the authenticated user's location
 * Filters and sorting are applied on the frontend after fetching nearby products
 * @param radius - Search radius in kilometers (10-100km)
 * @param filters - Additional filters to apply (type, price, availability)
 * @param sort - Sort option
 */
export function useNearbyProducts(
  radius: number = 10,
  filters?: Omit<ProductFilters, 'nearbyMode' | 'nearbyRadius'>,
  sort?: SortOption
) {
  return useQuery({
    queryKey: ['nearbyProducts', radius, filters, sort],
    queryFn: async () => {
      // Fetch nearby products from backend
      const nearbyProducts = await productApi.getNearbyProducts(radius);

      // Apply additional filters on frontend (excluding category since nearby is primary filter)
      let products = applyFilters(nearbyProducts, filters);

      // Apply sorting on frontend
      products = applySorting(products, sort);

      return products;
    },
  });
}
