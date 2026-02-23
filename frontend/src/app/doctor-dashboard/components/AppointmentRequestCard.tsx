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
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
      case 'Urgent':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
      case 'Routine':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-400/20';
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
    <div className="group relative bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      {/* Subtle Background Glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Header section */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 ring-4 ring-slate-50 group-hover:ring-primary/10 flex-shrink-0 transition-all">
              <AppImage
                src={request.patientImage}
                alt={request.patientImageAlt}
                width={48}
                height={48}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-slate-900 text-lg tracking-tight truncate group-hover:text-primary transition-colors">
                {request.patientName}
              </h3>
              <div className="flex items-center gap-1.5 text-sm text-slate-500 font-medium mt-0.5">
                <Icon name="CalendarIcon" size={14} className="text-primary/60" />
                <span>
                  {request.requestedDate} <span className="opacity-50 mx-0.5">•</span>{' '}
                  {request.requestedTime}
                </span>
              </div>
            </div>
          </div>

          <span
            className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase whitespace-nowrap border shadow-sm ring-1 ring-inset shrink-0 ${getUrgencyColor(
              request.urgency
            )}`}
          >
            {request.urgency}
          </span>
        </div>

        {/* Content section */}
        <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50">
          <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm mb-1.5 leading-tight">
            <div className="p-1 rounded bg-white shadow-sm text-primary">
              <Icon name={getTypeIcon(request.type) as any} size={14} />
            </div>
            <span>{request.type} Request</span>
          </div>
          <div className="flex items-start gap-2 text-sm text-slate-600 leading-snug">
            <Icon name="DocumentTextIcon" size={14} className="mt-0.5 flex-shrink-0 opacity-60" />
            <span className="line-clamp-2 italic">{request.reason}</span>
          </div>
        </div>

        {/* Action section */}
        <div className="flex gap-2">
          <button
            onClick={() => onApprove(request.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-md hover:shadow-emerald-600/20 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            <Icon name="CheckIcon" size={16} />
            <span>Approve</span>
          </button>
          <button
            onClick={() => onDecline(request.id)}
            className="flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-700 border border-slate-200 shadow-sm rounded-xl hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 active:scale-[0.98] transition-all text-sm font-semibold"
          >
            <Icon name="XMarkIcon" size={16} />
            <span>Decline</span>
          </button>
        </div>
      </div>
    </div>
  );
}
