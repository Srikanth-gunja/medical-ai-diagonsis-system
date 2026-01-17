'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Icon from '@/components/ui/AppIcon';

const HeroSection = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [isHovering, setIsHovering] = useState(false);
    const logoContainerRef = useRef<HTMLDivElement>(null);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!logoContainerRef.current) return;

        const rect = logoContainerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate position relative to center (-1 to 1)
        const x = (e.clientX - centerX) / (rect.width / 2);
        const y = (e.clientY - centerY) / (rect.height / 2);

        setMousePosition({ x, y });
    };

    const handleMouseEnter = () => setIsHovering(true);
    const handleMouseLeave = () => {
        setIsHovering(false);
        setMousePosition({ x: 0, y: 0 });
    };

    // Calculate transform based on mouse position
    const rotateX = isHovering ? mousePosition.y * -15 : 0;
    const rotateY = isHovering ? mousePosition.x * 15 : 0;
    const translateZ = isHovering ? 20 : 0;

    return (
        <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-accent/10 py-16 lg:py-24">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/10 rounded-full blur-3xl" />
            </div>

            <div className="container mx-auto px-4 sm:px-6 relative z-10">
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                    {/* Left Content */}
                    <div className="space-y-8">
                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary/10 rounded-full">
                            <Icon name="LockClosedIcon" size={16} className="text-primary" />
                            <span className="text-sm font-medium text-primary">Secure & Encrypted</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-bold text-text-primary leading-tight">
                            Healthcare{' '}
                            <span className="text-primary">Made Simple</span>
                        </h1>

                        <p className="text-lg text-text-secondary max-w-lg leading-relaxed">
                            Connect with licensed doctors instantly. Get AI-powered symptom assessment,
                            secure consultations, and comprehensive medical record management—all in one platform.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            <Link
                                href="/patient-registration"
                                className="inline-flex items-center space-x-2 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:shadow-elevation-2 hover:scale-[1.02] transition-all duration-200"
                            >
                                <span>Get Started as Patient</span>
                                <Icon name="ArrowRightIcon" size={18} />
                            </Link>
                            <Link
                                href="/doctor-registration"
                                className="inline-flex items-center space-x-2 px-6 py-3 border-2 border-border text-text-primary rounded-xl font-semibold hover:bg-muted hover:border-primary/30 transition-all duration-200"
                            >
                                <span>Join as Doctor</span>
                            </Link>
                        </div>

                        <div className="flex items-center space-x-6 pt-4">
                            <div className="flex items-center space-x-2 text-sm text-text-secondary">
                                <Icon name="CheckCircleIcon" size={16} className="text-success" />
                                <span>End-to-End Encryption</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-text-secondary">
                                <Icon name="CheckCircleIcon" size={16} className="text-success" />
                                <span>Verified Doctors</span>
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-text-secondary">
                                <Icon name="LockClosedIcon" size={16} className="text-success" />
                                <span>SSL Secured</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Visual - 3D Logo with Mouse Response */}
                    <div
                        ref={logoContainerRef}
                        className="relative flex items-center justify-center lg:pl-8 perspective-1000"
                        onMouseMove={handleMouseMove}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        style={{ perspective: '1000px' }}
                    >
                        <div
                            className="relative transition-transform duration-200 ease-out"
                            style={{
                                transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${translateZ}px)`,
                                transformStyle: 'preserve-3d'
                            }}
                        >
                            {/* Glow effect behind logo */}
                            <div
                                className="absolute inset-0 bg-gradient-to-br from-primary/30 to-accent/30 rounded-full blur-3xl scale-75 transition-all duration-300"
                                style={{
                                    transform: `translateX(${mousePosition.x * 20}px) translateY(${mousePosition.y * 20}px)`,
                                    opacity: isHovering ? 0.8 : 0.5
                                }}
                            />

                            {/* 3D Logo Image */}
                            <div
                                className="relative w-80 h-80 sm:w-96 sm:h-96 lg:w-[450px] lg:h-[450px] transition-transform duration-200"
                                style={{
                                    transform: `translateZ(30px)`,
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <Image
                                    src="/assets/images/medicare-3d-logo.png"
                                    alt="MediCare - Healthcare Made Simple"
                                    fill
                                    className="object-contain drop-shadow-2xl"
                                    priority
                                />
                            </div>

                            {/* Floating decorative elements with parallax */}
                            <div
                                className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-success/20 to-success/5 rounded-2xl backdrop-blur-sm border border-success/20 flex items-center justify-center transition-transform duration-300"
                                style={{
                                    transform: `translateX(${mousePosition.x * -30}px) translateY(${mousePosition.y * -30}px) translateZ(60px)`,
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <Icon name="HeartIcon" variant="solid" size={28} className="text-success" />
                            </div>

                            <div
                                className="absolute -bottom-4 -left-4 w-14 h-14 bg-gradient-to-br from-primary/20 to-primary/5 rounded-2xl backdrop-blur-sm border border-primary/20 flex items-center justify-center transition-transform duration-300"
                                style={{
                                    transform: `translateX(${mousePosition.x * -25}px) translateY(${mousePosition.y * -25}px) translateZ(50px)`,
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <Icon name="ShieldCheckIcon" variant="solid" size={24} className="text-primary" />
                            </div>

                            <div
                                className="absolute top-1/2 -right-8 w-12 h-12 bg-gradient-to-br from-accent/20 to-accent/5 rounded-xl backdrop-blur-sm border border-accent/20 flex items-center justify-center transition-transform duration-300"
                                style={{
                                    transform: `translateX(${mousePosition.x * -35}px) translateY(${mousePosition.y * -35}px) translateZ(70px)`,
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <Icon name="VideoCameraIcon" variant="solid" size={20} className="text-accent" />
                            </div>

                            {/* Additional floating element */}
                            <div
                                className="absolute bottom-1/4 -right-6 w-10 h-10 bg-gradient-to-br from-warning/20 to-warning/5 rounded-lg backdrop-blur-sm border border-warning/20 flex items-center justify-center transition-transform duration-300"
                                style={{
                                    transform: `translateX(${mousePosition.x * -20}px) translateY(${mousePosition.y * -20}px) translateZ(40px)`,
                                    transformStyle: 'preserve-3d'
                                }}
                            >
                                <Icon name="ChatBubbleLeftRightIcon" variant="solid" size={16} className="text-warning" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default HeroSection;
