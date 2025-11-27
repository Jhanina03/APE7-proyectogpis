import { useState } from "react";
import { Plus, PackageOpen } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductManagementCard } from "@/components/products/ProductManagementCard";
import { ProductFormDialog } from "@/components/products/ProductFormDialog";
import { useProductByUser } from "@/lib/hooks/useProducts";
import type { Product, ProductStatus, ProductType } from "@/lib/types/product";
import { useAuth } from "@/contexts/AuthContext";

export default function MyProductsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [statusFilter, setStatusFilter] = useState<ProductStatus | "all">(
    "all"
  );
  const [typeFilter, setTypeFilter] = useState<ProductType | "all">("all");
  const user = useAuth().user;

  const { data: allProducts, isLoading } = useProductByUser(user?.id || "");

  // Filter products based on selected filters
  const filteredProducts = allProducts?.filter((product) => {
    if (statusFilter !== "all" && product.status !== statusFilter) {
      return false;
    }
    if (typeFilter !== "all" && product.type !== typeFilter) {
      return false;
    }
    return true;
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormOpen(true);
  };

  const handleCreate = () => {
    setEditingProduct(null);
    setFormOpen(true);
  };

  const handleCloseDialog = () => {
    setFormOpen(false);
    setEditingProduct(null);
  };

  const getRightVerb = (length: number): string => {
    return length != 1 ? "results" : "result";
  };

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container px-4 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Products</h1>
            <p className="text-muted-foreground mt-2">
              Manage your product and service listings
            </p>
          </div>
          <Button onClick={handleCreate} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Create Product
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="flex">
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                setStatusFilter(value as ProductStatus | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="REPORTED">Reported</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="DELETED">Deleted</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Select
              value={typeFilter}
              onValueChange={(value) =>
                setTypeFilter(value as ProductType | "all")
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PRODUCT">Products</SelectItem>
                <SelectItem value="SERVICE">Services</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center text-sm text-muted-foreground">
            {isLoading
              ? "Loading..."
              : `${filteredProducts?.length || 0} ${getRightVerb(
                  filteredProducts?.length as number
                )}`}
          </div>
        </div>

        {/* Products List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : filteredProducts && filteredProducts.length > 0 ? (
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <ProductManagementCard
                key={product.id}
                product={product}
                onEdit={handleEdit}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <PackageOpen className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No products found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              {statusFilter !== "all" || typeFilter !== "all"
                ? "Try adjusting your filters to see more products."
                : "You haven't created any products yet. Create your first listing to get started!"}
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-5 w-5" />
              Create Your First Product
            </Button>
          </div>
        )}
      </div>

      <Footer />

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={formOpen}
        onOpenChange={handleCloseDialog}
        product={editingProduct}
      />
    </div>
  );
}
