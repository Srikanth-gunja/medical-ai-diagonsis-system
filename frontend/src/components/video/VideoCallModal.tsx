'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import VideoCallRoom from './VideoCallRoom';
import { useVideoCall } from '../../contexts/VideoCallContext';
import {
  XMarkIcon,
  VideoCameraIcon,
  PhoneIcon,
  ClockIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  otherUserName?: string;
}

export default function VideoCallModal({
  isOpen,
  onClose,
  appointmentId,
  otherUserName = 'Doctor',
}: VideoCallModalProps) {
  const {
    activeCall,
    isRinging,
    isInitializing,
    isConnecting,
    isClientReady,
    isClientInitializing,
    connectionProgress,
    initElapsedTime,
    endCall,
    leaveCall,
    callError,
    clearCallError,
    cancelInitializingCall,
    initializeCall,
    retryClientInitialization,
  } = useVideoCall();

  const [isStartingCall, setIsStartingCall] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  // Ref to prevent double-initialization
  const hasStartedCallRef = useRef(false);

  // Reset ref when modal closes
  useEffect(() => {
    if (!isOpen) {
      hasStartedCallRef.current = false;
    }
  }, [isOpen]);

  // Auto-start call when modal opens and client is ready (only if not already started)
  useEffect(() => {
    if (
      isOpen &&
      isClientReady &&
      !activeCall &&
      !isInitializing &&
      !isConnecting &&
      !isRinging &&
      !isStartingCall &&
      !hasStartedCallRef.current
    ) {
      hasStartedCallRef.current = true;
      const startCall = async () => {
        setIsStartingCall(true);
        setStartError(null);
        try {
          await initializeCall(appointmentId);
        } catch (error) {
          console.error('Failed to start call:', error);
          setStartError(error instanceof Error ? error.message : 'Failed to start call');
        } finally {
          setIsStartingCall(false);
        }
      };
      startCall();
    }
  }, [
    isOpen,
    isClientReady,
    activeCall,
    isInitializing,
    isConnecting,
    isRinging,
    isStartingCall,
    appointmentId,
    initializeCall,
  ]);

  const handleClose = async () => {
    if (isInitializing || isStartingCall) {
      await cancelInitializingCall();
      clearCallError();
      onClose();
      return;
    }

    if (activeCall) {
      // End the call for both participants
      await endCall();
    } else {
      await leaveCall();
    }
    clearCallError();
    onClose();
  };

  const handleRetry = async () => {
    setStartError(null);
    clearCallError();
    if (!isClientReady) {
      await retryClientInitialization();
    } else {
      setIsStartingCall(true);
      try {
        await initializeCall(appointmentId);
      } catch (error) {
        console.error('Retry failed:', error);
        setStartError(error instanceof Error ? error.message : 'Failed to start call');
      } finally {
        setIsStartingCall(false);
      }
    }
  };

  // Format elapsed time as mm:ss
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Show client initializing state
  if (isClientInitializing || (!isClientReady && !callError && !startError)) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-center align-middle shadow-2xl transition-all">
                  {/* Loading animation */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-blue-500/20 animate-pulse" />
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                      </div>
                    </div>
                  </div>

                  <Dialog.Title as="h3" className="text-2xl font-bold text-white mb-2">
                    Connecting to video service...
                  </Dialog.Title>

                  <p className="text-gray-400 mb-6">Please wait while we prepare your video call</p>

                  <button
                    onClick={handleClose}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-gray-600 hover:bg-gray-700 rounded-full text-white font-medium transition-all shadow-lg mx-auto"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  // Show loading state while initializing
  if (isInitializing || isConnecting) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-center align-middle shadow-2xl transition-all">
                  {/* Animated video icon */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-primary/20 animate-ping" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full bg-primary/30 animate-pulse" />
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                        <VideoCameraIcon className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </div>

                  <Dialog.Title as="h3" className="text-2xl font-bold text-white mb-2">
                    {isConnecting ? 'Connecting...' : 'Initializing video call...'}
                  </Dialog.Title>

                  <p className="text-gray-400 mb-6">
                    Please wait while we connect you to {otherUserName}
                  </p>

                  {/* Progress bar */}
                  <div className="mb-6">
                    <div className="w-full bg-gray-700 rounded-full h-2.5 mb-2">
                      <div
                        className="bg-gradient-to-r from-primary to-accent h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${connectionProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Connecting</span>
                      <span className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        {formatElapsedTime(initElapsedTime)}
                      </span>
                    </div>
                  </div>

                  {callError && (
                    <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {callError}
                    </div>
                  )}

                  <button
                    onClick={handleClose}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full text-white font-medium transition-all shadow-lg mx-auto"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    <span>Cancel</span>
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  // Show outgoing call / ringing state
  if (isRinging && activeCall) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-center align-middle shadow-2xl transition-all">
                  {/* Pulsing animation */}
                  <div className="relative mb-8">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 rounded-full bg-primary/20 animate-ping" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full bg-primary/30 animate-pulse" />
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
                        <PhoneIcon className="w-12 h-12 text-white animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <Dialog.Title as="h3" className="text-2xl font-bold text-white mb-2">
                    Calling {otherUserName}...
                  </Dialog.Title>
                  <p className="text-gray-400 mb-2">Waiting for them to answer</p>

                  {/* Elapsed time */}
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mb-6">
                    <ClockIcon className="w-4 h-4" />
                    <span>Ringing for {formatElapsedTime(initElapsedTime)}</span>
                  </div>

                  {callError && (
                    <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {callError}
                    </div>
                  )}

                  {/* Cancel button */}
                  <button
                    onClick={handleClose}
                    className="flex items-center justify-center gap-2 px-8 py-3 bg-red-600 hover:bg-red-700 rounded-full text-white font-medium transition-all shadow-lg mx-auto"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    <span>Cancel Call</span>
                  </button>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  // Show active call
  if (activeCall) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-0 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full h-screen transform overflow-hidden bg-gray-900 text-left align-middle shadow-xl transition-all flex flex-col">
                  <VideoCallRoom call={activeCall} onLeave={handleClose} />
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  // Show error state with retry option
  const displayError = callError || startError;
  if (displayError && !activeCall && !isRinging) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gradient-to-b from-gray-900 to-gray-800 p-8 text-center align-middle shadow-xl transition-all">
                  {/* Error icon */}
                  <div className="relative mb-6">
                    <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto">
                      <XMarkIcon className="w-10 h-10 text-red-500" />
                    </div>
                  </div>

                  <Dialog.Title as="h3" className="text-xl font-bold text-white mb-2">
                    Call Failed
                  </Dialog.Title>
                  <p className="text-red-300 mb-6">{displayError}</p>

                  <div className="flex items-center justify-center gap-4">
                    <button
                      onClick={handleClose}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 rounded-full text-white font-medium transition-colors"
                    >
                      <XMarkIcon className="w-5 h-5" />
                      Close
                    </button>
                    <button
                      onClick={handleRetry}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 rounded-full text-white font-medium transition-colors"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                      Try Again
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    );
  }

  // Should not reach here, but show fallback
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => {}}>
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-8 text-center align-middle shadow-xl transition-all">
              <p className="text-gray-400 mb-4">Preparing call...</p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded-md text-white font-medium transition-colors"
              >
                Cancel
              </button>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
