/**
 * CallNotificationProvider
 * 
 * Global provider component that enables incoming call notifications
 * across the entire application. Wraps children and shows the
 * IncomingCallModal when a call is received.
 * 
 * Usage: Wrap your app or layout with this provider
 */

'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useCallNotification } from '@/lib/hooks/useCallNotification';
import { IncomingCallModal } from './IncomingCallModal';

interface CallNotificationContextType {
    initiateCall: (appointmentId: string) => void;
    isWaitingForResponse: boolean;
    cancelCall: () => void;
}

const CallNotificationContext = createContext<CallNotificationContextType | null>(null);

export function useCallNotificationContext() {
    const context = useContext(CallNotificationContext);
    if (!context) {
        throw new Error('useCallNotificationContext must be used within CallNotificationProvider');
    }
    return context;
}

interface CallNotificationProviderProps {
    children: ReactNode;
}

export function CallNotificationProvider({ children }: CallNotificationProviderProps) {
    const {
        isIncomingCall,
        incomingCallData,
        isWaitingForResponse,
        acceptCall,
        declineCall,
        initiateCall,
        cancelCall,
    } = useCallNotification();

    return (
        <CallNotificationContext.Provider
            value={{
                initiateCall,
                isWaitingForResponse,
                cancelCall,
            }}
        >
            {children}

            {/* Incoming call modal */}
            <IncomingCallModal
                isOpen={isIncomingCall}
                callerName={incomingCallData?.callerName || 'Unknown'}
                callerRole={incomingCallData?.callerRole || 'patient'}
                appointmentId={incomingCallData?.appointmentId || ''}
                onAccept={acceptCall}
                onDecline={declineCall}
            />

            {/* Waiting for response overlay */}
            {isWaitingForResponse && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-slate-800 rounded-xl p-6 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4" />
                        <p className="text-white mb-4">Calling...</p>
                        <button
                            onClick={cancelCall}
                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </CallNotificationContext.Provider>
    );
}
