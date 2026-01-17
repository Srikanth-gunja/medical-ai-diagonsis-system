'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';

const FooterSection = () => {
    const [isHydrated, setIsHydrated] = useState(false);
    const [currentYear, setCurrentYear] = useState('2026');

    useEffect(() => {
        setIsHydrated(true);
        setCurrentYear(new Date().getFullYear().toString());
    }, []);

    const footerLinks = {
        platform: [
            { label: 'For Patients', href: '/patient-registration' },
            { label: 'For Doctors', href: '/doctor-registration' },
            { label: 'Login', href: '/login' }
        ],
        company: [
            { label: 'About Us', href: '/homepage#about' },
            { label: 'Contact', href: '/homepage#contact' },
            { label: 'Careers', href: '/homepage#careers' }
        ],
        legal: [
            { label: 'Privacy Policy', href: '/homepage#privacy' },
            { label: 'Terms of Service', href: '/homepage#terms' },
            { label: 'Security', href: '/homepage#security' }
        ]
    };

    const socialLinks = [
        { icon: 'EnvelopeIcon', label: 'Email', href: 'mailto:support@medicare.com' },
        { icon: 'PhoneIcon', label: 'Phone', href: 'tel:+1-800-MEDICARE' }
    ];

    if (!isHydrated) {
        return (
            <footer className="bg-card border-t border-border">
                <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        <div className="space-y-4">
                            <div className="flex items-center space-x-2">
                                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent">
                                    <Icon name="HeartIcon" variant="solid" size={24} className="text-white" />
                                </div>
                                <span className="text-xl font-heading font-semibold text-primary">MediCare</span>
                            </div>
                            <p className="text-sm text-text-secondary">
                                Transforming healthcare delivery through secure, accessible, and comprehensive telemedicine services.
                            </p>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-text-primary mb-4">Platform</h3>
                            <ul className="space-y-3">
                                {footerLinks.platform.map((link, index) => (
                                    <li key={index}>
                                        <span className="text-sm text-text-secondary">{link.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-text-primary mb-4">Company</h3>
                            <ul className="space-y-3">
                                {footerLinks.company.map((link, index) => (
                                    <li key={index}>
                                        <span className="text-sm text-text-secondary">{link.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-text-primary mb-4">Legal</h3>
                            <ul className="space-y-3">
                                {footerLinks.legal.map((link, index) => (
                                    <li key={index}>
                                        <span className="text-sm text-text-secondary">{link.label}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
                        <p className="text-sm text-text-secondary">
                            © 2026 MediCare. All rights reserved.
                        </p>

                        <div className="flex items-center space-x-4">
                            {socialLinks.map((social, index) => (
                                <div
                                    key={index}
                                    className="p-2 text-text-secondary rounded-lg"
                                    aria-label={social.label}
                                >
                                    <Icon name={social.icon as any} size={20} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>
        );
    }

    return (
        <footer className="bg-card border-t border-border">
            <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16">
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    <div className="space-y-4">
                        <Link href="/homepage" className="flex items-center space-x-2 hover:opacity-80 transition-base">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-accent">
                                <Icon name="HeartIcon" variant="solid" size={24} className="text-white" />
                            </div>
                            <span className="text-xl font-heading font-semibold text-primary">MediCare</span>
                        </Link>
                        <p className="text-sm text-text-secondary">
                            Transforming healthcare delivery through secure, accessible, and comprehensive telemedicine services.
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
                            <a
                                key={index}
                                href={social.href}
                                className="p-2 text-text-secondary hover:text-primary hover:bg-muted rounded-lg transition-base"
                                aria-label={social.label}
                            >
                                <Icon name={social.icon as any} size={20} />
                            </a>
                        ))}
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default FooterSection;