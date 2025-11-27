// User type matching backend response and AuthContext
export interface User {
  id: string;
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  address?: string;
  gender?: string;
  role: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Data for creating a moderator
export interface CreateModeratorData {
  nationalId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  gender: string;
  role: "MODERATOR";
}

// Response types
export interface ChangeUserStatusData {
  isActive: boolean;
}
