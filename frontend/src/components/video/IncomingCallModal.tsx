'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { useVideoCall } from '../../contexts/VideoCallContext';
import { PhoneIcon, XMarkIcon, VideoCameraIcon, ClockIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface IncomingCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IncomingCallModal({ isOpen, onClose }: IncomingCallModalProps) {
  const {
    incomingCall,
    acceptIncomingCall,
    rejectIncomingCall,
    isConnecting,
    initElapsedTime,
    callError,
    clearCallError,
  } = useVideoCall();
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [ringingTime, setRingingTime] = useState(0);

  // Track ringing duration
  useEffect(() => {
    if (incomingCall && !isConnecting && !isAccepting) {
      const timer = setInterval(() => {
        setRingingTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [incomingCall, isConnecting, isAccepting]);

  // Reset ringing time when incoming call changes
  useEffect(() => {
    if (!incomingCall) {
      setRingingTime(0);
    }
  }, [incomingCall]);

  // Format elapsed time as mm:ss
  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = useCallback(async () => {
    if (isAccepting || isConnecting) return;

    setIsAccepting(true);
    setAcceptError(null);
    clearCallError();

    try {
      await acceptIncomingCall();
      onClose();
    } catch (error) {
      console.error('Failed to accept call:', error);
      setAcceptError(error instanceof Error ? error.message : 'Failed to join call. Please try again.');
    } finally {
      setIsAccepting(false);
    }
  }, [acceptIncomingCall, onClose, isAccepting, isConnecting, clearCallError]);

  const handleRetryAccept = useCallback(async () => {
    setAcceptError(null);
    clearCallError();
    await handleAccept();
  }, [handleAccept, clearCallError]);

  const handleReject = useCallback(async () => {
    try {
      await rejectIncomingCall();
      onClose();
    } catch (error) {
      console.error('Failed to reject call:', error);
      // Force close even if reject fails
      onClose();
    }
  }, [rejectIncomingCall, onClose]);

  if (!incomingCall) return null;

  // Show connecting state after accepting
  if (isConnecting || isAccepting) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={() => {}}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
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
                      <div className="w-32 h-32 rounded-full bg-green-500/20 animate-ping" />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-28 h-28 rounded-full bg-green-500/30 animate-pulse" />
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                        <div className="h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
                      </div>
                    </div>
                  </div>

                  <Dialog.Title as="h3" className="text-2xl font-bold text-white mb-2">
                    Connecting...
                  </Dialog.Title>
                  <p className="text-lg text-gray-300 mb-1">
                    Joining call with{' '}
                    <span className="font-semibold text-white">{incomingCall.callerName}</span>
                  </p>
                  <div className="flex items-center justify-center gap-1 text-sm text-gray-400 mb-6">
                    <ClockIcon className="w-4 h-4" />
                    <span>{formatElapsedTime(initElapsedTime)}</span>
                  </div>

                  {(acceptError || callError) && (
                    <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {acceptError || callError}
                      <button
                        onClick={handleRetryAccept}
                        className="ml-2 text-red-400 underline hover:text-red-300 inline-flex items-center gap-1"
                      >
                        <ArrowPathIcon className="w-3 h-3" />
                        Try Again
                      </button>
                    </div>
                  )}

                  {/* Cancel button */}
                  <button
                    onClick={handleReject}
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

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={() => {}}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" />
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
                {/* Pulsing ring animation */}
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

                {/* Call info */}
                <Dialog.Title as="h3" className="text-2xl font-bold text-white mb-2">
                  Incoming Video Call
                </Dialog.Title>
                <p className="text-lg text-gray-300 mb-1">
                  From: <span className="font-semibold text-white">{incomingCall.callerName}</span>
                </p>
                <p className="text-sm text-gray-400 mb-8">Appointment consultation</p>

                {acceptError && (
                  <div className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {acceptError}
                  </div>
                )}

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-6">
                  {/* Reject button */}
                  <button onClick={handleReject} className="flex flex-col items-center gap-2 group">
                    <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-all transform group-hover:scale-105">
                      <XMarkIcon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm text-red-400 font-medium">Decline</span>
                  </button>

                  {/* Accept button */}
                  <button
                    onClick={handleAccept}
                    disabled={isAccepting}
                    className="flex flex-col items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="w-20 h-20 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center shadow-lg transition-all transform group-hover:scale-105">
                      <PhoneIcon className="w-10 h-10 text-white" />
                    </div>
                    <span className="text-sm text-green-400 font-medium">Accept</span>
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
