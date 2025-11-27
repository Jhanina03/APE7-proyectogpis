import { apiClient } from './client';
import type { Product } from '@/lib/types/product';
import type { User } from '@/lib/types/user';

// Report types
export type ReportType = 'DANGEROUS' | 'FRAUD' | 'INAPPROPRIATE' | 'OTHER';

// Incident response interface
export interface Incident {
  id: number;
  productId: number;
  type: ReportType;
  comment: string | null;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'APPEALED';
  reporterId: string;
  moderatorId: string | null;
  appealModeratorId?: string | null;
  appealReason: string | null;
  createdAt: string;
  updatedAt: string;
  product: Product;
  reporter?: User;
  moderator?: User;
  appealModerator?: User;
}

// API endpoints for moderation
export const moderationApi = {
  /**
   * Create a new report for a product
   */
  async createReport(data: {
    reporterId: string;
    productId: number;
    type: ReportType;
    comment?: string;
  }): Promise<Incident> {
    return apiClient.post<Incident>('/moderation/report', data);
  },

  /**
   * Appeal an incident
   */
  async appealIncident(incidentId: number, reason: string): Promise<Incident> {
    return apiClient.patch<Incident>(`/moderation/incident/${incidentId}/appeal`, {
      reason,
    });
  },

  /**
   * Get all incidents
   */
  async getAllIncidents(): Promise<Incident[]> {
    return apiClient.get<Incident[]>('/moderation/incidents');
  },

  /**
   * Get incidents by status
   */
  async getIncidentsByStatus(status: string): Promise<Incident[]> {
    return apiClient.get<Incident[]>(`/moderation/incidents/${status}`);
  },

  /**
   * Assign a moderator to an incident
   * This endpoint is used for both initial assignment and appeal assignment
   */
  async assignModerator(incidentId: number, moderatorId: string): Promise<Incident> {
    return apiClient.patch<Incident>(`/moderation/incident/${incidentId}/assign/${moderatorId}`, {});
  },

  /**
   * Resolve an incident (accept or reject)
   * finalStatus can be 'ACCEPTED' or 'REJECTED'
   */
  async resolveIncident(
    incidentId: number,
    finalStatus: 'ACCEPTED' | 'REJECTED'
  ): Promise<Incident> {
    return apiClient.patch<Incident>(`/moderation/incident/${incidentId}/resolve`, {
      finalStatus,
    });
  },

  /**
   * Change incident status
   */
  async changeIncidentStatus(
    incidentId: number,
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'APPEALED'
  ): Promise<Incident> {
    return apiClient.patch<Incident>(`/moderation/incident/${incidentId}/status`, {
      status,
    });
  },
};
