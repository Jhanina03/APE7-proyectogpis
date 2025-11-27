import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getFallbackImage, getProductThumbnail } from '@/lib/utils/imageUtils';

// Type for backend image objects
type ImageObject = { id: number; url: string; productId: number };

interface ProductImageProps {
  images: ImageObject[] | string[];
  alt: string;
  className?: string;
  priority?: boolean;
}

export function ProductImage({ images, alt, className, priority = false }: ProductImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const thumbnailUrl = getProductThumbnail(images);
  const displayUrl = imageError ? getFallbackImage() : thumbnailUrl;

  return (
    <div className={cn('relative overflow-hidden bg-muted', className)}>
      {!imageLoaded && !imageError && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <img
        src={displayUrl}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onError={() => setImageError(true)}
        onLoad={() => setImageLoaded(true)}
        className={cn(
          'h-full w-full object-cover transition-opacity duration-300',
          imageLoaded ? 'opacity-100' : 'opacity-0'
        )}
      />
    </div>
  );
}
