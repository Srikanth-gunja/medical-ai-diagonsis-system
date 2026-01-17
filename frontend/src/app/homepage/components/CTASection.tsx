'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const CTASection = () => {
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        setIsHydrated(true);
    }, []);

    if (!isHydrated) {
        return (
            <section className="py-16 lg:py-24 bg-gradient-to-br from-muted/50 to-background">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="max-w-4xl mx-auto bg-card rounded-3xl shadow-elevation-4 overflow-hidden border border-border">
                        <div className="p-8 lg:p-12 text-center space-y-6">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent">
                                <Icon name="HeartIcon" variant="solid" size={40} className="text-white" />
                            </div>

                            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-text-primary">
                                Ready to Transform Your
                                <br />
                                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    Healthcare Experience?
                                </span>
                            </h2>

                            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                                Join thousands of patients and doctors who trust MediCare for secure, convenient, and comprehensive telemedicine services.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                                <div className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow-elevation-2 text-center">
                                    Start as Patient
                                </div>
                                <div className="px-8 py-4 bg-card text-primary font-semibold rounded-lg border-2 border-primary text-center">
                                    Register as Doctor
                                </div>
                            </div>

                            <div className="flex items-center justify-center space-x-2 pt-4 text-sm text-text-secondary">
                                <Icon name="CheckCircleIcon" variant="solid" size={20} className="text-success" />
                                <span>No credit card required • Free to get started</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 lg:py-24 bg-gradient-to-br from-muted/50 to-background">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="max-w-4xl mx-auto bg-card rounded-3xl shadow-elevation-4 overflow-hidden border border-border animate-fade-in">
                    <div className="p-8 lg:p-12 text-center space-y-6">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-accent">
                            <Icon name="HeartIcon" variant="solid" size={40} className="text-white" />
                        </div>

                        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-text-primary">
                            Ready to Transform Your
                            <br />
                            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                Healthcare Experience?
                            </span>
                        </h2>

                        <p className="text-lg text-text-secondary max-w-2xl mx-auto">
                            Join thousands of patients and doctors who trust MediCare for secure, convenient, and comprehensive telemedicine services.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                            <Link
                                href="/patient-registration"
                                className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-lg shadow-elevation-2 hover:shadow-elevation-3 hover:-translate-y-0.5 active:scale-[0.98] transition-base text-center"
                            >
                                Start as Patient
                            </Link>
                            <Link
                                href="/doctor-registration"
                                className="px-8 py-4 bg-card text-primary font-semibold rounded-lg border-2 border-primary hover:bg-primary/5 transition-base text-center"
                            >
                                Register as Doctor
                            </Link>
                        </div>

                        <div className="flex items-center justify-center space-x-2 pt-4 text-sm text-text-secondary">
                            <Icon name="CheckCircleIcon" variant="solid" size={20} className="text-success" />
                            <span>No credit card required • Free to get started</span>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTASection;