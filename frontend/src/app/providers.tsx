'use client';

import { AuthProvider } from '../contexts/AuthContext';
import { VideoCallProvider } from '../contexts/VideoCallContext';
import { ToastProvider } from '@/components/ui/Toast';
import { ThemeProvider } from '@/contexts/ThemeContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <VideoCallProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </VideoCallProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
