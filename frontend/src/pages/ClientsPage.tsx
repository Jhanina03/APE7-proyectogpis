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
import { UserManagementCard } from "@/components/users/UserManagementCard";
import { useUsers } from "@/lib/hooks/useUserManagement";

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch clients
  const { data: clients, isLoading, error } = useUsers("CLIENT");

  // Filter clients based on search and status
  const filteredClients = clients?.filter((client) => {
    const matchesSearch =
      searchQuery === "" ||
      client.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.nationalId.includes(searchQuery);

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && client.isActive) ||
      (statusFilter === "inactive" && !client.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="container px-4 py-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Clients Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage client accounts and their status
          </p>
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
            Failed to load clients. Please try again.
          </p>
        </div>
      )}

      {/* Clients List */}
      {!isLoading && !error && (
        <>
          {filteredClients && filteredClients.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {filteredClients.map((client) => (
                <UserManagementCard key={client.id} user={client} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all"
                  ? "No clients match your filters."
                  : "No clients found in the system."}
              </p>
            </div>
          )}

          {/* Results count */}
          {filteredClients && filteredClients.length > 0 && (
            <div className="mt-6 text-center text-sm text-muted-foreground">
              Showing {filteredClients.length} of {clients?.length || 0}{" "}
              client{clients && clients.length !== 1 ? "s" : ""}
            </div>
          )}
        </>
      )}
    </div>
  );
}
