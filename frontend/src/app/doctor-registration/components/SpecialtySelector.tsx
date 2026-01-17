'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface Specialty {
  id: string;
  name: string;
  category: string;
}

interface SpecialtySelectorProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

const SpecialtySelector = ({ value, onChange, error }: SpecialtySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Specialties matching backend VALID_SPECIALTIES list
  const specialties: Specialty[] = [
    { id: 'general-practice', name: 'General Practice', category: 'Primary Care' },
    { id: 'cardiology', name: 'Cardiology', category: 'Specialty' },
    { id: 'dermatology', name: 'Dermatology', category: 'Specialty' },
    { id: 'neurology', name: 'Neurology', category: 'Specialty' },
    { id: 'orthopedics', name: 'Orthopedics', category: 'Specialty' },
    { id: 'pediatrics', name: 'Pediatrics', category: 'Primary Care' },
    { id: 'psychiatry', name: 'Psychiatry', category: 'Mental Health' },
    { id: 'ophthalmology', name: 'Ophthalmology', category: 'Specialty' },
    { id: 'gynecology', name: 'Gynecology', category: 'Specialty' },
    { id: 'urology', name: 'Urology', category: 'Specialty' },
    { id: 'oncology', name: 'Oncology', category: 'Specialty' },
    { id: 'endocrinology', name: 'Endocrinology', category: 'Specialty' },
    { id: 'gastroenterology', name: 'Gastroenterology', category: 'Specialty' },
    { id: 'pulmonology', name: 'Pulmonology', category: 'Specialty' },
    { id: 'nephrology', name: 'Nephrology', category: 'Specialty' },
    { id: 'rheumatology', name: 'Rheumatology', category: 'Specialty' },
    { id: 'emergency-medicine', name: 'Emergency Medicine', category: 'Emergency' },
  ];

  const filteredSpecialties = specialties.filter(
    (specialty) =>
      specialty.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      specialty.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Find selected specialty by name (value contains the full name)
  const selectedSpecialty = specialties.find((s) => s.name === value);

  const handleSelect = (specialty: Specialty) => {
    // Send the name, not the id, since backend validates the name
    onChange(specialty.name);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-text-primary mb-2">
        Medical Specialty <span className="text-error">*</span>
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-12 px-4 flex items-center justify-between bg-background border rounded-lg transition-base ${
          error ? 'border-error' : 'border-input hover:border-primary'
        } ${isOpen ? 'border-primary ring-2 ring-primary/20' : ''}`}
      >
        <span className={selectedSpecialty ? 'text-text-primary' : 'text-text-secondary'}>
          {selectedSpecialty ? selectedSpecialty.name : 'Select your specialty'}
        </span>
        <Icon
          name="ChevronDownIcon"
          size={20}
          className={`text-text-secondary transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {error && (
        <p className="mt-1 text-sm text-error flex items-center space-x-1">
          <Icon name="ExclamationCircleIcon" size={16} />
          <span>{error}</span>
        </p>
      )}

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-card border border-border rounded-lg shadow-elevation-3 animate-fade-in overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Icon
                name="MagnifyingGlassIcon"
                size={20}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search specialties..."
                className="w-full h-10 pl-10 pr-4 bg-background border border-input rounded-lg text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-base"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto">
            {filteredSpecialties.length > 0 ? (
              filteredSpecialties.map((specialty) => (
                <button
                  key={specialty.id}
                  type="button"
                  onClick={() => handleSelect(specialty)}
                  className={`w-full px-4 py-3 text-left hover:bg-muted transition-base ${
                    value === specialty.name ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-text-primary">{specialty.name}</p>
                      <p className="text-xs text-text-secondary">{specialty.category}</p>
                    </div>
                    {value === specialty.name && (
                      <Icon name="CheckIcon" size={20} className="text-primary" />
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center">
                <Icon
                  name="MagnifyingGlassIcon"
                  size={32}
                  className="mx-auto text-text-secondary mb-2"
                />
                <p className="text-sm text-text-secondary">No specialties found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecialtySelector;
