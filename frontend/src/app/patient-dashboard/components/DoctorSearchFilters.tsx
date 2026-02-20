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
      <div className="bg-card border border-border/60 rounded-2xl p-5">
        <div className="space-y-6">
          <div className="h-12 bg-muted/60 rounded-xl animate-pulse" />
          <div className="h-12 bg-muted/60 rounded-xl animate-pulse" />
          <div className="h-12 bg-muted/60 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border/60 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">
      <div className="p-5">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[17px] font-semibold text-text-primary flex items-center space-x-2">
            <div className="p-1.5 bg-primary/10 text-primary rounded-lg hidden sm:block">
              <Icon name="AdjustmentsHorizontalIcon" size={18} />
            </div>
            <span>Filter Doctors</span>
          </h3>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="lg:hidden p-2 text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl transition-colors duration-200"
            aria-label="Toggle filters"
          >
            <Icon name={isExpanded ? 'ChevronUpIcon' : 'ChevronDownIcon'} size={20} />
          </button>
        </div>

        <div className={`space-y-6 ${isExpanded ? 'block' : 'hidden lg:block'}`}>
          {/* Specialty */}
          <div className="group">
            <label className="block text-sm font-medium text-text-primary mb-2">Specialty</label>
            <div className="relative">
              <select
                value={filters.specialty}
                onChange={(e) => handleFilterChange('specialty', e.target.value)}
                className="w-full h-11 pl-3 pr-8 appearance-none bg-background border border-border/80 rounded-xl text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ease-in-out cursor-pointer hover:border-border text-ellipsis overflow-hidden whitespace-nowrap"
              >
                {specialties.map((specialty) => (
                  <option key={specialty.value} value={specialty.value}>
                    {specialty.label}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-text-muted group-hover:text-text-secondary transition-colors duration-200">
                <Icon name="ChevronDownIcon" size={16} />
              </div>
            </div>
          </div>

          {/* Registration Rating */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Minimum Rating
            </label>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-100 dark:bg-slate-800/30 dark:border-slate-800 rounded-xl py-1.5 px-2 overflow-hidden">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  onClick={() => handleFilterChange('minRating', rating)}
                  className={`p-1 rounded-lg transition-all duration-200 ease-spring hover:scale-110 active:scale-95 flex-shrink-0 ${
                    filters.minRating >= rating
                      ? 'text-warning drop-shadow-sm'
                      : 'text-text-muted hover:text-warning/70'
                  }`}
                  aria-label={`${rating} stars`}
                  title={`${rating} Stars & Up`}
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

          {/* Consultation Type */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Consultation Type
            </label>
            <div className="flex bg-slate-100 dark:bg-slate-800/60 p-1 rounded-xl overflow-hidden">
              {['all', 'video', 'in-person'].map((type) => {
                const isActive = filters.consultationType === type;
                return (
                  <button
                    key={type}
                    onClick={() => handleFilterChange('consultationType', type)}
                    className={`flex-1 px-1 py-1.5 text-[11px] font-medium rounded-lg transition-all duration-300 ease-in-out whitespace-nowrap text-ellipsis overflow-hidden ${
                      isActive
                        ? 'bg-white dark:bg-slate-700 text-primary shadow-sm ring-1 ring-border/5'
                        : 'text-text-secondary hover:text-text-primary hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                  >
                    {type === 'all' ? 'All' : type === 'video' ? 'Video' : 'In-Person'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Today Toggle */}
          <div className="py-3 border-t border-border/40">
            <label className="flex items-start justify-between cursor-pointer group gap-2">
              <div className="flex flex-col min-w-0 pr-2">
                <span className="text-sm font-medium text-text-primary group-hover:text-primary transition-colors duration-200">
                  Available Today
                </span>
                <span className="text-[11px] text-text-secondary mt-0.5 leading-tight">
                  Same-day appointments
                </span>
              </div>

              <div className="relative inline-flex items-center flex-shrink-0 mt-1">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={filters.availableToday}
                  onChange={(e) => handleFilterChange('availableToday', e.target.checked)}
                />
                <div className="w-10 h-[22px] bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/20 dark:peer-focus:ring-primary/10 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-[18px] after:w-[18px] after:transition-all dark:border-slate-600 peer-checked:bg-primary duration-300 ease-spring"></div>
              </div>
            </label>
          </div>

          {/* Reset Action */}
          <button
            onClick={handleReset}
            className="w-full mt-2 px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/5 rounded-xl transition-all duration-200 active:scale-[0.98]"
          >
            Reset All Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default DoctorSearchFilters;
