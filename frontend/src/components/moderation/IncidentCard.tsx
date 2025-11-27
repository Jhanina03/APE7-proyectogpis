import { Link } from "react-router-dom";
import { MapPin, AlertTriangle, User, Calendar, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/products/ProductImage";
import type { Incident } from "@/lib/api/moderation";
import { getCategoryInfo } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

interface IncidentCardProps {
  incident: Incident;
  onReview: (incident: Incident) => void;
  className?: string;
  isAppeal?: boolean;
}

export function IncidentCard({
  incident,
  onReview,
  className,
  isAppeal = false,
}: IncidentCardProps) {
  const { user } = useAuth();

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

  const getIncidentTypeColor = (type: string) => {
    switch (type) {
      case "DANGEROUS":
        return "bg-red-500";
      case "FRAUD":
        return "bg-orange-500";
      case "INAPPROPRIATE":
        return "bg-yellow-500";
      case "OTHER":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  const getIncidentStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-orange-500";
      case "ACCEPTED":
        return "bg-red-500";
      case "REJECTED":
        return "bg-green-500";
      case "APPEALED":
        return "bg-purple-500";
      default:
        return "bg-gray-500";
    }
  };

  const getProductStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-500";
      case "SUSPENDED":
        return "bg-gray-500";
      case "REPORTED":
        return "bg-orange-500";
      case "BANNED":
        return "bg-red-600";
      case "DELETED":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  // Disable review button logic
  const isReviewDisabled = () => {
    if (isAppeal) {
      // For appeals, disable if current user was the initial moderator
      return incident.moderatorId === user?.id;
    }
    // For initial reports, disable if not PENDING
    return incident.status !== "PENDING";
  };

  const categoryInfo = incident.product
    ? getCategoryInfo(incident.product.category)
    : null;

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-shadow hover:shadow-lg",
        className
      )}
    >
      <div className="grid md:grid-cols-[250px_1fr] gap-4">
        {/* Product Image */}
        {incident.product && (
          <Link
            to={`/product/${incident.product.id}`}
            className="relative aspect-square md:aspect-auto"
          >
            <ProductImage
              images={incident.product.images}
              alt={incident.product.name}
              className="h-full w-full object-cover pl-2"
            />
            {!incident.product.availability && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Badge variant="secondary" className="text-sm">
                  Unavailable
                </Badge>
              </div>
            )}
          </Link>
        )}

        {/* Content */}
        <div className="flex flex-col p-4">
          <div className="flex-1">
            {/* Product Header */}
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="flex-1">
                {incident.product && (
                  <>
                    <Link to={`/product/${incident.product.id}`}>
                      <h3 className="line-clamp-1 text-xl font-semibold leading-tight hover:underline">
                        {incident.product.name}
                      </h3>
                    </Link>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      {categoryInfo && (
                        <Badge variant="outline" className="text-xs">
                          {categoryInfo.icon} {categoryInfo.name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {incident.product.type}
                      </Badge>
                      <Badge
                        className={cn(
                          "text-xs",
                          getProductStatusColor(incident.product.status)
                        )}
                      >
                        {incident.product.status}
                      </Badge>
                    </div>
                  </>
                )}
              </div>

              {/* Review Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => onReview(incident)}
                disabled={isReviewDisabled()}
                title={
                  isReviewDisabled()
                    ? isAppeal
                      ? "You cannot review your own initial decision"
                      : "This incident is not available for review"
                    : "Review this incident"
                }
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Review
              </Button>
            </div>

            {/* Product Description */}
            {incident.product && (
              <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                {incident.product.description}
              </p>
            )}

            {/* Incident Information */}
            <div className="mb-3 p-3 bg-muted/50 rounded-md border">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="font-semibold text-sm">Incident Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Badge
                    className={cn(
                      "text-xs",
                      getIncidentTypeColor(incident.type)
                    )}
                  >
                    {incident.type}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-xs",
                      getIncidentStatusColor(incident.status)
                    )}
                  >
                    {incident.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <User className="h-3 w-3" />
                  <span>
                    Reporter:{" "}
                    {incident.reporter
                      ? `${incident.reporter.firstName} ${incident.reporter.lastName}`
                      : "System"}
                  </span>
                </div>
              </div>

              {/* Comment/Reason */}
              {incident.comment && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-start gap-2">
                    <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {incident.comment}
                    </p>
                  </div>
                </div>
              )}

              {/* Appeal Reason (if applicable) */}
              {isAppeal && incident.appealReason && (
                <div className="mt-2 pt-2 border-t">
                  <div className="flex items-start gap-2">
                    <FileText className="h-3 w-3 mt-0.5 flex-shrink-0 text-purple-600" />
                    <div>
                      <p className="text-xs font-semibold text-purple-600 mb-1">
                        Appeal Reason:
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {incident.appealReason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              {incident.product && incident.product.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{incident.product.address}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Reported {formatDate(incident.createdAt)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          {incident.product && (
            <div className="mt-4 flex items-center justify-between border-t pt-4">
              <div>
                <p className="text-2xl font-bold">
                  {formatPrice(incident.product.price)}
                </p>
                {incident.product.type === "SERVICE" && (
                  <p className="text-xs text-muted-foreground">per session</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
