'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Call,
  CallControls,
  PaginatedGridLayout,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  useCallStateHooks,
  CallingState,
} from '@stream-io/video-react-sdk';
import {
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  UserGroupIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { useVideoCall } from '@/contexts/VideoCallContext';

interface VideoCallRoomProps {
  call: Call;
  onLeave: () => void;
}

export default function VideoCallRoom({ call, onLeave }: VideoCallRoomProps) {
  return (
    <StreamTheme>
      <StreamCall call={call}>
        <VideoCallRoomInner onLeave={onLeave} />
      </StreamCall>
    </StreamTheme>
  );
}

function VideoCallRoomInner({ onLeave }: { onLeave: () => void }) {
  const { callError } = useVideoCall();
  const { useCallCallingState, useParticipantCount, useRemoteParticipants } = useCallStateHooks();

  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const remoteParticipants = useRemoteParticipants();
  const [layout, setLayout] = useState<'speaker' | 'grid'>('speaker');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [waitTime, setWaitTime] = useState(0);
  const [showWaitingOverlay, setShowWaitingOverlay] = useState(true);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'reconnecting'>('good');
  const hasHandledEndRef = useRef(false);
  const waitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const hasMediaDevices =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  // Format wait time
  const formatWaitTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Monitor connection state for reconnection handling
  useEffect(() => {
    if (callingState === CallingState.RECONNECTING) {
      setConnectionQuality('reconnecting');
      // Set a timeout to leave if reconnection takes too long
      reconnectTimeoutRef.current = setTimeout(() => {
        console.error('Reconnection timeout - leaving call');
        onLeave();
      }, 30000); // 30 second reconnection timeout
    } else if (callingState === CallingState.JOINED) {
      setConnectionQuality('good');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    }

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [callingState, onLeave]);

  // Start wait timer
  useEffect(() => {
    if (participantCount >= 2) {
      // Both participants are in call, hide waiting overlay after a delay
      const timer = setTimeout(() => {
        setShowWaitingOverlay(false);
      }, 2000);

      if (waitTimerRef.current) {
        clearInterval(waitTimerRef.current);
        waitTimerRef.current = null;
      }

      return () => clearTimeout(timer);
    } else {
      setShowWaitingOverlay(true);
      // Start the timer
      if (!waitTimerRef.current) {
        waitTimerRef.current = setInterval(() => {
          setWaitTime((prev) => prev + 1);
        }, 1000);
      }
    }

    return () => {
      if (waitTimerRef.current) {
        clearInterval(waitTimerRef.current);
      }
    };
  }, [participantCount]);

  // Handle call end states
  useEffect(() => {
    // Check for call end states using string comparison since CallingState enum values may vary
    const endStates = ['left', 'ended', 'idle', 'rejected'];
    if (endStates.includes(callingState as string)) {
      if (!hasHandledEndRef.current) {
        hasHandledEndRef.current = true;
        // Small delay to allow UI to update
        setTimeout(() => {
          onLeave();
        }, 500);
      }
    }
  }, [callingState, onLeave]);

  // Toggle fullscreen
  const toggleFullScreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.error(`Error attempting to enable fullscreen mode: ${e.message} (${e.name})`);
      });
      setIsFullScreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullScreen(false);
      }
    }
  }, []);

  // Handle leave with cleanup
  const handleLeave = useCallback(() => {
    hasHandledEndRef.current = true;
    onLeave();
  }, [onLeave]);

  if (!hasMediaDevices) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
          <p className="text-xl font-semibold mb-2">Camera/Microphone Unavailable</p>
          <p className="text-sm text-gray-300 mb-6">
            This browser session does not support media devices. Please use HTTPS or open the site
            on localhost, then try again.
          </p>
          <button
            onClick={handleLeave}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full text-white font-medium transition-colors"
          >
            Exit Call
          </button>
        </div>
      </div>
    );
  }

  if (callError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center max-w-md px-6">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-xl font-semibold mb-2">Call Error</p>
          <p className="text-sm text-gray-300 mb-6">{callError}</p>
          <button
            onClick={handleLeave}
            className="px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full text-white font-medium transition-colors"
          >
            Exit Call
          </button>
        </div>
      </div>
    );
  }

  // Show joining state
  if (callingState !== CallingState.JOINED && callingState !== CallingState.RECONNECTING) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-lg font-medium">Joining call...</p>
          <p className="text-sm text-gray-400 mt-2">Please wait</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full flex-col bg-gray-900 ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}
    >
      {/* Reconnecting overlay */}
      {connectionQuality === 'reconnecting' && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="text-center p-8">
            <div className="relative mb-6">
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto">
                <ExclamationTriangleIcon className="w-10 h-10 text-yellow-500 animate-pulse" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Connection Lost</h3>
            <p className="text-gray-300 mb-4">Attempting to reconnect...</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-yellow-500 border-t-transparent"></div>
              <span>Please wait</span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4 text-white">
        <div className="flex items-center gap-2">
          <span className={`flex h-2 w-2 rounded-full ${connectionQuality === 'good' ? 'bg-green-500' : connectionQuality === 'poor' ? 'bg-yellow-500' : 'bg-red-500'} animate-pulse`}></span>
          <span className="font-medium">Live Consultation</span>
          <span className="text-sm text-gray-300 ml-2">({participantCount} participants)</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLayout(layout === 'speaker' ? 'grid' : 'speaker')}
            className="rounded-lg bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/20 transition-colors"
          >
            {layout === 'speaker' ? 'Grid View' : 'Speaker View'}
          </button>

          <button
            onClick={toggleFullScreen}
            className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors"
            title={isFullScreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullScreen ? (
              <ArrowsPointingInIcon className="h-5 w-5" />
            ) : (
              <ArrowsPointingOutIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Waiting for participant overlay */}
      {showWaitingOverlay && participantCount < 2 && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="text-center p-8">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-primary/20 animate-ping" />
              </div>
              <div className="relative flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                  <UserGroupIcon className="w-10 h-10 text-white" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Waiting for other participant</h3>
            <p className="text-gray-300 mb-4">The other person will join shortly</p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span>Waiting for {formatWaitTime(waitTime)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Participant joined notification */}
      {participantCount >= 2 && remoteParticipants.length > 0 && (
        <div className="absolute top-16 left-0 right-0 z-10 flex justify-center pointer-events-none">
          <div className="rounded-full bg-green-500/20 border border-green-500/30 px-4 py-2 text-sm text-green-300 shadow-lg animate-pulse">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Participant joined
            </span>
          </div>
        </div>
      )}

      {/* Video Layout */}
      <div className="flex-1 overflow-hidden">
        {layout === 'speaker' ? (
          <SpeakerLayout participantsBarPosition="bottom" />
        ) : (
          <PaginatedGridLayout />
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-900 p-4 pb-8 flex justify-center">
        <CallControls onLeave={handleLeave} />
      </div>
    </div>
  );
}
