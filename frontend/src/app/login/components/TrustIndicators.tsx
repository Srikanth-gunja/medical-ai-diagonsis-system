'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { analyticsApi } from '@/lib/api';

interface TrustStat {
    value: string;
    label: string;
    icon: string;
}

const TrustIndicators = () => {
    const [stats, setStats] = useState<TrustStat[]>([
        { value: '...', label: 'Active Patients', icon: 'UsersIcon' },
        { value: '...', label: 'Verified Doctors', icon: 'UserCircleIcon' },
        { value: '...', label: 'Satisfaction Rate', icon: 'CheckCircleIcon' },
        { value: '...', label: 'Average Rating', icon: 'StarIcon' }
    ]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await analyticsApi.getPublicStats();
                setStats([
                    {
                        value: data.activePatients > 0 ? `${data.activePatients}+` : '0',
                        label: 'Active Patients',
                        icon: 'UsersIcon'
                    },
                    {
                        value: data.licensedDoctors > 0 ? `${data.licensedDoctors}+` : '0',
                        label: 'Verified Doctors',
                        icon: 'UserCircleIcon'
                    },
                    {
                        value: `${data.satisfactionRate}%`,
                        label: 'Satisfaction Rate',
                        icon: 'CheckCircleIcon'
                    },
                    {
                        value: data.averageRating ? `${data.averageRating}/5` : 'N/A',
                        label: 'Average Rating',
                        icon: 'StarIcon'
                    }
                ]);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
                // Show placeholder on error
                setStats([
                    { value: '0', label: 'Active Patients', icon: 'UsersIcon' },
                    { value: '0', label: 'Verified Doctors', icon: 'UserCircleIcon' },
                    { value: 'N/A', label: 'Satisfaction Rate', icon: 'CheckCircleIcon' },
                    { value: 'N/A', label: 'Average Rating', icon: 'StarIcon' }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
            {stats.map((stat, index) => (
                <div
                    key={index}
                    className="p-4 bg-card/40 backdrop-blur-sm rounded-lg border border-border text-center"
                >
                    <div className="flex justify-center mb-2">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Icon name={stat.icon as any} size={20} className="text-primary" />
                        </div>
                    </div>
                    <div className={`text-2xl font-heading font-bold text-primary mb-1 ${isLoading ? 'animate-pulse' : ''}`}>
                        {stat.value}
                    </div>
                    <div className="text-xs text-text-secondary">
                        {stat.label}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TrustIndicators;