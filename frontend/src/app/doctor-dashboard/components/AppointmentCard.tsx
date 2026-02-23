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
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
      case 'Pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
      case 'In Progress':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-indigo-600/20';
      case 'Cancelled':
      case 'No Show':
        return 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/20';
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
    <div
      className={`bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm transition-all duration-300 group ${isExpanded ? 'shadow-md border-primary/30' : 'hover:shadow-md hover:-translate-y-0.5 hover:border-slate-300'}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div
          className="flex items-start gap-4 flex-1 min-w-0 cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 ring-4 ring-slate-50 group-hover:ring-primary/10 transition-all">
            <AppImage
              src={appointment.patientImage}
              alt={appointment.patientImageAlt}
              width={56}
              height={56}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="flex-1 min-w-0 py-0.5">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors">
              {appointment.patientName}
            </h3>
            <div className="flex flex-wrap items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100/70 px-2.5 py-1 rounded-md border border-slate-200/50">
                <Icon name="ClockIcon" size={14} className="text-slate-400" />
                <span>{appointment.time}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100/70 px-2.5 py-1 rounded-md border border-slate-200/50">
                <Icon
                  name={getTypeIcon(appointment.type) as any}
                  size={14}
                  className="text-primary/70"
                />
                <span className="capitalize">{appointment.type}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 flex-shrink-0">
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ring-1 ring-inset ${getStatusColor(
              displayStatus
            )} whitespace-nowrap`}
          >
            {displayStatus}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className={`p-1.5 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-900 text-slate-500 rounded-full transition-all duration-300 shadow-sm ${isExpanded ? 'rotate-180 bg-slate-50 border-slate-300' : ''}`}
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
          >
            <Icon name="ChevronDownIcon" size={16} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="mt-5 pt-5 border-t border-slate-100 space-y-4 animate-fade-in relative">
          {appointment.isExpiredNoActivity && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex items-start gap-3">
              <Icon
                name="ExclamationTriangleIcon"
                size={20}
                className="text-rose-600 flex-shrink-0 mt-0.5"
              />
              <p className="text-sm font-medium text-rose-800 leading-relaxed">
                The scheduled window has passed with no activity. You can mark this as a no-show or
                reschedule.
              </p>
            </div>
          )}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100/50">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Icon name="DocumentTextIcon" size={14} /> Reason for visit
            </p>
            <p className="text-sm font-medium text-slate-700 leading-relaxed">
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
                className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 hover:shadow-md transition-all text-sm font-semibold shadow-sm"
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
                        className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 hover:shadow-md transition-all text-sm font-semibold shadow-sm shadow-primary/20"
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
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-sm font-semibold shadow-sm shadow-indigo-600/20"
                  >
                    <Icon name="ChatBubbleLeftRightIcon" size={18} />
                    <span>Chat</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onReschedule(appointment.id);
                    }}
                    className="flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all text-sm font-semibold shadow-sm"
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
                  className="flex-1 min-w-[150px] flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 hover:shadow-md transition-all text-sm font-semibold shadow-sm"
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 hover:shadow-md transition-all text-sm font-semibold shadow-sm shadow-rose-600/20"
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
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 shadow-sm text-slate-700 rounded-xl hover:bg-slate-50 transition-all text-sm font-semibold"
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
