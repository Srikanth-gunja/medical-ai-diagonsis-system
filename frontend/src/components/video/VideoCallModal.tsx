'use client';

import React from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import VideoCallRoom from './VideoCallRoom';
import { useVideoCall } from '../../contexts/VideoCallContext';
import { XMarkIcon, PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointmentId: string;
  otherUserName?: string;
}

export default function VideoCallModal({ isOpen, onClose, appointmentId, otherUserName = 'Doctor' }: VideoCallModalProps) {
  const { activeCall, isRinging, isInitializing, endCall, leaveCall, callError, clearCallError, cancelInitializingCall } =
    useVideoCall();

  const handleClose = async () => {
    if (isInitializing) {
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

  // Show loading state while initializing
  if (isInitializing) {
    return (
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => { }}>
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
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-8 text-center align-middle shadow-xl transition-all">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                  <p className="text-white text-lg">Initializing video call...</p>
                  <button
                    onClick={handleClose}
                    className="mt-6 px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-medium transition-colors"
                  >
                    Cancel
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
        <Dialog as="div" className="relative z-50" onClose={() => { }}>
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
                        <VideoCameraIcon className="w-12 h-12 text-white" />
                      </div>
                    </div>
                  </div>

                  <Dialog.Title as="h3" className="text-2xl font-bold text-white mb-2">
                    Calling {otherUserName}...
                  </Dialog.Title>
                  <p className="text-gray-400 mb-8">
                    Waiting for them to answer
                  </p>

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
        <Dialog as="div" className="relative z-50" onClose={() => { }}>
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

  // Should not reach here, but show error state just in case
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={() => { }}>
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm" />
        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-8 text-center align-middle shadow-xl transition-all">
              <p className="text-red-400 mb-4">
                {callError || 'Something went wrong with the call.'}
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-md text-white font-medium transition-colors"
              >
                Close
              </button>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
