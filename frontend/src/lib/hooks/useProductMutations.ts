import { useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '@/lib/api/products';
import type { Product } from '@/lib/types/product';
import { toast } from 'sonner';

/**
 * Hook for creating a new product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      name: string;
      description: string;
      price: number;
      type: 'PRODUCT' | 'SERVICE';
      category: string;
      address: string;
      latitude?: number;
      longitude?: number;
      serviceHours?: string;
      availability: boolean;
      images?: File[];
    }) => productApi.createProduct(data),
    onSuccess: (newProduct) => {
      // Invalidate all product-related queries to ensure fresh data across all pages
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['likedProducts'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'status'] });

      if (newProduct.status === 'REPORTED') {
        toast.warning('Product created but identified as dangerous and hidden.');
      } else {
        toast.success('Product created successfully!');
      }

      return newProduct;
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Failed to create product');
    },
  });
}

/**
 * Hook for updating an existing product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: number;
      data: {
        name?: string;
        description?: string;
        price?: number;
        type?: 'PRODUCT' | 'SERVICE';
        category?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        serviceHours?: string;
        availability?: boolean;
        imagesToRemove?: number[];
        images?: File[];
      };
    }) => productApi.updateProduct(id, data),
    onMutate: async ({ id, data }) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['products'] });
      await queryClient.cancelQueries({ queryKey: ['product', id] });
      await queryClient.cancelQueries({ queryKey: ['product', id.toString()] });

      // Snapshot previous values
      const previousProducts = queryClient.getQueryData<Product[]>(['products']);
      const previousProductNum = queryClient.getQueryData<Product>(['product', id]);
      const previousProductStr = queryClient.getQueryData<Product>(['product', id.toString()]);
      const previousProduct = previousProductNum || previousProductStr;

      // Create update object excluding images and imagesToRemove (they're File objects, not URLs yet)
      const { images, imagesToRemove, ...updateData } = data;

      // Optimistically update products list
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(
          ['products'],
          previousProducts.map((product) =>
            product.id === id ? { ...product, ...updateData } as Product : product
          )
        );
      }

      // Optimistically update single product (both number and string keys)
      if (previousProduct) {
        const updatedProduct = { ...previousProduct, ...updateData } as Product;
        queryClient.setQueryData<Product>(['product', id], updatedProduct);
        queryClient.setQueryData<Product>(['product', id.toString()], updatedProduct);
      }

      return { previousProducts, previousProduct };
    },
    onSuccess: (updatedProduct) => {
      // Invalidate all product-related queries to ensure fresh data across all pages
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['likedProducts'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['product', updatedProduct.id] });
      queryClient.invalidateQueries({ queryKey: ['product', updatedProduct.id.toString()] });

      toast.success('Product updated successfully!');
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(['product', _variables.id], context.previousProduct);
      }

      toast.error(error?.message || 'Failed to update product');
    },
  });
}

/**
 * Hook for deleting a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => productApi.deleteProduct(id),
    onMutate: async (id) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['products'] });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<Product[]>(['products']);

      // Optimistically remove product
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(
          ['products'],
          previousProducts.filter((product) => product.id !== id)
        );
      }

      return { previousProducts };
    },
    onSuccess: () => {
      // Invalidate all product-related queries to ensure fresh data across all pages
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['likedProducts'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'status'] });

      toast.success('Product deleted successfully!');
    },
    onError: (error: any, _variables, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }

      toast.error(error?.message || 'Failed to delete product');
    },
  });
}

/**
 * Hook for toggling like on a product
 */
export function useToggleLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => productApi.toggleLike(productId),
    onMutate: async (productId) => {
      // Convert productId to both string and number for query key matching
      const productIdStr = productId.toString();

      // Cancel outgoing queries for both number and string versions
      await queryClient.cancelQueries({ queryKey: ['products'] });
      await queryClient.cancelQueries({ queryKey: ['product', productId] });
      await queryClient.cancelQueries({ queryKey: ['product', productIdStr] });

      // Snapshot previous values (try both number and string keys)
      const previousProducts = queryClient.getQueryData<Product[]>(['products']);
      const previousProductNum = queryClient.getQueryData<Product>(['product', productId]);
      const previousProductStr = queryClient.getQueryData<Product>(['product', productIdStr]);
      const previousProduct = previousProductNum || previousProductStr;

      // Optimistically update products list
      if (previousProducts) {
        queryClient.setQueryData<Product[]>(
          ['products'],
          previousProducts.map((product) =>
            product.id === productId
              ? {
                ...product,
                hasLiked: !product.hasLiked,
                likesCount: (product.likesCount || 0) + (product.hasLiked ? -1 : 1),
              }
              : product
          )
        );
      }

      // Optimistically update single product (both number and string keys)
      if (previousProduct) {
        const updatedProduct = {
          ...previousProduct,
          hasLiked: !previousProduct.hasLiked,
          likesCount: (previousProduct.likesCount || 0) + (previousProduct.hasLiked ? -1 : 1),
        };

        // Update both possible query keys
        queryClient.setQueryData<Product>(['product', productId], updatedProduct);
        queryClient.setQueryData<Product>(['product', productIdStr], updatedProduct);
      }

      return { previousProducts, previousProduct };
    },
    onSuccess: (_data, productId) => {
      const productIdStr = productId.toString();

      // Invalidate all product-related queries to ensure fresh data across all pages
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['likedProducts'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'status'] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productIdStr] });
    },
    onError: (_error, productId, context) => {
      const productIdStr = productId.toString();

      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }
      if (context?.previousProduct) {
        queryClient.setQueryData(['product', productId], context.previousProduct);
        queryClient.setQueryData(['product', productIdStr], context.previousProduct);
      }

      toast.error('Failed to update like');
    },
  });
}
