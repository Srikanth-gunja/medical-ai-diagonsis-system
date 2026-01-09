/**
 * VideoCallButton Component
 * 
 * A reusable button component that initiates a video call.
 * Uses the CallNotificationContext to send invites.
 */

'use client';

import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCallNotificationContext } from './CallNotificationProvider';

interface VideoCallButtonProps {
    appointmentId: string;
    className?: string;
    size?: 'sm' | 'default' | 'lg' | 'icon';
    variant?: 'default' | 'outline' | 'ghost';
}

export function VideoCallButton({
    appointmentId,
    className = '',
    size = 'sm',
    variant = 'default',
}: VideoCallButtonProps) {
    const { initiateCall, isWaitingForResponse } = useCallNotificationContext();

    const handleClick = () => {
        initiateCall(appointmentId);
    };

    return (
        <Button
            size={size}
            variant={variant}
            className={`gap-1 w-full bg-emerald-600 hover:bg-emerald-500 text-white ${className}`}
            onClick={handleClick}
            disabled={isWaitingForResponse}
        >
            <Video className="h-4 w-4" />
            {isWaitingForResponse ? 'Calling...' : 'Video Call'}
        </Button>
    );
}
