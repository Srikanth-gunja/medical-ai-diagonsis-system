'use client';

import {
    Call,
    CallControls,
    SpeakerLayout,
    StreamCall,
    StreamTheme,
    StreamVideo,
    StreamVideoClient,
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || ''; // Ideally from env, but can be passed from backend too

interface VideoCallModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointmentId: string;
    userId: string;
    userType: 'doctor' | 'patient';
}

export default function VideoCallModal({
    isOpen,
    onClose,
    appointmentId,
    userId,
    userType,
}: VideoCallModalProps) {
    const [client, setClient] = useState<StreamVideoClient | null>(null);
    const [call, setCall] = useState<Call | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen || !appointmentId || !userId) return;

        const initCall = async () => {
            setLoading(true);
            setError(null);
            try {
                // Fetch token from backend
                const response = await fetch(`${API_BASE_URL}/video/token`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        appointmentId,
                        userType,
                        userId,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Failed to get video token');
                }

                const { token, apiKey: backendApiKey, callId, userId: streamUserId, userName } = await response.json();

                const user = {
                    id: streamUserId,
                    name: userName,
                    // image: userImage, 
                };

                const myClient = new StreamVideoClient({ apiKey: backendApiKey || apiKey, user, token });
                const myCall = myClient.call('default', callId);

                await myCall.join({ create: true });

                setClient(myClient);
                setCall(myCall);

            } catch (err: any) {
                console.error("Error joining call:", err);
                setError(err.message || "Failed to join video call.");
            } finally {
                setLoading(false);
            }
        };

        initCall();

        return () => {
            if (client) {
                // Cleanup
                client.disconnectUser();
                setClient(null);
                setCall(null);
            }
        };
    }, [isOpen, appointmentId, userId, userType]);
    // Dependency note: creating client in useEffect might re-create if deps change. 
    // Ideally, client should be singleton content wide, but for this modal simplicity we create per session.

    const handleClose = () => {
        if (call) {
            call.leave();
        }
        if (client) {
            client.disconnectUser();
        }
        setClient(null);
        setCall(null);
        onClose();
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-4xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-gray-800 h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 bg-gray-800/50 border-b border-gray-700">
                    <h3 className="text-white font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        Live Consultation
                    </h3>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        Close
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 bg-black relative flex items-center justify-center">
                    {loading && (
                        <div className="text-white flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p>Joining secure channel...</p>
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-center p-6 bg-red-900/10 rounded-lg border border-red-900/20">
                            <p className="font-medium mb-2">Connection Failed</p>
                            <p className="text-sm opacity-80">{error}</p>
                            <button
                                onClick={handleClose}
                                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    )}

                    {!loading && !error && client && call && (
                        <StreamVideo client={client}>
                            <StreamTheme>
                                <StreamCall call={call}>
                                    <div className="relative w-full h-full flex flex-col">
                                        <SpeakerLayout />
                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-gray-900/80 backdrop-blur rounded-full flex gap-4 shadow-xl border border-gray-700">
                                            <CallControls onLeave={handleClose} />
                                        </div>
                                    </div>
                                </StreamCall>
                            </StreamTheme>
                        </StreamVideo>
                    )}
                </div>
            </div>
        </div>
    );
}
