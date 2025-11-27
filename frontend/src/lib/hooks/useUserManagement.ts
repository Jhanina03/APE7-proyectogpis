import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usersApi } from "@/lib/api/users";
import type { User, CreateModeratorData } from "@/lib/types/user";

// Query keys
const USERS_QUERY_KEY = "users";

/**
 * Hook to fetch users with optional filters
 */
export function useUsers(role?: string, isActive?: boolean) {
  return useQuery({
    queryKey: [USERS_QUERY_KEY, role, isActive],
    queryFn: () => usersApi.getAllUsers(role, isActive),
  });
}

/**
 * Hook to create a new moderator
 */
export function useCreateModerator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<CreateModeratorData, "role">) =>
      usersApi.createModerator(data),
    onSuccess: (newModerator) => {
      // Invalidate users queries to refresh data
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });

      toast.success("Moderator created", {
        description: `${newModerator.firstName} ${newModerator.lastName} has been created. Credentials sent to ${newModerator.email}.`,
      });
    },
    onError: (error) => {
      console.error("Failed to create moderator:", error);
      toast.error("Failed to create moderator", {
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while creating the moderator.",
      });
    },
  });
}

/**
 * Hook to change user status (activate/deactivate)
 */
export function useChangeUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      usersApi.changeUserStatus(userId, isActive),
    onMutate: async ({ userId, isActive }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: [USERS_QUERY_KEY] });

      // Snapshot previous values
      const previousUsers = queryClient.getQueriesData({ queryKey: [USERS_QUERY_KEY] });

      // Optimistically update all users queries
      queryClient.setQueriesData<User[]>(
        { queryKey: [USERS_QUERY_KEY] },
        (old) => {
          if (!old) return old;
          return old.map((user) =>
            user.id === userId ? { ...user, isActive } : user
          );
        }
      );

      return { previousUsers };
    },
    onSuccess: (updatedUser) => {
      toast.success(
        updatedUser.isActive ? "User activated" : "User deactivated",
        {
          description: `${updatedUser.firstName} ${updatedUser.lastName}'s account has been ${
            updatedUser.isActive ? "activated" : "deactivated"
          }.`,
        }
      );
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        context.previousUsers.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }

      console.error("Failed to change user status:", error);
      toast.error("Failed to change user status", {
        description:
          error instanceof Error
            ? error.message
            : "An error occurred while changing user status.",
      });
    },
    onSettled: () => {
      // Invalidate queries to refresh data after mutation
      queryClient.invalidateQueries({ queryKey: [USERS_QUERY_KEY] });
    },
  });
}
