'use client';

import Icon from '@/components/ui/AppIcon';

interface RegistrationProgressProps {
    currentStep: number;
    totalSteps: number;
}

const RegistrationProgress = ({ currentStep, totalSteps }: RegistrationProgressProps) => {
    const steps = [
        { number: 1, label: 'Personal Info' },
        { number: 2, label: 'Contact Details' },
        { number: 3, label: 'Medical History' },
        { number: 4, label: 'Account Setup' },
    ];

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-text-secondary">
                    Step {currentStep} of {totalSteps}
                </span>
                <span className="text-sm font-medium text-primary">
                    {Math.round((currentStep / totalSteps) * 100)}% Complete
                </span>
            </div>

            <div className="relative">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
                        style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

            <div className="hidden sm:flex items-center justify-between mt-4">
                {steps.map((step) => (
                    <div key={step.number} className="flex items-center space-x-2">
                        <div
                            className={`flex items-center justify-center w-8 h-8 rounded-full transition-all ${step.number < currentStep
                                    ? 'bg-success text-success-foreground'
                                    : step.number === currentStep
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted text-muted-foreground'
                                }`}
                        >
                            {step.number < currentStep ? (
                                <Icon name="CheckIcon" size={16} />
                            ) : (
                                <span className="text-sm font-medium">{step.number}</span>
                            )}
                        </div>
                        <span
                            className={`text-sm font-medium ${step.number <= currentStep ? 'text-text-primary' : 'text-text-secondary'
                                }`}
                        >
                            {step.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RegistrationProgress;