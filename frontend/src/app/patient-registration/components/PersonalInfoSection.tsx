import Icon from '@/components/ui/AppIcon';

interface PersonalInfoSectionProps {
    formData: {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        gender: string;
        bloodGroup: string;
    };
    errors: Record<string, string>;
    onChange: (field: string, value: string) => void;
}

const PersonalInfoSection = ({ formData, errors, onChange }: PersonalInfoSectionProps) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
                    <Icon name="UserIcon" size={20} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-text-primary">Personal Information</h2>
                    <p className="text-sm text-text-secondary">Tell us about yourself</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-text-primary mb-2">
                        First Name <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => onChange('firstName', e.target.value)}
                        className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.firstName ? 'border-error' : 'border-input'
                            }`}
                        placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                        <p className="mt-1 text-sm text-error flex items-center space-x-1">
                            <Icon name="ExclamationCircleIcon" size={14} />
                            <span>{errors.firstName}</span>
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-text-primary mb-2">
                        Last Name <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => onChange('lastName', e.target.value)}
                        className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.lastName ? 'border-error' : 'border-input'
                            }`}
                        placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                        <p className="mt-1 text-sm text-error flex items-center space-x-1">
                            <Icon name="ExclamationCircleIcon" size={14} />
                            <span>{errors.lastName}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="dateOfBirth" className="block text-sm font-medium text-text-primary mb-2">
                        Date of Birth <span className="text-error">*</span>
                    </label>
                    <input
                        type="date"
                        id="dateOfBirth"
                        value={formData.dateOfBirth}
                        onChange={(e) => onChange('dateOfBirth', e.target.value)}
                        max="2026-01-15"
                        className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.dateOfBirth ? 'border-error' : 'border-input'
                            }`}
                    />
                    {errors.dateOfBirth && (
                        <p className="mt-1 text-sm text-error flex items-center space-x-1">
                            <Icon name="ExclamationCircleIcon" size={14} />
                            <span>{errors.dateOfBirth}</span>
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="gender" className="block text-sm font-medium text-text-primary mb-2">
                        Gender <span className="text-error">*</span>
                    </label>
                    <select
                        id="gender"
                        value={formData.gender}
                        onChange={(e) => onChange('gender', e.target.value)}
                        className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.gender ? 'border-error' : 'border-input'
                            }`}
                    >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                    </select>
                    {errors.gender && (
                        <p className="mt-1 text-sm text-error flex items-center space-x-1">
                            <Icon name="ExclamationCircleIcon" size={14} />
                            <span>{errors.gender}</span>
                        </p>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="bloodGroup" className="block text-sm font-medium text-text-primary mb-2">
                    Blood Group <span className="text-text-secondary text-xs">(Optional)</span>
                </label>
                <select
                    id="bloodGroup"
                    value={formData.bloodGroup}
                    onChange={(e) => onChange('bloodGroup', e.target.value)}
                    className="w-full h-12 px-4 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                </select>
            </div>
        </div>
    );
};

export default PersonalInfoSection;