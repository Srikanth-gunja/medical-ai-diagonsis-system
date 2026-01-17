'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface MedicalHistorySectionProps {
    formData: {
        allergies: string;
        currentMedications: string;
        chronicConditions: string[];
        previousSurgeries: string;
        insuranceProvider: string;
        insurancePolicyNumber: string;
    };
    onChange: (field: string, value: string | string[]) => void;
}

const MedicalHistorySection = ({ formData, onChange }: MedicalHistorySectionProps) => {
    const [showInsuranceFields, setShowInsuranceFields] = useState(false);

    const commonConditions = [
        'Diabetes',
        'Hypertension',
        'Asthma',
        'Heart Disease',
        'Arthritis',
        'Thyroid Disorder',
        'Depression',
        'Anxiety',
    ];

    const toggleCondition = (condition: string) => {
        const currentConditions = formData.chronicConditions || [];
        const newConditions = currentConditions.includes(condition)
            ? currentConditions.filter((c) => c !== condition)
            : [...currentConditions, condition];
        onChange('chronicConditions', newConditions);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-success/10">
                    <Icon name="HeartIcon" size={20} className="text-success" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-text-primary">Medical History</h2>
                    <p className="text-sm text-text-secondary">Help us provide better care</p>
                </div>
            </div>

            <div>
                <label htmlFor="allergies" className="block text-sm font-medium text-text-primary mb-2">
                    Known Allergies <span className="text-text-secondary text-xs">(Optional)</span>
                </label>
                <textarea
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => onChange('allergies', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="List any allergies to medications, foods, or other substances"
                />
            </div>

            <div>
                <label htmlFor="currentMedications" className="block text-sm font-medium text-text-primary mb-2">
                    Current Medications <span className="text-text-secondary text-xs">(Optional)</span>
                </label>
                <textarea
                    id="currentMedications"
                    value={formData.currentMedications}
                    onChange={(e) => onChange('currentMedications', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="List any medications you are currently taking"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-text-primary mb-3">
                    Chronic Conditions <span className="text-text-secondary text-xs">(Optional)</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {commonConditions.map((condition) => (
                        <button
                            key={condition}
                            type="button"
                            onClick={() => toggleCondition(condition)}
                            className={`flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-base ${formData.chronicConditions?.includes(condition)
                                    ? 'border-primary bg-primary/10 text-primary' : 'border-input bg-background text-text-secondary hover:border-primary/50'
                                }`}
                        >
                            <span className="text-sm font-medium">{condition}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div>
                <label htmlFor="previousSurgeries" className="block text-sm font-medium text-text-primary mb-2">
                    Previous Surgeries <span className="text-text-secondary text-xs">(Optional)</span>
                </label>
                <textarea
                    id="previousSurgeries"
                    value={formData.previousSurgeries}
                    onChange={(e) => onChange('previousSurgeries', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="List any previous surgeries or major medical procedures"
                />
            </div>

            <div className="pt-6 border-t border-border">
                <button
                    type="button"
                    onClick={() => setShowInsuranceFields(!showInsuranceFields)}
                    className="flex items-center justify-between w-full mb-4"
                >
                    <h3 className="text-lg font-semibold text-text-primary">
                        Insurance Information <span className="text-text-secondary text-sm font-normal">(Optional)</span>
                    </h3>
                    <Icon
                        name={showInsuranceFields ? 'ChevronUpIcon' : 'ChevronDownIcon'}
                        size={20}
                        className="text-text-secondary"
                    />
                </button>

                {showInsuranceFields && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-fade-in">
                        <div>
                            <label htmlFor="insuranceProvider" className="block text-sm font-medium text-text-primary mb-2">
                                Insurance Provider
                            </label>
                            <input
                                type="text"
                                id="insuranceProvider"
                                value={formData.insuranceProvider}
                                onChange={(e) => onChange('insuranceProvider', e.target.value)}
                                className="w-full h-12 px-4 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="e.g., Blue Cross Blue Shield"
                            />
                        </div>

                        <div>
                            <label htmlFor="insurancePolicyNumber" className="block text-sm font-medium text-text-primary mb-2">
                                Policy Number
                            </label>
                            <input
                                type="text"
                                id="insurancePolicyNumber"
                                value={formData.insurancePolicyNumber}
                                onChange={(e) => onChange('insurancePolicyNumber', e.target.value)}
                                className="w-full h-12 px-4 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary"
                                placeholder="Enter policy number"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MedicalHistorySection;