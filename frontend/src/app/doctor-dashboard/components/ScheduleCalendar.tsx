'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { appointmentsApi, schedulesApi, Appointment, Schedule } from '@/lib/api';

interface TimeSlot {
  time: string;
  available: boolean;
  patientName?: string;
  appointmentId?: string;
}

interface DayData {
  date: string;
  day: string;
  dayName: string;
  appointments: number;
  enabled: boolean;
}

interface ScheduleCalendarProps {
  onManageSchedule: () => void;
}

export default function ScheduleCalendar({ onManageSchedule }: ScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [appointmentsData, scheduleData] = await Promise.all([
        appointmentsApi.getAll(),
        schedulesApi.getMySchedule(),
      ]);
      setAppointments(appointmentsData);
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert 24-hour time to 12-hour format
  const formatTime = (time24: string): string => {
    const [hours, minutes] = time24.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    return `${hours12.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Parse 12-hour time to 24-hour format for comparison
  const parseTime12to24 = (time12: string): string => {
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return '00:00';
    let hours = parseInt(match[1]);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Generate time slots for a specific date based on schedule settings
  const generateTimeSlots = (date: string): TimeSlot[] => {
    if (!schedule) return [];

    const dateObj = new Date(date);
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const daySchedule = schedule.weeklySchedule[dayName];

    // If this day is not enabled, return empty
    if (!daySchedule?.enabled) return [];

    const slots: TimeSlot[] = [];
    const startTime = daySchedule.start || '09:00';
    const endTime = daySchedule.end || '17:00';
    const slotDuration = schedule.slotDuration || 30;

    // Parse start and end times
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    // Generate slots
    let currentHour = startHour;
    let currentMin = startMin;

    while (currentHour < endHour || (currentHour === endHour && currentMin < endMin)) {
      const time24 = `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`;
      const time12 = formatTime(time24);

      // Check if there's an appointment at this time
      const dateAppointments = appointments.filter((appt) => appt.date === date);
      const matchingAppt = dateAppointments.find((appt) => {
        // Match appointment time (might be in 12-hour or 24-hour format)
        const apptTime24 =
          appt.time.includes('AM') || appt.time.includes('PM')
            ? parseTime12to24(appt.time)
            : appt.time;
        return apptTime24 === time24;
      });

      if (matchingAppt) {
        slots.push({
          time: time12,
          available: false,
          patientName: matchingAppt.patientName || 'Patient',
          appointmentId: matchingAppt.id,
        });
      } else {
        slots.push({ time: time12, available: true });
      }

      // Advance by slot duration
      currentMin += slotDuration;
      if (currentMin >= 60) {
        currentHour += Math.floor(currentMin / 60);
        currentMin = currentMin % 60;
      }
    }

    return slots;
  };

  // Generate week days data - only show enabled days
  const generateWeekDays = (): DayData[] => {
    if (!schedule) return [];

    const today = new Date(selectedDate);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1); // Start from Monday

    const days: DayData[] = [];
    const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const shortDayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[i];
      const daySchedule = schedule.weeklySchedule[dayName];
      const isEnabled = daySchedule?.enabled || false;

      // Only add enabled days
      if (isEnabled) {
        const dayAppointments = appointments.filter((appt) => appt.date === dateStr);
        days.push({
          date: dateStr,
          day: shortDayNames[i],
          dayName: dayName,
          appointments: dayAppointments.length,
          enabled: isEnabled,
        });
      }
    }

    return days;
  };

  const formatDisplayDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const timeSlots = generateTimeSlots(selectedDate);
  const weekDays = generateWeekDays();

  // Check if selected day is enabled
  const selectedDayName = new Date(selectedDate)
    .toLocaleDateString('en-US', { weekday: 'long' })
    .toLowerCase();
  const selectedDayEnabled = schedule?.weeklySchedule[selectedDayName]?.enabled || false;

  if (isLoading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-text-primary">Schedule Overview</h2>
        <div className="flex items-center gap-2">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-base ${
                viewMode === 'day'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-base ${
                viewMode === 'week'
                  ? 'bg-card text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Week
            </button>
          </div>
          <button
            onClick={onManageSchedule}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-elevation-2 transition-base text-sm font-medium"
          >
            <Icon name="Cog6ToothIcon" size={16} />
            <span className="hidden sm:inline">Manage</span>
          </button>
        </div>
      </div>

      {viewMode === 'week' ? (
        weekDays.length === 0 ? (
          <div className="p-8 text-center text-text-secondary border border-dashed border-border rounded-lg">
            <Icon name="CalendarIcon" size={32} className="mx-auto mb-2 text-text-tertiary" />
            <p>No working days configured</p>
            <button
              onClick={onManageSchedule}
              className="mt-2 text-primary hover:underline text-sm"
            >
              Set up your schedule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2">
            {weekDays.map((day) => (
              <button
                key={day.date}
                onClick={() => {
                  setSelectedDate(day.date);
                  setViewMode('day');
                }}
                className={`p-4 rounded-lg border transition-base ${
                  day.date === selectedDate
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <p className="text-sm font-medium text-text-secondary">{day.day}</p>
                <p className="text-lg font-semibold text-text-primary mt-1">
                  {new Date(day.date).getDate()}
                </p>
                <p className="text-xs text-accent mt-2">
                  {day.appointments} appointment{day.appointments !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-text-primary">{formatDisplayDate(selectedDate)}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDay('prev')}
                className="p-1 hover:bg-muted rounded transition-base"
              >
                <Icon name="ChevronLeftIcon" size={20} className="text-text-secondary" />
              </button>
              <button
                onClick={() => navigateDay('next')}
                className="p-1 hover:bg-muted rounded transition-base"
              >
                <Icon name="ChevronRightIcon" size={20} className="text-text-secondary" />
              </button>
            </div>
          </div>

          {!selectedDayEnabled ? (
            <div className="p-8 text-center text-text-secondary border border-dashed border-border rounded-lg">
              <Icon name="XCircleIcon" size={32} className="mx-auto mb-2 text-text-tertiary" />
              <p>This day is not a working day</p>
              <button
                onClick={() => setViewMode('week')}
                className="mt-2 text-primary hover:underline text-sm"
              >
                View weekly schedule
              </button>
            </div>
          ) : (
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {timeSlots.length === 0 ? (
                <div className="p-8 text-center text-text-secondary">
                  <Icon name="CalendarIcon" size={32} className="mx-auto mb-2 text-text-tertiary" />
                  <p>No time slots configured for this day</p>
                </div>
              ) : (
                timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border transition-base ${
                      slot.available
                        ? 'border-border hover:border-success bg-success/5'
                        : 'border-border bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-text-primary">{slot.time}</span>
                        {slot.available ? (
                          <span className="flex items-center gap-1 text-xs text-success">
                            <div className="w-2 h-2 bg-success rounded-full" />
                            Available
                          </span>
                        ) : (
                          <span className="text-sm text-text-secondary">{slot.patientName}</span>
                        )}
                      </div>
                      {!slot.available && (
                        <Icon name="VideoCameraIcon" size={16} className="text-accent" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
