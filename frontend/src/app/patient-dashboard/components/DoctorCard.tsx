'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';
import AppImage from '@/components/ui/AppImage';

interface Doctor {
    id: string;
    name: string;
    image: string;
    imageAlt: string;
    specialty: string;
    rating: number;
    reviewCount: number;
    experience: number;
    availableToday: boolean;
    consultationTypes: ('video' | 'in-person')[];
    nextAvailable: string;
}

interface DoctorCardProps {
    doctor: Doctor;
    onBook: (id: string) => void;
}

const DoctorCard = ({ doctor, onBook }: DoctorCardProps) => {
    const [isHydrated, setIsHydrated] = useState(false);

    useState(() => {
        setIsHydrated(true);
    });

    if (!isHydrated) {
        return (
            <div className="bg-card border border-border rounded-xl p-5 shadow-elevation-1">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-muted animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                        <div className="h-5 bg-muted rounded animate-pulse w-32" />
                        <div className="h-4 bg-muted rounded animate-pulse w-24" />
                    </div>
                    <div className="h-10 bg-muted rounded-lg animate-pulse w-24" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card border border-border rounded-xl p-5 shadow-elevation-1 hover:shadow-elevation-2 hover:border-primary/20 transition-all duration-200">
            <div className="flex items-center gap-4">
                {/* Doctor Avatar */}
                <div className="relative flex-shrink-0">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-muted ring-2 ring-border">
                        <AppImage
                            src={doctor.image}
                            alt={doctor.imageAlt}
                            width={64}
                            height={64}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {doctor.availableToday && (
                        <div className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center w-5 h-5 bg-success rounded-full border-2 border-card">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                    )}
                </div>

                {/* Doctor Info - Main Section */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <h3 className="text-base font-semibold text-text-primary truncate">
                                Dr. {doctor.name}
                            </h3>
                            <p className="text-sm text-text-secondary">
                                {doctor.specialty}
                            </p>
                        </div>

                        {/* Rating Badge */}
                        <div className="flex items-center gap-1 px-2 py-1 bg-warning/10 rounded-lg flex-shrink-0">
                            <Icon name="StarIcon" variant="solid" size={14} className="text-warning" />
                            <span className="text-sm font-semibold text-warning">
                                {doctor.rating.toFixed(1)}
                            </span>
                            <span className="text-xs text-text-secondary">
                                ({doctor.reviewCount})
                            </span>
                        </div>
                    </div>

                    {/* Meta Info Row */}
                    <div className="flex items-center gap-3 mt-2">
                        <span className="inline-flex items-center gap-1 text-xs text-text-secondary">
                            <Icon name="BriefcaseIcon" size={12} />
                            {doctor.experience} years exp.
                        </span>

                        <div className="flex items-center gap-1.5">
                            {doctor.consultationTypes.map((type) => (
                                <span
                                    key={type}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted text-text-secondary rounded text-xs"
                                >
                                    <Icon name={type === 'video' ? 'VideoCameraIcon' : 'BuildingOfficeIcon'} size={10} />
                                    <span className="capitalize">{type === 'video' ? 'Video' : 'In-Person'}</span>
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Action Section */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                        <Icon name="ClockIcon" size={12} />
                        <span>Next: {doctor.nextAvailable}</span>
                    </div>

                    <button
                        onClick={() => onBook(doctor.id)}
                        className="px-5 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 hover:shadow-elevation-2 active:scale-[0.98] transition-all duration-150 text-sm font-medium"
                    >
                        Book Now
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DoctorCard;