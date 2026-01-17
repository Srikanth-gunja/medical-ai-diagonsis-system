import type { Metadata } from 'next';
import PublicHeader from '@/components/common/PublicHeader';
import DoctorRegistrationForm from './components/DoctorRegistrationForm';
import VerificationBadges from './components/VerificationBadges';

export const metadata: Metadata = {
    title: 'Doctor Registration - MediCare',
    description: 'Join MediCare as a verified medical professional. Register with your credentials to connect with patients through our secure telemedicine platform.',
};

export default function DoctorRegistrationPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10">
            <PublicHeader />

            <main className="container mx-auto px-4 sm:px-6 py-8 lg:py-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <DoctorRegistrationForm />
                    </div>

                    <div className="lg:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            <VerificationBadges />

                            <div className="bg-card rounded-xl p-6 border border-border shadow-elevation-1">
                                <h3 className="text-lg font-semibold text-text-primary mb-4">
                                    Registration Process
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-semibold text-primary">1</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">Submit Application</p>
                                            <p className="text-xs text-text-secondary mt-1">
                                                Complete the registration form with your credentials
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-semibold text-primary">2</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">Verification Review</p>
                                            <p className="text-xs text-text-secondary mt-1">
                                                Our team verifies your medical license and credentials
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start space-x-3">
                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-semibold text-primary">3</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-text-primary">Account Activation</p>
                                            <p className="text-xs text-text-secondary mt-1">
                                                Receive approval and start accepting patients
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-accent/10 to-primary/10 rounded-xl p-6 border border-border">
                                <h3 className="text-lg font-semibold text-text-primary mb-3">
                                    Need Help?
                                </h3>
                                <p className="text-sm text-text-secondary mb-4">
                                    Our support team is available to assist you with the registration process.
                                </p>
                                <a
                                    href="mailto:support@medicare.com"
                                    className="inline-flex items-center space-x-2 text-sm font-medium text-primary hover:underline"
                                >
                                    <span>Contact Support</span>
                                    <span>→</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="bg-card border-t border-border mt-16">
                <div className="container mx-auto px-4 sm:px-6 py-8">
                    <div className="text-center">
                        <p className="text-sm text-text-secondary">
                            © {new Date().getFullYear()} MediCare. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
}