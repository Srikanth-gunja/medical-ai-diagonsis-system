import Icon from '@/components/ui/AppIcon';

interface ContactDetailsSectionProps {
    formData: {
        email: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        zipCode: string;
        emergencyContactName: string;
        emergencyContactPhone: string;
    };
    errors: Record<string, string>;
    onChange: (field: string, value: string) => void;
}

const ContactDetailsSection = ({ formData, errors, onChange }: ContactDetailsSectionProps) => {
    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10">
                    <Icon name="PhoneIcon" size={20} className="text-accent" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-text-primary">Contact Details</h2>
                    <p className="text-sm text-text-secondary">How can we reach you?</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                        Email Address <span className="text-error">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.email ? 'border-error' : 'border-input'
                            }`}
                        placeholder="your.email@example.com"
                    />
                    {errors.email && (
                        <p className="mt-1 text-sm text-error flex items-center space-x-1">
                            <Icon name="ExclamationCircleIcon" size={14} />
                            <span>{errors.email}</span>
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-text-primary mb-2">
                        Phone Number <span className="text-error">*</span>
                    </label>
                    <input
                        type="tel"
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => onChange('phone', e.target.value)}
                        className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.phone ? 'border-error' : 'border-input'
                            }`}
                        placeholder="(555) 123-4567"
                    />
                    {errors.phone && (
                        <p className="mt-1 text-sm text-error flex items-center space-x-1">
                            <Icon name="ExclamationCircleIcon" size={14} />
                            <span>{errors.phone}</span>
                        </p>
                    )}
                </div>
            </div>

            <div>
                <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-2">
                    Street Address <span className="text-error">*</span>
                </label>
                <input
                    type="text"
                    id="address"
                    value={formData.address}
                    onChange={(e) => onChange('address', e.target.value)}
                    className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.address ? 'border-error' : 'border-input'
                        }`}
                    placeholder="123 Main Street, Apt 4B"
                />
                {errors.address && (
                    <p className="mt-1 text-sm text-error flex items-center space-x-1">
                        <Icon name="ExclamationCircleIcon" size={14} />
                        <span>{errors.address}</span>
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="city" className="block text-sm font-medium text-text-primary mb-2">
                        City <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        id="city"
                        value={formData.city}
                        onChange={(e) => onChange('city', e.target.value)}
                        className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.city ? 'border-error' : 'border-input'
                            }`}
                        placeholder="New York"
                    />
                    {errors.city && (
                        <p className="mt-1 text-sm text-error flex items-center space-x-1">
                            <Icon name="ExclamationCircleIcon" size={14} />
                            <span>{errors.city}</span>
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="state" className="block text-sm font-medium text-text-primary mb-2">
                        State <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        id="state"
                        value={formData.state}
                        onChange={(e) => onChange('state', e.target.value)}
                        className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.state ? 'border-error' : 'border-input'
                            }`}
                        placeholder="NY"
                    />
                    {errors.state && (
                        <p className="mt-1 text-sm text-error flex items-center space-x-1">
                            <Icon name="ExclamationCircleIcon" size={14} />
                            <span>{errors.state}</span>
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="zipCode" className="block text-sm font-medium text-text-primary mb-2">
                        ZIP Code <span className="text-error">*</span>
                    </label>
                    <input
                        type="text"
                        id="zipCode"
                        value={formData.zipCode}
                        onChange={(e) => onChange('zipCode', e.target.value)}
                        className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.zipCode ? 'border-error' : 'border-input'
                            }`}
                        placeholder="10001"
                    />
                    {errors.zipCode && (
                        <p className="mt-1 text-sm text-error flex items-center space-x-1">
                            <Icon name="ExclamationCircleIcon" size={14} />
                            <span>{errors.zipCode}</span>
                        </p>
                    )}
                </div>
            </div>

            <div className="pt-6 border-t border-border">
                <h3 className="text-lg font-semibold text-text-primary mb-4">
                    Emergency Contact <span className="text-text-secondary text-sm font-normal">(Optional)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="emergencyContactName" className="block text-sm font-medium text-text-primary mb-2">
                            Contact Name
                        </label>
                        <input
                            type="text"
                            id="emergencyContactName"
                            value={formData.emergencyContactName}
                            onChange={(e) => onChange('emergencyContactName', e.target.value)}
                            className="w-full h-12 px-4 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="Full name"
                        />
                    </div>

                    <div>
                        <label htmlFor="emergencyContactPhone" className="block text-sm font-medium text-text-primary mb-2">
                            Contact Phone
                        </label>
                        <input
                            type="tel"
                            id="emergencyContactPhone"
                            value={formData.emergencyContactPhone}
                            onChange={(e) => onChange('emergencyContactPhone', e.target.value)}
                            className="w-full h-12 px-4 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary"
                            placeholder="(555) 123-4567"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactDetailsSection;