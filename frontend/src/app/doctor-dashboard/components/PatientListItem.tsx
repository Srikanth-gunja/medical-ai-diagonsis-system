import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Patient {
  id: string;
  name: string;
  image: string;
  imageAlt: string;
  age: number;
  lastVisit: string;
  condition: string;
  status: 'Active' | 'Follow-up' | 'Discharged';
}

interface PatientListItemProps {
  patient: Patient;
  onViewHistory: (id: string) => void;
  onMessage: (id: string) => void;
  onPrescribe?: (id: string) => void;
  onFinish?: (id: string) => void;
  hasActiveAppointment?: boolean;
}

export default function PatientListItem({
  patient,
  onViewHistory,
  onMessage,
  onPrescribe,
  onFinish,
  hasActiveAppointment = false,
}: PatientListItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20';
      case 'Follow-up':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20';
      case 'Discharged':
        return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-400/20';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-400/20';
    }
  };

  return (
    <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-start gap-5">
        {/* Larger Avatar with Status Indicator */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-100 flex-shrink-0 ring-4 ring-slate-50 group-hover:ring-primary/10 transition-all">
            <AppImage
              src={patient.image}
              alt={patient.imageAlt}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight truncate group-hover:text-primary transition-colors">
                {patient.name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                <span className="flex items-center gap-1.5">
                  <Icon name="UserIcon" size={14} className="text-slate-400" />
                  Age: <span className="font-medium text-slate-700">{patient.age}</span>
                </span>
                <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <Icon name="CalendarIcon" size={14} className="text-slate-400" />
                  Last visit:{' '}
                  <span className="font-medium text-slate-700">{patient.lastVisit}</span>
                </span>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ring-1 ring-inset ${getStatusColor(
                patient.status
              )} whitespace-nowrap`}
            >
              {patient.status}
            </span>
          </div>

          {/* Condition */}
          <div className="mb-5 flex items-start gap-2 text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-100/50">
            <Icon name="InformationCircleIcon" size={18} className="text-primary/70 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{patient.condition}</p>
          </div>

          {/* Action Buttons - Refined Visual Hierarchy */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onViewHistory(patient.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 hover:border-slate-300 hover:text-slate-900 transition-all font-semibold text-sm shadow-sm flex-1 sm:flex-none"
            >
              <Icon name="DocumentTextIcon" size={16} />
              <span>History</span>
            </button>
            
            <button
              onClick={() => onMessage(patient.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 hover:shadow-md transition-all font-semibold text-sm shadow-sm shadow-primary/20 flex-1 sm:flex-none"
            >
              <Icon name="ChatBubbleLeftRightIcon" size={16} />
              <span>Message</span>
            </button>

            {onPrescribe && hasActiveAppointment && (
              <button
                onClick={() => onPrescribe(patient.id)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 text-orange-700 border border-orange-200 rounded-xl hover:bg-orange-100 hover:border-orange-300 hover:shadow-sm transition-all font-semibold text-sm flex-1 sm:flex-none"
              >
                <Icon name="ClipboardDocumentListIcon" size={16} />
                <span>Prescribe</span>
              </button>
            )}

            {onFinish && hasActiveAppointment && (
              <button
                onClick={() => onFinish(patient.id)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 hover:shadow-md transition-all font-semibold text-sm shadow-sm flex-1 sm:flex-none ml-auto"
              >
                <Icon name="CheckCircleIcon" size={16} />
                <span>Finish Appointment</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
