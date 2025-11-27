import { useState } from "react";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductGrid } from "@/components/products/ProductGrid";
import { ProductFilters } from "@/components/products/ProductFilters";
import { useProductsLiked } from "@/lib/hooks/useProducts";
import { SORT_OPTIONS } from "@/lib/constants/categories";
import type {
  ProductFilters as Filters,
  SortOption,
} from "@/lib/types/product";

export default function LikedProductsPage() {
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    type: "all",
    minPrice: 0,
    maxPrice: 10000,
  });
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { data: products, isLoading } = useProductsLiked(filters, sortBy, true);

  const handleSortChange = (value: string) => {
    setSortBy(value as SortOption);
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">
            Your Liked Products & Services
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse the products and services you've saved to come back to later.
          </p>
        </div>

        {/* Filters and Sort Bar */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Mobile Filter Toggle */}
            <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden">
                  <Filter className="mr-2 h-4 w-4" />
                  <SheetTitle>Filters</SheetTitle>
                </Button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-80 overflow-y-auto p-6"
                aria-describedby={undefined}
              >
                <ProductFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </SheetContent>
            </Sheet>

            {/* Results Count */}
            <p className="text-sm text-muted-foreground">
              {isLoading ? "Loading..." : `${products?.length || 0} results`}
            </p>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              Sort by:
            </span>
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
              <ProductFilters filters={filters} onFiltersChange={setFilters} />
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
