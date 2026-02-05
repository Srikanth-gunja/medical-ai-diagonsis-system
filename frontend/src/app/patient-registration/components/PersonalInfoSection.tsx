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
  touched: Set<string>;
  onChange: (field: string, value: string) => void;
  onBlur: (field: string) => void;
  isFieldValid: (field: string) => boolean;
  isFieldInvalid: (field: string) => boolean;
}

const PersonalInfoSection = ({ 
  formData, 
  errors, 
  touched,
  onChange,
  onBlur,
  isFieldValid,
  isFieldInvalid,
}: PersonalInfoSectionProps) => {
  const handleInputChange = (field: string, value: string) => {
    onChange(field, value);
  };

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
          <div className="relative">
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              onBlur={() => onBlur('firstName')}
              className={`w-full h-12 px-4 pr-12 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 ${
                isFieldInvalid('firstName')
                  ? 'border-error focus:ring-error/30'
                  : isFieldValid('firstName')
                  ? 'border-success focus:ring-success/30'
                  : 'border-input focus:ring-primary'
              }`}
              placeholder="Enter your first name"
            />
            {isFieldValid('firstName') && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Icon name="CheckCircleIcon" size={20} className="text-success" />
              </div>
            )}
            {isFieldInvalid('firstName') && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Icon name="ExclamationCircleIcon" size={20} className="text-error" />
              </div>
            )}
          </div>
          {touched.has('firstName') && errors.firstName && (
            <p className="mt-1 text-sm text-error flex items-center gap-1 animate-fade-in">
              <Icon name="ExclamationCircleIcon" size={14} />
              <span>{errors.firstName}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-text-primary mb-2">
            Last Name <span className="text-error">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => handleInputChange('lastName', e.target.value)}
              onBlur={() => onBlur('lastName')}
              className={`w-full h-12 px-4 pr-12 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 ${
                isFieldInvalid('lastName')
                  ? 'border-error focus:ring-error/30'
                  : isFieldValid('lastName')
                  ? 'border-success focus:ring-success/30'
                  : 'border-input focus:ring-primary'
              }`}
              placeholder="Enter your last name"
            />
            {isFieldValid('lastName') && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Icon name="CheckCircleIcon" size={20} className="text-success" />
              </div>
            )}
            {isFieldInvalid('lastName') && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Icon name="ExclamationCircleIcon" size={20} className="text-error" />
              </div>
            )}
          </div>
          {touched.has('lastName') && errors.lastName && (
            <p className="mt-1 text-sm text-error flex items-center gap-1 animate-fade-in">
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
          <div className="relative">
            <input
              type="date"
              id="dateOfBirth"
              value={formData.dateOfBirth}
              onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
              onBlur={() => onBlur('dateOfBirth')}
              max={new Date().toISOString().split('T')[0]}
              className={`w-full h-12 px-4 pr-12 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 ${
                isFieldInvalid('dateOfBirth')
                  ? 'border-error focus:ring-error/30'
                  : isFieldValid('dateOfBirth')
                  ? 'border-success focus:ring-success/30'
                  : 'border-input focus:ring-primary'
              }`}
            />
            {isFieldValid('dateOfBirth') && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Icon name="CheckCircleIcon" size={20} className="text-success" />
              </div>
            )}
            {isFieldInvalid('dateOfBirth') && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <Icon name="ExclamationCircleIcon" size={20} className="text-error" />
              </div>
            )}
          </div>
          {touched.has('dateOfBirth') && errors.dateOfBirth && (
            <p className="mt-1 text-sm text-error flex items-center gap-1 animate-fade-in">
              <Icon name="ExclamationCircleIcon" size={14} />
              <span>{errors.dateOfBirth}</span>
            </p>
          )}
        </div>

        <div>
          <label htmlFor="gender" className="block text-sm font-medium text-text-primary mb-2">
            Gender <span className="text-error">*</span>
          </label>
          <div className="relative">
            <select
              id="gender"
              value={formData.gender}
              onChange={(e) => handleInputChange('gender', e.target.value)}
              onBlur={() => onBlur('gender')}
              className={`w-full h-12 px-4 pr-12 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 appearance-none ${
                isFieldInvalid('gender')
                  ? 'border-error focus:ring-error/30'
                  : isFieldValid('gender')
                  ? 'border-success focus:ring-success/30'
                  : 'border-input focus:ring-primary'
              }`}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="prefer-not-to-say">Prefer not to say</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <Icon name="ChevronDownIcon" size={20} className="text-text-secondary" />
            </div>
            {isFieldValid('gender') && (
              <div className="absolute inset-y-0 right-10 pr-4 flex items-center pointer-events-none">
                <Icon name="CheckCircleIcon" size={20} className="text-success" />
              </div>
            )}
          </div>
          {touched.has('gender') && errors.gender && (
            <p className="mt-1 text-sm text-error flex items-center gap-1 animate-fade-in">
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
        <div className="relative">
          <select
            id="bloodGroup"
            value={formData.bloodGroup}
            onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
            className="w-full h-12 px-4 pr-12 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
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
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
            <Icon name="ChevronDownIcon" size={20} className="text-text-secondary" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSection;
