import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Filter, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Header } from '@/components/layout/Header';
import { CategoryNav } from '@/components/layout/CategoryNav';
import { Footer } from '@/components/layout/Footer';
import { ProductGrid } from '@/components/products/ProductGrid';
import { ProductFilters } from '@/components/products/ProductFilters';
import { useProducts, useNearbyProducts } from '@/lib/hooks/useProducts';
import { getCategoryInfo, SORT_OPTIONS } from '@/lib/constants/categories';
import type { ProductFilters as Filters, SortOption, Category } from '@/lib/types/product';

export default function CategoryPage() {
  const { category } = useParams<{ category: Category }>();

  const [filters, setFilters] = useState<Filters>({
    category: category || 'all',
    type: 'all',
    minPrice: 0,
    maxPrice: 10000,
    nearbyMode: false,
    nearbyRadius: 10,
  });
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Conditionally use nearby hook or regular products hook based on nearbyMode
  const { data: products, isLoading } = filters.nearbyMode
    ? useNearbyProducts(filters.nearbyRadius || 10, filters, sortBy)
    : useProducts(filters, sortBy);

  const categoryInfo = category ? getCategoryInfo(category as Category) : null;

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption);
  };

  // Update filters when category param changes
  useEffect(() => {
    if (category) {
      setFilters((prev) => ({ ...prev, category: category as Category }));
    }
  }, [category]);

  if (!categoryInfo) {
    return (
      <div className="min-h-screen">
        <Header />
        <CategoryNav />
        <div className="container px-4 py-16 text-center">
          <h1 className="text-2xl font-bold">Category not found</h1>
          <Link to="/products">
            <Button className="mt-4">Browse All Products</Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />
      <CategoryNav />

      <div className="container px-4 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/products" className="hover:text-foreground">
            Products
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{categoryInfo.name}</span>
        </nav>

        {/* Category Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">{categoryInfo.icon}</span>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{categoryInfo.name}</h1>
              <p className="text-muted-foreground mt-1">{categoryInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Filters and Sort Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Filter Toggle */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  hideCategoryFilter={true}
                />
              </SheetContent>
            </Sheet>

            {/* Results Count */}
            <p className="text-sm text-muted-foreground">
              {isLoading ? 'Loading...' : `${products?.length || 0} results`}
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">Sort by:</span>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content with Filters Sidebar */}
        <div className="grid gap-18 lg:grid-cols-[280px_1fr]">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <ProductFilters
                filters={filters}
                onFiltersChange={setFilters}
                hideCategoryFilter={true}
              />
            </div>
          </aside>

          {/* Products Grid */}
          <div>
            <ProductGrid products={products || []} isLoading={isLoading} />
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
