import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Clock, Flag } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/products/ProductImage";
import { ReportProductDialog } from "@/components/moderation/ReportProductDialog";
import type { Product } from "@/lib/types/product";
import { getCategoryInfo } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";

interface ProductModerationCardProps {
  product: Product;
  className?: string;
}

export function ProductModerationCard({
  product,
  className,
}: ProductModerationCardProps) {
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "SUSPENDED":
        return "bg-gray-500";
      case "REPORTED":
        return "bg-orange-500";
      case "DELETED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
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
                      {product.availability ? "AVAILABLE" : "NOT AVAILABLE"}
                    </Badge>
                    <Badge
                      className={cn("text-xs", getStatusColor(product.status))}
                    >
                      {product.status}
                    </Badge>
                  </div>
                </div>

                {/* Report Button */}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setReportDialogOpen(true)}
                  title="Report product"
                  className="hover:bg-destructive hover:text-destructive-foreground"
                >
                  <Flag className="h-4 w-4" />
                </Button>
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

            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-2xl font-bold">
                  {formatPrice(product.price)}
                </p>
                {product.type === "SERVICE" && (
                  <p className="text-xs text-muted-foreground">per session</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Report Dialog */}
      <ReportProductDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        product={product}
      />
    </>
  );
}
