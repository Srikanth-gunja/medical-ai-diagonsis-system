'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import AuthenticatedHeader from '@/components/common/AuthenticatedHeader';
import NavigationBreadcrumbs from '@/components/common/NavigationBreadcrumbs';
import StatusIndicatorBar from '@/components/common/StatusIndicatorBar';
import AppointmentCard from './AppointmentCard';
import AnalyticsCard from './AnalyticsCard';
import ScheduleCalendar from './ScheduleCalendar';
import PatientListItem from './PatientListItem';
import PrescriptionForm from './PrescriptionForm';
import PatientHistoryModal from './PatientHistoryModal';
import ScheduleManageModal from './ScheduleManageModal';
import AppointmentRequestCard from './AppointmentRequestCard';
import RevenueChart from './RevenueChart';
import PatientChatModal from './PatientChatModal';
import ChatPanel from './ChatPanel';
import ReviewsSection from './ReviewsSection';
import ConsultationModal, { type ConsultationData } from './ConsultationModal';
import RejectReasonModal from './RejectReasonModal';
import VideoCallModal from '@/components/video/VideoCallModal';
import IncomingCallModal from '@/components/video/IncomingCallModal';
import Icon from '@/components/ui/AppIcon';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { DoctorDashboardSkeleton } from '@/components/ui/Skeletons';
import { useDoctorProfile } from '@/hooks/useDoctors';
import { useAppointments, appointmentKeys, useUpdateAppointmentStatus, useCompleteAppointment, useRejectAppointment } from '@/hooks/useAppointments';
import { useMySchedule } from '@/hooks/useSchedules';
import { useDoctorPatients, patientKeys } from '@/hooks/usePatients';
import { useDoctorAnalytics, useDoctorChartData, analyticsKeys } from '@/hooks/useAnalytics';
import { useUnreadNotificationCount, notificationKeys } from '@/hooks/useNotifications';
import {
  appointmentsApi,
  authApi,
  schedulesApi,
  eventsApi,
  API_BASE_URL,
  getToken,
  type DoctorAnalytics,
  type Appointment as ApiAppointment,
  type Doctor as ApiDoctor,
} from '@/lib/api';
import { checkVideoCallWindow } from '@/lib/videoCallWindow';
import { logger } from '@/lib/logger';

interface Appointment {
  id: string;
  patientName: string;
  patientImage: string;
  patientImageAlt: string;
  time: string;
  date: string;
  rawTime: string;
  patientId: string;
  type: 'Video' | 'In-Person' | 'Phone';
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'In Progress' | 'No Show';
  reason: string;
  isExpiredNoActivity?: boolean;
  uiStatus?: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'In Progress' | 'No Show';
}

interface Patient {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
  age: number;
  lastVisit: string;
  condition: string;
  status: 'Active' | 'Follow-up' | 'Discharged';
}

interface AppointmentRequest {
  id: string;
  patientName: string;
  patientImage: string;
  patientImageAlt: string;
  requestedDate: string;
  requestedTime: string;
  type: 'Video' | 'In-Person' | 'Phone';
  reason: string;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
}

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

interface ChartData {
  appointmentsData: { day: string; appointments: number }[];
  statusData: { name: string; value: number; color: string }[];
}

// Helper functions
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const addMinutesToTime = (time: string, minutes: number) => {
  const parse = (value: string): { hours: number; mins: number } | null => {
    if (!value) return null;
    const trimmed = value.trim();

    // Match "h:mm AM/PM"
    const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (ampmMatch) {
      let hours = parseInt(ampmMatch[1], 10);
      const mins = parseInt(ampmMatch[2], 10);
      const period = ampmMatch[3].toUpperCase();
      if (period === 'PM' && hours !== 12) hours += 12;
      if (period === 'AM' && hours === 12) hours = 0;
      return { hours, mins };
    }

    // Match "HH:mm" or "HH:mm:ss"
    const parts = trimmed.split(':').map((p) => parseInt(p, 10));
    if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      return { hours: parts[0], mins: parts[1] };
    }

    return null;
  };

  const parsed = parse(time);
  if (!parsed) return time;

  const date = new Date();
  date.setHours(parsed.hours, parsed.mins + minutes, 0, 0);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

const parseDateTime = (dateStr: string, timeStr: string): Date | null => {
  if (!dateStr || !timeStr) return null;

  const base = new Date(dateStr);
  if (Number.isNaN(base.getTime())) return null;

  const trimmed = timeStr.trim();
  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const mins = parseInt(ampmMatch[2], 10);
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    base.setHours(hours, mins, 0, 0);
    return base;
  }

  const parts = trimmed.split(':').map((p) => parseInt(p, 10));
  if (parts.length >= 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
    base.setHours(parts[0], parts[1], 0, 0);
    return base;
  }

  return null;
};

const calculateAge = (dob?: string) => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

export default function DoctorDashboardInteractive() {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'appointments' | 'patients' | 'requests' | 'completed'
  >('appointments');
  const [showPrescriptionForm, setShowPrescriptionForm] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [showPatientHistory, setShowPatientHistory] = useState(false);
  const [historyPatientId, setHistoryPatientId] = useState<string>('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [showChatModal, setShowChatModal] = useState(false);
  const [chatAppointment, setChatAppointment] = useState<Appointment | null>(null);
  const [showChatPanel, setShowChatPanel] = useState(false);
  const [chatPatient, setChatPatient] = useState<{
    id: string;
    name: string;
    image: string;
  } | null>(null);

  // Consultation modal state
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [pendingFinishAppointment, setPendingFinishAppointment] = useState<{
    id: string;
    patientName: string;
  } | null>(null);
  const [isCompletingAppointment, setIsCompletingAppointment] = useState(false);

  // Reject modal state
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [pendingRejectRequest, setPendingRejectRequest] = useState<{
    id: string;
    patientName: string;
  } | null>(null);

  // Video Call state
  const [isVideoCallModalOpen, setIsVideoCallModalOpen] = useState(false);
  const [videoCallAppointmentId, setVideoCallAppointmentId] = useState<string | null>(null);
  const [videoCallPatientName, setVideoCallPatientName] = useState<string>('Patient');

  // Video call context for ringing support
  const { incomingCall, isClientReady } = useVideoCall();

  // Toast and confirmation dialogs
  const { showToast } = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirm();
  const queryClient = useQueryClient();

  // React Query hooks for data fetching
  const { data: doctorProfile, isLoading: isProfileLoading } = useDoctorProfile();
  const shouldLoadCoreData = isHydrated && Boolean(doctorProfile);
  const shouldLoadPatients = isHydrated && activeTab === 'patients';
  const { data: appointmentsData, isLoading: isAppointmentsLoading } = useAppointments(1, 20, shouldLoadCoreData);
  const { data: patientsData } = useDoctorPatients(shouldLoadPatients);
  const { data: analytics, isLoading: isAnalyticsLoading } = useDoctorAnalytics(shouldLoadCoreData);
  const { data: chartData, isLoading: isChartDataLoading } = useDoctorChartData(shouldLoadCoreData);
  const { data: scheduleData, isLoading: isScheduleLoading } = useMySchedule(shouldLoadCoreData);
  const { data: notificationCountData } = useUnreadNotificationCount(false);

  // Mutations
  const updateAppointmentStatusMutation = useUpdateAppointmentStatus();
  const completeAppointmentMutation = useCompleteAppointment();
  const rejectAppointmentMutation = useRejectAppointment();

  // Derived state
  const [slotDuration, setSlotDuration] = useState(30);
  const [visibleAppointmentsCount, setVisibleAppointmentsCount] = useState(12);
  const [visiblePatientsCount, setVisiblePatientsCount] = useState(12);

  // Memoized derived data
  const slotDurationFromSchedule = useMemo(() => {
    return scheduleData?.slotDuration ?? 30;
  }, [scheduleData]);

  // Update slot duration when schedule loads
  useEffect(() => {
    if (slotDurationFromSchedule) {
      setSlotDuration(slotDurationFromSchedule);
    }
  }, [slotDurationFromSchedule]);

  // Combined loading state
  const isLoading = isProfileLoading || isAppointmentsLoading || isAnalyticsLoading || isChartDataLoading || isScheduleLoading;

  // Notification count from React Query
  const notificationCount = notificationCountData?.count ?? 0;

  // Process appointments data with useMemo
  const { appointments, completedAppointments, requests, patientsWithActiveAppointments, nextAppointment } = useMemo(() => {
    if (!appointmentsData?.items) {
      return { appointments: [], completedAppointments: [], requests: [], patientsWithActiveAppointments: new Set<string>(), nextAppointment: null };
    }

    const apptData = appointmentsData.items;
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const graceMinutes = 15;

    const formattedAppointments: Appointment[] = [];
    const pendingRequests: AppointmentRequest[] = [];
    const expiredNoActivity: Appointment[] = [];

    for (const a of apptData) {
      const durationMinutes = a.slotDuration ?? slotDuration;
      const typeFormatted = (
        a.type === 'video' ? 'Video' : a.type === 'in-person' ? 'In-Person' : 'Video'
      ) as 'Video' | 'In-Person' | 'Phone';
      const statusFormatted = (
        a.status === 'in_progress'
          ? 'In Progress'
          : a.status === 'no_show'
            ? 'No Show'
            : a.status.charAt(0).toUpperCase() + a.status.slice(1)
      ) as 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'In Progress' | 'No Show';

      const startTime = parseDateTime(a.date, a.time);
      const endTime = startTime
        ? new Date(startTime.getTime() + durationMinutes * 60000)
        : null;
      const hasActivity = Boolean(
        a.call_started_at ||
        a.call_duration ||
        a.status === 'in_progress' ||
        a.status === 'completed'
      );
      const isExpiredNoActivity = Boolean(
        endTime &&
        now.getTime() > endTime.getTime() + graceMinutes * 60000 &&
        !hasActivity &&
        (a.status === 'confirmed' || a.status === 'pending')
      );

      // Separate pending appointments as requests
      if (a.status === 'pending') {
        pendingRequests.push({
          id: a.id,
          patientName: a.patientName || 'Unknown Patient',
          patientImage: '/assets/images/patient_profile.png',
          patientImageAlt: `${a.patientName || 'Patient'} profile`,
          requestedDate: formatDate(a.date),
          requestedTime: a.time,
          type: typeFormatted,
          reason: a.symptoms || 'General consultation',
          urgency: 'Routine',
        });
      }

      // Today's appointments
      if (a.date === today && a.status !== 'cancelled' && !isExpiredNoActivity) {
        formattedAppointments.push({
          id: a.id,
          patientName: a.patientName || 'Unknown Patient',
          patientImage: '/assets/images/patient_profile.png',
          patientImageAlt: `${a.patientName || 'Patient'} profile`,
          time: `${a.time} - ${addMinutesToTime(a.time, durationMinutes)}`,
          date: a.date,
          rawTime: a.time,
          patientId: a.patientId || '',
          type: typeFormatted,
          status: statusFormatted,
          reason: a.symptoms || 'General consultation',
          isExpiredNoActivity,
          uiStatus: isExpiredNoActivity ? 'No Show' : statusFormatted,
        });
      } else if (isExpiredNoActivity) {
        expiredNoActivity.push({
          id: a.id,
          patientName: a.patientName || 'Unknown Patient',
          patientImage: '/assets/images/patient_profile.png',
          patientImageAlt: `${a.patientName || 'Patient'} profile`,
          time: `${a.time} - ${addMinutesToTime(a.time, durationMinutes)}`,
          date: a.date,
          rawTime: a.time,
          patientId: a.patientId || '',
          type: typeFormatted,
          status: 'No Show',
          reason: a.symptoms || 'General consultation',
          isExpiredNoActivity,
          uiStatus: 'No Show',
        });
      }
    }

    // Collect completed appointments
    const completedAppts: Appointment[] = apptData
      .filter((a) => a.status === 'completed' || a.status === 'no_show')
      .map((a) => {
        const durationMinutes = a.slotDuration ?? slotDuration;
        const typeFormatted = (
          a.type === 'video' ? 'Video' : a.type === 'in-person' ? 'In-Person' : 'Video'
        ) as 'Video' | 'In-Person' | 'Phone';
        return {
          id: a.id,
          patientName: a.patientName || 'Unknown Patient',
          patientImage: '/assets/images/patient_profile.png',
          patientImageAlt: `${a.patientName || 'Patient'} profile`,
          time: `${a.time} - ${addMinutesToTime(a.time, durationMinutes)}`,
          date: a.date,
          rawTime: a.time,
          patientId: a.patientId || '',
          type: typeFormatted,
          status: a.status === 'no_show' ? ('No Show' as const) : ('Completed' as const),
          reason: a.symptoms || 'General consultation',
        };
      });

    // Track patients with confirmed appointments
    const activePatientIds = new Set<string>(
      apptData.filter((a) => a.status === 'confirmed' && a.patientId).map((a) => a.patientId!)
    );

    // Set next appointment for status bar - calculate actual time difference
    const currentTime = new Date();
    const confirmedFuture = formattedAppointments
      .filter((a) => a.status === 'Confirmed')
      .map((a) => {
        const appointmentDate = new Date(a.date);
        const timeMatch = a.rawTime.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
        if (timeMatch) {
          let hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          const period = timeMatch[3].toUpperCase();
          if (period === 'PM' && hours !== 12) hours += 12;
          if (period === 'AM' && hours === 12) hours = 0;
          appointmentDate.setHours(hours, minutes, 0, 0);
        }
        return { ...a, appointmentDateTime: appointmentDate };
      })
      .filter((a) => a.appointmentDateTime.getTime() > currentTime.getTime())
      .sort((a, b) => a.appointmentDateTime.getTime() - b.appointmentDateTime.getTime())[0];

    let nextAppt = null;
    if (confirmedFuture) {
      const diffMs = confirmedFuture.appointmentDateTime.getTime() - currentTime.getTime();
      const diffMinutes = Math.round(diffMs / (1000 * 60));
      const diffHours = Math.round(diffMs / (1000 * 60 * 60));

      let timeStr = '';
      if (diffMinutes < 60) {
        timeStr = `in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
      } else if (diffHours <= 24) {
        timeStr = `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
      } else {
        timeStr = 'soon';
      }

      nextAppt = {
        patientName: confirmedFuture.patientName,
        time: timeStr,
      };
    }

    return {
      appointments: formattedAppointments,
      completedAppointments: [...expiredNoActivity, ...completedAppts],
      requests: pendingRequests,
      patientsWithActiveAppointments: activePatientIds,
      nextAppointment: nextAppt,
    };
  }, [appointmentsData, slotDuration]);

  // Process patients data
  const patients = useMemo(() => {
    if (!patientsData) return [];

    return patientsData.map((p) => ({
      id: p.userId,
      name: `${p.firstName} ${p.lastName}`,
      image: '/assets/images/patient_profile.png',
      imageAlt: `${p.firstName} ${p.lastName}`,
      age: calculateAge(p.dateOfBirth),
      lastVisit: 'Recently',
      condition:
        p.chronicConditions && p.chronicConditions.length > 0
          ? p.chronicConditions[0]
          : 'General Care',
      status: 'Active' as const,
    }));
  }, [patientsData]);

  const visibleAppointments = useMemo(
    () => appointments.slice(0, visibleAppointmentsCount),
    [appointments, visibleAppointmentsCount]
  );
  const visiblePatients = useMemo(
    () => patients.slice(0, visiblePatientsCount),
    [patients, visiblePatientsCount]
  );

  useEffect(() => {
    setVisibleAppointmentsCount(12);
  }, [appointments.length]);

  useEffect(() => {
    setVisiblePatientsCount(12);
  }, [patients.length]);

  // Hydration effect
  useEffect(() => {
    setIsHydrated(true);

    // Handle hash-based navigation on mount
    const hash = window.location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
        // Switch to patients tab if navigating to patients section
        if (hash === 'patients') {
          setActiveTab('patients');
        }
      }, 500);
    }
  }, []);

  // SSE Connection for real-time updates
  useEffect(() => {
    if (!isHydrated) return;
    let active = true;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    const pendingInvalidations = {
      appointments: false,
      patients: false,
      analytics: false,
      chart: false,
      notifications: false,
    };

    const flushInvalidations = () => {
      if (!active) return;
      if (pendingInvalidations.appointments) {
        queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      }
      if (pendingInvalidations.patients) {
        queryClient.invalidateQueries({ queryKey: patientKeys.doctor() });
      }
      if (pendingInvalidations.analytics) {
        queryClient.invalidateQueries({ queryKey: analyticsKeys.doctor() });
      }
      if (pendingInvalidations.chart) {
        queryClient.invalidateQueries({ queryKey: analyticsKeys.doctorChart() });
      }
      if (pendingInvalidations.notifications) {
        queryClient.invalidateQueries({ queryKey: notificationKeys.count() });
      }
      pendingInvalidations.appointments = false;
      pendingInvalidations.patients = false;
      pendingInvalidations.analytics = false;
      pendingInvalidations.chart = false;
      pendingInvalidations.notifications = false;
      invalidateTimer = null;
    };

    const queueInvalidation = (updates: Partial<typeof pendingInvalidations>) => {
      pendingInvalidations.appointments =
        pendingInvalidations.appointments || Boolean(updates.appointments);
      pendingInvalidations.patients =
        pendingInvalidations.patients || Boolean(updates.patients);
      pendingInvalidations.analytics =
        pendingInvalidations.analytics || Boolean(updates.analytics);
      pendingInvalidations.chart = pendingInvalidations.chart || Boolean(updates.chart);
      pendingInvalidations.notifications =
        pendingInvalidations.notifications || Boolean(updates.notifications);
      if (!invalidateTimer) {
        invalidateTimer = setTimeout(flushInvalidations, 250);
      }
    };

    const connect = async () => {
      if (!active || !getToken()) return;
      try {
        const { token } = await eventsApi.getStreamToken();
        if (!active) return;
        const streamUrl = `${API_BASE_URL}/events/stream?token=${encodeURIComponent(token)}`;
        eventSource = new EventSource(streamUrl, { withCredentials: true });
        eventSource.addEventListener('appointments.updated', () =>
          queueInvalidation({ appointments: true, patients: true, analytics: true, chart: true })
        );
        eventSource.addEventListener('activities.updated', () =>
          queueInvalidation({ analytics: true })
        );
        eventSource.addEventListener('notifications.updated', () =>
          queueInvalidation({ notifications: true })
        );
        eventSource.addEventListener('prescriptions.updated', () =>
          queueInvalidation({ analytics: true })
        );
        eventSource.addEventListener('messages.updated', () =>
          queueInvalidation({ notifications: true })
        );
        eventSource.onerror = (err) => {
          logger.error('SSE connection error (doctor dashboard):', err);
          if (!active) return;
          eventSource?.close();
          eventSource = null;
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (err) {
        if (!active) return;
        logger.error('Failed to initialize SSE (doctor dashboard):', err);
        reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      active = false;
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (invalidateTimer) {
        clearTimeout(invalidateTimer);
      }
    };
  }, [isHydrated, queryClient]);

  // Manual refresh on visibility change
  useEffect(() => {
    if (!isHydrated) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        // React Query automatically handles stale data refetching
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isHydrated]);



  const handleConfirmAppointment = async (id: string) => {
    if (!isHydrated) return;
    try {
      await updateAppointmentStatusMutation.mutateAsync({ id, status: 'confirmed' });
    } catch (err) {
      logger.error('Failed to confirm appointment:', err);
    }
  };

  const handleMarkNoShow = async (id: string) => {
    if (!isHydrated) return;
    try {
      await updateAppointmentStatusMutation.mutateAsync({ id, status: 'no_show' });
    } catch (err) {
      logger.error('Failed to mark no-show:', err);
    }
  };

  const handleRescheduleAppointment = (id: string) => {
    if (!isHydrated) return;
    logger.log('Rescheduling appointment:', id);
  };

  const handleChatWithPatient = (id: string) => {
    if (!isHydrated) return;
    const appointment = appointments.find((a) => a.id === id);
    if (appointment) {
      setChatAppointment(appointment);
      setShowChatModal(true);
    }
  };

  const handleViewPatientHistory = (patientId: string) => {
    if (!isHydrated) return;
    setHistoryPatientId(patientId);
    setShowPatientHistory(true);
  };

  const handleMessagePatient = (id: string) => {
    if (!isHydrated) return;
    const patient = patients.find((p) => p.id === id);
    if (patient) {
      setChatPatient({
        id: patient.id,
        name: patient.name,
        image: patient.image,
      });
      setShowChatPanel(true);
    }
  };

  const handleManageSchedule = () => {
    if (!isHydrated) return;
    setShowScheduleModal(true);
  };

  const handleFinishAppointment = (id: string) => {
    if (!isHydrated) return;
    const appointment = appointments.find((a) => a.id === id);
    if (appointment) {
      setPendingFinishAppointment({ id, patientName: appointment.patientName });
      setShowConsultationModal(true);
    }
  };

  const handleApproveRequest = async (id: string) => {
    if (!isHydrated) return;
    try {
      await updateAppointmentStatusMutation.mutateAsync({ id, status: 'confirmed' });
    } catch (err) {
      logger.error('Failed to approve request:', err);
    }
  };

  const handleDeclineRequest = async (id: string) => {
    if (!isHydrated) return;
    // Find the request to get patient name
    const request = requests.find((r) => r.id === id);
    if (request) {
      setPendingRejectRequest({ id, patientName: request.patientName });
      setShowRejectModal(true);
    }
  };

  const handleConfirmReject = async (id: string, reason: string) => {
    try {
      await rejectAppointmentMutation.mutateAsync({ id, reason });
      setShowRejectModal(false);
      setPendingRejectRequest(null);
    } catch (err) {
      logger.error('Failed to reject request:', err);
    }
  };

  const handleJoinVideoCall = async (id: string) => {
    if (!isHydrated) return;

    // Check if video client is ready
    if (!isClientReady) {
      showToast({
        type: 'warning',
        title: 'Video Service Initializing',
        message: 'Please wait a moment and try again.',
      });
      return;
    }

    const rawAppointment = appointmentsData?.items?.find((a: ApiAppointment) => a.id === id);
    if (rawAppointment) {
      const callWindow = checkVideoCallWindow({
        date: rawAppointment.date,
        time: rawAppointment.time,
        status: rawAppointment.status,
      });
      if (!callWindow.allowed) {
        showToast({
          type: 'warning',
          title: 'Call Not Available',
          message: callWindow.reason || 'Video call cannot be started for this appointment.',
        });
        return;
      }
    }

    // Find the appointment to get patient details for UI
    const appointment = appointments.find((a) => a.id === id);
    if (!appointment) return;

    setVideoCallAppointmentId(id);
    setVideoCallPatientName(appointment.patientName);
    setIsVideoCallModalOpen(true);
  };

  const handleFinishPatientAppointment = async (patientId: string) => {
    if (!isHydrated) return;
    try {
      // Find the patient's latest confirmed appointment
      const appointmentsResponse = await appointmentsApi.getAll();
      const allAppointments = appointmentsResponse.items || [];
      const patientAppointment = allAppointments.find(
        (a) => a.patientId === patientId && a.status === 'confirmed'
      );

      if (patientAppointment) {
        setPendingFinishAppointment({
          id: patientAppointment.id,
          patientName: patientAppointment.patientName || 'Patient',
        });
        setShowConsultationModal(true);
      } else {
        showToast({
          type: 'warning',
          title: 'No Active Appointment',
          message: 'No active appointment found for this patient.',
        });
      }
    } catch (err) {
      logger.error('Failed to find patient appointment:', err);
    }
  };

  const handleConsultationSubmit = async (data: ConsultationData) => {
    if (!pendingFinishAppointment) return;

    setIsCompletingAppointment(true);
    try {
      await completeAppointmentMutation.mutateAsync({
        id: pendingFinishAppointment.id,
        data,
      });
      setShowConsultationModal(false);
      setPendingFinishAppointment(null);
    } catch (err) {
      logger.error('Failed to complete appointment:', err);
    } finally {
      setIsCompletingAppointment(false);
    }
  };

  const handleCreatePrescription = (patientId?: string) => {
    if (!isHydrated) return;
    setSelectedPatientId(patientId || '');
    setShowPrescriptionForm(true);
  };

  const handlePrescriptionSubmit = (success: boolean) => {
    if (success) {
      // Invalidate appointments query to refresh data
      queryClient.invalidateQueries({ queryKey: appointmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: analyticsKeys.doctor() });
    }
    setShowPrescriptionForm(false);
    setSelectedPatientId('');
  };

  const handleLogout = () => {
    if (!isHydrated) return;
    authApi.logout();
    router.push('/login');
  };

  if (!isHydrated || isLoading) {
    return <DoctorDashboardSkeleton />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedHeader
        user={{
          name: doctorProfile?.name || 'Doctor',
          role: 'doctor',
          avatar: doctorProfile?.image || '/assets/images/doctor_profile.png',
        }}
        notificationCount={notificationCount}
        onLogout={handleLogout}
      />

      {showStatusBar && nextAppointment && (
        <StatusIndicatorBar
          appointmentStatus={{
            type: 'upcoming',
            message: `Next appointment with ${nextAppointment.patientName}`,
            time: nextAppointment.time,
          }}
          chatAvailable={true}
          onDismiss={() => setShowStatusBar(false)}
        />
      )}

      <div className="container mx-auto px-4 sm:px-6 py-6">
        <NavigationBreadcrumbs />

        <div className="mb-10 text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent mb-3 tracking-tight">
            Doctor Dashboard 👨‍⚕️
          </h1>
          <p className="text-base sm:text-lg text-text-secondary font-medium max-w-2xl mx-auto sm:mx-0">
            Manage your appointments, patients, and practice analytics
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsCard
            title="Today's Appointments"
            value={analytics?.todayAppointments ?? appointments.length}
            change={`${analytics?.thisMonthAppointments ?? 0} this month`}
            trend="up"
            icon="📅"
            color="primary"
          />

          <AnalyticsCard
            title="Active Patients"
            value={analytics?.uniquePatients ?? patients.length}
            change={`${analytics?.appointmentsByStatus?.pending ?? 0} pending`}
            trend="up"
            icon="👥"
            color="success"
          />

          <AnalyticsCard
            title="Pending Requests"
            value={requests.length}
            change={requests.length > 0 ? `${requests.length} to review` : 'All clear'}
            trend="neutral"
            icon="⏳"
            color="warning"
          />

          <AnalyticsCard
            title="Rating"
            value={analytics?.rating ? analytics.rating.toFixed(1) : 'N/A'}
            change={`${analytics?.ratingCount ?? 0} reviews`}
            trend="up"
            icon="⭐"
            color="accent"
          />
        </div>

        <div className="mb-8">
          <RevenueChart chartData={chartData} />
        </div>

        <div id="schedule" className="mb-8">
          <ScheduleCalendar onManageSchedule={handleManageSchedule} />
        </div>

        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-text-primary">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/doctor-dashboard#patients')}
              className="flex flex-col items-center gap-3 p-6 bg-primary/5 border border-primary/20 rounded-lg hover:shadow-elevation-2 transition-base"
            >
              <Icon name="UserGroupIcon" size={32} className="text-primary" />
              <span className="font-medium text-text-primary">View Patients</span>
            </button>
            <button
              onClick={handleManageSchedule}
              className="flex flex-col items-center gap-3 p-6 bg-accent/5 border border-accent/20 rounded-lg hover:shadow-elevation-2 transition-base"
            >
              <Icon name="CalendarIcon" size={32} className="text-accent" />
              <span className="font-medium text-text-primary">Manage Schedule</span>
            </button>
            <button
              onClick={() => logger.log('View analytics')}
              className="flex flex-col items-center gap-3 p-6 bg-success/5 border border-success/20 rounded-lg hover:shadow-elevation-2 transition-base"
            >
              <Icon name="ChartBarIcon" size={32} className="text-success" />
              <span className="font-medium text-text-primary">View Analytics</span>
            </button>
            <button
              onClick={() => logger.log('Patient records')}
              className="flex flex-col items-center gap-3 p-6 bg-warning/5 border border-warning/20 rounded-lg hover:shadow-elevation-2 transition-base"
            >
              <Icon name="FolderIcon" size={32} className="text-warning" />
              <span className="font-medium text-text-primary">Patient Records</span>
            </button>
          </div>
        </div>

        {showPrescriptionForm && (
          <div className="mb-8">
            <PrescriptionForm
              patientId={selectedPatientId}
              onSubmit={handlePrescriptionSubmit}
              onCancel={() => {
                setShowPrescriptionForm(false);
                setSelectedPatientId('');
              }}
            />
          </div>
        )}

        {showPatientHistory && historyPatientId && (
          <PatientHistoryModal
            patientId={historyPatientId}
            onClose={() => {
              setShowPatientHistory(false);
              setHistoryPatientId('');
            }}
          />
        )}

        {showScheduleModal && <ScheduleManageModal onClose={() => setShowScheduleModal(false)} />}

        {showChatModal && chatAppointment && (
          <PatientChatModal
            isOpen={showChatModal}
            onClose={() => {
              setShowChatModal(false);
              setChatAppointment(null);
            }}
            appointment={{
              id: chatAppointment.id,
              patientName: chatAppointment.patientName,
              patientImage: chatAppointment.patientImage,
              date: chatAppointment.date,
              time: chatAppointment.rawTime,
              status: chatAppointment.status.toLowerCase(),
              patientId: chatAppointment.patientId,
            }}
          />
        )}

        <ReviewsSection className="mb-8" />

        <div id="patients" className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center gap-4 mb-6 border-b border-border">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`pb-4 px-2 font-medium transition-base relative ${activeTab === 'appointments' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Today's Appointments
              {activeTab === 'appointments' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('patients')}
              className={`pb-4 px-2 font-medium transition-base relative ${activeTab === 'patients' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              My Patients
              {activeTab === 'patients' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`pb-4 px-2 font-medium transition-base relative ${activeTab === 'requests' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Appointment Requests
              {requests.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-warning text-warning-foreground rounded-full text-xs font-semibold">
                  {requests.length}
                </span>
              )}
              {activeTab === 'requests' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`pb-4 px-2 font-medium transition-base relative ${activeTab === 'completed' ? 'text-primary' : 'text-text-secondary hover:text-text-primary'}`}
            >
              Completed
              {completedAppointments.length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                  {completedAppointments.length}
                </span>
              )}
              {activeTab === 'completed' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>

          {activeTab === 'appointments' && (
            <div className="space-y-4">
              {appointments.length > 0 ? (
                visibleAppointments.map((appointment) => (
                  <AppointmentCard
                    key={appointment.id}
                    appointment={appointment}
                    onConfirm={handleConfirmAppointment}
                    onReschedule={handleRescheduleAppointment}
                    onChat={handleChatWithPatient}
                    onFinish={handleFinishAppointment}
                    onJoinCall={handleJoinVideoCall}
                    onMarkNoShow={handleMarkNoShow}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Icon
                    name="CalendarIcon"
                    size={48}
                    className="mx-auto text-text-secondary mb-4"
                  />
                  <p className="text-text-secondary">No appointments scheduled for today</p>
                </div>
              )}
              {appointments.length > visibleAppointments.length && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setVisibleAppointmentsCount((count) => count + 12)}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-base"
                  >
                    Load more appointments
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'patients' && (
            <div className="space-y-4">
              {patients.length > 0 ? (
                visiblePatients.map((patient) => (
                  <PatientListItem
                    key={patient.id}
                    patient={patient}
                    onViewHistory={handleViewPatientHistory}
                    onMessage={handleMessagePatient}
                    onPrescribe={handleCreatePrescription}
                    onFinish={handleFinishPatientAppointment}
                    hasActiveAppointment={patientsWithActiveAppointments.has(patient.id)}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Icon
                    name="UserGroupIcon"
                    size={48}
                    className="mx-auto text-text-secondary mb-4"
                  />
                  <p className="text-text-secondary">No patients to display</p>
                </div>
              )}
              {patients.length > visiblePatients.length && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setVisiblePatientsCount((count) => count + 12)}
                    className="text-sm font-medium text-primary hover:text-primary/80 transition-base"
                  >
                    Load more patients
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              {requests.length > 0 ? (
                requests.map((request) => (
                  <AppointmentRequestCard
                    key={request.id}
                    request={request}
                    onApprove={handleApproveRequest}
                    onDecline={handleDeclineRequest}
                  />
                ))
              ) : (
                <div className="text-center py-12">
                  <Icon name="InboxIcon" size={48} className="mx-auto text-text-secondary mb-4" />
                  <p className="text-text-secondary">No pending appointment requests</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'completed' && (
            <div className="space-y-4">
              {completedAppointments.length > 0 ? (
                completedAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-card border border-border rounded-lg p-4 hover:shadow-elevation-2 transition-base"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                        <img
                          src={appointment.patientImage}
                          alt={appointment.patientName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-text-primary">
                          {appointment.patientName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
                          <Icon name="CalendarIcon" size={14} />
                          <span>{appointment.date}</span>
                          <span>•</span>
                          <span>{appointment.time}</span>
                        </div>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${appointment.status === 'No Show'
                          ? 'bg-warning/10 text-warning border-warning/20'
                          : 'bg-primary/10 text-primary border-primary/20'
                          }`}
                      >
                        {appointment.status}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Icon
                    name="CheckCircleIcon"
                    size={48}
                    className="mx-auto text-text-secondary mb-4"
                  />
                  <p className="text-text-secondary">No completed appointments yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel for messaging patients */}
      {chatPatient && (
        <ChatPanel
          isOpen={showChatPanel}
          onClose={() => {
            setShowChatPanel(false);
            setChatPatient(null);
          }}
          patientId={chatPatient.id}
          patientName={chatPatient.name}
          patientImage={chatPatient.image}
        />
      )}

      {/* Consultation Modal */}
      <ConsultationModal
        isOpen={showConsultationModal}
        onClose={() => {
          setShowConsultationModal(false);
          setPendingFinishAppointment(null);
        }}
        onSubmit={handleConsultationSubmit}
        patientName={pendingFinishAppointment?.patientName || ''}
        isLoading={isCompletingAppointment}
      />

      {/* Reject Reason Modal */}
      <RejectReasonModal
        isOpen={showRejectModal}
        requestId={pendingRejectRequest?.id || ''}
        patientName={pendingRejectRequest?.patientName || ''}
        onConfirm={handleConfirmReject}
        onCancel={() => {
          setShowRejectModal(false);
          setPendingRejectRequest(null);
        }}
      />

      {/* Video Call Modal for outgoing calls */}
      {videoCallAppointmentId && (
        <VideoCallModal
          isOpen={isVideoCallModalOpen}
          onClose={() => {
            setIsVideoCallModalOpen(false);
            setVideoCallAppointmentId(null);
          }}
          appointmentId={videoCallAppointmentId}
          otherUserName={videoCallPatientName}
        />
      )}

      {/* Incoming Call Modal */}
      <IncomingCallModal isOpen={!!incomingCall} onClose={() => { }} />

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </div>
  );
}
