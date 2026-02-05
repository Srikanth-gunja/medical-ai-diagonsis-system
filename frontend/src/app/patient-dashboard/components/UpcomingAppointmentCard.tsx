'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Appointment {
  id: string;
  doctorName: string;
  doctorImage: string;
  doctorImageAlt: string;
  specialty: string;
  date: string;
  time: string;
  type: 'video' | 'in-person';
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled' | 'rejected' | 'in_progress' | 'no_show';
  rated?: boolean;
  rejectionReason?: string;
}

interface UpcomingAppointmentCardProps {
  appointment: Appointment;
  onReschedule: (id: string) => void;
  onJoin: (id: string) => void;
  onCancel: (id: string) => void;
  onChat: (id: string) => void;
  onReview: (id: string) => void;
}

const UpcomingAppointmentCard = ({
  appointment,
  onReschedule,
  onJoin,
  onCancel,
  onChat,
  onReview,
}: UpcomingAppointmentCardProps) => {
  const [isHydrated, setIsHydrated] = useState(false);

  useState(() => {
    setIsHydrated(true);
  });

  const getStatusColor = () => {
    switch (appointment.status) {
      case 'confirmed':
        return 'bg-success/10 text-success border-success/20';
      case 'pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'completed':
        return 'bg-muted text-muted-foreground border-border';
      case 'in_progress':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'no_show':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'rejected':
        return 'bg-error/10 text-error border-error/20';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  const getStatusIcon = () => {
    switch (appointment.status) {
      case 'confirmed':
        return 'CheckCircleIcon';
      case 'pending':
        return 'ClockIcon';
      case 'completed':
        return 'CheckBadgeIcon';
      case 'in_progress':
        return 'VideoCameraIcon';
      case 'no_show':
        return 'ExclamationTriangleIcon';
      case 'rejected':
        return 'XCircleIcon';
      default:
        return 'CalendarIcon';
    }
  };

  const formatStatusLabel = () => {
    if (appointment.status === 'in_progress') return 'In Progress';
    if (appointment.status === 'no_show') return 'No Show';
    return appointment.status.replace('_', ' ');
  };

  if (!isHydrated) {
    return (
      <div className="bg-card border border-border rounded-xl p-6 shadow-elevation-1">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
            <div className="h-4 bg-muted rounded animate-pulse w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-elevation-1 hover:shadow-elevation-2 transition-base">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0">
            <AppImage
              src={appointment.doctorImage}
              alt={appointment.doctorImageAlt}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-text-primary mb-1">
              {appointment.doctorName}
            </h3>
            <p className="text-sm text-text-secondary mb-2">{appointment.specialty}</p>

            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center space-x-1.5 text-text-secondary">
                <Icon name="CalendarIcon" size={16} />
                <span className="nowrap">{appointment.date}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-text-secondary">
                <Icon name="ClockIcon" size={16} />
                <span className="nowrap">{appointment.time}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-text-secondary">
                <Icon
                  name={appointment.type === 'video' ? 'VideoCameraIcon' : 'BuildingOfficeIcon'}
                  size={16}
                />
                <span className="capitalize">{appointment.type}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-start sm:items-end space-y-3">
          <span
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${getStatusColor()}`}
          >
            <Icon name={getStatusIcon() as any} size={14} />
            <span className="capitalize">{formatStatusLabel()}</span>
          </span>

          <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
            {(appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
              <button
                onClick={() => onChat(appointment.id)}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-base text-sm font-medium"
                title="Chat with Doctor"
              >
                <Icon name="ChatBubbleLeftRightIcon" size={16} />
                <span>Chat</span>
              </button>
            )}

            {(appointment.status === 'confirmed' || appointment.status === 'in_progress') &&
              appointment.type === 'video' && (
              <button
                onClick={() => onJoin(appointment.id)}
                className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-elevation-2 active:scale-[0.97] transition-base text-sm font-medium"
              >
                <Icon name="VideoCameraIcon" size={16} />
                <span>Join</span>
              </button>
            )}

            {appointment.status === 'completed' &&
              (appointment.rated ? (
                <span className="flex items-center space-x-1.5 px-3 py-2 bg-success/10 text-success border border-success/20 rounded-lg text-sm font-medium">
                  <Icon name="CheckCircleIcon" size={16} />
                  <span>Reviewed</span>
                </span>
              ) : (
                <button
                  onClick={() => onReview(appointment.id)}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-accent/10 text-accent border border-accent/20 rounded-lg hover:bg-accent/20 transition-base text-sm font-medium"
                >
                  <Icon name="StarIcon" size={16} />
                  <span>Review</span>
                </button>
              ))}

            {appointment.status === 'rejected' && appointment.rejectionReason && (
              <div className="w-full mt-2 p-3 bg-error/5 border border-error/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Icon
                    name="ExclamationTriangleIcon"
                    size={16}
                    className="text-error mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <p className="text-xs font-medium text-error">Rejection Reason:</p>
                    <p className="text-sm text-text-secondary mt-0.5">
                      {appointment.rejectionReason}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {appointment.status !== 'completed' &&
              appointment.status !== 'cancelled' &&
              appointment.status !== 'rejected' &&
              appointment.status !== 'no_show' && (
                <div className="flex space-x-1">
                  <button
                    onClick={() => onReschedule(appointment.id)}
                    className="flex items-center justify-center p-2 text-text-secondary hover:text-primary hover:bg-muted rounded-lg transition-base"
                    aria-label="Reschedule appointment"
                    title="Reschedule"
                  >
                    <Icon name="ArrowPathIcon" size={18} />
                  </button>

                  <button
                    onClick={() => onCancel(appointment.id)}
                    className="flex items-center justify-center p-2 text-error hover:bg-error/10 rounded-lg transition-base"
                    aria-label="Cancel appointment"
                    title="Cancel"
                  >
                    <Icon name="XMarkIcon" size={18} />
                  </button>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingAppointmentCard;
