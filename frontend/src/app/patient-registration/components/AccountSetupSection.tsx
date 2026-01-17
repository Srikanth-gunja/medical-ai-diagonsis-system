'use client';

import { useState } from 'react';
import Icon from '@/components/ui/AppIcon';

interface AccountSetupSectionProps {
    formData: {
        password: string;
        confirmPassword: string;
        agreeToTerms: boolean;
        agreeToPrivacy: boolean;
        agreeToMarketing: boolean;
    };
    errors: Record<string, string>;
    onChange: (field: string, value: string | boolean) => void;
}

const AccountSetupSection = ({ formData, errors, onChange }: AccountSetupSectionProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [showPrivacyModal, setShowPrivacyModal] = useState(false);

    const passwordStrength = (password: string): { strength: string; color: string; width: string } => {
        if (!password) return { strength: '', color: '', width: '0%' };

        let score = 0;
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
        if (/\d/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;

        if (score <= 2) return { strength: 'Weak', color: 'bg-error', width: '33%' };
        if (score <= 3) return { strength: 'Medium', color: 'bg-warning', width: '66%' };
        return { strength: 'Strong', color: 'bg-success', width: '100%' };
    };

    const strength = passwordStrength(formData.password);

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-warning/10">
                    <Icon name="LockClosedIcon" size={20} className="text-warning" />
                </div>
                <div>
                    <h2 className="text-xl font-semibold text-text-primary">Account Setup</h2>
                    <p className="text-sm text-text-secondary">Create your secure account</p>
                </div>
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-text-primary mb-2">
                    Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        value={formData.password}
                        onChange={(e) => onChange('password', e.target.value)}
                        className={`w-full h-12 px-4 pr-12 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.password ? 'border-error' : 'border-input'
                            }`}
                        placeholder="Create a strong password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary transition-base"
                    >
                        <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
                    </button>
                </div>
                {formData.password && (
                    <div className="mt-2">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-text-secondary">Password strength:</span>
                            <span className={`text-xs font-medium ${strength.color.replace('bg-', 'text-')}`}>
                                {strength.strength}
                            </span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                                className={`h-full ${strength.color} transition-all duration-300`}
                                style={{ width: strength.width }}
                            />
                        </div>
                    </div>
                )}
                {errors.password && (
                    <p className="mt-1 text-sm text-error flex items-center space-x-1">
                        <Icon name="ExclamationCircleIcon" size={14} />
                        <span>{errors.password}</span>
                    </p>
                )}
                <p className="mt-2 text-xs text-text-secondary">
                    Must be at least 8 characters with uppercase, lowercase, number, and special character
                </p>
            </div>

            <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary mb-2">
                    Confirm Password <span className="text-error">*</span>
                </label>
                <div className="relative">
                    <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={(e) => onChange('confirmPassword', e.target.value)}
                        className={`w-full h-12 px-4 pr-12 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 focus:ring-primary ${errors.confirmPassword ? 'border-error' : 'border-input'
                            }`}
                        placeholder="Re-enter your password"
                    />
                    <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary transition-base"
                    >
                        <Icon name={showConfirmPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
                    </button>
                </div>
                {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-error flex items-center space-x-1">
                        <Icon name="ExclamationCircleIcon" size={14} />
                        <span>{errors.confirmPassword}</span>
                    </p>
                )}
            </div>

            <div className="pt-6 border-t border-border space-y-4">
                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        id="agreeToTerms"
                        checked={formData.agreeToTerms}
                        onChange={(e) => onChange('agreeToTerms', e.target.checked)}
                        className="mt-1 w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-primary"
                    />
                    <label htmlFor="agreeToTerms" className="flex-1 text-sm text-text-secondary">
                        I agree to the{' '}
                        <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-primary hover:underline font-medium"
                        >
                            Terms of Service
                        </button>{' '}
                        and{' '}
                        <button
                            type="button"
                            onClick={() => setShowTermsModal(true)}
                            className="text-primary hover:underline font-medium"
                        >
                            Privacy Policy
                        </button>
                        <span className="text-error ml-1">*</span>
                    </label>
                </div>
                {errors.agreeToTerms && (
                    <p className="ml-7 text-sm text-error flex items-center space-x-1">
                        <Icon name="ExclamationCircleIcon" size={14} />
                        <span>{errors.agreeToTerms}</span>
                    </p>
                )}

                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        id="agreeToPrivacy"
                        checked={formData.agreeToPrivacy}
                        onChange={(e) => onChange('agreeToPrivacy', e.target.checked)}
                        className="mt-1 w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-primary"
                    />
                    <label htmlFor="agreeToPrivacy" className="flex-1 text-sm text-text-secondary">
                        I acknowledge and consent to the{' '}
                        <button
                            type="button"
                            onClick={() => setShowPrivacyModal(true)}
                            className="text-primary hover:underline font-medium"
                        >
                            Health Data Privacy Practices
                        </button>{' '}
                        and understand how my health information will be used and protected
                        <span className="text-error ml-1">*</span>
                    </label>
                </div>
                {errors.agreeToPrivacy && (
                    <p className="ml-7 text-sm text-error flex items-center space-x-1">
                        <Icon name="ExclamationCircleIcon" size={14} />
                        <span>{errors.agreeToPrivacy}</span>
                    </p>
                )}

                <div className="flex items-start space-x-3">
                    <input
                        type="checkbox"
                        id="agreeToMarketing"
                        checked={formData.agreeToMarketing}
                        onChange={(e) => onChange('agreeToMarketing', e.target.checked)}
                        className="mt-1 w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-primary"
                    />
                    <label htmlFor="agreeToMarketing" className="flex-1 text-sm text-text-secondary">
                        I would like to receive health tips, appointment reminders, and promotional offers via email
                    </label>
                </div>
            </div>

            {showTermsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card rounded-xl shadow-elevation-4 max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-xl font-semibold text-text-primary">Terms of Service & Privacy Policy</h3>
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="p-2 hover:bg-muted rounded-lg transition-base"
                            >
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 text-sm text-text-secondary">
                            <p>
                                By using MediCare, you agree to our terms of service. We are committed to protecting your privacy
                                and ensuring the security of your personal health information.
                            </p>
                            <p>
                                Our platform uses encryption to protect your data. Your information is stored securely
                                and we never share it without your explicit consent.
                            </p>
                            <p>
                                You have the right to access, modify, or delete your personal information at any time through your
                                account settings.
                            </p>
                        </div>
                        <div className="p-6 border-t border-border">
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 transition-base"
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showPrivacyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card rounded-xl shadow-elevation-4 max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-6 border-b border-border">
                            <h3 className="text-xl font-semibold text-text-primary">Health Data Privacy Practices</h3>
                            <button
                                onClick={() => setShowPrivacyModal(false)}
                                className="p-2 hover:bg-muted rounded-lg transition-base"
                            >
                                <Icon name="XMarkIcon" size={20} />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto max-h-[60vh] space-y-4 text-sm text-text-secondary">
                            <p>
                                MediCare takes the protection of your health information seriously. This notice describes how
                                your medical information may be used and disclosed.
                            </p>
                            <p>
                                We use your health information to provide treatment, process appointments, and conduct healthcare
                                operations. Your information may be shared with healthcare providers involved in your care
                                and as required by law.
                            </p>
                            <p>
                                You have the right to inspect and copy your health information, request corrections, and
                                request restrictions on certain uses of your information.
                            </p>
                            <p>
                                All electronic communications are encrypted using industry-standard protocols. We maintain
                                strict access controls to protect your information.
                            </p>
                        </div>
                        <div className="p-6 border-t border-border">
                            <button
                                onClick={() => setShowPrivacyModal(false)}
                                className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 transition-base"
                            >
                                I Understand
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccountSetupSection;