'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/Toast';
import { schedulesApi } from '@/lib/api';
import { logger } from '@/lib/logger';

interface RescheduleModalProps {
  isOpen: boolean;
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  currentDate: string;
  currentTime: string;
  onConfirm: (id: string, date: string, time: string) => void;
  onCancel: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

const getLocalDateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function RescheduleModal({
  isOpen,
  appointmentId,
  doctorId,
  doctorName,
  currentDate,
  currentTime,
  onConfirm,
  onCancel,
}: RescheduleModalProps) {
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slotsWarning, setSlotsWarning] = useState<string | null>(null);
  const { showToast } = useToast();

  // Generate available dates (next 14 days, excluding past dates)
  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 1; i <= 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push({
        value: getLocalDateString(date),
        label: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
      });
    }
    return dates;
  };

  const availableDates = getAvailableDates();

  // Fetch time slots when date changes
  useEffect(() => {
    if (selectedDate && doctorId) {
      fetchTimeSlots();
    }
  }, [selectedDate, doctorId]);

  const fetchTimeSlots = async () => {
    setIsLoadingSlots(true);
    setSlotsWarning(null);
    try {
      const data = await schedulesApi.getAvailableSlots(doctorId, selectedDate);
      setTimeSlots(
        data.slots.map((time: string) => ({
          time,
          available: true,
        }))
      );
    } catch (err) {
      logger.error('Failed to fetch time slots:', err);
      // Fallback to default slots if API fails
      const defaultSlots = [
        '09:00 AM',
        '09:30 AM',
        '10:00 AM',
        '10:30 AM',
        '11:00 AM',
        '11:30 AM',
        '02:00 PM',
        '02:30 PM',
        '03:00 PM',
        '03:30 PM',
        '04:00 PM',
        '04:30 PM',
      ];
      setTimeSlots(defaultSlots.map((time) => ({ time, available: true })));
      setSlotsWarning('Live availability is unavailable. Showing default time slots.');
      showToast({
        type: 'warning',
        title: 'Live Slots Unavailable',
        message: 'Showing default slots for now. Please confirm timing with your doctor.',
      });
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleConfirm = async () => {
    if (!selectedDate || !selectedTime) return;
    setIsSubmitting(true);
    try {
      await onConfirm(appointmentId, selectedDate, selectedTime);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedDate('');
    setSelectedTime('');
    onCancel();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-card rounded-2xl shadow-elevation-4 max-w-lg w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Icon name="CalendarIcon" size={24} className="text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-text-primary">Reschedule Appointment</h3>
              <p className="text-sm text-text-secondary">with {doctorName}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-muted rounded-lg transition-base">
            <Icon name="XMarkIcon" size={20} className="text-text-secondary" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[60vh]">
          {/* Current Appointment */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-text-secondary mb-1">Current appointment:</p>
            <div className="flex items-center gap-2">
              <Icon name="CalendarIcon" size={16} className="text-text-secondary" />
              <span className="font-medium text-text-primary">{currentDate}</span>
              <span className="text-text-secondary">at</span>
              <span className="font-medium text-text-primary">{currentTime}</span>
            </div>
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Select new date
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {availableDates.map((date) => (
                <button
                  key={date.value}
                  type="button"
                  onClick={() => {
                    setSelectedDate(date.value);
                    setSelectedTime('');
                  }}
                  className={`px-3 py-2 text-sm rounded-lg border transition-base ${
                    selectedDate === date.value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background text-text-secondary border-border hover:border-primary/50'
                  }`}
                >
                  {date.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-3">
                Select new time
              </label>
              {isLoadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : timeSlots.length > 0 ? (
                <>
                  {slotsWarning && (
                    <div className="mb-3 rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
                      {slotsWarning}
                    </div>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`px-3 py-2 text-sm rounded-lg border transition-base ${
                          selectedTime === slot.time
                            ? 'bg-primary text-primary-foreground border-primary'
                            : slot.available
                              ? 'bg-background text-text-secondary border-border hover:border-primary/50'
                              : 'bg-muted text-text-tertiary border-border cursor-not-allowed opacity-50'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-4 text-text-secondary">
                  No available time slots for this date
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-border bg-muted/30">
          <button
            onClick={handleClose}
            className="flex-1 h-11 px-4 bg-muted text-text-primary font-medium rounded-lg hover:bg-muted/80 transition-base"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedDate || !selectedTime || isSubmitting}
            className="flex-1 h-11 px-4 bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 transition-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Rescheduling...</span>
              </>
            ) : (
              <>
                <Icon name="CalendarIcon" size={16} />
                <span>Confirm Reschedule</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
