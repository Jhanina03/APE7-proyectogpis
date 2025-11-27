import { useState } from "react";
import { UserPlus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserManagementCard } from "@/components/users/UserManagementCard";
import { ModeratorFormDialog } from "@/components/users/ModeratorFormDialog";
import { useUsers } from "@/lib/hooks/useUserManagement";

export default function ModeratorsPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch moderators
  const { data: moderators, isLoading, error } = useUsers("MODERATOR");

  // Filter moderators based on search and status
  const filteredModerators = moderators?.filter((moderator) => {
    const matchesSearch =
      searchQuery === "" ||
      moderator.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      moderator.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      moderator.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      moderator.nationalId.includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && moderator.isActive) ||
      (statusFilter === "inactive" && !moderator.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Moderators Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage moderator accounts
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Create Moderator
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active Only</SelectItem>
              <SelectItem value="inactive">Inactive Only</SelectItem>
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
            Failed to load moderators. Please try again.
          </p>
        </div>
      )}

      {/* Moderators List */}
      {!isLoading && !error && (
        <>
          {filteredModerators && filteredModerators.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredModerators.map((moderator) => (
                <UserManagementCard key={moderator.id} user={moderator} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No moderators match your filters."
                  : "No moderators found. Create your first moderator to get started."}
              </p>
            </div>
          )}

          {/* Results count */}
          {filteredModerators && filteredModerators.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredModerators.length} of {moderators?.length || 0}{" "}
              moderator{moderators && moderators.length !== 1 ? "s" : ""}
            </div>
          )}
        </>
      )}

      {/* Create Moderator Dialog */}
      <ModeratorFormDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  );
}
