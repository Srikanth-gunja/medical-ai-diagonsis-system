'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function DoctorDashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    const token = authApi.getToken();
    const user = authApi.getUser();

    if (!token || !user || user.role !== 'doctor') {
      authApi.logout();
      const next = encodeURIComponent(pathname || '/doctor-dashboard');
      router.replace(`/login?next=${next}`);
      return;
    }

    setIsCheckingAuth(false);
  }, [pathname, router]);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
