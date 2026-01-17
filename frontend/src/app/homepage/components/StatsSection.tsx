'use client';

import { useState, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { analyticsApi } from '@/lib/api';

interface Stat {
    value: string;
    label: string;
    icon: string;
}

const StatsSection = () => {
    const [stats, setStats] = useState<Stat[]>([
        {
            value: "...",
            label: "Active Patients",
            icon: "UsersIcon"
        },
        {
            value: "...",
            label: "Licensed Doctors",
            icon: "UserGroupIcon"
        },
        {
            value: "...",
            label: "Patient Satisfaction",
            icon: "StarIcon"
        },
        {
            value: "24/7",
            label: "Support Available",
            icon: "ClockIcon"
        }
    ]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await analyticsApi.getPublicStats();
                setStats([
                    {
                        value: data.activePatients > 1000
                            ? `${Math.floor(data.activePatients / 1000)}K+`
                            : `${data.activePatients}+`,
                        label: "Active Patients",
                        icon: "UsersIcon"
                    },
                    {
                        value: data.licensedDoctors > 1000
                            ? `${Math.floor(data.licensedDoctors / 1000)}K+`
                            : `${data.licensedDoctors}+`,
                        label: "Licensed Doctors",
                        icon: "UserGroupIcon"
                    },
                    {
                        value: `${data.satisfactionRate}%`,
                        label: "Patient Satisfaction",
                        icon: "StarIcon"
                    },
                    {
                        value: "24/7",
                        label: "Support Available",
                        icon: "ClockIcon"
                    }
                ]);
            } catch (error) {
                console.error('Failed to fetch stats:', error);
                // Show placeholder on error
                setStats([
                    { value: "0", label: "Active Patients", icon: "UsersIcon" },
                    { value: "0", label: "Licensed Doctors", icon: "UserGroupIcon" },
                    { value: "N/A", label: "Patient Satisfaction", icon: "StarIcon" },
                    { value: "24/7", label: "Support Available", icon: "ClockIcon" }
                ]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <section className="py-16 lg:py-24 bg-primary text-primary-foreground relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent opacity-90" />
            <div className="absolute top-0 right-0 w-[48rem] h-[48rem] bg-accent/20 rounded-full blur-3xl" />

            <div className="container relative mx-auto px-4 sm:px-6">
                <div className="text-center space-y-4 mb-12">
                    <h2 className="text-3xl sm:text-4xl font-heading font-bold">
                        Our Growing Community
                    </h2>
                    <p className="text-lg opacity-90 max-w-2xl mx-auto">
                        Be part of our healthcare platform connecting patients with quality medical care.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center space-y-3">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white/10 backdrop-blur-sm">
                                <Icon name={stat.icon as any} variant="solid" size={28} className="text-white" />
                            </div>

                            <div className="space-y-1">
                                <div className={`text-4xl sm:text-5xl font-heading font-bold ${isLoading ? 'animate-pulse' : ''}`}>
                                    {stat.value}
                                </div>
                                <div className="text-lg opacity-90">
                                    {stat.label}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;