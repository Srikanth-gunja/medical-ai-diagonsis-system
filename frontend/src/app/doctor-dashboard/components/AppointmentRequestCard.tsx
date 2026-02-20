'use client';

import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface AppointmentRequest {
  id: string;
  patientName: string;
  patientImage: string;
  patientImageAlt: string;
  requestedDate: string;
  requestedTime: string;
  type: 'Video' | 'In-Person' | 'Phone';
  reason: string;
  urgency: 'Routine' | 'Urgent' | 'Emergency';
}

interface AppointmentRequestCardProps {
  request: AppointmentRequest;
  onApprove: (id: string) => void;
  onDecline: (id: string) => void;
}

export default function AppointmentRequestCard({
  request,
  onApprove,
  onDecline,
}: AppointmentRequestCardProps) {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Emergency':
        return 'bg-error/10 text-error border-error/20';
      case 'Urgent':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Routine':
        return 'bg-primary/10 text-primary border-primary/20';
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
    <div className="group relative bg-card/80 backdrop-blur-md border border-border/50 rounded-2xl p-5 shadow-elevation-1 hover:shadow-elevation-3 transition-all duration-300 overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border-2 border-background ring-2 ring-primary/10 flex-shrink-0 shadow-sm">
              <AppImage
                src={request.patientImage}
                alt={request.patientImageAlt}
                width={48}
                height={48}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-text-primary text-base truncate group-hover:text-primary transition-colors">{request.patientName}</h3>
              <div className="flex items-center gap-1.5 text-xs text-text-secondary font-medium mt-0.5">
                <Icon name="CalendarIcon" size={14} className="text-primary/60" />
                <span>
                  {request.requestedDate} <span className="opacity-50 mx-0.5">•</span> {request.requestedTime}
                </span>
              </div>
            </div>
          </div>

          <span
            className={`px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wider uppercase whitespace-nowrap border shrink-0 ${getUrgencyColor(request.urgency)}`}
          >
            {request.urgency}
          </span>
        </div>

        {/* Content section */}
        <div className="bg-muted/30 rounded-xl p-3 border border-border/30">
          <div className="flex items-center gap-2 text-text-primary font-semibold text-sm mb-1.5 leading-tight">
            <div className="p-1 rounded bg-background shadow-xs text-accent">
              <Icon name={getTypeIcon(request.type) as any} size={14} />
            </div>
            <span>{request.type} Request</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-text-secondary leading-snug">
            <Icon name="DocumentTextIcon" size={14} className="mt-0.5 flex-shrink-0 opacity-60" />
            <span className="line-clamp-2 italic">{request.reason}</span>
          </div>
        </div>

        {/* Action section */}
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(request.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-success/90 text-white rounded-xl hover:bg-success hover:shadow-lg hover:shadow-success/20 active:scale-[0.98] transition-all text-sm font-bold"
          >
            <Icon name="CheckIcon" size={16} />
            <span>Approve</span>
          </button>
          <button
            onClick={() => onDecline(request.id)}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-background text-text-primary border border-border shadow-sm rounded-xl hover:bg-error/10 hover:text-error hover:border-error/20 active:scale-[0.98] transition-all text-sm font-bold"
          >
            <Icon name="XMarkIcon" size={16} />
            <span>Decline</span>
          </button>
        </div>
      </div>
    </div>
  );
}
