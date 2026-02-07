import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { doctorsApi, Doctor, PaginatedResponse } from '@/lib/api';

// Query keys for doctors
export const doctorKeys = {
  all: ['doctors'] as const,
  lists: () => [...doctorKeys.all, 'list'] as const,
  list: (page: number, perPage: number) => [...doctorKeys.lists(), { page, perPage }] as const,
  details: () => [...doctorKeys.all, 'detail'] as const,
  detail: (id: string) => [...doctorKeys.details(), id] as const,
  nextAvailable: () => [...doctorKeys.all, 'next-available'] as const,
  profile: () => [...doctorKeys.all, 'profile'] as const,
};

/**
 * Hook to fetch paginated list of doctors
 * Automatically caches data and handles background refetching
 */
export function useDoctors(page: number = 1, perPage: number = 12) {
  return useQuery({
    queryKey: doctorKeys.list(page, perPage),
    queryFn: () => doctorsApi.getAll(page, perPage),
    // Keep data fresh for 2 minutes (reduces API calls)
    staleTime: 1000 * 60 * 2,
    // Keep unused data in cache for 10 minutes
    gcTime: 1000 * 60 * 10,
  });
}

/**
 * Hook to fetch a single doctor by ID
 */
export function useDoctor(id: string) {
  return useQuery({
    queryKey: doctorKeys.detail(id),
    queryFn: () => doctorsApi.getById(id),
    enabled: !!id, // Only run if ID is provided
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to fetch next available slots for all doctors
 */
export function useNextAvailableSlots() {
  return useQuery({
    queryKey: doctorKeys.nextAvailable(),
    queryFn: () => doctorsApi.getNextAvailable(),
    staleTime: 1000 * 60 * 1,
  });
}

/**
 * Hook to fetch doctor profile
 */
export function useDoctorProfile() {
  return useQuery({
    queryKey: doctorKeys.profile(),
    queryFn: () => doctorsApi.getProfile(),
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook to update doctor profile
 * Automatically invalidates profile cache on success
 */
export function useUpdateDoctorProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: doctorsApi.updateProfile,
    onSuccess: () => {
      // Invalidate profile cache to trigger refetch
      queryClient.invalidateQueries({ queryKey: doctorKeys.profile() });
    },
  });
}

/**
 * Hook to request profile update
 */
export function useRequestProfileUpdate() {
  return useMutation({
    mutationFn: doctorsApi.requestProfileUpdate,
  });
}
