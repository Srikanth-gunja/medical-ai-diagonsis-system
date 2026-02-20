'use client';

import { useEffect, useState } from 'react';
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

  useEffect(() => {
    setIsHydrated(true);
  }, []);

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
    <div className="group bg-card/80 backdrop-blur-sm border border-border rounded-2xl p-5 shadow-elevation-1 hover:shadow-elevation-3 hover:border-primary/30 transition-all duration-300">
      <div className="flex items-start gap-4">
        {/* Doctor Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-[72px] h-[72px] rounded-full overflow-hidden bg-muted border-2 border-background ring-2 ring-primary/10 group-hover:ring-primary/40 transition-all duration-300 shadow-sm relative z-10">
            <AppImage
              src={doctor.image}
              alt={doctor.imageAlt}
              width={72}
              height={72}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          </div>
          {doctor.availableToday && (
            <div className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 bg-success rounded-full border-2 border-card shadow-sm z-20" title="Available Today">
              <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse-subtle" />
            </div>
          )}
        </div>

        {/* Doctor Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-text-primary truncate group-hover:text-primary transition-colors">
                Dr. {doctor.name}
              </h3>
              <p className="text-sm font-medium text-text-secondary">{doctor.specialty}</p>
            </div>

            <div className="flex items-center bg-warning/10 px-2.5 py-1 rounded-md shrink-0">
              <Icon name="StarIcon" variant="solid" size={14} className="text-warning mr-1" />
              <span className="text-sm font-extrabold text-warning">{doctor.rating.toFixed(1)}</span>
              <span className="text-[10px] font-bold text-warning/70 ml-1">({doctor.reviewCount})</span>
            </div>
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2 py-1 bg-muted/50 rounded-md text-xs font-semibold text-text-secondary">
              <Icon name="BriefcaseIcon" size={12} className="text-primary/60" />
              {doctor.experience} Yrs
            </span>

            <div className="flex items-center gap-1.5">
              {doctor.consultationTypes.map((type) => (
                <span
                  key={type}
                  className="inline-flex items-center gap-1.5 px-2 py-1 bg-primary/5 text-primary rounded-md text-xs font-semibold"
                >
                  <Icon
                    name={type === 'video' ? 'VideoCameraIcon' : 'BuildingOfficeIcon'}
                    size={12}
                  />
                  <span className="capitalize">{type === 'video' ? 'Video' : 'In-Person'}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Action Area */}
      <div className="mt-5 pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-text-secondary">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Icon name="ClockIcon" size={18} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted">Next available</span>
            <span className="font-bold text-text-primary truncate">
              {doctor.nextAvailable === 'Not available' ? 'Fully Booked' : doctor.nextAvailable}
            </span>
          </div>
        </div>

        <button
          onClick={() => onBook(doctor.id)}
          className="w-full sm:w-auto px-6 py-2.5 bg-primary text-primary-foreground rounded-xl font-bold hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
        >
          Book Now
        </button>
      </div>
    </div>
  );
};

export default DoctorCard;
