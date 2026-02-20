'use client';

import { useEffect, useState, useCallback } from 'react';
import Icon from '@/components/ui/AppIcon';

interface SessionTimeoutWarningProps {
  tokenExpiryTime?: number; // Timestamp when token expires
  warningDuration?: number; // Show warning X minutes before expiry (default: 5)
  onLogout?: () => void;
  onExtend?: () => void;
}

export function SessionTimeoutWarning({
  tokenExpiryTime,
  warningDuration = 5, // 5 minutes before expiry
  onLogout,
  onExtend,
}: SessionTimeoutWarningProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [isVisible, setIsVisible] = useState(false);
  const [isWarningDismissed, setIsWarningDismissed] = useState(false);

  const calculateTimeLeft = useCallback(() => {
    if (!tokenExpiryTime) return 0;
    const now = Date.now();
    const timeLeftMs = tokenExpiryTime - now;
    return Math.max(0, Math.floor(timeLeftMs / 1000)); // Convert to seconds
  }, [tokenExpiryTime]);

  useEffect(() => {
    if (!tokenExpiryTime || isWarningDismissed) return;

    const checkInterval = setInterval(() => {
      const remaining = calculateTimeLeft();
      const warningThresholdSeconds = warningDuration * 60;

      setTimeLeft(remaining);

      // Show warning when within warning duration
      if (remaining <= warningThresholdSeconds && remaining > 0) {
        setIsVisible(true);
      } else if (remaining <= 0) {
        // Session expired
        setIsVisible(false);
        onLogout?.();
      }
    }, 1000);

    return () => clearInterval(checkInterval);
  }, [tokenExpiryTime, warningDuration, calculateTimeLeft, isWarningDismissed, onLogout]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtend = () => {
    setIsWarningDismissed(true);
    setIsVisible(false);
    onExtend?.();
    // Reset dismissal after 30 seconds so warning can show again if needed
    setTimeout(() => setIsWarningDismissed(false), 30000);
  };

  const handleLogout = () => {
    setIsVisible(false);
    onLogout?.();
  };

  if (!isVisible) return null;

  const isCritical = timeLeft <= 60; // Last minute is critical

  return (
    <div className="fixed bottom-4 right-4 z-[90] animate-slide-up">
      <div
        className={`
        p-4 rounded-xl shadow-elevation-3 border max-w-sm w-full
        ${isCritical ? 'bg-error/10 border-error/20' : 'bg-warning/10 border-warning/20'}
      `}
      >
        <div className="flex items-start gap-3">
          <div
            className={`
            w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
            ${isCritical ? 'bg-error/20' : 'bg-warning/20'}
          `}
          >
            <Icon
              name="ClockIcon"
              className={`w-5 h-5 ${isCritical ? 'text-error' : 'text-warning'}`}
            />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm ${isCritical ? 'text-error' : 'text-warning'}`}>
              Session Expiring Soon
            </h4>
            <p className="text-text-secondary text-sm mt-1">
              Your session will expire in{' '}
              <span className={`font-mono font-bold ${isCritical ? 'text-error' : 'text-warning'}`}>
                {formatTime(timeLeft)}
              </span>
            </p>

            <div className="flex gap-2 mt-3">
              <button
                onClick={handleExtend}
                className={`
                  flex-1 px-3 py-2 rounded-lg text-sm font-medium text-white
                  transition-colors
                  ${isCritical ? 'bg-error hover:bg-error/90' : 'bg-warning hover:bg-warning/90'}
                `}
              >
                Extend Session
              </button>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-muted transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook to track session time based on JWT token
export function useSessionTimeout() {
  const [expiryTime, setExpiryTime] = useState<number | undefined>();

  useEffect(() => {
    // Parse JWT token to get expiry time
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));

        if (payload.exp) {
          // JWT exp is in seconds, convert to milliseconds
          setExpiryTime(payload.exp * 1000);
        }
      } catch {
        // Invalid token format
      }
    }
  }, []);

  return { expiryTime };
}

export default SessionTimeoutWarning;
