import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi, Appointment, PaginatedResponse } from '@/lib/api';

// Query keys for appointments
export const appointmentKeys = {
  all: ['appointments'] as const,
  lists: () => [...appointmentKeys.all, 'list'] as const,
  list: (page: number, perPage: number) => [...appointmentKeys.lists(), { page, perPage }] as const,
  details: () => [...appointmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...appointmentKeys.details(), id] as const,
  byDoctor: (doctorId: string) => [...appointmentKeys.all, 'doctor', doctorId] as const,
  byPatient: (patientId: string) => [...appointmentKeys.all, 'patient', patientId] as const,
};

/**
 * Hook to fetch paginated list of appointments
 * Automatically caches data and handles background refetching
 */
export function useAppointments(page: number = 1, perPage: number = 10) {
  return useQuery({
    queryKey: appointmentKeys.list(page, perPage),
    queryFn: () => appointmentsApi.getAll(page, perPage),
    // Keep data fresh for 1 minute
    staleTime: 1000 * 60 * 1,
    // Keep unused data in cache for 5 minutes
    gcTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to create a new appointment
 * Automatically invalidates appointments cache on success
 */
export function useCreateAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: appointmentsApi.create,
    onSuccess: () => {
      // Invalidate all appointment lists to refetch
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to update appointment status
 * Automatically updates cache optimistically
 */
export function useUpdateAppointmentStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.updateStatus(id, status),
    onSuccess: (data) => {
      // Update the specific appointment in cache
      queryClient.setQueryData(appointmentKeys.detail(data.id), data);
      // Invalidate lists to refresh
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to revoke/cancel an appointment
 */
export function useRevokeAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: appointmentsApi.revoke,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to complete an appointment
 */
export function useCompleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof appointmentsApi.complete>[1] }) =>
      appointmentsApi.complete(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to delete an appointment
 */
export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: appointmentsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to reject an appointment
 */
export function useRejectAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      appointmentsApi.reject(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}

/**
 * Hook to reschedule an appointment
 */
export function useRescheduleAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { date: string; time: string } }) =>
      appointmentsApi.reschedule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
    },
  });
}
