import { useParams, Link } from "react-router-dom";
import {
  MapPin,
  Clock,
  ArrowLeft,
  Heart,
  Flag,
  Mail,
  Calendar,
} from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportProductDialog } from "@/components/moderation/ReportProductDialog";
import { useProduct } from "@/lib/hooks/useProducts";
import { useToggleLike } from "@/lib/hooks/useProductMutations";
import { getCategoryInfo } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading, error } = useProduct(id || "");
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const toggleLikeMutation = useToggleLike();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container px-4 py-8">
          <Skeleton className="h-8 w-32 mb-6" />
          <div className="grid gap-8 md:grid-cols-2">
            <Skeleton className="aspect-square w-full" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="container px-4 py-8">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
          <Card className="p-8 text-center">
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-muted-foreground mb-4">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/products">Browse All Products</Link>
            </Button>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  const categoryInfo = getCategoryInfo(product.category);
  const images = product.images || [];
  const currentImage = images[currentImageIndex];

  return (
    <div className="min-h-screen">
      <Header />

      <div className="container px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/products"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </div>

        {/* Main Content */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
              {currentImage ? (
                <img
                  src={currentImage.url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-muted-foreground">
                  No image available
                </div>
              )}
              {!product.availability && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="secondary" className="text-lg">
                    Unavailable
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative aspect-square w-20 flex-shrink-0 overflow-hidden rounded-md border-2 transition-colors ${
                      index === currentImageIndex
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground"
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={`${product.name} - ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <div className="mb-2 flex items-start justify-between gap-4">
                <div>
                  <Badge variant="outline" className="mb-2">
                    {categoryInfo.icon} {categoryInfo.name}
                  </Badge>
                  <h1 className="text-3xl font-bold tracking-tight">
                    {product.name}
                  </h1>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setReportDialogOpen(true)}
                    title="Report product"
                  >
                    <Flag className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={toggleLikeMutation.isPending}
                    className={cn(
                      "transition-all",
                      product.hasLiked
                        ? "text-red-500 hover:text-red-800"
                        : "hover:text-red-500"
                    )}
                    title={product.hasLiked ? "Unlike" : "Like"}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleLikeMutation.mutate(product.id);
                    }}
                  >
                    <Heart
                      className={cn(
                        "h-4 w-4 transition-all",
                        product.hasLiked && "fill-current text-destructive"
                      )}
                    />
                  </Button>
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-4xl font-bold">
                  {formatPrice(product.price)}
                </p>
                {product.type === "SERVICE" && (
                  <span className="text-sm text-muted-foreground">
                    per session
                  </span>
                )}
              </div>
            </div>

            {/* Likes Count */}
            {product.likesCount !== undefined && product.likesCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="h-4 w-4 fill-current text-red-500" />
                <span>
                  {product.likesCount}{" "}
                  {product.likesCount === 1 ? "person" : "people"} liked this
                </span>
              </div>
            )}

            {/* Status Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge variant={product.availability ? "default" : "secondary"}>
                {product.availability ? "AVAILABLE" : "UNAVAILABLE"}
              </Badge>
              <Badge variant="outline">{product.type}</Badge>
              <Badge variant="outline">{product.status}</Badge>
            </div>

            {/* Description */}
            <div>
              <h2 className="mb-2 text-lg font-semibold">Description</h2>
              <p className="text-muted-foreground">{product.description}</p>
            </div>

            {/* Address & Details */}
            <Card>
              <CardContent className="space-y-3 py-3">
                {product.address && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Address</p>
                      <p className="text-sm text-muted-foreground">
                        {product.address}
                      </p>
                    </div>
                  </div>
                )}

                {product.serviceHours && (
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Service Hours</p>
                      <p className="text-sm text-muted-foreground">
                        {product.serviceHours}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Posted on</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(product.publishDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Seller Information */}
            {product.sellerName && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="mb-3 text-lg font-semibold">
                    Seller Information
                  </h2>
                  <p className="mb-3 font-medium">{product.sellerName}</p>
                  <div className="flex gap-2">
                    <Button className="flex-1" disabled={!product.availability}>
                      <Mail className="mr-2 h-4 w-4" />
                      Contact Seller
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            {!product.sellerName && (
              <div className="flex gap-3">
                <Button
                  className="flex-1"
                  size="lg"
                  disabled={!product.availability}
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Contact Seller
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />

      {/* Report Dialog */}
      <ReportProductDialog
        open={reportDialogOpen}
        onOpenChange={setReportDialogOpen}
        product={product}
      />
    </div>
  );
}
