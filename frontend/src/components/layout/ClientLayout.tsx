'use client';

import { SessionTimeoutWarning, useSessionTimeout } from '@/components/ui/SessionTimeoutWarning';
import IncomingCallModal from '@/components/video/IncomingCallModal';
import { useVideoCall } from '@/contexts/VideoCallContext';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { expiryTime } = useSessionTimeout();
  const { incomingCall } = useVideoCall();

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  const handleExtendSession = () => {
    router.refresh();
  };

  return (
    <>
      {children}
      <SessionTimeoutWarning
        tokenExpiryTime={expiryTime}
        warningDuration={5}
        onLogout={handleLogout}
        onExtend={handleExtendSession}
      />
      <IncomingCallModal isOpen={!!incomingCall} onClose={() => { }} />
    </>
  );
}
