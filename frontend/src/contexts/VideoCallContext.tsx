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
  initializeCall: (appointmentId: string, otherUserId: string, otherUserName: string) => Promise<void>;
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
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null);

  // Initialize client when user is authenticated
  useEffect(() => {
    if (!user) {
      if (client) {
        client.disconnectUser();
        setClient(null);
      }
      return;
    }

    const initClient = async () => {
      try {
        const tokenData = await videoCallsApi.getToken();

        if (!tokenData.api_key || !tokenData.token) {
          console.error('Failed to get video call token configuration');
          return;
        }

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
      } catch (error) {
        console.error('Failed to initialize video client:', error);
      }
    };

    if (!client) {
      initClient();
    }

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

  const initializeCall = async (
    appointmentId: string,
    otherUserId: string,
    otherUserName: string
  ): Promise<void> => {
    if (!client) throw new Error('Video client not initialized');

    setIsInitializing(true);
    setPendingAppointmentId(appointmentId);

    try {
      // Get call details from backend
      const callDetails = await videoCallsApi.createCall(appointmentId);

      const call = client.call('default', callDetails.call_id);

      // Create a ringing call with both participants as members
      await call.getOrCreate({
        ring: true,
        video: true,
        data: {
          members: [
            { user_id: callDetails.user_id },
            { user_id: otherUserId },
          ],
          custom: {
            appointmentId,
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

  return (
    <VideoCallContext.Provider
      value={{
        client,
        activeCall,
        incomingCall,
        isInitializing,
        isRinging,
        initializeCall,
        joinCall,
        acceptIncomingCall,
        rejectIncomingCall,
        leaveCall,
        endCall,
      }}
    >
      <StreamVideo client={client!}>
        {client && (
          <CallWatcherWrapper
            onIncomingCall={handleIncomingCall}
            onOutgoingCallEnded={handleOutgoingCallEnded}
          />
        )}
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
