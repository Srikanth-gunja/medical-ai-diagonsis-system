import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { patientsApi, Patient, PatientHistory } from '@/lib/api';

// Query keys for patients
export const patientKeys = {
  all: ['patients'] as const,
  lists: () => [...patientKeys.all, 'list'] as const,
  doctor: () => [...patientKeys.all, 'doctor'] as const,
  details: () => [...patientKeys.all, 'detail'] as const,
  detail: (id: string) => [...patientKeys.details(), id] as const,
  history: (patientId: string) => [...patientKeys.all, 'history', patientId] as const,
  records: () => [...patientKeys.all, 'records'] as const,
  profile: () => [...patientKeys.all, 'profile'] as const,
};

/**
 * Hook to fetch the current patient's profile
 */
export function usePatientProfile() {
  return useQuery({
    queryKey: patientKeys.profile(),
    queryFn: () => patientsApi.getProfile(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch all patients for the current doctor
 */
export function useDoctorPatients(enabled: boolean = true) {
  return useQuery({
    queryKey: patientKeys.doctor(),
    queryFn: () => patientsApi.getDoctorPatients(),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch a patient by ID
 */
export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientsApi.getPatientById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to fetch patient history
 */
export function usePatientHistory(patientId: string) {
  return useQuery({
    queryKey: patientKeys.history(patientId),
    queryFn: () => patientsApi.getPatientHistory(patientId),
    enabled: !!patientId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Hook to fetch medical records
 */
export function usePatientRecords() {
  return useQuery({
    queryKey: patientKeys.records(),
    queryFn: () => patientsApi.getRecords(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook to update patient profile
 */
export function useUpdatePatientProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: patientsApi.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: patientKeys.profile() });
    },
  });
}
