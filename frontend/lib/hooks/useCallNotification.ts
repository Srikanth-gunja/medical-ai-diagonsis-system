/**
 * useCallNotification Hook
 * 
 * Provides global incoming call notification functionality.
 * Connects to signaling server and listens for incoming calls.
 * Should be used in a global layout or provider to work across pages.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { signalingService, IncomingCallData } from '@/lib/services/signaling.service';

export interface CallNotificationState {
    isIncomingCall: boolean;
    incomingCallData: IncomingCallData | null;
    isWaitingForResponse: boolean;
    pendingAppointmentId: string | null;
}

export function useCallNotification() {
    const router = useRouter();
    const { token, isAuthenticated } = useAuth();

    const [state, setState] = useState<CallNotificationState>({
        isIncomingCall: false,
        incomingCallData: null,
        isWaitingForResponse: false,
        pendingAppointmentId: null,
    });

    /**
     * Handle incoming call notification
     */
    const handleIncomingCall = useCallback((data: IncomingCallData) => {
        setState(prev => ({
            ...prev,
            isIncomingCall: true,
            incomingCallData: data,
        }));
    }, []);

    /**
     * Handle invite sent confirmation
     */
    const handleInviteSent = useCallback((data: { appointmentId: string }) => {
        setState(prev => ({
            ...prev,
            isWaitingForResponse: true,
            pendingAppointmentId: data.appointmentId,
        }));
    }, []);

    /**
     * Handle call accepted - navigate to call page
     */
    const handleCallAccepted = useCallback((data: { appointmentId: string; acceptedBy: string }) => {
        setState(prev => ({
            ...prev,
            isWaitingForResponse: false,
            pendingAppointmentId: null,
            isIncomingCall: false,
            incomingCallData: null,
        }));

        // Navigate to call page
        router.push(`/call/${data.appointmentId}`);
    }, [router]);

    /**
     * Handle call declined
     */
    const handleCallDeclined = useCallback((data: { appointmentId: string; declinedBy: string }) => {
        setState(prev => ({
            ...prev,
            isWaitingForResponse: false,
            pendingAppointmentId: null,
        }));

        // Show notification (could use a toast library here)
        if (data.declinedBy !== 'self') {
            alert('Call was declined');
        }
    }, []);

    /**
     * Handle invite cancelled
     */
    const handleInviteCancelled = useCallback(() => {
        setState(prev => ({
            ...prev,
            isIncomingCall: false,
            incomingCallData: null,
        }));
    }, []);

    /**
     * Accept the incoming call
     */
    const acceptCall = useCallback(() => {
        if (!state.incomingCallData) return;

        const appointmentId = state.incomingCallData.appointmentId;
        signalingService.acceptCall(appointmentId);

        setState(prev => ({
            ...prev,
            isIncomingCall: false,
            incomingCallData: null,
        }));

        // Navigate to call page
        router.push(`/call/${appointmentId}`);
    }, [state.incomingCallData, router]);

    /**
     * Decline the incoming call
     */
    const declineCall = useCallback(() => {
        if (!state.incomingCallData) return;

        signalingService.declineCall(state.incomingCallData.appointmentId);

        setState(prev => ({
            ...prev,
            isIncomingCall: false,
            incomingCallData: null,
        }));
    }, [state.incomingCallData]);

    /**
     * Initiate a call to the other party
     */
    const initiateCall = useCallback((appointmentId: string) => {
        if (!signalingService.isConnected()) {
            // Connect first if not connected
            if (token) {
                signalingService.connect(token);
                // Wait a bit for connection before sending invite
                setTimeout(() => {
                    signalingService.sendInvite(appointmentId);
                }, 500);
            }
        } else {
            signalingService.sendInvite(appointmentId);
        }
    }, [token]);

    /**
     * Cancel a pending invite
     */
    const cancelCall = useCallback(() => {
        if (!state.pendingAppointmentId) return;

        signalingService.cancelInvite(state.pendingAppointmentId);

        setState(prev => ({
            ...prev,
            isWaitingForResponse: false,
            pendingAppointmentId: null,
        }));
    }, [state.pendingAppointmentId]);

    /**
     * Connect to signaling server and setup handlers
     */
    useEffect(() => {
        if (!isAuthenticated || !token) return;

        // Connect to signaling server
        signalingService.connect(token);

        // Setup event handlers
        signalingService.setHandlers({
            onIncomingCall: handleIncomingCall,
            onInviteSent: handleInviteSent,
            onCallAccepted: handleCallAccepted,
            onCallDeclined: handleCallDeclined,
            onInviteCancelled: handleInviteCancelled,
        });

        // Cleanup on unmount
        return () => {
            // Don't disconnect here as it might be used by other components
            // signalingService.disconnect();
        };
    }, [isAuthenticated, token, handleIncomingCall, handleInviteSent, handleCallAccepted, handleCallDeclined, handleInviteCancelled]);

    return {
        ...state,
        acceptCall,
        declineCall,
        initiateCall,
        cancelCall,
    };
}
