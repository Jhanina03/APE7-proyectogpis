import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin,
  Edit,
  Trash2,
  Clock,
  Megaphone,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProductImage } from "./ProductImage";
import type { Product } from "@/lib/types/product";
import { getCategoryInfo } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import { useDeleteProduct } from "@/lib/hooks/useProductMutations";
import { AppealIncidentDialog } from "@/components/moderation/AppealIncidentDialog";

interface ProductManagementCardProps {
  product: Product;
  onEdit: (product: Product) => void;
  className?: string;
}

export function ProductManagementCard({
  product,
  onEdit,
  className,
}: ProductManagementCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAppealDialog, setShowAppealDialog] = useState(false);
  const deleteMutation = useDeleteProduct();
  const categoryInfo = getCategoryInfo(product.category);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(product.id);
      setShowDeleteDialog(false);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.log("error", error);
    }
  };

  // Product status colors - using semantic color meanings
  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "ACTIVE":
        return "bg-emerald-500";
      case "SUSPENDED":
        return "bg-amber-500";
      case "REPORTED":
        return "bg-orange-500";
      case "DELETED":
        return "bg-gray-400";
      case "BANNED":
        return "bg-red-600";
      default:
        return "bg-gray-400";
    }
  };

  // Incident status colors - aligned with user mental models
  const getIncidentColor = (status: string) => {
    switch ((status || "").toUpperCase()) {
      case "PENGING": // Typo-safe
      case "PENDING":
        return "bg-amber-500 text-white";
      case "REJECTED":
        return "bg-emerald-500 text-white";
      case "ACCEPTED":
        return "bg-red-500 text-white";
      case "APPEALED":
        return "bg-blue-500 text-white";
      default:
        return "bg-gray-400";
    }
  };

  const getLatestIncident = (incidents?: Product["incidents"]) => {
    if (!incidents || incidents.length === 0) return null;

    // Find the incident with the highest id
    const latestIncident = incidents.reduce((latest, current) =>
      current.id > latest.id ? current : latest
    );

    // Only return if the status is not "REJECTED"
    return latestIncident.status.toUpperCase() !== "REJECTED"
      ? latestIncident
      : null;
  };

  return (
    <>
      <Card
        className={cn(
          "group overflow-hidden transition-shadow hover:shadow-lg",
          className
        )}
      >
        <div className="grid md:grid-cols-[200px_1fr] gap-4">
          {/* Image */}
          <Link
            to={`/product/${product.id}`}
            className="relative aspect-square md:aspect-auto"
          >
            <ProductImage
              images={product.images}
              alt={product.name}
              className="h-full w-full"
            />
            {!product.availability && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="secondary" className="text-sm">
                  Unavailable
                </Badge>
              </div>
            )}
          </Link>

          {/* Content */}
          <div className="flex flex-col p-4">
            <div className="flex-1">
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Link to={`/product/${product.id}`}>
                    <h3 className="line-clamp-1 text-xl font-semibold leading-tight hover:underline">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {categoryInfo.icon} {categoryInfo.name}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {product.type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {product.availability == true
                        ? "AVAILABLE"
                        : "NOT AVAILABLE"}
                    </Badge>
                    <Badge
                      className={cn("text-xs", getStatusColor(product.status))}
                    >
                      {product.status}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onEdit(product)}
                    title="Edit product"
                    disabled={product.status !== "ACTIVE"}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    title="Delete product"
                    className="hover:bg-destructive hover:text-destructive-foreground"
                    disabled={product.status !== "ACTIVE"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                {product.description}
              </p>

              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                {product.address && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{product.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Posted {formatDate(product.publishDate)}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t pt-4">
              <div className="">
                <p className="text-2xl font-bold">
                  {formatPrice(product.price)}
                </p>
                {product.type === "SERVICE" && (
                  <p className="text-xs text-muted-foreground">per session</p>
                )}
              </div>

              {(product.status === "SUSPENDED" ||
                product.status === "REPORTED") && (
                <>
                  {product.incidents &&
                    product.incidents.length > 0 &&
                    (() => {
                      const latest = getLatestIncident(product.incidents);
                      if (!latest) return null;
                      return (
                        <div className="flex flex-col items-stretch w-full max-w-sm gap-4">
                          <Item
                            variant="outline"
                            className="border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-colors"
                          >
                            <ItemMedia variant="icon">
                              <div className="flex-shrink-0 mt-0.5">
                                <div className="p-2 bg-amber-100 rounded-lg border border-amber-200">
                                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                                </div>
                              </div>
                            </ItemMedia>
                            <ItemContent>
                              <ItemTitle>
                                <h3 className="font-semibold text-amber-900 text-base">
                                  Product{" "}
                                  {product.status === "SUSPENDED"
                                    ? "Suspended"
                                    : "Reported"}
                                </h3>
                                <Badge
                                  variant="secondary"
                                  className={cn(
                                    "text-xs",
                                    getIncidentColor(latest.status)
                                  )}
                                >
                                  {latest.status}
                                </Badge>
                              </ItemTitle>
                              <ItemDescription>
                                {latest.comment ==
                                "Detected automatically as dangerous/offensive" ? (
                                  <div className="flex items-center gap-1 text-xs text-amber-600">
                                    <ShieldAlert className="h-3 w-3" />
                                    <span>
                                      Automatically detected as offensive
                                      content
                                    </span>
                                  </div>
                                ) : (
                                  <p className="text-xs text-amber-800">
                                    <span className="font-medium">Reason:</span>{" "}
                                    {latest.comment || "No additional details provided."}
                                  </p>
                                )}
                              </ItemDescription>
                            </ItemContent>
                            {product.status === "SUSPENDED" && (
                              <ItemActions>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="bg-amber-100 border-amber-300 text-amber-900 hover:bg-amber-200 hover:text-amber-800"
                                  onClick={() => setShowAppealDialog(true)}
                                  disabled={
                                    latest.status.toUpperCase() === "APPEALED"
                                  }
                                  title={
                                    latest.status.toUpperCase() === "APPEALED"
                                      ? "Appeal already submitted"
                                      : "Appeal this incident"
                                  }
                                >
                                  <Megaphone className="h-4 w-4 mr-2" />
                                  Appeal
                                </Button>
                              </ItemActions>
                            )}
                          </Item>
                        </div>
                      );
                    })()}
                </>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete "{product.name}". This action cannot be undone.
              The product will be marked as deleted and removed from public
              listings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Appeal Incident Dialog */}
      {(() => {
        const latestIncident = getLatestIncident(product.incidents);
        if (!latestIncident) return null;
        return (
          <AppealIncidentDialog
            open={showAppealDialog}
            onOpenChange={setShowAppealDialog}
            incident={latestIncident}
            productName={product.name}
          />
        );
      })()}
    </>
  );
}
