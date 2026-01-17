'use client';

import { useRouter } from 'next/navigation';
import NavigationBreadcrumbs from '@/components/common/NavigationBreadcrumbs';
import Icon from '@/components/ui/AppIcon';

export default function LabReportsPage() {
    const router = useRouter();

    const upcomingFeatures = [
        {
            icon: 'ChartBarIcon',
            title: 'View Test Results',
            description: 'Access all your lab reports in one place with visual trend analysis'
        },
        {
            icon: 'ArrowTrendingUpIcon',
            title: 'Track Health Trends',
            description: 'Monitor changes in your health metrics over time with interactive charts'
        },
        {
            icon: 'DocumentArrowDownIcon',
            title: 'Download Reports',
            description: 'Download and share your lab reports with healthcare providers'
        },
        {
            icon: 'BellAlertIcon',
            title: 'Result Notifications',
            description: 'Get notified instantly when new lab results are available'
        }
    ];

    return (
        <div className="container mx-auto px-4 sm:px-6 py-8">
            <NavigationBreadcrumbs />

            <div className="max-w-4xl mx-auto">
                {/* Coming Soon Banner */}
                <div className="bg-gradient-to-br from-success/10 via-accent/5 to-primary/10 rounded-3xl p-8 sm:p-12 text-center mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-success/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/10 rounded-full blur-2xl" />

                    <div className="relative">
                        <div className="w-20 h-20 bg-success/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Icon name="BeakerIcon" size={48} className="text-success" />
                        </div>

                        <div className="inline-flex items-center space-x-2 px-4 py-2 bg-success/10 rounded-full mb-6">
                            <Icon name="SparklesIcon" size={16} className="text-success" />
                            <span className="text-sm font-medium text-success">Coming Soon</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-4">
                            Lab Reports
                        </h1>
                        <p className="text-text-secondary max-w-xl mx-auto text-lg">
                            We're building a comprehensive lab reports feature to help you access and understand your test results better.
                        </p>
                    </div>
                </div>

                {/* Upcoming Features */}
                <h2 className="text-xl font-semibold text-text-primary mb-6 flex items-center space-x-2">
                    <Icon name="RocketLaunchIcon" size={24} className="text-primary" />
                    <span>What's Coming</span>
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
                    {upcomingFeatures.map((feature, index) => (
                        <div key={index} className="bg-card border border-border rounded-xl p-6 hover:shadow-elevation-2 transition-base">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                                <Icon name={feature.icon} size={24} className="text-primary" />
                            </div>
                            <h3 className="font-semibold text-text-primary mb-2">{feature.title}</h3>
                            <p className="text-sm text-text-secondary">{feature.description}</p>
                        </div>
                    ))}
                </div>

                {/* Notify Me */}
                <div className="bg-card border border-border rounded-2xl p-8 text-center">
                    <h3 className="text-lg font-semibold text-text-primary mb-2">
                        Get Notified When It's Ready
                    </h3>
                    <p className="text-text-secondary mb-6">
                        We'll let you know as soon as the Lab Reports feature is available.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button className="w-full sm:w-auto px-8 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 transition-base flex items-center justify-center space-x-2">
                            <Icon name="BellIcon" size={20} />
                            <span>Notify Me</span>
                        </button>
                        <button
                            onClick={() => router.push('/patient-dashboard')}
                            className="w-full sm:w-auto px-8 py-3 border border-border text-text-secondary hover:text-primary rounded-lg transition-base"
                        >
                            Back to Dashboard
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
