'use client';

import PublicHeader from '@/components/common/PublicHeader';
import FooterSection from '@/components/common/FooterSection';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 sm:px-6 py-12 lg:py-16 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary mb-8">Privacy Policy</h1>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">1. Introduction</h2>
            <p>
              At MediCare, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you access our telemedicine platform and services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">2. Information We Collect</h2>
            <p className="mb-4">We collect information that you provide directly to us, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Personal identification information (Name, email address, phone number, date of birth)</li>
              <li>Medical history and health information provided during consultations</li>
              <li>Payment information for transaction processing</li>
              <li>Device and usage information regarding your interaction with our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">3. How We Use Your Information</h2>
            <p>We utilize the collected data to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Facilitate medical consultations and diagnosis</li>
              <li>Process payments and manage your account</li>
              <li>Send appointment reminders and service updates</li>
              <li>Improve platform performance and user experience</li>
              <li>Comply with legal and regulatory obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">4. Data Security</h2>
            <p>
              We implement industry-standard security measures, including encryption and secure server infrastructure, to protect your personal and medical information. However, no method of transmission over the internet requires 100% security.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">5. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy, please contact us at <a href="mailto:privacy@medicare.com" className="text-primary hover:underline">privacy@medicare.com</a>.
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
