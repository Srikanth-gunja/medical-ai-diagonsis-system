'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface StatusIndicatorBarProps {
    appointmentStatus?: {
        type: 'upcoming' | 'ongoing' | 'completed';
        message: string;
        time?: string;
    };
    chatAvailable?: boolean;
    systemNotification?: {
        type: 'info' | 'warning' | 'error' | 'success';
        message: string;
    };
    onDismiss?: () => void;
    className?: string;
}

const StatusIndicatorBar = ({
    appointmentStatus,
    chatAvailable,
    systemNotification,
    onDismiss,
    className = '',
}: StatusIndicatorBarProps) => {
    const [isDismissed, setIsDismissed] = useState(false);

    const handleDismiss = () => {
        setIsDismissed(true);
        if (onDismiss) {
            onDismiss();
        }
    };

    if (isDismissed) {
        return null;
    }

    const getStatusColor = () => {
        if (appointmentStatus) {
            switch (appointmentStatus.type) {
                case 'upcoming':
                    return 'bg-accent text-accent-foreground';
                case 'ongoing':
                    return 'bg-success text-success-foreground';
                case 'completed':
                    return 'bg-muted text-muted-foreground';
                default:
                    return 'bg-primary text-primary-foreground';
            }
        }

        if (systemNotification) {
            switch (systemNotification.type) {
                case 'success':
                    return 'bg-success text-success-foreground';
                case 'warning':
                    return 'bg-warning text-warning-foreground';
                case 'error':
                    return 'bg-error text-error-foreground';
                case 'info':
                default:
                    return 'bg-primary text-primary-foreground';
            }
        }

        return 'bg-card text-card-foreground border-b border-border';
    };

    const getStatusIcon = () => {
        if (appointmentStatus) {
            switch (appointmentStatus.type) {
                case 'upcoming':
                    return 'ClockIcon';
                case 'ongoing':
                    return 'VideoCameraIcon';
                case 'completed':
                    return 'CheckCircleIcon';
                default:
                    return 'CalendarIcon';
            }
        }

        if (systemNotification) {
            switch (systemNotification.type) {
                case 'success':
                    return 'CheckCircleIcon';
                case 'warning':
                    return 'ExclamationTriangleIcon';
                case 'error':
                    return 'XCircleIcon';
                case 'info':
                default:
                    return 'InformationCircleIcon';
            }
        }

        return 'BellIcon';
    };

    const hasContent = appointmentStatus || chatAvailable || systemNotification;

    if (!hasContent) {
        return null;
    }

    return (
        <div className={`${getStatusColor()} ${className}`}>
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between py-3">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Icon
                            name={getStatusIcon() as any}
                            size={20}
                            className="flex-shrink-0"
                        />

                        <div className="flex-1 min-w-0">
                            {appointmentStatus && (
                                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                                    <span className="font-medium truncate">
                                        {appointmentStatus.message}
                                    </span>
                                    {appointmentStatus.time && (
                                        <span className="text-sm opacity-90">
                                            {appointmentStatus.time}
                                        </span>
                                    )}
                                </div>
                            )}

                            {systemNotification && (
                                <span className="font-medium">
                                    {systemNotification.message}
                                </span>
                            )}

                            {chatAvailable && !appointmentStatus && !systemNotification && (
                                <span className="font-medium">
                                    Chat support is available
                                </span>
                            )}
                        </div>

                        {chatAvailable && (
                            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-white bg-opacity-20 rounded-full">
                                <div className="w-2 h-2 bg-success rounded-full animate-pulse-subtle" />
                                <span className="text-sm font-medium">Chat Available</span>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleDismiss}
                        className="ml-4 p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-base flex-shrink-0"
                        aria-label="Dismiss notification"
                    >
                        <Icon name="XMarkIcon" size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StatusIndicatorBar;