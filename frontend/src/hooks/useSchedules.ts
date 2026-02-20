import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { schedulesApi, Schedule } from '@/lib/api';

// Query keys for schedules
export const scheduleKeys = {
  all: ['schedules'] as const,
  my: () => [...scheduleKeys.all, 'my'] as const,
  doctor: (doctorId: string) => [...scheduleKeys.all, 'doctor', doctorId] as const,
  slots: (doctorId: string, date: string) =>
    [...scheduleKeys.all, 'slots', doctorId, date] as const,
};

/**
 * Hook to fetch the current doctor's schedule
 */
export function useMySchedule(enabled: boolean = true) {
  return useQuery({
    queryKey: scheduleKeys.my(),
    queryFn: () => schedulesApi.getMySchedule(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch available slots for a doctor
 */
export function useAvailableSlots(doctorId: string, date: string) {
  return useQuery({
    queryKey: scheduleKeys.slots(doctorId, date),
    queryFn: () => schedulesApi.getAvailableSlots(doctorId, date),
    enabled: !!doctorId && !!date,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to update the doctor's schedule
 */
export function useUpdateSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schedulesApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.my() });
    },
  });
}

/**
 * Hook to add a blocked date
 */
export function useAddBlockedDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schedulesApi.addBlockedDate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.my() });
    },
  });
}

/**
 * Hook to remove a blocked date
 */
export function useRemoveBlockedDate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: schedulesApi.removeBlockedDate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: scheduleKeys.my() });
    },
  });
}
