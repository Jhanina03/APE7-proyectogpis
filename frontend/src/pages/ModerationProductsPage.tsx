import { useState } from "react";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductModerationCard } from "@/components/moderation/ProductModerationCard";
import { useProductsByStatus } from "@/lib/hooks/useProducts";
import type { ProductFilters, Category } from "@/lib/types/product";

export default function ModerationProductsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<Category | "all">("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  // Build filters for frontend filtering
  const filters: ProductFilters = {
    search: searchQuery || undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    type:
      typeFilter !== "all" ? (typeFilter as "PRODUCT" | "SERVICE") : undefined,
  };

  // Fetch active products (products that haven't been reported yet)
  const {
    data: products,
    isLoading,
    error,
  } = useProductsByStatus("ACTIVE", filters);

  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Active Products</h1>
          <p className="text-muted-foreground mt-1">
            Review and report active products that violate platform policies
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onValueChange={(value) =>
              setCategoryFilter(value as Category | "all")
            }
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="ELECTRONICS">Electronics</SelectItem>
              <SelectItem value="FASHION">Fashion</SelectItem>
              <SelectItem value="HOME">Home</SelectItem>
              <SelectItem value="SERVICES">Services</SelectItem>
              <SelectItem value="SPORTS">Sports</SelectItem>
              <SelectItem value="BOOKS">Books</SelectItem>
              <SelectItem value="TOYS">Toys</SelectItem>
              <SelectItem value="AUTOMOTIVE">Automotive</SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="PRODUCT">Products</SelectItem>
              <SelectItem value="SERVICE">Services</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="text-center py-12">
          <p className="text-destructive">
            Failed to load products. Please try again.
          </p>
        </div>
      )}

      {/* Products List */}
      {!isLoading && !error && (
        <>
          {products && products.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {products.map((product) => (
                <ProductModerationCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || categoryFilter !== "all" || typeFilter !== "all"
                  ? "No active products match your filters."
                  : "No active products found. All products have been reviewed or reported."}
              </p>
            </div>
          )}

          {/* Results count */}
          {products && products.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {products.length} active product
              {products.length !== 1 ? "s" : ""}
            </div>
          )}
        </>
      )}
    </div>
  );
}
