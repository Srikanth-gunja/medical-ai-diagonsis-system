import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { analyticsApi, DoctorAnalytics, PatientAnalytics } from '@/lib/api';

// Query keys for analytics
export const analyticsKeys = {
  all: ['analytics'] as const,
  doctor: () => [...analyticsKeys.all, 'doctor'] as const,
  patient: () => [...analyticsKeys.all, 'patient'] as const,
  doctorChart: () => [...analyticsKeys.all, 'doctor', 'chart'] as const,
  publicStats: () => [...analyticsKeys.all, 'public'] as const,
};

/**
 * Hook to fetch doctor analytics
 */
export function useDoctorAnalytics(enabled: boolean = true) {
  return useQuery({
    queryKey: analyticsKeys.doctor(),
    queryFn: () => analyticsApi.getDoctor(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch doctor chart data
 */
export function useDoctorChartData(enabled: boolean = true) {
  return useQuery({
    queryKey: analyticsKeys.doctorChart(),
    queryFn: () => analyticsApi.getDoctorChartData(),
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch patient analytics
 */
export function usePatientAnalytics() {
  return useQuery({
    queryKey: analyticsKeys.patient(),
    queryFn: () => analyticsApi.getPatient(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch public stats
 */
export function usePublicStats() {
  return useQuery({
    queryKey: analyticsKeys.publicStats(),
    queryFn: () => analyticsApi.getPublicStats(),
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
