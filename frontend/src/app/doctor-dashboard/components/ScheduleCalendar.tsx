'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import type { Appointment, Schedule } from '@/lib/api';

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
  appointmentsData: Appointment[];
  scheduleData: Schedule | null;
  isLoadingData?: boolean;
}

export default function ScheduleCalendar({
  onManageSchedule,
  appointmentsData,
  scheduleData,
  isLoadingData = false,
}: ScheduleCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [viewMode, setViewMode] = useState<'day' | 'week'>('week');
  const appointments = appointmentsData;
  const schedule = scheduleData;
  const isLoading = isLoadingData;

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
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <h2 className="text-2xl font-bold text-foreground tracking-tight flex items-center space-x-3">
          <div className="p-2 bg-primary/10 rounded-xl text-primary">
            <Icon name="CalendarIcon" size={24} />
          </div>
          <span>Schedule Overview</span>
        </h2>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-muted p-1.5 rounded-xl border border-border w-full sm:w-auto">
            <button
              onClick={() => setViewMode('day')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${viewMode === 'day'
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border scale-100'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
            >
              Day
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-300 ${viewMode === 'week'
                ? 'bg-card text-foreground shadow-sm ring-1 ring-border scale-100'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                }`}
            >
              Week
            </button>
          </div>
          <button
            onClick={onManageSchedule}
            className="hidden sm:flex items-center justify-center gap-2 px-4 py-2 bg-card border border-border text-foreground/80 rounded-xl hover:bg-muted hover:text-foreground shadow-sm transition-all text-sm font-semibold"
          >
            <Icon name="Cog6ToothIcon" size={16} />
            <span>Manage</span>
          </button>
        </div>
      </div>

      {viewMode === 'week' ? (
        weekDays.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-muted">
            <Icon name="CalendarIcon" size={32} className="mx-auto mb-2 text-text-muted" />
            <p className="font-medium text-sm">No working days configured</p>
            <button
              onClick={onManageSchedule}
              className="mt-2 text-primary hover:underline text-sm font-semibold"
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
                className={`p-4 rounded-2xl border transition-all duration-300 ${day.date === selectedDate
                  ? 'border-primary bg-primary shadow-md shadow-primary/20 text-white scale-105 z-10'
                  : 'border-border bg-card hover:border-primary/50 hover:shadow-sm'
                  }`}
              >
                <p className={`text-sm font-semibold opacity-90`}>{day.day}</p>
                <p className="text-xl font-bold mt-1 tracking-tight">{new Date(day.date).getDate()}</p>
                <p
                  className={`text-[10px] font-bold mt-2 uppercase tracking-wider ${day.date === selectedDate ? 'text-white/80' : 'text-primary/70'}`}
                >
                  {day.appointments} appt{day.appointments !== 1 ? 's' : ''}
                </p>
              </button>
            ))}
          </div>
        )
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-foreground tracking-tight">{formatDisplayDate(selectedDate)}</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateDay('prev')}
                className="p-1 hover:bg-muted rounded-md transition-all text-muted-foreground hover:text-foreground"
              >
                <Icon name="ChevronLeftIcon" size={20} />
              </button>
              <button
                onClick={() => navigateDay('next')}
                className="p-1 hover:bg-muted rounded-md transition-all text-muted-foreground hover:text-foreground"
              >
                <Icon name="ChevronRightIcon" size={20} />
              </button>
            </div>
          </div>

          {!selectedDayEnabled ? (
            <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-muted">
              <Icon name="XCircleIcon" size={32} className="mx-auto mb-2 text-text-muted" />
              <p className="font-medium text-sm">This day is not a working day</p>
              <button
                onClick={() => setViewMode('week')}
                className="mt-2 text-primary hover:underline text-sm font-semibold"
              >
                View weekly schedule
              </button>
            </div>
          ) : (
            <div className="grid gap-2 max-h-96 overflow-y-auto pr-2">
              {timeSlots.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground bg-muted rounded-xl border border-dashed border-border">
                  <Icon name="CalendarIcon" size={32} className="mx-auto mb-2 text-text-muted" />
                  <p className="font-medium text-sm">No time slots configured for this day</p>
                </div>
              ) : (
                timeSlots.map((slot, index) => (
                  <div
                    key={index}
                    className={`p-3.5 rounded-xl border transition-all ${slot.available
                      ? 'border-emerald-200 hover:border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:hover:border-emerald-700 dark:bg-emerald-950/30'
                      : 'border-border bg-muted'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-foreground w-20">{slot.time}</span>
                        {slot.available ? (
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Available
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-muted-foreground">{slot.patientName}</span>
                        )}
                      </div>
                      {!slot.available && (
                        <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
                          <Icon name="VideoCameraIcon" size={14} className="text-primary" />
                        </div>
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
