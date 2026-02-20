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
        return 'bg-success/10 text-success border-success/20';
      case 'Follow-up':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Discharged':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 hover:shadow-elevation-2 transition-base">
      <div className="flex items-start gap-5">
        {/* Larger Avatar */}
        <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0 ring-2 ring-border">
          <AppImage
            src={patient.image}
            alt={patient.imageAlt}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-text-primary truncate">{patient.name}</h3>
              <p className="text-sm text-text-secondary mt-1">
                Age: {patient.age} • Last visit: {patient.lastVisit}
              </p>
            </div>
            <span
              className={`px-4 py-1.5 rounded-full text-sm font-medium border whitespace-nowrap ${getStatusColor(patient.status)}`}
            >
              {patient.status}
            </span>
          </div>

          {/* Condition */}
          <p className="text-text-secondary mb-4">{patient.condition}</p>

          {/* Action Buttons - Larger and more spaced */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onViewHistory(patient.id)}
              className="flex items-center gap-2 px-5 py-2.5 bg-muted text-text-primary rounded-xl hover:brightness-95 transition-base font-medium shadow-sm"
            >
              <Icon name="DocumentTextIcon" size={18} />
              <span>History</span>
            </button>
            <button
              onClick={() => onMessage(patient.id)}
              className="flex items-center gap-2 px-5 py-2.5 bg-accent text-accent-foreground rounded-xl hover:brightness-110 hover:shadow-elevation-2 transition-base font-medium"
            >
              <Icon name="ChatBubbleLeftRightIcon" size={18} />
              <span>Message</span>
            </button>
            {onPrescribe && hasActiveAppointment && (
              <button
                onClick={() => onPrescribe(patient.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-warning text-warning-foreground rounded-xl hover:brightness-110 transition-base font-medium shadow-sm"
              >
                <Icon name="ClipboardDocumentListIcon" size={18} />
                <span>Prescribe</span>
              </button>
            )}
            {onFinish && hasActiveAppointment && (
              <button
                onClick={() => onFinish(patient.id)}
                className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-xl hover:brightness-110 transition-base font-medium shadow-sm"
              >
                <Icon name="CheckCircleIcon" size={18} />
                <span>Finish Appointment</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
