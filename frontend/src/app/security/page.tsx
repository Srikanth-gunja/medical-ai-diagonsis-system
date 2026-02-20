'use client';

import PublicHeader from '@/components/common/PublicHeader';
import FooterSection from '@/components/common/FooterSection';
import Icon from '@/components/ui/AppIcon';

export default function Security() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />
      <main className="container mx-auto px-4 sm:px-6 py-12 lg:py-16 max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary mb-8">
          Security at MediCare
        </h1>

        <p className="text-lg text-text-secondary mb-12">
          Your security constitutes our highest priority. We employ state-of-the-art technology and
          rigorous protocols to ensure your data remains safe, private, and accessible only to you.
        </p>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
              <Icon name="LockClosedIcon" size={24} className="text-primary" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">End-to-End Encryption</h3>
            <p className="text-text-secondary">
              All data transmitted between your device and our servers is encrypted using
              industry-standard TLS 1.3 protocol. Your medical records are encrypted at rest using
              AES-256 encryption.
            </p>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mb-4">
              <Icon name="ShieldCheckIcon" size={24} className="text-accent" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">HIPAA Compliance</h3>
            <p className="text-text-secondary">
              Our infrastructure and operations are fully compliant with HIPAA regulations, ensuring
              strict adherence to standards for protecting sensitive patient health information.
            </p>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center mb-4">
              <Icon name="ServerIcon" size={24} className="text-success" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Secure Infrastructure</h3>
            <p className="text-text-secondary">
              We host our platform on secure, SOC 2 Type II certified data centers with 24/7
              monitoring, automated backups, and disaster recovery capabilities.
            </p>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center mb-4">
              <Icon name="KeyIcon" size={24} className="text-warning" />
            </div>
            <h3 className="text-xl font-semibold text-text-primary mb-2">Access Control</h3>
            <p className="text-text-secondary">
              Strict role-based access controls ensure that only authorized medical personnel
              involved in your care can access your health records.
            </p>
          </div>
        </div>

        <div className="prose prose-lg dark:prose-invert max-w-none space-y-8 text-text-secondary">
          <section>
            <h2 className="text-xl font-semibold text-text-primary mb-4">
              Reporting Vulnerabilities
            </h2>
            <p>
              We encourage security researchers to report potential vulnerabilities to our security
              team. If you believe you have found a security bug, please email us specifically at{' '}
              <a href="mailto:security@medicare.com" className="text-primary hover:underline">
                security@medicare.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <FooterSection />
    </div>
  );
}
