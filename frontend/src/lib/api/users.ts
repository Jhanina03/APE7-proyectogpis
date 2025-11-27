import { apiClient } from "./client";
import type { User, CreateModeratorData, ChangeUserStatusData } from "@/lib/types/user";

/**
 * Users API Service
 * Handles user management operations (moderators and clients)
 */
class UsersApi {
  /**
   * Get all users with optional filters
   * @param role - Filter by role (MODERATOR, CLIENT, ADMIN)
   * @param isActive - Filter by active status
   */
  async getAllUsers(role?: string, isActive?: boolean): Promise<User[]> {
    let endpoint = "/users";
    const params = new URLSearchParams();

    if (role) {
      params.append("role", role);
    }
    if (isActive !== undefined) {
      params.append("isActive", isActive.toString());
    }

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    return apiClient.get<User[]>(endpoint);
  }

  /**
   * Create a new moderator
   * Backend auto-generates password and sends email
   */
  async createModerator(data: Omit<CreateModeratorData, "role">): Promise<User> {
    const moderatorData: CreateModeratorData = {
      ...data,
      role: "MODERATOR",
    };
    return apiClient.post<User>("/users/moderators", moderatorData);
  }

  /**
   * Change user account status (activate/deactivate)
   */
  async changeUserStatus(userId: string, isActive: boolean): Promise<User> {
    const data: ChangeUserStatusData = { isActive };
    return apiClient.patch<User>(`/users/${userId}/status`, data);
  }
}

export const usersApi = new UsersApi();
