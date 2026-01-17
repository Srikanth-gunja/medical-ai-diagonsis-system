'use client';

import AuthenticatedHeader from '@/components/common/AuthenticatedHeader';

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
    const handleLogout = () => {
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
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