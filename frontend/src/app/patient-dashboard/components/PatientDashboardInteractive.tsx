'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import UpcomingAppointmentCard from './UpcomingAppointmentCard';
import DoctorSearchFilters from './DoctorSearchFilters';
import DoctorCard from './DoctorCard';
import QuickAccessPanel from './QuickAccessPanel';
import RecentActivityFeed from './RecentActivityFeed';
import AIChatbotWidget from './AIChatbotWidget';
import AIChatbotModal from './AIChatbotModal';
import DoctorChatModal from './DoctorChatModal';
import ReviewDoctorModal from './ReviewDoctorModal';
import BookingModal from './BookingModal';
import RescheduleModal from './RescheduleModal';
import VideoCallModal from '@/components/video/VideoCallModal';
import IncomingCallModal from '@/components/video/IncomingCallModal';
import Icon from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/Toast';
import { useConfirm } from '@/components/ui/ConfirmDialog';
import { DashboardSkeleton, AppointmentCardSkeleton } from '@/components/ui/Skeletons';
import { useUser } from '../ClientLayout';
import { useVideoCall } from '@/contexts/VideoCallContext';
import {
  doctorsApi,
  appointmentsApi,
  activitiesApi,
  type Doctor as ApiDoctor,
  type Appointment as ApiAppointment,
  type Activity,
  schedulesApi,
  eventsApi,
  API_BASE_URL,
  getToken,
} from '@/lib/api';
import { logger } from '@/lib/logger';

interface Appointment {
  id: string;
  doctorName: string;
  doctorImage: string;
  doctorImageAlt: string;
  specialty: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  status: 'confirmed' | 'pending' | 'completed' | 'rejected' | 'in_progress' | 'no_show';
  doctorId: string;
  rated?: boolean;
  rejectionReason?: string;
}

interface Doctor {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experience: number;
  availableToday: boolean;
  consultationTypes: ('video' | 'in-person')[];
  nextAvailable: string;
}

interface FilterOptions {
  specialty: string;
  minRating: number;
  availableToday: boolean;
  consultationType: 'all' | 'video' | 'in-person';
}

const PatientDashboardInteractive = () => {
  const { user } = useUser();
  const [isHydrated, setIsHydrated] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedDoctorForBooking, setSelectedDoctorForBooking] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] =
    useState<Appointment | null>(null);
  const [isVideoCallModalOpen, setIsVideoCallModalOpen] = useState(false);
  const [videoCallAppointmentId, setVideoCallAppointmentId] = useState<string | null>(null);
  const [videoCallDoctorName, setVideoCallDoctorName] = useState<string>('Doctor');

  // Video call context for ringing support
  const { incomingCall, initializeCall, isClientReady } = useVideoCall();

  // Toast notifications and confirmation dialogs
  const { showToast } = useToast();
  const { confirm, ConfirmDialogComponent } = useConfirm();

  // Data states
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [filters, setFilters] = useState<FilterOptions>({
    specialty: '',
    minRating: 0,
    availableToday: false,
    consultationType: 'all',
  });

  // Appointment tab state
  const [appointmentTab, setAppointmentTab] = useState<
    'upcoming' | 'pending' | 'completed' | 'rejected'
  >('upcoming');

  const fetchData = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setIsLoading(true);
    }
    setError(null);

    try {
      // Fetch appointments
      try {
        const apptResponse = await appointmentsApi.getAll();
        const apptData = apptResponse.items || [];
        const formattedAppointments: Appointment[] = apptData
          .filter((a: ApiAppointment) => a.status !== 'cancelled')
          .map((a: ApiAppointment) => ({
            id: a.id,
            doctorName: a.doctorName.replace('Dr. ', ''),
            doctorImage: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
            doctorImageAlt: `Doctor ${a.doctorName}`,
            specialty: 'General',
            date: formatDate(a.date),
            time: a.time,
            type: (a.type as 'video' | 'in-person') || 'video',
            status: a.status as
              | 'confirmed'
              | 'pending'
              | 'completed'
              | 'rejected'
              | 'in_progress'
              | 'no_show',
            doctorId: a.doctorId,
            rated: (a as any).rated || false,
            rejectionReason: (a as any).rejectionReason || '',
          }));
        setAppointments(formattedAppointments);
      } catch (err: any) {
        logger.error('Failed to fetch appointments:', err);
        if (err.message?.includes('Backend server is not running')) {
          setError('Unable to connect to server. Please check your internet connection or try again later.');
        }
      }

      // Fetch doctors
      try {
        const doctorResponse = await doctorsApi.getAll();
        const doctorData = doctorResponse.items || [];
        logger.log('Doctors fetched:', doctorData);

        let nextAvailableMap = new Map<string, string>();
        try {
          const nextAvailable = await doctorsApi.getNextAvailable();
          nextAvailableMap = new Map(
            Object.entries(nextAvailable).filter(([, v]) => typeof v === 'string') as [
              string,
              string
            ][]
          );
        } catch (err) {
          logger.error('Failed to fetch next available slots:', err);
        }

        const formattedDoctors: Doctor[] = doctorData.map((d: ApiDoctor) => ({
          id: d.id,
          name: d.name.replace('Dr. ', ''),
          image: d.image || 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400',
          imageAlt: `${d.name} profile photo`,
          specialty: d.specialty,
          rating: d.rating ?? 0,
          reviewCount: d.reviewCount || 0,
          experience: d.experience || 5,
          availableToday: d.availableToday ?? false,
          consultationTypes: d.consultationTypes || ['video', 'in-person'],
          nextAvailable: nextAvailableMap.get(d.id) || d.nextAvailable || 'Tomorrow',
        }));
        setDoctors(formattedDoctors);
      } catch (err) {
        logger.error('Failed to fetch doctors:', err);
      }

      // Fetch activities
      try {
        const activityData = await activitiesApi.getRecent();
        setActivities(activityData);
      } catch (err) {
        logger.error('Failed to fetch activities:', err);
        setActivities([]);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      logger.error('Dashboard error:', err);
    } finally {
      if (!silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    setIsHydrated(true);
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!isHydrated) return;
    let active = true;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = async () => {
      if (!active || !getToken()) return;
      try {
        const { token } = await eventsApi.getStreamToken();
        if (!active) return;
        const streamUrl = `${API_BASE_URL}/events/stream?token=${encodeURIComponent(token)}`;
        eventSource = new EventSource(streamUrl, { withCredentials: true });
        const handleUpdate = () => fetchData({ silent: true });

        eventSource.addEventListener('appointments.updated', handleUpdate);
        eventSource.addEventListener('activities.updated', handleUpdate);
        eventSource.addEventListener('notifications.updated', handleUpdate);
        eventSource.addEventListener('prescriptions.updated', handleUpdate);
        eventSource.addEventListener('messages.updated', handleUpdate);
        eventSource.addEventListener('message', handleUpdate);
        eventSource.onerror = (err) => {
          logger.error('SSE connection error (patient dashboard):', err);
          if (!active) return;
          eventSource?.close();
          eventSource = null;
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (err) {
        if (!active) return;
        logger.error('Failed to initialize SSE (patient dashboard):', err);
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
    };
  }, [fetchData, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchData({ silent: true });
      }
    };

    window.addEventListener('focus', handleVisibility);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('focus', handleVisibility);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [fetchData, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    const refreshInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchData({ silent: true });
      }
    }, 15000);

    return () => clearInterval(refreshInterval);
  }, [fetchData, isHydrated]);

  const formatDate = (dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const quickAccessItems = [
    {
      id: '1',
      title: 'Medical History',
      description: 'View your complete medical records',
      icon: 'DocumentTextIcon',
      color: 'bg-primary',
      href: '/patient-dashboard/medical-history',
    },
    {
      id: '2',
      title: 'Prescriptions',
      description: 'Manage and refill prescriptions',
      icon: 'ClipboardDocumentListIcon',
      color: 'bg-accent',
      href: '/patient-dashboard/prescriptions',
    },
    {
      id: '3',
      title: 'Lab Reports',
      description: 'Access your test results',
      icon: 'BeakerIcon',
      color: 'bg-success',
      href: '/patient-dashboard/lab-reports',
    },
    {
      id: '4',
      title: 'Health Tracker',
      description: 'Monitor your vital signs',
      icon: 'HeartIcon',
      color: 'bg-error',
      href: '/patient-dashboard/health-tracker',
    },
  ];

  const handleReschedule = (id: string) => {
    if (isHydrated) {
      const appointment = appointments.find((a) => a.id === id);
      if (appointment) {
        setSelectedAppointmentForReschedule(appointment);
        setIsRescheduleModalOpen(true);
      }
    }
  };

  const handleConfirmReschedule = async (id: string, date: string, time: string) => {
    try {
      await appointmentsApi.reschedule(id, { date, time });
      setIsRescheduleModalOpen(false);
      setSelectedAppointmentForReschedule(null);
      fetchData(); // Refresh appointments
    } catch (err) {
      logger.error('Failed to reschedule appointment:', err);
      alert('Failed to reschedule appointment. Please try again.');
    }
  };

  const handleJoinAppointment = async (id: string) => {
    if (!isHydrated) return;

    // Check if video client is ready
    if (!isClientReady) {
      alert('Video call service is still initializing. Please wait a moment and try again.');
      return;
    }

    // Find the appointment to get doctor details for UI
    const appointment = appointments.find((a) => a.id === id);
    if (!appointment) return;

    setVideoCallAppointmentId(id);
    setVideoCallDoctorName(appointment.doctorName);

    try {
      // Initialize ringing call first - backend handles user creation
      await initializeCall(id);
      // Only open modal after successful initialization
      setIsVideoCallModalOpen(true);
    } catch (error) {
      logger.error('Failed to start video call:', error);
      alert('Failed to start video call. Please try again.');
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (isHydrated) {
      const confirmed = await confirm({
        title: 'Cancel Appointment?',
        message: 'Are you sure you want to cancel this appointment? This action cannot be undone.',
        confirmLabel: 'Cancel Appointment',
        cancelLabel: 'Keep Appointment',
        type: 'warning',
      });

      if (confirmed) {
        try {
          await appointmentsApi.revoke(id);
          setAppointments((prev) => prev.filter((a) => a.id !== id));
          showToast({
            type: 'success',
            title: 'Appointment Cancelled',
            message: 'Your appointment has been successfully cancelled.',
          });
        } catch (err) {
          showToast({
            type: 'error',
            title: 'Failed to Cancel',
            message: 'Unable to cancel appointment. Please try again.',
          });
        }
      }
    }
  };

  const handleChat = (id: string) => {
    const appointment = appointments.find((a) => a.id === id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsChatModalOpen(true);
    }
  };

  const handleReview = (id: string) => {
    const appointment = appointments.find((a) => a.id === id);
    if (appointment) {
      setSelectedAppointment(appointment);
      setIsReviewModalOpen(true);
    }
  };

  const handleReviewSuccess = () => {
    // Mark the appointment as rated in local state
    if (selectedAppointment) {
      setAppointments((prev) =>
        prev.map((a) => (a.id === selectedAppointment.id ? { ...a, rated: true } : a))
      );
    }
    setIsReviewModalOpen(false);
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    if (isHydrated) {
      // Convert "all" to empty string for specialty comparison
      const normalizedFilters = {
        ...newFilters,
        specialty: newFilters.specialty === 'all' ? '' : newFilters.specialty,
      };
      setFilters(normalizedFilters);
    }
  };

  const handleBookDoctor = (doctorId: string) => {
    const doctor = doctors.find((d) => d.id === doctorId);
    if (doctor && isHydrated) {
      setSelectedDoctorForBooking({ id: doctorId, name: doctor.name });
      setIsBookingModalOpen(true);
    }
  };

  const handleConfirmBooking = async (date: string, time: string, type: string) => {
    if (isHydrated && selectedDoctorForBooking) {
      try {
        await appointmentsApi.create({
          doctorId: selectedDoctorForBooking.id,
          doctorName: `Dr. ${selectedDoctorForBooking.name}`,
          date,
          time,
          symptoms: '',
        });
        setShowSuccessMessage(true);
        setIsBookingModalOpen(false);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        // Refresh appointments
        fetchData();
      } catch (err) {
        alert('Failed to book appointment. Please try again.');
      }
    }
  };

  const handleOpenAIChat = () => {
    if (isHydrated) {
      setIsChatbotOpen(true);
    }
  };

  // Filter doctors based on search and filters - memoized for performance
  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const matchesSearch =
        !searchQuery ||
        doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialty.toLowerCase().includes(searchQuery.toLowerCase());

      // Case-insensitive specialty matching
      const matchesSpecialty =
        !filters.specialty || doctor.specialty.toLowerCase() === filters.specialty.toLowerCase();

      const matchesRating = doctor.rating >= filters.minRating;

      const matchesAvailability = !filters.availableToday || doctor.availableToday;

      const matchesConsultationType =
        filters.consultationType === 'all' ||
        doctor.consultationTypes.includes(filters.consultationType as 'video' | 'in-person');

      return (
        matchesSearch &&
        matchesSpecialty &&
        matchesRating &&
        matchesAvailability &&
        matchesConsultationType
      );
    });
  }, [doctors, searchQuery, filters]);

  // Memoized appointment counts for tabs
  const appointmentCounts = useMemo(() => ({
    confirmed: appointments.filter((a) => a.status === 'confirmed' || a.status === 'in_progress').length,
    pending: appointments.filter((a) => a.status === 'pending').length,
    completed: appointments.filter((a) => a.status === 'completed' || a.status === 'no_show').length,
    rejected: appointments.filter((a) => a.status === 'rejected').length,
  }), [appointments]);

  // Memoized filtered appointments for each tab
  const confirmedAppointments = useMemo(() =>
    appointments.filter((a) => a.status === 'confirmed' || a.status === 'in_progress'),
    [appointments]
  );

  const pendingAppointmentsList = useMemo(() =>
    appointments.filter((a) => a.status === 'pending'),
    [appointments]
  );

  const completedAppointmentsList = useMemo(() =>
    appointments.filter((a) => a.status === 'completed' || a.status === 'no_show'),
    [appointments]
  );

  const rejectedAppointmentsList = useMemo(() =>
    appointments.filter((a) => a.status === 'rejected'),
    [appointments]
  );

  // Filter appointments for upcoming section: confirmed or pending - memoized
  const upcomingAppointments = useMemo(() =>
    appointments.filter(
      (a) => a.status === 'confirmed' || a.status === 'pending' || a.status === 'in_progress'
    ),
    [appointments]
  );

  // Display all appointments
  const displayAppointments = appointments;

  if (!isHydrated || isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {showSuccessMessage && (
          <div className="mb-6 bg-success/10 border border-success/20 rounded-lg p-4 flex items-center space-x-3 animate-fade-in">
            <Icon name="CheckCircleIcon" size={24} className="text-success flex-shrink-0" />
            <p className="text-success font-medium">
              Appointment booked successfully! You will receive a confirmation email shortly.
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-error/10 border border-error/20 rounded-lg p-4 flex items-center space-x-3">
            <Icon name="ExclamationCircleIcon" size={24} className="text-error flex-shrink-0" />
            <p className="text-error font-medium">{error}</p>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-heading font-semibold text-text-primary mb-2">
            Welcome back, {user?.firstName || 'there'}!
          </h1>
          <p className="text-text-secondary">
            Manage your appointments and find the right doctor for your needs
          </p>
        </div>

        <div className="mb-8">
          <QuickAccessPanel items={quickAccessItems} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section>
              <div className="bg-card border border-border rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-text-primary flex items-center space-x-2">
                    <Icon name="CalendarIcon" size={28} />
                    <span>Appointments</span>
                  </h2>
                </div>

                {/* Appointment Tabs */}
                <div className="flex items-center gap-2 border-b border-border mb-6">
                  <button
                    onClick={() => setAppointmentTab('upcoming')}
                    className={`pb-3 px-4 font-medium transition-base relative ${appointmentTab === 'upcoming'
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    Upcoming
                    {appointmentCounts.confirmed > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-semibold">
                        {appointmentCounts.confirmed}
                      </span>
                    )}
                    {appointmentTab === 'upcoming' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => setAppointmentTab('pending')}
                    className={`pb-3 px-4 font-medium transition-base relative ${appointmentTab === 'pending'
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    Pending
                    {appointmentCounts.pending > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-warning/10 text-warning rounded-full text-xs font-semibold">
                        {appointmentCounts.pending}
                      </span>
                    )}
                    {appointmentTab === 'pending' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => setAppointmentTab('completed')}
                    className={`pb-3 px-4 font-medium transition-base relative ${appointmentTab === 'completed'
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    Completed
                    {appointmentCounts.completed > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                        {appointmentCounts.completed}
                      </span>
                    )}
                    {appointmentTab === 'completed' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                  <button
                    onClick={() => setAppointmentTab('rejected')}
                    className={`pb-3 px-4 font-medium transition-base relative ${appointmentTab === 'rejected'
                      ? 'text-primary'
                      : 'text-text-secondary hover:text-text-primary'
                      }`}
                  >
                    Rejected
                    {appointmentCounts.rejected > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-error/10 text-error rounded-full text-xs font-semibold">
                        {appointmentCounts.rejected}
                      </span>
                    )}
                    {appointmentTab === 'rejected' && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
                    )}
                  </button>
                </div>

                {/* Tab Content */}
                <div className="space-y-4">
                  {appointmentTab === 'upcoming' && (
                    <>
                      {confirmedAppointments.length > 0 ? (
                        confirmedAppointments.map((appointment) => (
                          <UpcomingAppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onReschedule={handleReschedule}
                            onJoin={handleJoinAppointment}
                            onCancel={handleCancelAppointment}
                            onChat={handleChat}
                            onReview={handleReview}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Icon
                            name="CalendarIcon"
                            size={48}
                            className="mx-auto text-text-secondary mb-4"
                          />
                          <p className="text-text-secondary">No upcoming appointments</p>
                          <p className="text-sm text-text-secondary mt-1">
                            Book an appointment with a doctor below
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {appointmentTab === 'pending' && (
                    <>
                      {pendingAppointmentsList.length > 0 ? (
                        pendingAppointmentsList.map((appointment) => (
                          <UpcomingAppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onReschedule={handleReschedule}
                            onJoin={handleJoinAppointment}
                            onCancel={handleCancelAppointment}
                            onChat={handleChat}
                            onReview={handleReview}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Icon
                            name="ClockIcon"
                            size={48}
                            className="mx-auto text-text-secondary mb-4"
                          />
                          <p className="text-text-secondary">No pending appointments</p>
                          <p className="text-sm text-text-secondary mt-1">
                            Your appointment requests will appear here
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {appointmentTab === 'completed' && (
                    <>
                      {completedAppointmentsList.length > 0 ? (
                        completedAppointmentsList.map((appointment) => (
                          <UpcomingAppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onReschedule={handleReschedule}
                            onJoin={handleJoinAppointment}
                            onCancel={handleCancelAppointment}
                            onChat={handleChat}
                            onReview={handleReview}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Icon
                            name="CheckCircleIcon"
                            size={48}
                            className="mx-auto text-text-secondary mb-4"
                          />
                          <p className="text-text-secondary">No completed appointments</p>
                          <p className="text-sm text-text-secondary mt-1">
                            Your completed consultations will appear here
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {appointmentTab === 'rejected' && (
                    <>
                      {rejectedAppointmentsList.length > 0 ? (
                        rejectedAppointmentsList.map((appointment) => (
                          <UpcomingAppointmentCard
                            key={appointment.id}
                            appointment={appointment}
                            onReschedule={handleReschedule}
                            onJoin={handleJoinAppointment}
                            onCancel={handleCancelAppointment}
                            onChat={handleChat}
                            onReview={handleReview}
                          />
                        ))
                      ) : (
                        <div className="text-center py-12">
                          <Icon
                            name="XCircleIcon"
                            size={48}
                            className="mx-auto text-text-secondary mb-4"
                          />
                          <p className="text-text-secondary">No rejected appointments</p>
                          <p className="text-sm text-text-secondary mt-1">
                            Appointments rejected by doctors will appear here
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </section>

            <section>
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-text-primary mb-4 flex items-center space-x-2">
                  <Icon name="MagnifyingGlassIcon" size={28} />
                  <span>Find Doctors</span>
                  <span className="text-sm font-normal text-text-secondary ml-2">
                    ({filteredDoctors.length} available)
                  </span>
                </h2>

                <div className="relative">
                  <Icon
                    name="MagnifyingGlassIcon"
                    size={20}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary"
                  />

                  <input
                    type="text"
                    placeholder="Search by name, specialty, or condition..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-14 pl-12 pr-4 bg-card border border-border rounded-xl text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-ring transition-base shadow-elevation-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                <div className="xl:col-span-1">
                  <DoctorSearchFilters onFilterChange={handleFilterChange} />
                </div>

                <div className="xl:col-span-3 space-y-4">
                  {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor) => (
                      <DoctorCard key={doctor.id} doctor={doctor} onBook={handleBookDoctor} />
                    ))
                  ) : (
                    <div className="bg-card border border-border rounded-xl p-8 text-center">
                      <Icon
                        name="UserGroupIcon"
                        size={48}
                        className="mx-auto text-text-secondary mb-4"
                      />
                      <p className="text-text-secondary">No doctors found matching your criteria</p>
                      <p className="text-sm text-text-secondary mt-1">
                        Try adjusting your filters or search query
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <AIChatbotWidget onOpen={handleOpenAIChat} />
            <RecentActivityFeed
              activities={
                activities.length > 0
                  ? activities
                  : [
                    {
                      id: '1',
                      type: 'appointment' as const,
                      title: 'Welcome!',
                      description: 'Start by booking your first appointment',
                      timestamp: 'Just now',
                      icon: 'SparklesIcon',
                      color: 'bg-primary',
                    },
                  ]
              }
            />
          </div>
        </div>
      </div>

      <BookingModal
        isOpen={isBookingModalOpen}
        doctorId={selectedDoctorForBooking?.id || ''}
        doctorName={selectedDoctorForBooking?.name || ''}
        onClose={() => setIsBookingModalOpen(false)}
        onConfirm={handleConfirmBooking}
      />

      <AIChatbotModal isOpen={isChatbotOpen} onClose={() => setIsChatbotOpen(false)} />

      {selectedAppointment && (
        <>
          <DoctorChatModal
            isOpen={isChatModalOpen}
            onClose={() => setIsChatModalOpen(false)}
            appointment={selectedAppointment as any}
          />
          <ReviewDoctorModal
            isOpen={isReviewModalOpen}
            onClose={() => setIsReviewModalOpen(false)}
            appointment={selectedAppointment as any}
            onSuccess={handleReviewSuccess}
          />
        </>
      )}

      {selectedAppointmentForReschedule && (
        <RescheduleModal
          isOpen={isRescheduleModalOpen}
          appointmentId={selectedAppointmentForReschedule.id}
          doctorId={selectedAppointmentForReschedule.doctorId}
          doctorName={selectedAppointmentForReschedule.doctorName}
          currentDate={selectedAppointmentForReschedule.date}
          currentTime={selectedAppointmentForReschedule.time}
          onConfirm={handleConfirmReschedule}
          onCancel={() => {
            setIsRescheduleModalOpen(false);
            setSelectedAppointmentForReschedule(null);
          }}
        />
      )}

      {/* Video Call Modal for outgoing calls */}
      {videoCallAppointmentId && (
        <VideoCallModal
          isOpen={isVideoCallModalOpen}
          onClose={() => {
            setIsVideoCallModalOpen(false);
            setVideoCallAppointmentId(null);
          }}
          appointmentId={videoCallAppointmentId}
          otherUserName={videoCallDoctorName}
        />
      )}

      {/* Incoming Call Modal */}
      <IncomingCallModal
        isOpen={!!incomingCall}
        onClose={() => { }}
      />

      {/* Confirmation Dialog */}
      {ConfirmDialogComponent}
    </>
  );
};

export default PatientDashboardInteractive;
