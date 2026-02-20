'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PublicHeader from '@/components/common/PublicHeader';
import LoginForm from './components/LoginForm';
import SecurityBadges from './components/SecurityBadges';
import TrustIndicators from './components/TrustIndicators';
import ContactModal from '@/components/common/ContactModal';
import { useToast } from '@/components/ui/Toast';

export default function LoginPage() {
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState<'checking' | 'operational' | 'issues'>(
    'checking'
  );
  const { showToast } = useToast();

  useEffect(() => {
    const checkSystemStatus = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5000/api';
        // Remove /api suffix if present to avoid double /api/api
        const baseUrl = apiUrl.replace(/\/api$/, '');
        const res = await fetch(`${baseUrl}/api/health`);
        if (res.ok) {
          setSystemStatus('operational');
        } else {
          setSystemStatus('issues');
        }
      } catch (error) {
        setSystemStatus('issues');
      }
    };

    checkSystemStatus();
    // Poll every 30 seconds
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleHelpCenterClick = () => {
    showToast({
      type: 'info',
      title: 'Help Center',
      message: 'Self-help resources are coming soon! For now, please contact support.',
    });
  };

  const getStatusColor = () => {
    switch (systemStatus) {
      case 'operational':
        return 'text-green-500';
      case 'issues':
        return 'text-red-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[72rem] h-[72rem] bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[96rem] h-[96rem] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <PublicHeader />

      <main className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl sm:text-3xl font-heading font-semibold text-text-primary mb-3">
              Secure Access to Your Healthcare
            </h2>
            <p className="text-text-secondary">
              Your health data is protected with enterprise-grade security
            </p>
          </div>

          <LoginForm />

          <div className="space-y-12 pt-8">
            <SecurityBadges />
            <TrustIndicators />
          </div>

          <div className="text-center pt-8 pb-4">
            <p className="text-sm text-text-secondary">
              By signing in, you agree to our{' '}
              <Link
                href="/terms-of-service"
                className="text-primary hover:text-accent transition-base font-medium"
              >
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link
                href="/privacy-policy"
                className="text-primary hover:text-accent transition-base font-medium"
              >
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-border bg-card/60 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <p className="text-sm text-text-secondary">
              &copy; {new Date().getFullYear()} MediCare. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 text-sm text-text-secondary">
              <button
                onClick={handleHelpCenterClick}
                className="hover:text-primary transition-base"
              >
                Help Center
              </button>
              <button
                onClick={() => setIsContactModalOpen(true)}
                className="hover:text-primary transition-base"
              >
                Contact Support
              </button>
              <div className="flex items-center space-x-2">
                <span
                  className={`w-2 h-2 rounded-full ${systemStatus === 'operational' ? 'bg-green-500' : systemStatus === 'issues' ? 'bg-red-500' : 'bg-yellow-500'} animate-pulse`}
                />
                <span className={getStatusColor()}>
                  {systemStatus === 'checking'
                    ? 'Checking Status...'
                    : systemStatus === 'operational'
                      ? 'System Operational'
                      : 'System Issues'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </footer>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
}
