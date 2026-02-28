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
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800 dark:ring-emerald-500/20';
      case 'Follow-up':
        return 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800 dark:ring-amber-500/20';
      case 'Discharged':
        return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-400/20 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700 dark:ring-slate-500/20';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200 ring-slate-400/20 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-700 dark:ring-slate-500/20';
    }
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
      <div className="flex items-start gap-5">
        {/* Larger Avatar with Status Indicator */}
        <div className="relative">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-4 ring-muted/50 group-hover:ring-primary/10 transition-all">
            <AppImage
              src={patient.image}
              alt={patient.imageAlt}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full"></span>
        </div>

        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground tracking-tight truncate group-hover:text-primary transition-colors">
                {patient.name}
              </h3>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1.5">
                  <Icon name="UserIcon" size={14} className="text-text-muted" />
                  Age: <span className="font-medium text-foreground/80">{patient.age}</span>
                </span>
                <span className="w-1 h-1 bg-border rounded-full"></span>
                <span className="flex items-center gap-1.5">
                  <Icon name="CalendarIcon" size={14} className="text-text-muted" />
                  Last visit:{' '}
                  <span className="font-medium text-foreground/80">{patient.lastVisit}</span>
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
          <div className="mb-5 flex items-start gap-2 text-muted-foreground bg-muted rounded-lg p-3 border border-border/50">
            <Icon name="InformationCircleIcon" size={18} className="text-primary/70 shrink-0 mt-0.5" />
            <p className="text-sm font-medium leading-relaxed">{patient.condition}</p>
          </div>

          {/* Action Buttons - Refined Visual Hierarchy */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onViewHistory(patient.id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-card border border-border text-foreground/80 rounded-xl hover:bg-muted hover:border-border hover:text-foreground transition-all font-semibold text-sm shadow-sm flex-1 sm:flex-none"
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
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-50 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-800 rounded-xl hover:bg-orange-100 dark:hover:bg-orange-950/60 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-sm transition-all font-semibold text-sm flex-1 sm:flex-none"
              >
                <Icon name="ClipboardDocumentListIcon" size={16} />
                <span>Prescribe</span>
              </button>
            )}

            {onFinish && hasActiveAppointment && (
              <button
                onClick={() => onFinish(patient.id)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/90 hover:shadow-md transition-all font-semibold text-sm shadow-sm flex-1 sm:flex-none ml-auto"
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
