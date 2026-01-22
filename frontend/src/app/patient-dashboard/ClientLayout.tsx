'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { patientsApi, authApi, appointmentsApi, notificationsApi, type Patient } from '@/lib/api';
import PatientDashboardHeader from './components/PatientDashboardHeader';
import StatusIndicatorBar from '@/components/common/StatusIndicatorBar';
import NavigationBreadcrumbs from '@/components/common/NavigationBreadcrumbs';

interface UserContextType {
  user: {
    name: string;
    firstName: string;
    lastName: string;
    email: string;
    role: 'patient';
    avatar: string;
    phone?: string;
    address?: string;
  } | null;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  isLoading: true,
  refreshUser: async () => { },
});

export const useUser = () => useContext(UserContext);

interface PatientDashboardClientLayoutProps {
  children: ReactNode;
}

export default function PatientDashboardClientLayout({
  children,
}: PatientDashboardClientLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<UserContextType['user']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notificationCount, setNotificationCount] = useState(0);
  const [appointmentStatus, setAppointmentStatus] = useState<{
    type: 'upcoming' | 'ongoing' | 'completed';
    message: string;
    time: string;
  } | null>(null);

  const fetchUser = async () => {
    try {
      const token = authApi.getToken();
      if (!token) {
        router.push('/login');
        return;
      }

      const profile = await patientsApi.getProfile();
      setUser({
        name: `${profile.firstName} ${profile.lastName}`,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        role: 'patient',
        avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
        phone: profile.phone,
        address: profile.address,
      });

      // Fetch next appointment for status bar
      try {
        const appointments = await appointmentsApi.getAll();
        const now = new Date();

        // Parse appointment date and time properly
        const parseAppointmentDateTime = (dateStr: string, timeStr: string): Date => {
          const date = new Date(dateStr);
          // Parse time like "10:00 AM" or "02:30 PM"
          const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
          if (timeMatch) {
            let hours = parseInt(timeMatch[1], 10);
            const minutes = parseInt(timeMatch[2], 10);
            const period = timeMatch[3].toUpperCase();

            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;

            date.setHours(hours, minutes, 0, 0);
          }
          return date;
        };

        // Filter to only future appointments
        const futureAppointments = appointments
          .filter((a: any) => a.status !== 'cancelled' && a.status !== 'completed' && a.status !== 'rejected')
          .filter((a: any) => {
            const appointmentDateTime = parseAppointmentDateTime(a.date, a.time);
            return appointmentDateTime.getTime() > now.getTime();
          })
          .sort((a: any, b: any) => {
            const dateA = parseAppointmentDateTime(a.date, a.time);
            const dateB = parseAppointmentDateTime(b.date, b.time);
            return dateA.getTime() - dateB.getTime();
          });

        const upcoming = futureAppointments[0];

        if (upcoming) {
          const appointmentDateTime = parseAppointmentDateTime(upcoming.date, upcoming.time);
          const diffMs = appointmentDateTime.getTime() - now.getTime();
          const diffHours = Math.round(diffMs / (1000 * 60 * 60));
          const diffMinutes = Math.round(diffMs / (1000 * 60));

          let timeMessage = '';
          if (diffMinutes < 60) {
            timeMessage = `Your next appointment is in ${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
          } else if (diffHours <= 24) {
            timeMessage = `Your next appointment is in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
          } else {
            const diffDays = Math.round(diffHours / 24);
            timeMessage = `Your next appointment is in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
          }

          setAppointmentStatus({
            type: 'upcoming',
            message: timeMessage,
            time: `${appointmentDateTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${upcoming.time} with ${upcoming.doctorName}`,
          });
        } else {
          // No upcoming appointments
          setAppointmentStatus(null);
        }
      } catch (err) {
        console.error('Failed to fetch appointment status:', err);
      }

      // Fetch notification count
      try {
        const { count } = await notificationsApi.getUnreadCount();
        setNotificationCount(count);
      } catch (err) {
        console.error('Failed to fetch notification count:', err);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      // Token might be invalid
      authApi.logout();
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-text-secondary">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  const isMainDashboard = pathname === '/patient-dashboard';

  return (
    <UserContext.Provider value={{ user, isLoading, refreshUser: fetchUser }}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <PatientDashboardHeader
          user={{
            name: user?.name || 'Patient',
            role: 'patient',
            avatar:
              user?.avatar || 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
          }}
          notificationCount={notificationCount}
        />

        {appointmentStatus && (
          <StatusIndicatorBar appointmentStatus={appointmentStatus} chatAvailable={true} />
        )}

        {isMainDashboard && (
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <NavigationBreadcrumbs />
          </div>
        )}

        <main>{children}</main>

        <footer className="bg-card border-t border-border mt-16">
          <div className="container mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
              <div className="flex items-center space-x-4 text-sm text-text-secondary">
                <span>&copy; {new Date().getFullYear()} MediCare. All rights reserved.</span>
                <span className="hidden sm:inline">|</span>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full" />
                  <span>Secure Platform</span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <a
                  href="#privacy"
                  className="text-text-secondary hover:text-primary transition-base"
                >
                  Privacy Policy
                </a>
                <a href="#terms" className="text-text-secondary hover:text-primary transition-base">
                  Terms of Service
                </a>
                <a
                  href="#support"
                  className="text-text-secondary hover:text-primary transition-base"
                >
                  Support
                </a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </UserContext.Provider>
  );
}
