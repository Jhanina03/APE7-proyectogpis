import { useState } from "react";
import { AlertTriangle, CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ProductImage } from "@/components/products/ProductImage";
import type { Incident } from "@/lib/api/moderation";
import { getCategoryInfo } from "@/lib/constants/categories";
import { cn } from "@/lib/utils";
import {
  useAssignModerator,
  useResolveIncident,
} from "@/lib/hooks/useModerationMutations";
import { useAuth } from "@/contexts/AuthContext";

interface ResolveIncidentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  incident: Incident | null;
  isAppeal?: boolean;
}

export function ResolveIncidentDialog({
  open,
  onOpenChange,
  incident,
  isAppeal = false,
}: ResolveIncidentDialogProps) {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const assignModeratorMutation = useAssignModerator();
  const resolveIncidentMutation = useResolveIncident();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
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

  const handleResolve = async (finalStatus: "ACCEPTED" | "REJECTED") => {
    if (!incident || !user) return;

    setIsProcessing(true);
    try {
      // First, assign the moderator if not already assigned (or assign appeal moderator)
      const needsAssignment = isAppeal
        ? !incident.appealModeratorId
        : !incident.moderatorId;

      if (needsAssignment) {
        await assignModeratorMutation.mutateAsync({
          incidentId: incident.id,
          moderatorId: user.id,
        });
      }

      // Then resolve the incident
      await resolveIncidentMutation.mutateAsync({
        incidentId: incident.id,
        finalStatus,
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to resolve incident:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!incident) return null;

  const categoryInfo = incident.product
    ? getCategoryInfo(incident.product.category)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            {isAppeal ? "Review Appeal" : "Review Incident Report"}
          </DialogTitle>
          <DialogDescription>
            {isAppeal
              ? "Review the user's appeal and make a final decision on this incident."
              : "Review this incident and decide whether to accept or reject the report."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Incident Information */}
          <div className="p-4 bg-muted/50 rounded-lg border">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" />
              Incident Details
            </h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <Badge
                  className={cn("ml-2", getIncidentTypeColor(incident.type))}
                >
                  {incident.type}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Status:</span>
                <Badge variant="outline" className="ml-2">
                  {incident.status}
                </Badge>
              </div>
              <div>
                <span className="text-muted-foreground">Reported by:</span>
                <span className="ml-2 font-medium">
                  {incident.reporterId === '0'
                    ? "System"
                    : `User #${incident.reporterId}`}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Date:</span>
                <span className="ml-2 font-medium">
                  {formatDate(incident.createdAt)}
                </span>
              </div>
            </div>

            {incident.comment && (
              <div className="mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Report Reason:</strong>
                </p>
                <p className="text-sm">{incident.comment}</p>
              </div>
            )}

            {isAppeal && incident.appealReason && (
              <div className="mt-3 pt-3 border-t bg-purple-50 dark:bg-purple-950/20 -m-4 p-4 rounded-b-lg">
                <p className="text-sm text-purple-700 dark:text-purple-400 mb-1 font-semibold">
                  Appeal Reason:
                </p>
                <p className="text-sm text-purple-900 dark:text-purple-300">
                  {incident.appealReason}
                </p>
              </div>
            )}
          </div>

          {/* Product Information */}
          {incident.product && (
            <div className="p-4 bg-muted/50 rounded-lg border">
              <h3 className="font-semibold mb-3">Product Information</h3>
              <div className="grid md:grid-cols-[150px_1fr] gap-4">
                {/* Product Image */}
                <div className="relative aspect-square overflow-hidden rounded-md">
                  <ProductImage
                    images={incident.product.images}
                    alt={incident.product.name}
                    className="h-full w-full"
                  />
                </div>

                {/* Product Details */}
                <div className="space-y-2">
                  <div>
                    <h4 className="font-semibold text-lg">
                      {incident.product.name}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      {categoryInfo && (
                        <Badge variant="outline" className="text-xs">
                          {categoryInfo.icon} {categoryInfo.name}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {incident.product.type}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {incident.product.status}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {incident.product.description}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold">
                      {formatPrice(incident.product.price)}
                    </p>
                    {incident.product.type === "SERVICE" && (
                      <span className="text-xs text-muted-foreground">
                        per session
                      </span>
                    )}
                  </div>
                  {incident.product.address && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Address:</strong> {incident.product.address}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Warning Messages */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {isAppeal ? (
                <>
                  <strong>Final Decision:</strong> This is the final review for
                  this incident. If you accept the report, the product will be{" "}
                  <strong>permanently banned</strong>. If you reject it, the
                  product will be <strong>restored to active status</strong>.
                </>
              ) : (
                <>
                  <strong>Important:</strong> If you accept this report, the
                  product will be <strong>suspended</strong> and the owner will
                  be able to appeal. If you reject it, the product will be{" "}
                  <strong>restored to active status</strong>.
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => handleResolve("REJECTED")}
              disabled={isProcessing}
              className="text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
            >
              <XCircle className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Reject Report"}
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleResolve("ACCEPTED")}
              disabled={isProcessing}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isProcessing ? "Processing..." : "Accept Report"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
