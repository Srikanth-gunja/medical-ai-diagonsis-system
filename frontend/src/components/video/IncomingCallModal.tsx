'use client';

import React, { Fragment, useEffect, useRef } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useVideoCall } from '../../contexts/VideoCallContext';
import { PhoneIcon, XMarkIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface IncomingCallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function IncomingCallModal({ isOpen, onClose }: IncomingCallModalProps) {
  const { incomingCall, acceptIncomingCall, rejectIncomingCall } = useVideoCall();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Play ringing sound
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      // Create audio element for ringing sound
      audioRef.current = new Audio('/sounds/incoming-call.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.5;
      
      // Try to play (may be blocked by browser autoplay policy)
      audioRef.current.play().catch((e) => {
        console.log('Audio play blocked:', e);
      });

      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current = null;
        }
      };
    }
  }, [isOpen]);

  const handleAccept = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    try {
      await acceptIncomingCall();
      onClose();
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleReject = async () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    try {
      await rejectIncomingCall();
      onClose();
    } catch (error) {
      console.error('Failed to reject call:', error);
    }
  };

  if (!incomingCall) return null;

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
                <p className="text-sm text-gray-400 mb-8">
                  Appointment consultation
                </p>

                {/* Action buttons */}
                <div className="flex items-center justify-center gap-6">
                  {/* Reject button */}
                  <button
                    onClick={handleReject}
                    className="flex flex-col items-center gap-2 group"
                  >
                    <div className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center shadow-lg transition-all transform group-hover:scale-105">
                      <XMarkIcon className="w-8 h-8 text-white" />
                    </div>
                    <span className="text-sm text-red-400 font-medium">Decline</span>
                  </button>

                  {/* Accept button */}
                  <button
                    onClick={handleAccept}
                    className="flex flex-col items-center gap-2 group"
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
