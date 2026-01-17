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
    onDecline
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
        <div className="bg-card border border-border rounded-lg p-4 hover:shadow-elevation-2 transition-base">
            <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-muted flex-shrink-0">
                    <AppImage
                        src={request.patientImage}
                        alt={request.patientImageAlt}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-text-primary truncate">
                            {request.patientName}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getUrgencyColor(request.urgency)}`}>
                            {request.urgency}
                        </span>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Icon name="CalendarIcon" size={16} />
                            <span>{request.requestedDate} at {request.requestedTime}</span>
                        </div>
                        <div className="flex items-center gap-2 text-text-secondary">
                            <Icon name={getTypeIcon(request.type) as any} size={16} />
                            <span>{request.type} Consultation</span>
                        </div>
                        <div className="flex items-start gap-2 text-text-secondary">
                            <Icon name="DocumentTextIcon" size={16} className="mt-0.5 flex-shrink-0" />
                            <span className="line-clamp-2">{request.reason}</span>
                        </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => onApprove(request.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-success text-success-foreground rounded-lg hover:shadow-elevation-2 transition-base text-sm font-medium"
                        >
                            <Icon name="CheckIcon" size={16} />
                            <span>Approve</span>
                        </button>
                        <button
                            onClick={() => onDecline(request.id)}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-muted text-text-primary rounded-lg hover:bg-muted/80 transition-base text-sm font-medium"
                        >
                            <Icon name="XMarkIcon" size={16} />
                            <span>Decline</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}