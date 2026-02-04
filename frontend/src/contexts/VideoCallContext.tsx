'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  StreamVideoClient,
  Call,
  StreamVideo,
  User,
  CallingState,
  useCalls,
} from '@stream-io/video-react-sdk';
import { useAuth } from './AuthContext';
import { videoCallsApi } from '../lib/api';

interface IncomingCall {
  call: Call;
  appointmentId: string;
  callerName: string;
}

interface VideoCallContextType {
  client: StreamVideoClient | null;
  activeCall: Call | null;
  incomingCall: IncomingCall | null;
  isInitializing: boolean;
  isRinging: boolean;
  isClientReady: boolean;
  initializeCall: (appointmentId: string) => Promise<void>;
  joinCall: (call: Call) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => Promise<void>;
  leaveCall: () => Promise<void>;
  endCall: () => Promise<void>;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

// Hook to watch for calls - must be used inside StreamVideo
function useCallWatcher(
  onIncomingCall: (call: Call) => void,
  onOutgoingCallEnded: () => void
) {
  const calls = useCalls();

  useEffect(() => {
    // Filter for ringing calls that we didn't create (incoming)
    const incomingCalls = calls.filter(
      (call) =>
        call.isCreatedByMe === false &&
        call.state.callingState === CallingState.RINGING
    );

    if (incomingCalls.length > 0) {
      onIncomingCall(incomingCalls[0]);
    }

    // Filter for outgoing calls that are no longer ringing
    const outgoingCalls = calls.filter(
      (call) =>
        call.isCreatedByMe === true &&
        call.state.callingState !== CallingState.RINGING &&
        call.state.callingState !== CallingState.IDLE
    );

    if (outgoingCalls.length > 0) {
      // Outgoing call was answered or ended
      onOutgoingCallEnded();
    }
  }, [calls, onIncomingCall, onOutgoingCallEnded]);
}

function CallWatcherWrapper({
  onIncomingCall,
  onOutgoingCallEnded,
}: {
  onIncomingCall: (call: Call) => void;
  onOutgoingCallEnded: () => void;
}) {
  useCallWatcher(onIncomingCall, onOutgoingCallEnded);
  return null;
}

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null);
  const initializingRef = React.useRef(false);

  // Initialize client immediately when user is authenticated (on app load)
  useEffect(() => {
    if (!user) {
      if (client) {
        client.disconnectUser();
        setClient(null);
        setIsClientReady(false);
      }
      initializingRef.current = false;
      return;
    }

    // Prevent double initialization
    if (client || initializingRef.current) {
      return;
    }

    const initClient = async () => {
      initializingRef.current = true;
      try {
        console.log('🎥 Initializing video client for user:', user.email);
        const tokenData = await videoCallsApi.getToken();

        if (!tokenData.api_key || !tokenData.token) {
          console.error('❌ Failed to get video call token - missing api_key or token');
          initializingRef.current = false;
          return;
        }

        console.log('✅ Got token data, creating StreamVideoClient...');
        const streamUser: User = {
          id: tokenData.user_id,
          name: tokenData.user_name || user.email,
          type: 'authenticated',
        };

        const newClient = new StreamVideoClient({
          apiKey: tokenData.api_key,
          user: streamUser,
          token: tokenData.token,
        });

        setClient(newClient);
        setIsClientReady(true);
        console.log('✅ Video client initialized successfully - ready for calls');
      } catch (error) {
        console.error('❌ Failed to initialize video client:', error);
        setIsClientReady(false);
        initializingRef.current = false;
      }
    };

    // Initialize immediately on user login
    initClient();

    return () => {
      // Cleanup handled by dependency change logic or unmount
    };
  }, [user]);

  const handleIncomingCall = useCallback((call: Call) => {
    // Extract appointment ID from call custom data
    const appointmentId = call.state.custom?.appointmentId || '';
    const callerName = call.state.createdBy?.name || 'Unknown Caller';

    setIncomingCall({
      call,
      appointmentId,
      callerName,
    });
  }, []);

  const handleOutgoingCallEnded = useCallback(() => {
    setIsRinging(false);
  }, []);

  const initializeCall = async (appointmentId: string): Promise<void> => {
    if (!client || !isClientReady) {
      throw new Error('Video client not initialized. Please wait a moment and try again.');
    }

    setIsInitializing(true);
    setPendingAppointmentId(appointmentId);

    try {
      // Get call details from backend (backend now creates both users in Stream)
      const callDetails = await videoCallsApi.createCall(appointmentId);

      const call = client.call('default', callDetails.call_id);

      // Create a ringing call with both participants as members
      await call.getOrCreate({
        ring: true,
        video: true,
        data: {
          members: [
            { user_id: callDetails.user_id },
            { user_id: callDetails.other_user_id },
          ],
          custom: {
            appointmentId,
            callerName: callDetails.user_name,
          },
        },
      });

      setActiveCall(call);
      setIsRinging(true);
    } catch (error) {
      console.error('Error initializing call:', error);
      throw error;
    } finally {
      setIsInitializing(false);
    }
  };

  const joinCall = async (call: Call): Promise<void> => {
    try {
      await call.join();
      setActiveCall(call);
      setIncomingCall(null);
      setIsRinging(false);
    } catch (error) {
      console.error('Error joining call:', error);
      throw error;
    }
  };

  const acceptIncomingCall = async (): Promise<void> => {
    if (!incomingCall) return;

    try {
      await joinCall(incomingCall.call);
    } catch (error) {
      console.error('Error accepting incoming call:', error);
      throw error;
    }
  };

  const rejectIncomingCall = async (): Promise<void> => {
    if (!incomingCall) return;

    try {
      await incomingCall.call.leave({ reject: true, reason: 'decline' });
      setIncomingCall(null);
    } catch (error) {
      console.error('Error rejecting incoming call:', error);
      throw error;
    }
  };

  const leaveCall = async () => {
    if (activeCall) {
      await activeCall.leave();
      setActiveCall(null);
      setIsRinging(false);
      setPendingAppointmentId(null);
    }
  };

  const endCall = async () => {
    if (activeCall) {
      // If doctor, end it for everyone
      await activeCall.endCall();
      await activeCall.leave();
      setActiveCall(null);
      setIsRinging(false);
      setPendingAppointmentId(null);
    }
  };

  // Context value - always provide it so hooks work
  const contextValue: VideoCallContextType = {
    client,
    activeCall,
    incomingCall,
    isInitializing,
    isRinging,
    isClientReady,
    initializeCall,
    joinCall,
    acceptIncomingCall,
    rejectIncomingCall,
    leaveCall,
    endCall,
  };

  // Only render StreamVideo when client is ready
  // This prevents the "client is not initialized" error from Stream SDK
  if (!client || !isClientReady) {
    return (
      <VideoCallContext.Provider value={contextValue}>
        {children}
      </VideoCallContext.Provider>
    );
  }

  return (
    <VideoCallContext.Provider value={contextValue}>
      <StreamVideo client={client}>
        <CallWatcherWrapper
          onIncomingCall={handleIncomingCall}
          onOutgoingCallEnded={handleOutgoingCallEnded}
        />
        {children}
      </StreamVideo>
    </VideoCallContext.Provider>
  );
}

export function useVideoCall() {
  const context = useContext(VideoCallContext);
  if (context === undefined) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
}
