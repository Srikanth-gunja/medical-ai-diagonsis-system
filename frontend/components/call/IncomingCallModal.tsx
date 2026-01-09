/**
 * IncomingCallModal Component
 * 
 * Displays a popup notification when receiving an incoming video call.
 * Shows caller information and provides accept/decline buttons.
 */

'use client';

import { useEffect, useState } from 'react';
import { Phone, PhoneOff, User, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface IncomingCallModalProps {
    isOpen: boolean;
    callerName: string;
    callerRole: 'doctor' | 'patient';
    appointmentId: string;
    onAccept: () => void;
    onDecline: () => void;
}

export function IncomingCallModal({
    isOpen,
    callerName,
    callerRole,
    appointmentId,
    onAccept,
    onDecline,
}: IncomingCallModalProps) {
    const [ringDuration, setRingDuration] = useState(0);

    // Auto-decline after 60 seconds
    useEffect(() => {
        if (!isOpen) {
            setRingDuration(0);
            return;
        }

        const interval = setInterval(() => {
            setRingDuration(prev => {
                if (prev >= 60) {
                    onDecline();
                    return 0;
                }
                return prev + 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [isOpen, onDecline]);

    // Play ringtone sound (optional - can be enabled if needed)
    useEffect(() => {
        if (!isOpen) return;

        // You could add audio playback here:
        // const audio = new Audio('/sounds/ringtone.mp3');
        // audio.loop = true;
        // audio.play();
        // return () => audio.pause();
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-700 animate-in fade-in zoom-in duration-300">
                {/* Pulsing ring animation */}
                <div className="relative mx-auto w-24 h-24 mb-6">
                    <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                    <div className="absolute inset-2 rounded-full bg-emerald-500/30 animate-ping animation-delay-100" />
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                        <Video className="w-10 h-10 text-white" />
                    </div>
                </div>

                {/* Caller info */}
                <h2 className="text-xl font-semibold text-white mb-1">
                    Incoming Video Call
                </h2>
                <div className="flex items-center justify-center gap-2 mb-1">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="text-lg text-white font-medium">{callerName}</span>
                </div>
                <p className="text-slate-400 text-sm mb-6 capitalize">
                    {callerRole} is calling...
                </p>

                {/* Timer */}
                <p className="text-slate-500 text-xs mb-6">
                    {60 - ringDuration}s remaining
                </p>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-4">
                    {/* Decline button */}
                    <Button
                        onClick={onDecline}
                        className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 border-0 shadow-lg shadow-red-500/30 transition-transform hover:scale-105"
                        title="Decline call"
                    >
                        <PhoneOff className="w-7 h-7" />
                    </Button>

                    {/* Accept button */}
                    <Button
                        onClick={onAccept}
                        className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 border-0 shadow-lg shadow-emerald-500/30 transition-transform hover:scale-105"
                        title="Accept call"
                    >
                        <Phone className="w-7 h-7" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
