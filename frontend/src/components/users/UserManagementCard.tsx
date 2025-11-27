import { useState } from "react";
import { Mail, Phone, MapPin, Calendar, User as UserIcon, ShieldCheck, ShieldOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types/user";
import { useChangeUserStatus } from "@/lib/hooks/useUserManagement";

interface UserManagementCardProps {
  user: User;
  className?: string;
}

export function UserManagementCard({
  user,
  className,
}: UserManagementCardProps) {
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const changeStatusMutation = useChangeUserStatus();

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const handleStatusChange = async () => {
    try {
      await changeStatusMutation.mutateAsync({
        userId: user.id,
        isActive: !user.isActive,
      });
      setShowStatusDialog(false);
    } catch (error) {
      // Error handling is done in the mutation hook
      console.log("error", error);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role.toUpperCase()) {
      case "ADMIN":
        return "bg-purple-500";
      case "MODERATOR":
        return "bg-blue-500";
      case "CLIENT":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <>
      <Card
        className={cn(
          "group overflow-hidden transition-shadow hover:shadow-lg",
          !user.isActive && "opacity-60",
          className
        )}
      >
        <div className="p-6">
          {/* Header with name and badges */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <UserIcon className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-xl font-semibold">
                  {user.firstName} {user.lastName}
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={cn("text-xs", getRoleBadgeColor(user.role))}>
                  {user.role}
                </Badge>
                <Badge
                  variant={user.isActive ? "default" : "secondary"}
                  className={cn(
                    "text-xs",
                    user.isActive ? "bg-green-500" : "bg-gray-500"
                  )}
                >
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
                <Badge
                  variant={user.isVerified ? "default" : "outline"}
                  className={cn(
                    "text-xs",
                    user.isVerified ? "bg-blue-500" : ""
                  )}
                >
                  {user.isVerified ? "Verified" : "Unverified"}
                </Badge>
              </div>
            </div>

            {/* Status change button */}
            <Button
              variant={user.isActive ? "destructive" : "default"}
              size="sm"
              onClick={() => setShowStatusDialog(true)}
              className={cn(
                "flex items-center gap-2",
                user.isActive
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-green-500 hover:bg-green-600"
              )}
            >
              {user.isActive ? (
                <>
                  <ShieldOff className="h-4 w-4" />
                  Deactivate
                </>
              ) : (
                <>
                  <ShieldCheck className="h-4 w-4" />
                  Activate
                </>
              )}
            </Button>
          </div>

          {/* User details grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>

            {user.phone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span>{user.phone}</span>
              </div>
            )}

            {user.address && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="truncate">{user.address}</span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="text-muted-foreground">
                Joined {formatDate(user.createdAt)}
              </span>
            </div>
          </div>

          {/* National ID and Gender */}
          <div className="mt-3 pt-3 border-t flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <strong>ID:</strong> {user.nationalId}
            </span>
            {user.gender && (
              <span>
                <strong>Gender:</strong> {user.gender}
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* Status Change Confirmation Dialog */}
      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.isActive ? "Deactivate" : "Activate"} User Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.isActive ? (
                <>
                  This will deactivate <strong>{user.firstName} {user.lastName}</strong>'s account.
                  They will not be able to log in or access the platform. Any products owned by this user will also be affected.
                </>
              ) : (
                <>
                  This will activate <strong>{user.firstName} {user.lastName}</strong>'s account.
                  They will be able to log in and access the platform again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              className={cn(
                user.isActive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : "bg-green-500 text-white hover:bg-green-600"
              )}
              disabled={changeStatusMutation.isPending}
            >
              {changeStatusMutation.isPending
                ? user.isActive
                  ? "Deactivating..."
                  : "Activating..."
                : user.isActive
                ? "Deactivate"
                : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
