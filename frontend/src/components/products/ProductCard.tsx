import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Heart, Flag } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "./ProductImage";
import { ReportProductDialog } from "@/components/moderation/ReportProductDialog";
import type { Product } from "@/lib/types/product";
import { getCategoryInfo } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import { useToggleLike } from "@/lib/hooks/useProductMutations";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const toggleLikeMutation = useToggleLike();
  const categoryInfo = getCategoryInfo(product.category);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-shadow hover:shadow-lg",
        className
      )}
    >
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          <ProductImage
            images={product.images}
            alt={product.name}
            className="transition-transform duration-300 group-hover:scale-105"
          />

          {/* Overlay de no disponible */}
          {!product.availability && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="secondary" className="text-sm">
                Unavailable
              </Badge>
            </div>
          )}

          {/* Botones de acción - Mejor organización */}
          <div className="absolute top-2 right-2 flex flex-col gap-2">
            {/* Botón de reporte */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background hover:text-amber-500 transition-all"
              onClick={(e) => {
                e.preventDefault();
                setReportDialogOpen(true);
              }}
            >
              <Flag className="h-4 w-4" />
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm transition-all",
                  "hover:scale-105 active:scale-95 shadow-sm border border-gray-100",
                  product.hasLiked
                    ? "text-red-500 hover:text-red-600 bg-red-50/80"
                    : "hover:text-red-500 hover:bg-gray-50"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  toggleLikeMutation.mutate(product.id);
                }}
                disabled={toggleLikeMutation.isPending}
              >
                <Heart
                  className={cn(
                    "h-4 w-4 transition-all",
                    product.hasLiked && "fill-current scale-110"
                  )}
                />
              </Button>

              {product.likesCount !== undefined && product.likesCount > 0 && (
                <div
                  className={cn(
                    "absolute -top-1.5 -right-1.5 rounded-full min-w-[16px] h-4 flex items-center justify-center text-xs font-semibold border shadow-xs transition-all",
                    product.hasLiked
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-700 border-gray-200"
                  )}
                >
                  {product.likesCount > 99 ? "99+" : product.likesCount}
                </div>
              )}
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          <div className="mb-3 flex flex-col items-start justify-between gap-3">
            <h3 className="line-clamp-2 text-lg font-semibold leading-tight flex-1 min-w-0">
              {product.name}
            </h3>
            <Badge
              variant="outline"
              className="flex-shrink-0 text-xs whitespace-nowrap"
            >
              {categoryInfo.icon} {categoryInfo.name}
            </Badge>
          </div>

          {/* Descripción */}
          <p className="mb-3 line-clamp-2 text-sm text-muted-foreground leading-relaxed">
            {product.description}
          </p>

          {/* Dirección */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span className="truncate leading-relaxed">
              {product.address || "N/A"}
            </span>
          </div>
        </CardContent>

        <CardFooter className="flex items-center justify-between border-t p-4">
          <div>
            <p className="text-2xl font-bold">{formatPrice(product.price)}</p>
            {product.type === "SERVICE" && (
              <p className="text-xs text-muted-foreground mt-0.5">
                per session
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" className="font-medium">
            View Details
          </Button>
        </CardFooter>
      </Link>

      <ReportProductDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        product={product}
      />
    </Card>
  );
}
