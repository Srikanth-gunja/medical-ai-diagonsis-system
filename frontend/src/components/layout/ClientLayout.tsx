'use client';

import { SessionTimeoutWarning, useSessionTimeout } from '@/components/ui/SessionTimeoutWarning';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { expiryTime } = useSessionTimeout();

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
    </>
  );
}
