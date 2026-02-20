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
    <div
      className={`group bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-elevation-1 transition-all duration-300 ${isExpanded ? 'shadow-elevation-2 border-primary/30' : 'hover:shadow-elevation-3 hover:border-primary/20'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="flex items-start gap-4 flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-background ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all shadow-sm">
            <AppImage
              src={appointment.patientImage}
              alt={appointment.patientImageAlt}
              width={56}
              height={56}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>

          <div className="flex-1 min-w-0 py-0.5">
            <h3 className="font-bold text-lg text-text-primary truncate group-hover:text-primary transition-colors">
              {appointment.patientName}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-muted/40 px-2 py-1 rounded-md">
                <Icon name="ClockIcon" size={14} className="text-primary/70" />
                <span>{appointment.time}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary bg-muted/40 px-2 py-1 rounded-md">
                <Icon
                  name={getTypeIcon(appointment.type) as any}
                  size={14}
                  className="text-accent/80"
                />
                <span className="capitalize">{appointment.type}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <span
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase border ${getStatusColor(displayStatus)}`}
          >
            {displayStatus}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`p-1.5 bg-background border border-border/50 hover:bg-muted rounded-full transition-all duration-300 ${isExpanded ? 'rotate-180 bg-muted border-border' : ''}`}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <Icon name="ChevronDownIcon" size={16} className="text-text-secondary" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-border/50 space-y-4 animate-fade-in relative">
          {appointment.isExpiredNoActivity && (
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-4 flex items-start gap-3">
              <Icon
                name="ExclamationTriangleIcon"
                size={20}
                className="text-warning flex-shrink-0 mt-0.5"
              />
              <p className="text-sm font-medium text-warning/90 leading-relaxed">
                The scheduled window has passed with no activity. You can mark this as a no-show or
                reschedule.
              </p>
            </div>
          )}
          <div className="bg-muted/30 rounded-xl p-4 border border-border/30">
            <p className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-1.5 flex items-center gap-1.5">
              <Icon name="DocumentTextIcon" size={14} /> Reason for visit
            </p>
            <p className="text-sm font-medium text-text-primary leading-relaxed">
              {appointment.reason}
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 pt-1">
            {appointment.status === 'Pending' && !appointment.isExpiredNoActivity && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onConfirm(appointment.id);
                }}
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-success text-success-foreground rounded-xl hover:brightness-110 hover:shadow-lg hover:shadow-success/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all text-sm font-bold"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onJoinCall(appointment.id);
                        }}
                        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all text-sm font-bold"
                      >
                        <Icon name="VideoCameraIcon" size={18} />
                        <span>Join Call</span>
                      </button>
                    )}

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onChat(appointment.id);
                    }}
                    className="flex items-center justify-center gap-2 px-6 py-2.5 bg-accent text-accent-foreground rounded-xl hover:brightness-110 transition-colors text-sm font-bold shadow-sm"
                  >
                    <Icon name="ChatBubbleLeftRightIcon" size={18} />
                    <span>Chat</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReschedule(appointment.id);
                    }}
                    className="flex-1 min-w-[120px] sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-muted text-text-primary rounded-xl hover:brightness-95 transition-colors text-sm font-bold shadow-sm"
                  >
                    <Icon name="CalendarIcon" size={16} />
                    <span>Reschedule</span>
                  </button>
                </>
              )}

            {!appointment.isExpiredNoActivity &&
              (appointment.status === 'Confirmed' || appointment.status === 'In Progress') &&
              onFinish && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onFinish(appointment.id);
                  }}
                  className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2.5 bg-secondary text-secondary-foreground rounded-xl hover:brightness-110 hover:shadow-lg hover:shadow-secondary/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all text-sm font-bold"
                >
                  <Icon name="CheckCircleIcon" size={18} />
                  <span>Finish Appointment</span>
                </button>
              )}

            {appointment.isExpiredNoActivity && onMarkNoShow && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkNoShow(appointment.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-warning text-warning-foreground rounded-xl hover:bg-warning/90 hover:shadow-md transition-all text-sm font-bold"
              >
                <Icon name="ExclamationTriangleIcon" size={16} />
                <span>Mark No-Show</span>
              </button>
            )}

            {appointment.isExpiredNoActivity && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onReschedule(appointment.id);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-muted shadow-sm text-text-primary rounded-xl hover:brightness-95 transition-all text-sm font-bold"
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
