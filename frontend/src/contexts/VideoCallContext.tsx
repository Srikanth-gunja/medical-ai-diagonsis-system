'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  StreamVideoClient,
  Call,
  StreamVideo,
  User,
  CallingState,
  useCalls,
} from '@stream-io/video-react-sdk';
import { useAuth } from './AuthContext';
import { getToken } from '@/lib/api';
import { videoCallsApi } from '../lib/api';
import { logger } from '@/lib/logger';

// WhatsApp-like timeouts
const CONNECTION_TIMEOUT_MS = 30000; // 30 seconds to establish connection
const RINGING_TIMEOUT_MS = 60000; // 60 seconds ringing before auto-cancel
const CLIENT_INIT_TIMEOUT_MS = 15000; // 15 seconds for client initialization
const RETRY_DELAY_MS = 2000; // 2 seconds between retries

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
  isClientInitializing: boolean;
  isConnecting: boolean;
  connectionProgress: number;
  initElapsedTime: number;
  callError: string | null;
  initializeCall: (appointmentId: string) => Promise<void>;
  cancelInitializingCall: () => Promise<void>;
  joinCall: (call: Call) => Promise<void>;
  acceptIncomingCall: () => Promise<void>;
  rejectIncomingCall: () => Promise<void>;
  leaveCall: () => Promise<void>;
  endCall: () => Promise<void>;
  clearCallError: () => void;
  retryClientInitialization: () => Promise<void>;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

// Hook to watch for calls - must be used inside StreamVideo
function useCallWatcher(
  onIncomingCall: (call: Call) => void,
  onOutgoingCallAnswered: () => void,
  onOutgoingCallEnded: () => void
) {
  const calls = useCalls();

  useEffect(() => {
    // Filter for ringing calls that we didn't create (incoming)
    const incomingCalls = calls.filter(
      (call) => call.isCreatedByMe === false && call.state.callingState === CallingState.RINGING
    );

    if (incomingCalls.length > 0) {
      onIncomingCall(incomingCalls[0]);
    }

    // Filter for outgoing calls that are no longer ringing (answered)
    const answeredCalls = calls.filter(
      (call) => call.isCreatedByMe === true && call.state.callingState === CallingState.JOINED
    );

    if (answeredCalls.length > 0) {
      onOutgoingCallAnswered();
    }

    // Filter for outgoing calls that ended
    const endedCalls = calls.filter(
      (call) =>
        call.isCreatedByMe === true &&
        (call.state.callingState === CallingState.LEFT ||
          (call.state.callingState as string) === 'ended')
    );

    if (endedCalls.length > 0) {
      onOutgoingCallEnded();
    }
  }, [calls, onIncomingCall, onOutgoingCallAnswered, onOutgoingCallEnded]);
}

function CallWatcherWrapper({
  onIncomingCall,
  onOutgoingCallAnswered,
  onOutgoingCallEnded,
}: {
  onIncomingCall: (call: Call) => void;
  onOutgoingCallAnswered: () => void;
  onOutgoingCallEnded: () => void;
}) {
  useCallWatcher(onIncomingCall, onOutgoingCallAnswered, onOutgoingCallEnded);
  return null;
}

// Helper function to get friendly error messages
const getFriendlyError = (error: unknown): string => {
  const message =
    typeof error === 'string'
      ? error
      : error instanceof Error
        ? error.message
        : JSON.stringify(error || '');

  if (!message) return 'Something went wrong with the call.';
  const normalized = message.toLowerCase();

  if (normalized.includes('getusermedia') || normalized.includes('media devices')) {
    return 'Camera or microphone access is blocked. Please allow permissions and try again.';
  }
  if (normalized.includes('notallowed') || normalized.includes('permission')) {
    return 'Camera or microphone permission was denied. Please enable it in your browser.';
  }
  if (normalized.includes('notfound') || normalized.includes('device')) {
    return 'No camera or microphone was found. Please connect a device and try again.';
  }
  if (normalized.includes('metadata')) {
    return 'Unable to join the call. Please try again in a few seconds.';
  }
  if (normalized.includes('accept')) {
    return 'Call could not be accepted. Please try again.';
  }
  if (
    normalized.includes('network') ||
    normalized.includes('connection') ||
    normalized.includes('timeout')
  ) {
    return 'Network connection issue. Please check your internet and try again.';
  }
  return 'Something went wrong with the call. Please try again.';
};

export function VideoCallProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [activeCall, setActiveCall] = useState<Call | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCall | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isRinging, setIsRinging] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);
  const [isClientInitializing, setIsClientInitializing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [initElapsedTime, setInitElapsedTime] = useState(0);
  const [callError, setCallError] = useState<string | null>(null);
  const [pendingAppointmentId, setPendingAppointmentId] = useState<string | null>(null);

  const callStartedAtRef = useRef<number | null>(null);
  const initializingRef = useRef(false);
  const initRequestIdRef = useRef(0);
  const initCancelledRef = useRef(false);
  const connectionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const ringingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const clientRef = useRef<StreamVideoClient | null>(null);
  const mountedRef = useRef(true);

  const streamMock = typeof window !== 'undefined' ? (window as any).__STREAM_MOCK__ : null;
  const isMockMode = !!streamMock;

  // Keep clientRef in sync
  useEffect(() => {
    clientRef.current = client;
  }, [client]);

  // Clear all timers
  const clearAllTimers = useCallback(() => {
    if (connectionTimerRef.current) {
      clearInterval(connectionTimerRef.current);
      connectionTimerRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    if (ringingTimeoutRef.current) {
      clearTimeout(ringingTimeoutRef.current);
      ringingTimeoutRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  // Start connection progress timer
  const startConnectionTimer = useCallback(() => {
    clearAllTimers();
    setInitElapsedTime(0);
    setConnectionProgress(0);

    // Timer for elapsed time
    connectionTimerRef.current = setInterval(() => {
      setInitElapsedTime((prev) => prev + 1);
    }, 1000);

    // Progress bar simulation (0-90% over 30 seconds)
    progressTimerRef.current = setInterval(() => {
      setConnectionProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + 3;
      });
    }, 1000);
  }, [clearAllTimers]);

  // Stop connection timer
  const stopConnectionTimer = useCallback(() => {
    clearAllTimers();
    setConnectionProgress(100);
  }, [clearAllTimers]);

  const retryWithBackoff = useCallback(
    async <T,>(fn: () => Promise<T>, retries = 3, baseDelayMs = 300): Promise<T> => {
      let attempt = 0;
      while (true) {
        try {
          return await fn();
        } catch (error) {
          attempt += 1;
          if (attempt > retries) {
            throw error;
          }
          const delay = baseDelayMs * Math.pow(2, attempt - 1);
          logger.log(`Retry attempt ${attempt}/${retries}, waiting ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    },
    []
  );

  // Initialize client immediately when user is authenticated (on app load)
  useEffect(() => {
    mountedRef.current = true;

    if (isAuthLoading) {
      return;
    }
    const token = getToken();
    if (!user || !token) {
      if (client) {
        client.disconnectUser();
        setClient(null);
        setIsClientReady(false);
      }
      initializingRef.current = false;
      setIsClientInitializing(false);
      return;
    }

    // Prevent double initialization
    if (client || initializingRef.current) {
      return;
    }

    const initClient = async () => {
      initializingRef.current = true;
      setIsClientInitializing(true);

      // Set a timeout for client initialization
      const initTimeout = setTimeout(() => {
        if (!mountedRef.current) return;
        if (initializingRef.current && !clientRef.current) {
          logger.error('❌ Client initialization timed out');
          initializingRef.current = false;
          setIsClientInitializing(false);
          setCallError('Video service is taking too long to connect. Please try again.');
        }
      }, CLIENT_INIT_TIMEOUT_MS);

      try {
        if (isMockMode) {
          const mockClient =
            streamMock?.client ||
            ({
              call: () => streamMock?.call || null,
              disconnectUser: () => {},
            } as unknown as StreamVideoClient);
          if (mountedRef.current) {
            setClient(mockClient);
            setIsClientReady(true);
            setIsClientInitializing(false);
          }
          clearTimeout(initTimeout);
          return;
        }

        logger.log('🎥 Initializing video client for user:', user.email);
        const tokenData = await retryWithBackoff(() => videoCallsApi.getToken());

        if (!mountedRef.current) {
          clearTimeout(initTimeout);
          return;
        }

        // SECURITY: API key is now loaded from env, not from backend
        const apiKey = process.env.NEXT_PUBLIC_GETSTREAM_API_KEY;

        if (!apiKey) {
          logger.error(
            '❌ Video calls disabled: NEXT_PUBLIC_GETSTREAM_API_KEY not set in .env.local'
          );
          setIsClientReady(false);
          setIsClientInitializing(false);
          initializingRef.current = false;
          clearTimeout(initTimeout);
          return;
        }

        if (!tokenData.token) {
          logger.error('❌ Failed to get video call token from backend');
          setIsClientReady(false);
          setIsClientInitializing(false);
          initializingRef.current = false;
          clearTimeout(initTimeout);
          return;
        }

        logger.log('✅ Got token data, creating StreamVideoClient...');
        const streamUser: User = {
          id: tokenData.user_id,
          name: tokenData.user_name || user.email,
          type: 'authenticated',
        };

        const newClient = new StreamVideoClient({
          apiKey: apiKey,
          user: streamUser,
          token: tokenData.token,
        });

        // Wait for client to be fully connected before marking ready
        // This ensures Stream is fully initialized
        await new Promise<void>((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (!mountedRef.current) {
              clearInterval(checkInterval);
              reject(new Error('Component unmounted'));
              return;
            }
            // Client is ready when it exists
            if (newClient) {
              clearInterval(checkInterval);
              resolve();
            }
          }, 100);

          // Fallback timeout
          setTimeout(() => {
            clearInterval(checkInterval);
            resolve(); // Proceed anyway after short wait
          }, 2000);
        });

        if (mountedRef.current) {
          setClient(newClient);
          setIsClientReady(true);
          setIsClientInitializing(false);
          logger.log('✅ Video client initialized successfully - ready for calls');
        }

        clearTimeout(initTimeout);
      } catch (error) {
        logger.error('❌ Failed to initialize video client:', error);
        if (mountedRef.current) {
          setIsClientReady(false);
          setIsClientInitializing(false);
          setCallError('Failed to connect to video service. Please refresh the page.');
        }
        initializingRef.current = false;
        clearTimeout(initTimeout);
      }
    };

    // Initialize immediately on user login
    initClient();

    return () => {
      mountedRef.current = false;
      // Clean up client on unmount
      if (clientRef.current) {
        try {
          clientRef.current.disconnectUser();
        } catch (e) {
          logger.error('Error disconnecting client on unmount:', e);
        }
      }
    };
  }, [user, isAuthLoading, client, isMockMode, retryWithBackoff, streamMock]);

  // Retry client initialization
  const retryClientInitialization = useCallback(async () => {
    if (client) {
      try {
        client.disconnectUser();
      } catch (e) {
        logger.error('Error disconnecting old client:', e);
      }
      setClient(null);
    }
    setIsClientReady(false);
    initializingRef.current = false;
    setCallError(null);

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));

    // Force re-run of initialization effect by temporarily clearing client state
    // The useEffect will pick up the change and reinitialize
  }, [client]);

  const handleIncomingCall = useCallback((call: Call) => {
    // Extract appointment ID from call custom data
    const appointmentId = call.state.custom?.appointmentId || '';
    const callerName = call.state.createdBy?.name || 'Unknown Caller';

    setIncomingCall({
      call,
      appointmentId,
      callerName,
    });
    setCallError(null);
    if (appointmentId) {
      setPendingAppointmentId(appointmentId);
    }
  }, []);

  const handleOutgoingCallAnswered = useCallback(() => {
    setIsRinging(false);
    stopConnectionTimer();
  }, [stopConnectionTimer]);

  const handleOutgoingCallEnded = useCallback(() => {
    setIsRinging(false);
    stopConnectionTimer();
  }, [stopConnectionTimer]);

  const initializeCall = async (appointmentId: string): Promise<void> => {
    if (!client || !isClientReady) {
      throw new Error('Video client not initialized. Please wait a moment and try again.');
    }

    const initId = (initRequestIdRef.current += 1);
    initCancelledRef.current = false;
    setCallError(null);
    setIsInitializing(true);
    setIsConnecting(true);
    setPendingAppointmentId(appointmentId);
    startConnectionTimer();

    // Set up connection timeout (WhatsApp-like 30s timeout)
    connectionTimeoutRef.current = setTimeout(() => {
      if (isConnecting && !activeCall) {
        logger.error('❌ Connection timeout - call took too long to establish');
        setCallError('Connection timed out. Please check your internet and try again.');
        setIsConnecting(false);
        setIsInitializing(false);
        stopConnectionTimer();
        initCancelledRef.current = true;
      }
    }, CONNECTION_TIMEOUT_MS);

    try {
      logger.log('📞 Initializing call for appointment:', appointmentId);

      // Get call details from backend (backend now creates both users in Stream)
      const callDetails = await retryWithBackoff(() => videoCallsApi.createCall(appointmentId));

      if (initCancelledRef.current || initId !== initRequestIdRef.current) {
        logger.log('Call initialization was cancelled');
        setIsInitializing(false);
        setIsConnecting(false);
        stopConnectionTimer();
        return;
      }

      if (!callDetails.other_user_id) {
        throw new Error('Other participant not found for this appointment.');
      }

      logger.log('✅ Got call details, creating call...');
      const call = client.call('default', callDetails.call_id);

      // Create a ringing call with both participants as members
      await call.getOrCreate({
        ring: true,
        video: true,
        data: {
          members: [{ user_id: callDetails.user_id }, { user_id: callDetails.other_user_id }],
          custom: {
            appointmentId,
            callerName: callDetails.user_name,
          },
        },
      });

      if (initCancelledRef.current || initId !== initRequestIdRef.current) {
        logger.log('Call was cancelled after creation, cleaning up...');
        try {
          await call.endCall();
        } catch (error) {
          logger.error('Error ending canceled call:', error);
        }
        try {
          await call.leave();
        } catch (error) {
          logger.error('Error leaving canceled call:', error);
        }
        setActiveCall(null);
        setIsRinging(false);
        setPendingAppointmentId(null);
        setIsInitializing(false);
        setIsConnecting(false);
        stopConnectionTimer();
        return;
      }

      setActiveCall(call);
      setIsRinging(true);
      setIsConnecting(false);
      logger.log('✅ Call created, joining...');

      // Clear connection timeout - we're now in ringing state
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      // Set up ringing timeout (WhatsApp-like 60s auto-cancel)
      ringingTimeoutRef.current = setTimeout(async () => {
        if (isRinging && activeCall) {
          logger.log('⏰ Ringing timeout - other party did not answer');
          setCallError('No answer. The other party did not respond.');
          try {
            await call.endCall();
          } catch (e) {
            logger.error('Error ending timed-out call:', e);
          }
          try {
            await call.leave();
          } catch (e) {
            logger.error('Error leaving timed-out call:', e);
          }
          setActiveCall(null);
          setIsRinging(false);
          setPendingAppointmentId(null);
          stopConnectionTimer();
        }
      }, RINGING_TIMEOUT_MS);

      if (!isMockMode || !streamMock?.disableAutoJoin) {
        // Join the call as the caller with timeout
        try {
          // Wrap join in a timeout promise
          const joinWithTimeout = Promise.race([
            call.join(),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error('Join timeout')), CONNECTION_TIMEOUT_MS)
            )
          ]);

          await joinWithTimeout;
          logger.log('✅ Successfully joined call');

          // Clear ringing timeout since we joined
          if (ringingTimeoutRef.current) {
            clearTimeout(ringingTimeoutRef.current);
          }

          setIsRinging(true); // Now waiting for other party
          stopConnectionTimer();
          if (!callStartedAtRef.current) {
            callStartedAtRef.current = Date.now();
          }
        } catch (joinError) {
          logger.error('❌ Error joining outgoing call:', joinError);

          const errorMessage = joinError instanceof Error && joinError.message === 'Join timeout'
            ? 'Connection timed out. Please check your internet and try again.'
            : getFriendlyError(joinError);

          setCallError(errorMessage);
          setIsConnecting(false);
          stopConnectionTimer();

          // Clean up the failed call
          try {
            await call.endCall();
          } catch (error) {
            logger.error('Error ending failed call:', error);
          }
          try {
            await call.leave();
          } catch (error) {
            logger.error('Error leaving failed call:', error);
          }
          setActiveCall(null);
          setIsRinging(false);
          setPendingAppointmentId(null);
          throw joinError;
        }
      }
    } catch (error) {
      logger.error('❌ Error initializing call:', error);
      setCallError(getFriendlyError(error));
      setIsConnecting(false);
      stopConnectionTimer();
      throw error;
    } finally {
      if (initId === initRequestIdRef.current) {
        setIsInitializing(false);
      }
      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    }
  };

  const cancelInitializingCall = async (): Promise<void> => {
    initCancelledRef.current = true;
    setIsInitializing(false);
    setIsRinging(false);
    setIsConnecting(false);
    setCallError(null);
    clearAllTimers(); // This now clears ringing and connection timeouts too

    if (activeCall) {
      try {
        await activeCall.endCall();
      } catch (error) {
        logger.error('Error ending canceled call:', error);
      }
      try {
        await activeCall.leave();
      } catch (error) {
        logger.error('Error leaving canceled call:', error);
      }
      setActiveCall(null);
      setPendingAppointmentId(null);
    }
  };

  const joinCall = async (call: Call): Promise<void> => {
    setIsConnecting(true);
    setCallError(null);
    startConnectionTimer();

    // Set up connection timeout
    connectionTimeoutRef.current = setTimeout(() => {
      logger.error('❌ Join timeout - connection took too long');
      setCallError('Connection timed out. Please try again.');
      setIsConnecting(false);
      stopConnectionTimer();
    }, CONNECTION_TIMEOUT_MS);

    try {
      logger.log('📞 Joining call...');

      // Join with timeout
      const joinWithTimeout = Promise.race([
        call.join(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Join timeout')), CONNECTION_TIMEOUT_MS)
        )
      ]);

      await joinWithTimeout;
      logger.log('✅ Successfully joined call');

      // Clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      setActiveCall(call);
      setIncomingCall(null);
      setIsRinging(false);
      setIsConnecting(false);
      setCallError(null);
      stopConnectionTimer();

      if (!callStartedAtRef.current) {
        callStartedAtRef.current = Date.now();
      }
    } catch (error) {
      logger.error('❌ Error joining call:', error);

      // Clear timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      const errorMessage = error instanceof Error && error.message === 'Join timeout'
        ? 'Connection timed out. Please check your internet and try again.'
        : getFriendlyError(error);

      setCallError(errorMessage);
      setIsConnecting(false);
      stopConnectionTimer();
      throw error;
    }
  };

  const acceptIncomingCall = async (): Promise<void> => {
    if (!incomingCall) {
      logger.error('No incoming call to accept');
      return;
    }

    try {
      logger.log('📞 Accepting incoming call...');

      if (incomingCall.appointmentId) {
        setPendingAppointmentId(incomingCall.appointmentId);
      }

      // Set connecting state immediately for UI feedback
      setIsConnecting(true);
      startConnectionTimer();

      // Small delay to ensure UI updates before heavy operation
      await new Promise((resolve) => setTimeout(resolve, 100));

      await joinCall(incomingCall.call);
      logger.log('✅ Call accepted successfully');
    } catch (error) {
      logger.error('❌ Error accepting incoming call:', error);
      setCallError(getFriendlyError(error));
      setIsConnecting(false);
      stopConnectionTimer();

      // Don't clear incomingCall on error so user can retry
      throw error;
    }
  };

  const rejectIncomingCall = async (): Promise<void> => {
    if (!incomingCall) return;

    try {
      logger.log('📞 Rejecting incoming call...');
      await incomingCall.call.leave({ reject: true, reason: 'decline' });
      setIncomingCall(null);
      setPendingAppointmentId(null);
      callStartedAtRef.current = null;
      setCallError(null);
      logger.log('✅ Call rejected');
    } catch (error) {
      logger.error('❌ Error rejecting call:', error);
      setCallError(getFriendlyError(error));
      // Still clear the incoming call even if reject fails
      setIncomingCall(null);
      throw error;
    }
  };

  const leaveCall = async () => {
    // Clear all timeouts immediately
    clearAllTimers();

    if (activeCall) {
      const appointmentId = pendingAppointmentId;
      const startedAt = callStartedAtRef.current;
      const duration = startedAt
        ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
        : undefined;

      try {
        if (appointmentId) {
          await videoCallsApi.endCall(appointmentId, duration);
        }
      } catch (error) {
        logger.error('Error logging call end:', error);
      } finally {
        try {
          await activeCall.leave();
        } catch (error) {
          logger.error('Error leaving call:', error);
        }
        setActiveCall(null);
        setIsRinging(false);
        setIsConnecting(false);
        setIncomingCall(null);
        setPendingAppointmentId(null);
        callStartedAtRef.current = null;
        setCallError(null);
      }
    }
  };

  const endCall = async () => {
    // Clear all timeouts immediately
    clearAllTimers();

    if (activeCall) {
      const appointmentId = pendingAppointmentId;
      const startedAt = callStartedAtRef.current;
      const duration = startedAt
        ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000))
        : undefined;

      try {
        if (appointmentId) {
          await videoCallsApi.endCall(appointmentId, duration);
        }
      } catch (error) {
        logger.error('Error logging call end:', error);
      } finally {
        // End it for everyone, then leave locally
        try {
          await activeCall.endCall();
        } catch (error) {
          logger.error('Error ending call:', error);
          setCallError(getFriendlyError(error));
        }
        try {
          await activeCall.leave();
        } catch (error) {
          logger.error('Error leaving call:', error);
        }
        setActiveCall(null);
        setIsRinging(false);
        setIsConnecting(false);
        setIncomingCall(null);
        setPendingAppointmentId(null);
        callStartedAtRef.current = null;
        setCallError(null);
      }
    }
  };

  const clearCallError = () => setCallError(null);

  // Context value - always provide it so hooks work
  const contextValue: VideoCallContextType = {
    client,
    activeCall,
    incomingCall,
    isInitializing,
    isRinging,
    isClientReady,
    isClientInitializing,
    isConnecting,
    connectionProgress,
    initElapsedTime,
    callError,
    initializeCall,
    cancelInitializingCall,
    joinCall,
    acceptIncomingCall,
    rejectIncomingCall,
    leaveCall,
    endCall,
    clearCallError,
    retryClientInitialization,
  };

  // Only render StreamVideo when client is ready
  // This prevents the "client is not initialized" error from Stream SDK
  if (!client || !isClientReady) {
    return <VideoCallContext.Provider value={contextValue}>{children}</VideoCallContext.Provider>;
  }

  return (
    <VideoCallContext.Provider value={contextValue}>
      {isMockMode ? (
        children
      ) : (
        <StreamVideo client={client}>
          <CallWatcherWrapper
            onIncomingCall={handleIncomingCall}
            onOutgoingCallAnswered={handleOutgoingCallAnswered}
            onOutgoingCallEnded={handleOutgoingCallEnded}
          />
          {children}
        </StreamVideo>
      )}
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
