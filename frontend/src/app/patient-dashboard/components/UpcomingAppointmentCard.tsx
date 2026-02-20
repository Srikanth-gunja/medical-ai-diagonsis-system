'use client';

import { useEffect, useState } from 'react';
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
  status:
    | 'confirmed'
    | 'pending'
    | 'completed'
    | 'cancelled'
    | 'rejected'
    | 'in_progress'
    | 'no_show';
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

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
    <div className="relative overflow-hidden bg-card border border-border rounded-2xl shadow-elevation-1 hover:shadow-elevation-2 transition-all duration-300 group">
      {/* Decorative Side Panel */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-primary/80 group-hover:bg-primary transition-colors duration-300" />

      <div className="flex flex-col sm:flex-row sm:items-stretch h-full">
        {/* Left Side: Doctor Details */}
        <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-muted border-2 border-background ring-2 ring-primary/20 shadow-sm flex-shrink-0">
              <AppImage
                src={appointment.doctorImage}
                alt={appointment.doctorImageAlt}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
            {appointment.status === 'confirmed' && (
              <div className="absolute bottom-0 right-0 w-5 h-5 bg-success rounded-full border-2 border-background flex items-center justify-center shadow-sm">
                <Icon name="CheckIcon" size={10} className="text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-0.5">
              <h3 className="text-lg font-bold text-text-primary group-hover:text-primary transition-colors truncate">
                {appointment.doctorName}
              </h3>
              {appointment.type === 'video' ? (
                <span className="bg-accent/10 text-accent px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 shrink-0">
                  <Icon name="VideoCameraIcon" size={10} /> Video
                </span>
              ) : (
                <span className="bg-secondary/10 text-secondary px-1.5 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 shrink-0">
                  <Icon name="BuildingOfficeIcon" size={10} /> In-Person
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-text-secondary">{appointment.specialty}</p>

            <div className="mt-2">
              <span
                className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${getStatusColor()}`}
              >
                <Icon name={getStatusIcon() as any} size={12} />
                <span>{formatStatusLabel()}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Divider for Ticket Feel */}
        <div className="hidden sm:block w-px bg-border/40 my-4 relative"></div>
        <div className="sm:hidden h-px w-full bg-border/40 mx-4 relative border-dashed"></div>

        {/* Right Side: Date/Time & Actions */}
        <div className="p-4 sm:p-5 sm:w-64 flex flex-col justify-between bg-primary/[0.02] sm:bg-transparent">
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="flex flex-col text-text-primary bg-background/50 p-2.5 rounded-xl border border-border/50">
              <p className="flex items-center gap-1 text-[10px] text-text-secondary font-bold uppercase tracking-wider leading-none mb-1.5">
                <Icon name="CalendarIcon" size={12} className="text-primary" /> Date
              </p>
              <p className="font-bold text-xs truncate">{appointment.date}</p>
            </div>
            <div className="flex flex-col text-text-primary bg-background/50 p-2.5 rounded-xl border border-border/50">
              <p className="flex items-center gap-1 text-[10px] text-text-secondary font-bold uppercase tracking-wider leading-none mb-1.5">
                <Icon name="ClockIcon" size={12} className="text-primary" /> Time
              </p>
              <p className="font-bold text-xs truncate">{appointment.time}</p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-auto">
            {/* The video call button must be before chat/reschedule in this logic */}
            {(appointment.status === 'confirmed' || appointment.status === 'in_progress') &&
              appointment.type === 'video' && (
                <button
                  onClick={() => onJoin(appointment.id)}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-xl hover:shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all font-semibold text-sm"
                >
                  <Icon name="VideoCameraIcon" size={16} />
                  <span>Join Video Call</span>
                </button>
              )}

            <div className="flex justify-between items-stretch gap-2">
              {(appointment.status === 'confirmed' || appointment.status === 'in_progress') && (
                <button
                  onClick={() => onChat(appointment.id)}
                  className="flex-1 flex items-center justify-center space-x-1.5 px-2 py-1.5 bg-background text-text-primary border border-border shadow-sm rounded-xl hover:bg-muted transition-colors text-xs font-semibold"
                  title="Chat with Doctor"
                >
                  <Icon name="ChatBubbleLeftRightIcon" size={14} />
                  <span>Chat</span>
                </button>
              )}

              {appointment.status !== 'completed' &&
                appointment.status !== 'cancelled' &&
                appointment.status !== 'rejected' &&
                appointment.status !== 'no_show' && (
                  <>
                    <button
                      onClick={() => onReschedule(appointment.id)}
                      className="flex-1 flex items-center justify-center space-x-1.5 px-2 py-1.5 bg-background text-text-primary border border-border shadow-sm rounded-xl hover:bg-muted transition-colors text-xs font-semibold"
                      title="Reschedule"
                    >
                      <span>Reschedule</span>
                    </button>
                    <button
                      onClick={() => onCancel(appointment.id)}
                      className="flex items-center justify-center p-1.5 w-8 text-error bg-background border border-border shadow-sm hover:bg-error/10 hover:border-error/20 rounded-xl transition-colors shrink-0"
                      title="Cancel"
                    >
                      <Icon name="XMarkIcon" size={16} />
                    </button>
                  </>
                )}

              {appointment.status === 'completed' &&
                (appointment.rated ? (
                  <span className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-success/10 text-success border border-success/20 rounded-xl text-sm font-bold">
                    <Icon name="CheckCircleIcon" size={16} />
                    <span>Reviewed</span>
                  </span>
                ) : (
                  <button
                    onClick={() => onReview(appointment.id)}
                    className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-accent text-accent-foreground rounded-xl hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 active:scale-[0.98] transition-all font-semibold text-sm"
                  >
                    <Icon name="StarIcon" size={16} />
                    <span>Review Doctor</span>
                  </button>
                ))}
            </div>

            {appointment.status === 'rejected' && appointment.rejectionReason && (
              <div className="w-full mt-1 p-2 bg-error/5 border border-error/20 rounded-xl text-xs">
                <span className="font-bold text-error flex items-center gap-1 mb-0.5">
                  <Icon name="ExclamationTriangleIcon" size={12} /> Reason
                </span>
                <span
                  className="text-text-secondary line-clamp-2"
                  title={appointment.rejectionReason}
                >
                  {appointment.rejectionReason}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpcomingAppointmentCard;
