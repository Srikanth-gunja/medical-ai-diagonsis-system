'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import ContactModal from './ContactModal';
import { useToast } from '@/components/ui/Toast';

const FooterSection = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentYear, setCurrentYear] = useState('2026');
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    setIsHydrated(true);
    setCurrentYear(new Date().getFullYear().toString());
  }, []);

  const handleCareersClick = (e: React.MouseEvent) => {
    e.preventDefault();
    showToast({
      type: 'info',
      title: 'Coming Soon',
      message: 'Our careers portal is currently under development. Please check back later!',
    });
  };

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsContactModalOpen(true);
  };

  const footerLinks = {
    platform: [
      { label: 'For Patients', href: '/patient-registration' },
      { label: 'For Doctors', href: '/doctor-registration' },
      { label: 'Login', href: '/login' },
    ],
    company: [
      { label: 'About Us', href: '/homepage#about' },
      { label: 'Contact', href: '#', onClick: handleContactClick },
      { label: 'Careers', href: '#', onClick: handleCareersClick },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy-policy' },
      { label: 'Terms of Service', href: '/terms-of-service' },
      { label: 'Security', href: '/security' },
    ],
  };

  const socialLinks = [
    { icon: 'EnvelopeIcon', label: 'Email', href: '#' },
    { icon: 'PhoneIcon', label: 'Phone', href: '#' },
  ];

  if (!isHydrated) return null;

  return (
    <>
      <footer className="bg-card border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="space-y-4">
              <Link
                href="/homepage"
                className="flex items-center space-x-2 hover:opacity-80 transition-base"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent">
                  <Icon name="HeartIcon" variant="solid" size={24} className="text-white" />
                </div>
                <span className="text-xl font-heading font-semibold text-primary">MediCare</span>
              </Link>
              <p className="text-sm text-text-secondary">
                Transforming healthcare delivery through secure, accessible, and comprehensive
                telemedicine services.
              </p>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-4">Platform</h3>
              <ul className="space-y-3">
                {footerLinks.platform.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-primary transition-base"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-4">Company</h3>
              <ul className="space-y-3">
                {footerLinks.company.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      onClick={link.onClick}
                      className="text-sm text-text-secondary hover:text-primary transition-base"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-primary mb-4">Legal</h3>
              <ul className="space-y-3">
                {footerLinks.legal.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-sm text-text-secondary hover:text-primary transition-base"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-sm text-text-secondary">
              © {currentYear} MediCare. All rights reserved.
            </p>

            <div className="flex items-center space-x-4">
              {socialLinks.map((social, index) => (
                <button
                  key={index}
                  onClick={handleContactClick}
                  className="p-2 text-text-secondary hover:text-primary hover:bg-muted rounded-lg transition-base"
                  aria-label={social.label}
                >
                  <Icon name={social.icon as any} size={20} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </>
  );
};

export default FooterSection;
