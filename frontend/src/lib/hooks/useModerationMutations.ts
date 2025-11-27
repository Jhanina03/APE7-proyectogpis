import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { moderationApi, type ReportType } from '@/lib/api/moderation';
import { toast } from 'sonner';

// Query keys
const INCIDENTS_QUERY_KEY = 'incidents';

/**
 * Hook for creating a product report
 */
export function useCreateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      reporterId: string;
      productId: number;
      type: ReportType;
      comment?: string;
    }) => moderationApi.createReport(data),
    onSuccess: () => {
      // Invalidate all relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['likedProducts'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'status'] });

      toast.success('Report submitted successfully!', {
        description: 'Our moderation team will review your report.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to submit report', {
        description: error?.message || 'Please try again later.',
      });
    },
  });
}

/**
 * Hook for appealing an incident
 */
export function useAppealIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ incidentId, reason }: { incidentId: number; reason: string }) =>
      moderationApi.appealIncident(incidentId, reason),
    onSuccess: () => {
      // Invalidate all relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['likedProducts'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'status'] });

      toast.success('Appeal submitted successfully!', {
        description: 'Your appeal will be reviewed by our moderation team.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to submit appeal', {
        description: error?.message || 'Please try again later.',
      });
    },
  });
}

/**
 * Hook to fetch all incidents
 */
export function useIncidents() {
  return useQuery({
    queryKey: [INCIDENTS_QUERY_KEY],
    queryFn: () => moderationApi.getAllIncidents(),
  });
}

/**
 * Hook to assign a moderator to an incident
 */
export function useAssignModerator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ incidentId, moderatorId }: { incidentId: number; moderatorId: string }) =>
      moderationApi.assignModerator(incidentId, moderatorId),
    onSuccess: () => {
      // Invalidate all relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['likedProducts'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'status'] });

      toast.success('Incident assigned successfully!', {
        description: 'You can now review and resolve this incident.',
      });
    },
    onError: (error: any) => {
      toast.error('Failed to assign moderator', {
        description: error?.message || 'Please try again later.',
      });
    },
  });
}

/**
 * Hook to resolve an incident (accept or reject)
 */
export function useResolveIncident() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      incidentId,
      finalStatus
    }: {
      incidentId: number;
      finalStatus: 'ACCEPTED' | 'REJECTED';
    }) => moderationApi.resolveIncident(incidentId, finalStatus),
    onSuccess: (_, variables) => {
      // Invalidate all relevant queries to ensure fresh data
      queryClient.invalidateQueries({ queryKey: [INCIDENTS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['likedProducts'] });
      queryClient.invalidateQueries({ queryKey: ['userProducts'] });
      queryClient.invalidateQueries({ queryKey: ['nearbyProducts'] });
      queryClient.invalidateQueries({ queryKey: ['products', 'status'] });

      const action = variables.finalStatus === 'ACCEPTED' ? 'accepted' : 'rejected';
      toast.success(`Incident ${action} successfully!`, {
        description: `The product status has been updated accordingly.`,
      });
    },
    onError: (error: any) => {
      toast.error('Failed to resolve incident', {
        description: error?.message || 'Please try again later.',
      });
    },
  });
}
