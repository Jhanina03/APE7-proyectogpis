import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from './ProductCard';
import type { Product } from '@/lib/types/product';
import type { Category } from '@/lib/types/product';
import { getCategoryInfo } from '@/lib/constants/categories';

interface CategorySectionProps {
  category: Category;
  products: Product[];
}

export function CategorySection({ category, products }: CategorySectionProps) {
  if (products.length === 0) return null;

  const categoryInfo = getCategoryInfo(category);

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-4xl">{categoryInfo.icon}</span>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{categoryInfo.name}</h2>
            <p className="text-sm text-muted-foreground">{categoryInfo.description}</p>
          </div>
        </div>
        <Link to={`/products/${category}`}>
          <Button variant="ghost" size="sm">
            View All
            <ChevronRight className="ml-1 h-4 w-4" />
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
