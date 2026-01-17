import type { Metadata } from 'next';
import PublicHeader from '@/components/common/PublicHeader';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import TrustSignalsSection from './components/TrustSignalsSection';
import StatsSection from './components/StatsSection';
import CTASection from './components/CTASection';
import FooterSection from './components/FooterSection';

export const metadata: Metadata = {
    title: 'MediCare - Modern Healthcare Made Simple',
    description: 'Connect with licensed doctors instantly through our secure telemedicine platform. Get AI-powered symptom assessment, video consultations, and comprehensive medical record management in one secure solution.',
};

export default function Homepage() {
    return (
        <div className="min-h-screen bg-background">
            <PublicHeader />

            <main>
                <HeroSection />
                <FeaturesSection />
                <TrustSignalsSection />
                <StatsSection />
                <CTASection />
            </main>

            <FooterSection />
        </div>
    );
}