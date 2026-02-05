'use client';

import React, { useEffect, useState } from 'react';
import {
  Call,
  CallControls,
  PaginatedGridLayout,
  SpeakerLayout,
  StreamCall,
  StreamTheme,
  useCallStateHooks,
} from '@stream-io/video-react-sdk';
import { ArrowsPointingOutIcon, ArrowsPointingInIcon } from '@heroicons/react/24/outline';
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
  const { useCallCallingState, useParticipantCount } = useCallStateHooks();
  const callingState = useCallCallingState();
  const participantCount = useParticipantCount();
  const [layout, setLayout] = useState<'speaker' | 'grid'>('speaker');
  const [isFullScreen, setIsFullScreen] = useState(false);
  const hasHandledEndRef = React.useRef(false);
  const hasMediaDevices =
    typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

  useEffect(() => {
    if (
      callingState === 'left' ||
      callingState === 'ended' ||
      callingState === 'idle' ||
      callingState === 'rejected'
    ) {
      if (!hasHandledEndRef.current) {
        hasHandledEndRef.current = true;
        onLeave();
      }
    }
  }, [callingState, onLeave]);

  if (!hasMediaDevices) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center max-w-md px-6">
          <p className="text-lg font-semibold mb-2">Camera/Microphone Unavailable</p>
          <p className="text-sm text-gray-300 mb-6">
            This browser session does not support media devices. Please use HTTPS or
            open the site on `localhost`, then try again.
          </p>
          <button
            onClick={onLeave}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-medium transition-colors"
          >
            Exit Call
          </button>
        </div>
      </div>
    );
  }

  // Toggle fullscreen
  const toggleFullScreen = () => {
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
  };

  if (callError) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center max-w-md px-6">
          <p className="text-lg font-semibold mb-2">Call Error</p>
          <p className="text-sm text-gray-300 mb-6">{callError}</p>
          <button
            onClick={onLeave}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-medium transition-colors"
          >
            Exit Call
          </button>
        </div>
      </div>
    );
  }

  if (callingState !== 'joined') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="text-lg font-medium">Joining call...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative flex h-full w-full flex-col bg-gray-900 ${isFullScreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent p-4 text-white">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>
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
            title={isFullScreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullScreen ? (
              <ArrowsPointingInIcon className="h-5 w-5" />
            ) : (
              <ArrowsPointingOutIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {participantCount < 2 && (
        <div className="absolute top-16 left-0 right-0 z-10 flex justify-center">
          <div className="rounded-full bg-black/60 px-4 py-2 text-sm text-gray-200 shadow-lg">
            Waiting for the other participant to join...
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
        <CallControls onLeave={onLeave} />
      </div>
    </div>
  );
}
