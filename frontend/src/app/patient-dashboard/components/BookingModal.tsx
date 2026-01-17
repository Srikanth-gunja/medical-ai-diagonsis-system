'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { schedulesApi } from '@/lib/api';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface BookingModalProps {
  isOpen: boolean;
  doctorId: string;
  doctorName: string;
  onClose: () => void;
  onConfirm: (date: string, time: string, type: string) => void;
}

const BookingModal = ({ isOpen, doctorId, doctorName, onClose, onConfirm }: BookingModalProps) => {
  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState('');
  const [consultationType, setConsultationType] = useState<'video' | 'in-person'>('video');
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && doctorId) {
      fetchAvailableSlots(selectedDate);
    }
  }, [isOpen, doctorId, selectedDate]);

  const fetchAvailableSlots = async (date: string) => {
    setIsLoading(true);
    setError(null);
    setSelectedTime(''); // Reset selected time when date changes
    try {
      const response = await schedulesApi.getAvailableSlots(doctorId, date);
      const slots: TimeSlot[] = response.slots.map((slot) => ({
        time: slot,
        available: true,
      }));
      setTimeSlots(slots);
      if (slots.length === 0) {
        setError('No available slots for this date');
      }
    } catch (err) {
      console.error('Failed to fetch slots:', err);
      setError('Failed to load available slots');
      setTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (selectedTime) {
      onConfirm(selectedDate, selectedTime, consultationType);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-card rounded-2xl shadow-elevation-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between z-10">
          <h2 className="text-2xl font-semibold text-text-primary">Book Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 text-text-secondary hover:text-primary hover:bg-muted rounded-lg transition-base"
            aria-label="Close modal"
          >
            <Icon name="XMarkIcon" size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-text-secondary mb-1">Booking with</p>
            <p className="text-lg font-semibold text-text-primary">Dr. {doctorName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Consultation Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConsultationType('video')}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-base ${
                  consultationType === 'video'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-text-secondary hover:border-primary/50'
                }`}
              >
                <Icon name="VideoCameraIcon" size={20} />
                <span className="font-medium">Video Call</span>
              </button>
              <button
                onClick={() => setConsultationType('in-person')}
                className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-base ${
                  consultationType === 'in-person'
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-text-secondary hover:border-primary/50'
                }`}
              >
                <Icon name="BuildingOfficeIcon" size={20} />
                <span className="font-medium">In-Person</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">Select Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Available Time Slots
            </label>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent" />
              </div>
            ) : error ? (
              <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg text-center">
                <Icon
                  name="ExclamationTriangleIcon"
                  size={24}
                  className="mx-auto mb-2 text-warning"
                />
                <p className="text-sm text-text-secondary">{error}</p>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="p-4 bg-muted rounded-lg text-center">
                <Icon name="CalendarIcon" size={24} className="mx-auto mb-2 text-text-tertiary" />
                <p className="text-sm text-text-secondary">No available slots for this date</p>
                <p className="text-xs text-text-tertiary mt-1">Try selecting a different date</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {timeSlots.map((slot) => (
                  <button
                    key={slot.time}
                    onClick={() => slot.available && setSelectedTime(slot.time)}
                    disabled={!slot.available}
                    className={`px-4 py-3 rounded-lg border-2 transition-base font-medium ${
                      selectedTime === slot.time
                        ? 'border-primary bg-primary/10 text-primary'
                        : slot.available
                          ? 'border-border bg-background text-text-primary hover:border-primary/50'
                          : 'border-border bg-muted text-muted-foreground cursor-not-allowed'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Icon
                name="InformationCircleIcon"
                size={20}
                className="text-accent flex-shrink-0 mt-0.5"
              />
              <div className="text-sm text-text-secondary">
                <p className="font-medium text-text-primary mb-1">Booking Policy</p>
                <p>You can reschedule or cancel up to 2 hours before the appointment time.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-text-secondary hover:bg-muted rounded-lg transition-base font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!selectedTime}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:shadow-elevation-2 active:scale-[0.97] transition-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;
