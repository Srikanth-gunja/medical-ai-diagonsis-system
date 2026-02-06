'use client';

import PublicHeader from '@/components/common/PublicHeader';
import FooterSection from '@/components/common/FooterSection';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />
            <main className="container mx-auto px-4 sm:px-6 py-12 lg:py-16 max-w-4xl">
                <h1 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary mb-8">Terms of Service</h1>

                <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-text-secondary">
                    <section>
                        <h2 className="text-xl font-semibold text-text-primary mb-4">1. Acceptance of Terms</h2>
                        <p>
                            By accessing and using the MediCare platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you may not use our services.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-text-primary mb-4">2. Use of Services</h2>
                        <p className="mb-4">You agree to use our telemedicine services only for lawful purposes and in accordance with these Terms.</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>You must be at least 18 years old to use our services independently.</li>
                            <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                            <li>You agree to provide accurate and complete information during registration and consultations.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-text-primary mb-4">3. Medical Disclaimer</h2>
                        <p>
                            MediCare does not replace your primary care physician. In case of a medical emergency, dial 911 immediately. Our AI diagnostic tools are for informational purposes only and do not constitute a definitive medical diagnosis.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-text-primary mb-4">4. Intellectual Property</h2>
                        <p>
                            The content, features, and functionality of the MediCare platform are owned by MediCare and are protected by international copyright, trademark, and other intellectual property laws.
                        </p>
                    </section>

                    <section>
                        <h2 className="text-xl font-semibold text-text-primary mb-4">5. Termination</h2>
                        <p>
                            We reserve the right to terminate or suspend your account and access to the services immediately, without prior notice or liability, for any reason, including without limitation if you breach the Terms.
                        </p>
                    </section>

                    <p className="text-sm text-text-secondary pt-8">
                        Last Updated: February 6, 2026
                    </p>
                </div>
            </main>
            <FooterSection />
        </div>
    );
}
