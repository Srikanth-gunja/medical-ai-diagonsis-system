'use client';

import { useState, useEffect } from 'react';
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
import Icon from '@/components/ui/AppIcon';
import { useUser } from '../ClientLayout';
import {
  doctorsApi,
  appointmentsApi,
  activitiesApi,
  type Doctor as ApiDoctor,
  type Appointment as ApiAppointment,
  type Activity,
} from '@/lib/api';

interface Appointment {
  id: string;
  doctorName: string;
  doctorImage: string;
  doctorImageAlt: string;
  specialty: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  status: 'confirmed' | 'pending' | 'completed' | 'rejected';
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
  const [selectedAppointmentForReschedule, setSelectedAppointmentForReschedule] = useState<Appointment | null>(null);

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
  const [appointmentTab, setAppointmentTab] = useState<'upcoming' | 'pending' | 'completed' | 'rejected'>('upcoming');

  useEffect(() => {
    setIsHydrated(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch appointments
      try {
        const apptData = await appointmentsApi.getAll();
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
            status: a.status as 'confirmed' | 'pending' | 'completed' | 'rejected',
            doctorId: a.doctorId,
            rated: (a as any).rated || false,
            rejectionReason: (a as any).rejectionReason || '',
          }));
        setAppointments(formattedAppointments);
      } catch (err) {
        console.error('Failed to fetch appointments:', err);
      }

      // Fetch doctors
      try {
        const doctorData = await doctorsApi.getAll();
        console.log('Doctors fetched:', doctorData);
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
          nextAvailable: d.nextAvailable || 'Tomorrow',
        }));
        setDoctors(formattedDoctors);
      } catch (err) {
        console.error('Failed to fetch doctors:', err);
      }

      // Fetch activities
      try {
        const activityData = await activitiesApi.getRecent();
        setActivities(activityData);
      } catch (err) {
        console.error('Failed to fetch activities:', err);
        setActivities([]);
      }
    } catch (err) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard error:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
      const appointment = appointments.find(a => a.id === id);
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
      console.error('Failed to reschedule appointment:', err);
      alert('Failed to reschedule appointment. Please try again.');
    }
  };

  const handleJoinAppointment = (id: string) => {
    if (isHydrated) {
      alert(`Joining video consultation for appointment ${id}`);
    }
  };

  const handleCancelAppointment = async (id: string) => {
    if (isHydrated) {
      if (confirm('Are you sure you want to cancel this appointment?')) {
        try {
          await appointmentsApi.revoke(id);
          setAppointments((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
          alert('Failed to cancel appointment');
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

  // Filter doctors based on search and filters
  const filteredDoctors = doctors.filter((doctor) => {
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

  if (!isHydrated || isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-8">
            <div className="h-10 bg-muted rounded animate-pulse w-1/3" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-48 bg-muted rounded-xl animate-pulse" />
                <div className="h-48 bg-muted rounded-xl animate-pulse" />
              </div>
              <div className="space-y-6">
                <div className="h-96 bg-muted rounded-xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Filter appointments for upcoming section: confirmed or pending
  const upcomingAppointments = appointments.filter(
    (a) => a.status === 'confirmed' || a.status === 'pending'
  );

  // You might want to show completed appointments differently or in a history section,
  // but for now, we'll include completed ones that haven't been reviewed if we want to prompt review?
  // Based on user request "after appointment complete patient can revivew", let's include completed appointments here too?
  // Or maybe confusing. Let's stick to the current filter logic but allow completed ones to show up so we can review them?
  // The previous code was: .filter((a: ApiAppointment) => a.status !== 'cancelled' && a.status !== 'completed')
  // I changed it in fetchData to include completed.

  // Let's filter for UI: upcoming (confirmed/pending) + recently completed?
  // For simplicity, let's just show all active appointments (not cancelled) in the list for now,
  // or maybe separate them. The user wants to review completed ones.
  const displayAppointments = appointments;

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
                    {appointments.filter(a => a.status === 'confirmed').length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-success/10 text-success rounded-full text-xs font-semibold">
                        {appointments.filter(a => a.status === 'confirmed').length}
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
                    {appointments.filter(a => a.status === 'pending').length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-warning/10 text-warning rounded-full text-xs font-semibold">
                        {appointments.filter(a => a.status === 'pending').length}
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
                    {appointments.filter(a => a.status === 'completed').length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded-full text-xs font-semibold">
                        {appointments.filter(a => a.status === 'completed').length}
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
                    {appointments.filter(a => a.status === 'rejected').length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-error/10 text-error rounded-full text-xs font-semibold">
                        {appointments.filter(a => a.status === 'rejected').length}
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
                      {appointments.filter(a => a.status === 'confirmed').length > 0 ? (
                        appointments
                          .filter(a => a.status === 'confirmed')
                          .map((appointment) => (
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
                          <Icon name="CalendarIcon" size={48} className="mx-auto text-text-secondary mb-4" />
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
                      {appointments.filter(a => a.status === 'pending').length > 0 ? (
                        appointments
                          .filter(a => a.status === 'pending')
                          .map((appointment) => (
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
                          <Icon name="ClockIcon" size={48} className="mx-auto text-text-secondary mb-4" />
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
                      {appointments.filter(a => a.status === 'completed').length > 0 ? (
                        appointments
                          .filter(a => a.status === 'completed')
                          .map((appointment) => (
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
                          <Icon name="CheckCircleIcon" size={48} className="mx-auto text-text-secondary mb-4" />
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
                      {appointments.filter(a => a.status === 'rejected').length > 0 ? (
                        appointments
                          .filter(a => a.status === 'rejected')
                          .map((appointment) => (
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
                          <Icon name="XCircleIcon" size={48} className="mx-auto text-text-secondary mb-4" />
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
    </>
  );
};

export default PatientDashboardInteractive;
