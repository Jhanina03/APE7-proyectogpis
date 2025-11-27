// Image utility functions for handling product images (Cloudinary-ready)

// Type for backend image objects
type ImageObject = { id: number; url: string; productId: number };

export const DEFAULT_PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/94a3b8/white?text=No+Image';

/**
 * Get the first image from an array of photos or return placeholder
 * Supports both string arrays (legacy) and ProductImage objects (backend response)
 * Returns an optimized thumbnail version (400x300)
 */
export const getProductThumbnail = (images: ImageObject[] | string[]): string => {
  if (!images || images.length === 0) {
    return DEFAULT_PLACEHOLDER_IMAGE;
  }

  const firstImage = images[0];
  const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url;

  // Return optimized thumbnail (400x300 with quality 80)
  return getOptimizedImageUrl(imageUrl, { width: 400, height: 300, quality: 80 });
};

/**
 * Validate that photos array has between 1-5 images
 */
export const validatePhotosArray = (images: ImageObject[] | string[]): boolean => {
  return images && images.length >= 1 && images.length <= 5;
};

/**
 * Get fallback image URL
 */
export const getFallbackImage = (): string => {
  return DEFAULT_PLACEHOLDER_IMAGE;
};

/**
 * Transform Cloudinary URL with optimization parameters
 * Adds width, height, and quality transformations to Cloudinary URLs
 */
export const getOptimizedImageUrl = (
  url: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string => {
  // Check if it's a Cloudinary URL
  if (!url.includes('cloudinary.com') && !url.includes('res.cloudinary')) {
    return url;
  }

  try {
    // Build transformation string
    const transformations: string[] = [];

    if (options?.width) {
      transformations.push(`w_${options.width}`);
    }
    if (options?.height) {
      transformations.push(`h_${options.height}`);
    }
    if (options?.quality) {
      transformations.push(`q_${options.quality}`);
    }

    // Add crop mode for better thumbnails
    if (options?.width || options?.height) {
      transformations.push('c_fill');
    }

    if (transformations.length === 0) {
      return url;
    }

    const transformString = transformations.join(',');

    // Insert transformations into Cloudinary URL
    // Format: https://res.cloudinary.com/{cloud_name}/image/upload/{transformations}/{public_id}
    return url.replace('/upload/', `/upload/${transformString}/`);
  } catch {
    // If transformation fails, return original URL
    return url;
  }
};

/**
 * Format image URLs for responsive images
 */
export const getResponsiveImageUrls = (url: string) => {
  return {
    thumbnail: getOptimizedImageUrl(url, { width: 400, height: 300 }),
    medium: getOptimizedImageUrl(url, { width: 800, height: 600 }),
    large: getOptimizedImageUrl(url, { width: 1200, height: 900 }),
  };
};

/**
 * Check if URL is a valid image URL
 */
export const isValidImageUrl = (url: string): boolean => {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
};
