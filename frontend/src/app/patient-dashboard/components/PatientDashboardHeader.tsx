'use client';

import { useRouter } from 'next/navigation';
import AuthenticatedHeader from '@/components/common/AuthenticatedHeader';
import { authApi } from '@/lib/api';

interface User {
  name: string;
  role: 'patient' | 'doctor';
  avatar?: string;
}

interface PatientDashboardHeaderProps {
  user: User;
  notificationCount?: number;
}

const PatientDashboardHeader = ({ user, notificationCount }: PatientDashboardHeaderProps) => {
  const router = useRouter();

  const handleLogout = () => {
    authApi.logout();
    router.push('/login');
  };

  return (
    <AuthenticatedHeader
      user={user}
      notificationCount={notificationCount}
      onLogout={handleLogout}
    />
  );
};

export default PatientDashboardHeader;
