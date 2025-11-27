import { apiClient } from './client';
import type { Product } from '@/lib/types/product';

// API endpoints for products
export const productApi = {
  /**
   * Get all products with optional filters
   * NOTE: Filters and sort are kept in signature for future backend support
   * Currently, filtering/sorting is handled on the frontend
   */
  async getProducts(): Promise<Product[]> {
    // Fetch all products without filters - filtering is done on frontend
    return apiClient.get<Product[]>('/products');
  },

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/category/${category}`);
  },

  /**
   * Get products by status (e.g., ACTIVE, REPORTED, SUSPENDED, DELETED)
   */
  async getProductsByStatus(status: string): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/status/${status}`);
  },

  /**
   * Get featured products
   */
  async getFeaturedProducts(): Promise<Product[]> {
    return apiClient.get<Product[]>('/products/featured');
  },

  /**
   * Get single product by code
   */
  async getProduct(id: string): Promise<Product> {
    return apiClient.get<Product>(`/products/${id}`);
  },

  async getProductByUser(id: string): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/user/${id}`);
  },

  /**
   * Get recent products
   */
  async getRecentProducts(limit = 8): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/recent?limit=${limit}`);
  },

  /**
   * Create a new product with images
   */
  async createProduct(data: {
    name: string;
    description: string;
    price: number;
    type: 'PRODUCT' | 'SERVICE';
    category: string;
    address: string;
    serviceHours?: string;
    availability: boolean;
    images?: File[];
  }): Promise<Product> {
    const formData = new FormData();

    formData.append('name', data.name);
    formData.append('description', data.description);
    formData.append('price', data.price.toString());
    formData.append('type', data.type);
    formData.append('category', data.category);
    formData.append('address', data.address);
    // Send boolean as string "true" or "false" - backend should handle Transform
    formData.append('availability', data.availability ? 'true' : 'false');

    if (data.serviceHours) {
      formData.append('serviceHours', data.serviceHours);
    }

    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return apiClient.postFormData<Product>('/products', formData);
  },

  /**
   * Update an existing product
   */
  async updateProduct(
    id: number,
    data: {
      name?: string;
      description?: string;
      price?: number;
      type?: 'PRODUCT' | 'SERVICE';
      category?: string;
      address?: string;
      serviceHours?: string;
      availability?: boolean;
      imagesToRemove?: number[];
      images?: File[];
    }
  ): Promise<Product> {
    const formData = new FormData();

    if (data.name !== undefined) formData.append('name', data.name);
    if (data.description !== undefined) formData.append('description', data.description);
    if (data.price !== undefined) formData.append('price', data.price.toString());
    if (data.type !== undefined) formData.append('type', data.type);
    if (data.category !== undefined) formData.append('category', data.category);
    if (data.address !== undefined) formData.append('address', data.address);
    if (data.availability !== undefined) formData.append('availability', data.availability ? 'true' : 'false');
    if (data.serviceHours !== undefined) formData.append('serviceHours', data.serviceHours);

    if (data.imagesToRemove && data.imagesToRemove.length > 0) {
      formData.append('imagesToRemove', JSON.stringify(data.imagesToRemove));
    }

    if (data.images) {
      data.images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return apiClient.patchFormData<Product>(`/products/${id}`, formData);
  },

  /**
   * Delete a product (soft delete)
   */
  async deleteProduct(id: number): Promise<Product> {
    return apiClient.delete<Product>(`/products/${id}`);
  },

  /**
   * Toggle like/unlike for a product
   */
  async toggleLike(id: number): Promise<{ message: string; liked: boolean }> {
    return apiClient.post<{ message: string; liked: boolean }>(`/products/${id}/like`, {});
  },

  /**
   * Get products near the authenticated user's location
   * Requires user to have latitude/longitude set in profile
   * @param radius - Search radius in kilometers (10-100km)
   */
  async getNearbyProducts(radius: number = 10): Promise<Product[]> {
    return apiClient.get<Product[]>(`/products/nearby?radius=${radius}`);
  },
};
