'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Appointment {
  id: string;
  patientName: string;
  patientImage: string;
  patientImageAlt: string;
  time: string;
  type: 'Video' | 'In-Person' | 'Phone';
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'In Progress' | 'No Show';
  reason: string;
  isExpiredNoActivity?: boolean;
  uiStatus?: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled' | 'In Progress' | 'No Show';
}

interface AppointmentCardProps {
  appointment: Appointment;
  onConfirm: (id: string) => void;
  onReschedule: (id: string) => void;
  onChat: (id: string) => void;
  onFinish?: (id: string) => void;
  onJoinCall?: (id: string) => void;
  onMarkNoShow?: (id: string) => void;
}

export default function AppointmentCard({
  appointment,
  onConfirm,
  onReschedule,
  onChat,
  onFinish,
  onJoinCall,
  onMarkNoShow,
}: AppointmentCardProps) {
  const [isExpanded, setIsExpanded] = useState(
    appointment.status === 'In Progress' || appointment.isExpiredNoActivity === true
  );
  const displayStatus = appointment.uiStatus || appointment.status;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-success/10 text-success border-success/20';
      case 'Pending':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Completed':
        return 'bg-primary/10 text-primary border-primary/20';
      case 'Cancelled':
        return 'bg-error/10 text-error border-error/20';
      case 'In Progress':
        return 'bg-accent/10 text-accent border-accent/20';
      case 'No Show':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Video':
        return 'VideoCameraIcon';
      case 'Phone':
        return 'PhoneIcon';
      case 'In-Person':
        return 'UserIcon';
      default:
        return 'CalendarIcon';
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:shadow-elevation-2 transition-base">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
            <AppImage
              src={appointment.patientImage}
              alt={appointment.patientImageAlt}
              width={48}
              height={48}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-text-primary truncate">{appointment.patientName}</h3>
            <div className="flex items-center gap-2 mt-1 text-sm text-text-secondary">
              <Icon name="ClockIcon" size={16} />
              <span>{appointment.time}</span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Icon name={getTypeIcon(appointment.type) as any} size={16} className="text-accent" />
              <span className="text-sm text-text-secondary">{appointment.type}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(displayStatus)}`}
          >
            {displayStatus}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-muted rounded transition-base"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <Icon
              name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'}
              size={20}
              className="text-text-secondary"
            />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-border space-y-3 animate-fade-in">
          {appointment.isExpiredNoActivity && (
            <div className="rounded-lg border border-warning/20 bg-warning/10 px-3 py-2 text-sm text-warning">
              The scheduled window has passed with no activity. You can mark this as a no-show or
              reschedule.
            </div>
          )}
          <div>
            <p className="text-sm text-text-secondary">Reason for visit:</p>
            <p className="text-sm text-text-primary mt-1">{appointment.reason}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {appointment.status === 'Pending' && !appointment.isExpiredNoActivity && (
              <button
                onClick={() => onConfirm(appointment.id)}
                className="flex items-center gap-2 px-4 py-2 bg-success text-success-foreground rounded-lg hover:shadow-elevation-2 transition-base text-sm font-medium"
              >
                <Icon name="CheckIcon" size={16} />
                <span>Confirm</span>
              </button>
            )}

            {!appointment.isExpiredNoActivity &&
              (appointment.status === 'Confirmed' ||
                appointment.status === 'Pending' ||
                appointment.status === 'In Progress') && (
                <>
                  {(appointment.status === 'Confirmed' || appointment.status === 'In Progress') &&
                    appointment.type === 'Video' &&
                    onJoinCall && (
                      <button
                        onClick={() => onJoinCall(appointment.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-base text-sm font-medium"
                      >
                        <Icon name="VideoCameraIcon" size={16} />
                        <span>Join Call</span>
                      </button>
                    )}

                  <button
                    onClick={() => onReschedule(appointment.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-muted text-text-primary rounded-lg hover:bg-muted/80 transition-base text-sm font-medium"
                  >
                    <Icon name="CalendarIcon" size={16} />
                    <span>Reschedule</span>
                  </button>

                  <button
                    onClick={() => onChat(appointment.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:shadow-elevation-2 transition-base text-sm font-medium"
                  >
                    <Icon name="ChatBubbleLeftRightIcon" size={16} />
                    <span>Chat</span>
                  </button>
                </>
              )}

            {!appointment.isExpiredNoActivity &&
              (appointment.status === 'Confirmed' || appointment.status === 'In Progress') &&
              onFinish && (
                <button
                  onClick={() => onFinish(appointment.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-base text-sm font-medium"
                >
                  <Icon name="CheckCircleIcon" size={16} />
                  <span>Finish Appointment</span>
                </button>
              )}

            {appointment.isExpiredNoActivity && onMarkNoShow && (
              <button
                onClick={() => onMarkNoShow(appointment.id)}
                className="flex items-center gap-2 px-4 py-2 bg-warning text-warning-foreground rounded-lg hover:bg-warning/90 transition-base text-sm font-medium"
              >
                <Icon name="ExclamationTriangleIcon" size={16} />
                <span>Mark No-Show</span>
              </button>
            )}

            {appointment.isExpiredNoActivity && (
              <button
                onClick={() => onReschedule(appointment.id)}
                className="flex items-center gap-2 px-4 py-2 bg-muted text-text-primary rounded-lg hover:bg-muted/80 transition-base text-sm font-medium"
              >
                <Icon name="CalendarIcon" size={16} />
                <span>Reschedule</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
