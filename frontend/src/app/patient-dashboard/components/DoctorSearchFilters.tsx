'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface FilterOptions {
  specialty: string;
  minRating: number;
  availableToday: boolean;
  consultationType: 'all' | 'video' | 'in-person';
}

interface DoctorSearchFiltersProps {
  onFilterChange: (filters: FilterOptions) => void;
}

const DoctorSearchFilters = ({ onFilterChange }: DoctorSearchFiltersProps) => {
  const [isHydrated, setIsHydrated] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    specialty: 'all',
    minRating: 0,
    availableToday: false,
    consultationType: 'all',
  });
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const specialties = [
    { label: 'All Specialties', value: 'all' },
    { label: 'Pediatrics', value: 'Pediatrics' },
    { label: 'Orthopedics', value: 'Orthopedics' },
    { label: 'Psychiatry', value: 'Psychiatry' },
    { label: 'Neurology', value: 'Neurology' },
    { label: 'Cardiology', value: 'Cardiology' },
    { label: 'Dermatology', value: 'Dermatology' },
    { label: 'Endocrinology', value: 'Endocrinology' },
    { label: 'Gastroenterology', value: 'Gastroenterology' },
  ];

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (isHydrated) {
      onFilterChange(newFilters);
    }
  };

  const handleReset = () => {
    const resetFilters: FilterOptions = {
      specialty: 'all',
      minRating: 0,
      availableToday: false,
      consultationType: 'all',
    };
    setFilters(resetFilters);
    if (isHydrated) {
      onFilterChange(resetFilters);
    }
  };

  if (!isHydrated) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <div className="space-y-4">
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
          <div className="h-10 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl shadow-elevation-1 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-text-primary flex items-center space-x-2">
            <Icon name="AdjustmentsHorizontalIcon" size={20} />
            <span>Filter Doctors</span>
          </h3>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden p-2 text-text-secondary hover:text-primary hover:bg-muted rounded-lg transition-base"
            aria-label="Toggle filters"
          >
            <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={20} />
          </button>
        </div>

        <div className={`space-y-6 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Specialty</label>
            <select
              value={filters.specialty}
              onChange={(e) => handleFilterChange('specialty', e.target.value)}
              className="w-full h-12 px-4 bg-background border border-input rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-ring transition-base"
            >
              {specialties.map((specialty) => (
                <option key={specialty.value} value={specialty.value}>
                  {specialty.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Minimum Rating
            </label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleFilterChange('minRating', rating)}
                  className={`p-1.5 rounded-lg transition-base ${
                    filters.minRating >= rating
                      ? 'text-warning'
                      : 'text-muted-foreground hover:text-warning'
                  }`}
                  aria-label={`${rating} stars`}
                >
                  <Icon
                    name="StarIcon"
                    variant={filters.minRating >= rating ? 'solid' : 'outline'}
                    size={20}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Consultation Type
            </label>
            <div className="flex flex-wrap gap-2">
              {['all', 'video', 'in-person'].map((type) => (
                <button
                  key={type}
                  onClick={() => handleFilterChange('consultationType', type)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-base whitespace-nowrap ${
                    filters.consultationType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-text-secondary hover:bg-muted/80'
                  }`}
                >
                  {type === 'all' ? 'All' : type === 'video' ? 'Video' : 'In-Person'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.availableToday}
                onChange={(e) => handleFilterChange('availableToday', e.target.checked)}
                className="w-5 h-5 rounded border-input text-primary focus:ring-2 focus:ring-ring transition-base"
              />
              <span className="text-sm font-medium text-text-primary">Available Today</span>
            </label>
          </div>

          <button
            onClick={handleReset}
            className="w-full px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-muted rounded-lg transition-base"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorSearchFilters;
