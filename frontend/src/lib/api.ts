/**
 * API Client Utility
 * Centralized API configuration with environment variable support and auth handling
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Types for API responses
export interface ApiError {
  error: string;
  message?: string;
}

export class ApiRequestError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.details = details;
  }
}

export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
}

export interface AuthResponse {
  access_token: string;
  user: User;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  location: string;
  availability: string[];
  rating: number;
  image: string;
  experience?: number;
  reviewCount?: number;
  availableToday?: boolean;
  consultationTypes?: ('video' | 'in-person')[];
  nextAvailable?: string;
  isAvailable?: boolean;
  availabilityStatus?: string;
}

export interface Appointment {
  id: string;
  patientId?: string;
  patientName?: string;
  patientImage?: string;
  doctorId: string;
  doctorName: string;
  doctorImage?: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'in_progress' | 'no_show' | 'rejected';
  symptoms?: string;
  type?: 'video' | 'in-person';
  rated?: boolean;
  slotDuration?: number;
  call_started_at?: string;
  call_ended_at?: string;
  call_duration?: number;
}

export interface Patient {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  currentMedications?: string;
  chronicConditions?: string[];
  previousSurgeries?: string;
  insuranceProvider?: string;
  insurancePolicyNumber?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  date: string;
  type: string;
  doctor: string;
  description: string;
  result?: string;
  notes?: string;
}

export interface Activity {
  id: string;
  type: 'appointment' | 'prescription' | 'report' | 'message';
  title: string;
  description: string;
  timestamp: string;
  icon: string;
  color: string;
}

export interface DoctorAnalytics {
  totalAppointments: number;
  appointmentsByStatus: {
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
  uniquePatients: number;
  thisMonthAppointments: number;
  todayAppointments: number;
  rating: number;
  ratingCount: number;
  prescriptionsWritten: number;
}

export interface PatientAnalytics {
  totalAppointments: number;
  upcomingAppointments: number;
  completedAppointments: number;
  prescriptionsReceived: number;
  doctorsVisited: number;
  nextAppointment: {
    date: string;
    time: string;
    doctorName: string;
  } | null;
}

export interface Schedule {
  doctorId: string;
  weeklySchedule: {
    [key: string]: {
      start: string;
      end: string;
      enabled: boolean;
    };
  };
  blockedDates: string[];
  slotDuration: number;
}

export interface Prescription {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentId?: string;
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  diagnosis?: string;
  notes?: string;
  createdAt: string;
  doctorName?: string;
  patientName?: string;
}

export interface Review {
  id: string;
  doctorId: string;
  patientId: string;
  appointmentId: string;
  score: number;
  comment?: string;
  createdAt: string;
  patientName?: string;
}

export interface PatientHistory {
  patient: Patient;
  medicalRecords: MedicalRecord[];
  appointments: Appointment[];
  prescriptions: Prescription[];
}

// Token management
export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
};

const setToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

const removeToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
};

const setUser = (user: User): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('user', JSON.stringify(user));
  }
};

// Base fetch wrapper
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiRequestError(
        errorData.error || errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      );
    }

    return response.json();
  } catch (error) {
    // Check if it's a network error (backend not running)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('Backend server is not running. Please start the backend server.');
    }
    throw error;
  }
}

// Auth API
export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const response = await fetchApi<{
      access_token: string;
      role: 'patient' | 'doctor';
      id: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Construct user object from backend response
    const user: User = {
      id: response.id,
      email: email,
      role: response.role,
    };

    setToken(response.access_token);
    setUser(user);

    return {
      access_token: response.access_token,
      user,
    };
  },

  register: async (data: {
    email: string;
    password: string;
    role: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    specialty?: string;
    location?: string;
  }): Promise<AuthResponse | { message: string; pending_verification?: boolean }> => {
    const response = await fetchApi<{
      message: string;
      id: string;
      pending_verification?: boolean;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    // For doctors, don't auto-login as they need admin verification
    if (data.role === 'doctor' && response.pending_verification) {
      return { message: response.message, pending_verification: true };
    }

    // For patients, log them in after registration
    return authApi.login(data.email, data.password);
  },

  logout: (): void => {
    removeToken();
  },

  getToken,
  getUser,
  isAuthenticated: (): boolean => !!getToken(),
};

// Pagination types
export interface PaginationInfo {
  current_page: number;
  per_page: number;
  total_pages: number;
  total_items: number;
  has_next: boolean;
  has_prev: boolean;
  next_page: number | null;
  prev_page: number | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}

// Doctors API
export const doctorsApi = {
  getAll: (page: number = 1, perPage: number = 12): Promise<PaginatedResponse<Doctor>> =>
    fetchApi<PaginatedResponse<Doctor>>(`/doctors?page=${page}&per_page=${perPage}`),

  getNextAvailable: (): Promise<Record<string, string | null>> =>
    fetchApi<Record<string, string | null>>('/doctors/next-available'),

  getById: (id: string): Promise<Doctor> => fetchApi<Doctor>(`/doctors/${id}`),

  getProfile: (): Promise<Doctor> => fetchApi<Doctor>('/doctors/profile'),

  updateProfile: (data: Partial<Doctor>): Promise<Doctor> =>
    fetchApi<Doctor>('/doctors/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  requestProfileUpdate: (data: Partial<Doctor>): Promise<{ message: string }> =>
    fetchApi<{ message: string }>('/doctors/profile/request-update', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getPendingUpdate: (): Promise<{
    hasPendingUpdate: boolean;
    pendingData?: Partial<Doctor>;
    requestedAt?: string;
  }> => fetchApi('/doctors/profile/pending'),
};

// Appointments API
export const appointmentsApi = {
  getAll: (page: number = 1, perPage: number = 10): Promise<PaginatedResponse<Appointment>> =>
    fetchApi<PaginatedResponse<Appointment>>(`/appointments?page=${page}&per_page=${perPage}`),

  create: (data: {
    doctorId: string;
    doctorName: string;
    date: string;
    time: string;
    symptoms?: string;
  }): Promise<Appointment> =>
    fetchApi<Appointment>('/appointments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string): Promise<Appointment> =>
    fetchApi<Appointment>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  revoke: (id: string): Promise<Appointment> =>
    fetchApi<Appointment>(`/appointments/${id}/revoke`, {
      method: 'PATCH',
    }),

  complete: (
    id: string,
    data: {
      type?: string;
      description?: string;
      result?: string;
      notes?: string;
    }
  ): Promise<{ appointment: Appointment; medicalRecord: MedicalRecord }> =>
    fetchApi(`/appointments/${id}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  delete: (id: string): Promise<{ message: string }> =>
    fetchApi(`/appointments/${id}`, {
      method: 'DELETE',
    }),

  reject: (id: string, reason: string): Promise<{ message: string; appointment: Appointment }> =>
    fetchApi(`/appointments/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  reschedule: (
    id: string,
    data: { date: string; time: string }
  ): Promise<{ message: string; appointment: Appointment }> =>
    fetchApi(`/appointments/${id}/reschedule`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
};

// Patients API
export const patientsApi = {
  getProfile: (): Promise<Patient> => fetchApi<Patient>('/patients/profile'),

  updateProfile: (data: Partial<Patient>): Promise<{ message: string; profile: Patient }> =>
    fetchApi('/patients/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getRecords: (): Promise<MedicalRecord[]> => fetchApi<MedicalRecord[]>('/patients/records'),

  getPatientById: (id: string): Promise<Patient> => fetchApi<Patient>(`/patients/${id}`),

  getDoctorPatients: (): Promise<Patient[]> => fetchApi<Patient[]>('/patients/doctor'),

  getPatientHistory: (patientId: string): Promise<PatientHistory> =>
    fetchApi<PatientHistory>(`/patients/${patientId}/history`),
};

// Analytics API
export const analyticsApi = {
  getDoctor: (): Promise<DoctorAnalytics> => fetchApi<DoctorAnalytics>('/analytics/doctor'),

  getPatient: (): Promise<PatientAnalytics> => fetchApi<PatientAnalytics>('/analytics/patient'),

  getDoctorChartData: (): Promise<{
    appointmentsData: { day: string; appointments: number }[];
    statusData: { name: string; value: number; color: string }[];
  }> => fetchApi('/analytics/doctor/chart'),

  getPublicStats: (): Promise<{
    activePatients: number;
    licensedDoctors: number;
    completedConsultations: number;
    satisfactionRate: number;
    averageRating: number;
  }> => fetch(`${API_BASE_URL}/analytics/public-stats`).then((res) => res.json()),
};

// Messages API
export const messagesApi = {
  getMessages: (appointmentId: string): Promise<any[]> =>
    fetchApi<any[]>(`/messages/${appointmentId}`),

  send: (appointmentId: string, content: string): Promise<any> =>
    fetchApi(`/messages/${appointmentId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  getUnreadCount: (appointmentId: string): Promise<{ unread: number }> =>
    fetchApi<{ unread: number }>(`/messages/${appointmentId}/unread`),

  getChatStatus: (
    appointmentId: string
  ): Promise<{
    canChat: boolean;
    appointmentStatus: string;
    isInTimeWindow: boolean;
    timeMessage: string;
    doctorName: string;
    appointmentDate: string;
    appointmentTime: string;
  }> => fetchApi(`/messages/${appointmentId}/status`),
};

// Chatbot API
export const chatbotApi = {
  sendMessage: (
    message: string
  ): Promise<{ message: string; response: string; success: boolean }> =>
    fetchApi<{ message: string; response: string; success: boolean }>('/chatbot/message', {
      method: 'POST',
      body: JSON.stringify({ message }),
    }),

  getHistory: (): Promise<{ history: any[]; success: boolean }> =>
    fetchApi<{ history: any[]; success: boolean }>('/chatbot/history'),

  clearHistory: (): Promise<{ message: string; success: boolean }> =>
    fetchApi<{ message: string; success: boolean }>('/chatbot/history', {
      method: 'DELETE',
    }),
};

// Activities API
export const activitiesApi = {
  getRecent: (): Promise<Activity[]> => fetchApi<Activity[]>('/activities'),
};

// Ratings API
export const ratingsApi = {
  create: (appointmentId: string, score: number, comment?: string): Promise<any> =>
    fetchApi('/ratings/', {
      method: 'POST',
      body: JSON.stringify({ appointmentId, score, comment }),
    }),

  getDoctorRatings: (doctorId: string): Promise<any[]> =>
    fetchApi<any[]>(`/ratings/doctor/${doctorId}`),

  checkRating: (appointmentId: string): Promise<{ hasRated: boolean }> =>
    fetchApi<{ hasRated: boolean }>(`/ratings/check/${appointmentId}`),

  getMyReviews: (): Promise<{ reviews: Review[]; average: number; count: number }> =>
    fetchApi<{ reviews: Review[]; average: number; count: number }>('/ratings/my-reviews'),
};

// Prescriptions API
export const prescriptionsApi = {
  getAll: (): Promise<Prescription[]> => fetchApi<Prescription[]>('/prescriptions/patient'),

  getDoctorPrescriptions: (): Promise<Prescription[]> =>
    fetchApi<Prescription[]>('/prescriptions/doctor'),

  create: (data: {
    appointmentId: string;
    medications: { name: string; dosage: string; frequency: string; duration: string }[];
    diagnosis?: string;
    notes?: string;
  }): Promise<Prescription> =>
    fetchApi('/prescriptions/', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  createForPatient: (
    patientId: string,
    data: {
      medications: { name: string; dosage: string; frequency: string; duration: string }[];
      diagnosis?: string;
      notes?: string;
    }
  ): Promise<Prescription> =>
    fetchApi(`/prescriptions/patient/${patientId}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getByAppointment: (appointmentId: string): Promise<Prescription> =>
    fetchApi<Prescription>(`/prescriptions/appointment/${appointmentId}`),

  getById: (id: string): Promise<Prescription> => fetchApi<Prescription>(`/prescriptions/${id}`),
};

// Reports API
export const reportsApi = {
  downloadPrescription: (prescriptionId: string): Promise<Blob> =>
    fetch(`${API_BASE_URL}/reports/prescription/${prescriptionId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }).then((res) => {
      if (!res.ok) throw new Error('Failed to download prescription');
      return res.blob();
    }),

  downloadMedicalRecord: (recordId: string): Promise<Blob> =>
    fetch(`${API_BASE_URL}/reports/medical-record/${recordId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${getToken()}`,
      },
    }).then((res) => {
      if (!res.ok) throw new Error('Failed to download medical record');
      return res.blob();
    }),

  generate: (appointmentId?: string): Promise<Blob> =>
    fetch(
      `${API_BASE_URL}/reports/generate${appointmentId ? `?appointmentId=${appointmentId}` : ''}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      }
    ).then((res) => res.blob()),
};

// Notifications API
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'appointment' | 'message' | 'prescription';
  link?: string;
  read: boolean;
  createdAt: string;
}

export const notificationsApi = {
  getAll: (
    limit?: number,
    unreadOnly?: boolean
  ): Promise<{ notifications: Notification[]; unreadCount: number }> =>
    fetchApi(`/notifications/?limit=${limit || 20}&unread_only=${unreadOnly || false}`),

  getUnreadCount: (): Promise<{ count: number }> => fetchApi('/notifications/count'),

  markAsRead: (notificationId: string): Promise<{ success: boolean }> =>
    fetchApi(`/notifications/${notificationId}/read`, { method: 'POST' }),

  markAllAsRead: (): Promise<{ success: boolean }> =>
    fetchApi('/notifications/read-all', { method: 'POST' }),

  delete: (notificationId: string): Promise<{ success: boolean }> =>
    fetchApi(`/notifications/${notificationId}`, { method: 'DELETE' }),
};

// Schedules API
export const schedulesApi = {
  getMySchedule: (): Promise<Schedule> => fetchApi<Schedule>('/schedules/'),

  update: (data: Partial<Schedule>): Promise<Schedule> =>
    fetchApi<Schedule>('/schedules/', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  getAvailableSlots: (
    doctorId: string,
    date: string
  ): Promise<{ doctorId: string; date: string; slots: string[] }> =>
    fetchApi(`/schedules/doctor/${doctorId}/slots?date=${date}`),

  addBlockedDate: (date: string): Promise<{ message: string }> =>
    fetchApi('/schedules/blocked-dates', {
      method: 'POST',
      body: JSON.stringify({ date }),
    }),

  removeBlockedDate: (date: string): Promise<{ message: string }> =>
    fetchApi('/schedules/blocked-dates', {
      method: 'DELETE',
      body: JSON.stringify({ date }),
    }),
};

// Video Call Types
export interface VideoCallToken {
  token: string;
  api_key: string;
  user_id: string;
  user_name: string;
}

export interface CallDetails {
  call_id: string;
  token: string;
  api_key: string;
  user_id: string;
  user_name: string;
  appointment: Appointment;
  other_user_id: string;
  other_user_name: string;
}

export interface StreamToken {
  token: string;
  expires_in: number;
}

// Events API (SSE)
export const eventsApi = {
  getStreamToken: (): Promise<StreamToken> =>
    fetchApi<StreamToken>('/events/token', {
      method: 'POST',
    }),
};

// Video Calls API
export const videoCallsApi = {
  getToken: (): Promise<VideoCallToken> => fetchApi<VideoCallToken>('/video-calls/token', {
    method: 'POST'
  }),

  createCall: (appointmentId: string): Promise<CallDetails> =>
    fetchApi<CallDetails>(`/video-calls/call/${appointmentId}`, {
      method: 'POST'
    }),

  endCall: (appointmentId: string, duration?: number): Promise<{ message: string }> =>
    fetchApi<{ message: string }>(`/video-calls/call/${appointmentId}/end`, {
      method: 'POST',
      body: JSON.stringify({ duration })
    }),
};

export default {
  auth: authApi,
  doctors: doctorsApi,
  appointments: appointmentsApi,
  patients: patientsApi,
  analytics: analyticsApi,
  messages: messagesApi,
  chatbot: chatbotApi,
  activities: activitiesApi,
  ratings: ratingsApi,
  prescriptions: prescriptionsApi,
  reports: reportsApi,
  notifications: notificationsApi,
  schedules: schedulesApi,
  events: eventsApi,
  videoCalls: videoCallsApi,
};
