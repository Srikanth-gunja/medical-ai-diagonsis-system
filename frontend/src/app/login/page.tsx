import type { Metadata } from 'next';
import PublicHeader from '@/components/common/PublicHeader';
import LoginForm from './components/LoginForm';
import SecurityBadges from './components/SecurityBadges';
import TrustIndicators from './components/TrustIndicators';

export const metadata: Metadata = {
    title: 'Login - MediCare',
    description: 'Sign in to your MediCare account to access personalized healthcare services, manage appointments, and connect with verified medical professionals.',
};

export default function LoginPage() {
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
                            <button className="text-primary hover:text-accent transition-base font-medium">
                                Terms of Service
                            </button>
                            {' '}and{' '}
                            <button className="text-primary hover:text-accent transition-base font-medium">
                                Privacy Policy
                            </button>
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
                            <button className="hover:text-primary transition-base">Help Center</button>
                            <button className="hover:text-primary transition-base">Contact Support</button>
                            <button className="hover:text-primary transition-base">System Status</button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}