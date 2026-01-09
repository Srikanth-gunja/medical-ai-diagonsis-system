/**
 * CallNotificationWrapper
 * 
 * Client-side wrapper for the CallNotificationProvider.
 * Used in the root layout to enable global call notifications.
 */

'use client';

import { ReactNode } from 'react';
import { CallNotificationProvider } from '@/components/call/CallNotificationProvider';

interface CallNotificationWrapperProps {
    children: ReactNode;
}

export function CallNotificationWrapper({ children }: CallNotificationWrapperProps) {
    return (
        <CallNotificationProvider>
            {children}
        </CallNotificationProvider>
    );
}
