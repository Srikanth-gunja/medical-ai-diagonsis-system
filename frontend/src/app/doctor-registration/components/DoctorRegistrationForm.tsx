'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import Icon from '@/components/ui/AppIcon';
import SpecialtySelector from './SpecialtySelector';

interface FormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  licenseNumber: string;
  specialty: string;
  yearsOfExperience: string;
  education: string;
  location: string;
  bio: string;
  agreeToTerms: boolean;
  agreeToMedicalRegulations: boolean;
}

interface FormErrors {
  [key: string]: string;
}

const DoctorRegistrationForm = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    licenseNumber: '',
    specialty: '',
    yearsOfExperience: '',
    education: '',
    location: '',
    bio: '',
    agreeToTerms: false,
    agreeToMedicalRegulations: false,
  });

  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must include uppercase, lowercase, and number';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.specialty) {
      newErrors.specialty = 'Please select your specialty';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.agreeToTerms) {
      newErrors.agreeToTerms = 'You must agree to the terms and conditions';
    }

    if (!formData.agreeToMedicalRegulations) {
      newErrors.agreeToMedicalRegulations = 'You must agree to medical practice regulations';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: 'doctor',
          name: formData.fullName,
          specialty: formData.specialty,
          location: formData.location,
          phone: formData.phone,
          experience: parseInt(formData.yearsOfExperience) || 0,
          bio: formData.bio,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.error || 'Registration failed' });
        setIsLoading(false);
        return;
      }

      // Show success message
      setRegistrationSuccess(true);
    } catch (error) {
      setErrors({ general: 'Network error. Please try again.' });
      setIsLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Success State
  if (registrationSuccess) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="glassmorphism rounded-2xl shadow-elevation-3 overflow-hidden">
          <div className="bg-gradient-to-r from-warning to-warning/80 p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon name="ClockIcon" variant="solid" size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-white mb-2">
              Application Submitted!
            </h1>
            <p className="text-white/90">Your account is pending verification</p>
          </div>

          <div className="p-8 text-center space-y-6">
            <div className="bg-warning/10 border border-warning/20 rounded-xl p-6">
              <Icon name="ShieldExclamationIcon" size={32} className="text-warning mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-text-primary mb-2">
                Awaiting Admin Verification
              </h2>
              <p className="text-text-secondary">
                Our team will review your credentials and verify your medical license. This
                typically takes 1-2 business days. You'll receive an email once your account is
                approved.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-center space-x-2 text-text-secondary">
                <Icon name="CheckCircleIcon" size={20} className="text-success" />
                <span>Registration received</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-text-secondary">
                <Icon name="ClockIcon" size={20} className="text-warning" />
                <span>Verification in progress</span>
              </div>
              <div className="flex items-center justify-center space-x-2 text-text-tertiary">
                <Icon name="LockClosedIcon" size={20} />
                <span>Account activation (pending)</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/login')}
              className="w-full h-12 bg-primary text-primary-foreground font-semibold rounded-lg hover:shadow-elevation-2 transition-base"
            >
              Go to Login
            </button>

            <p className="text-sm text-text-secondary">
              Have questions? Contact us at{' '}
              <a href="mailto:support@medicare.com" className="text-primary hover:underline">
                support@medicare.com
              </a>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glassmorphism rounded-2xl shadow-elevation-3 overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-accent p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon name="UserCircleIcon" variant="solid" size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-white mb-2">Doctor Registration</h1>
          <p className="text-white/90 text-sm">
            Join our network of verified medical professionals
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {errors.general && (
            <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <Icon
                  name="ExclamationCircleIcon"
                  size={20}
                  className="text-error flex-shrink-0 mt-0.5"
                />
                <p className="text-sm text-error">{errors.general}</p>
              </div>
            </div>
          )}

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
                <Icon name="UserIcon" size={20} className="text-primary" />
                <span>Personal Information</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Full Name <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="Dr. John Smith"
                    className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 ${errors.fullName
                        ? 'border-error focus:border-error focus:ring-error/20'
                        : 'border-input focus:border-primary focus:ring-primary/20'
                      }`}
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-sm text-error flex items-center space-x-1">
                      <Icon name="ExclamationCircleIcon" size={16} />
                      <span>{errors.fullName}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Email Address <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="doctor@example.com"
                    className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 ${errors.email
                        ? 'border-error focus:border-error focus:ring-error/20'
                        : 'border-input focus:border-primary focus:ring-primary/20'
                      }`}
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-error flex items-center space-x-1">
                      <Icon name="ExclamationCircleIcon" size={16} />
                      <span>{errors.email}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Password <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className={`w-full h-12 px-4 pr-12 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 ${errors.password
                          ? 'border-error focus:border-error focus:ring-error/20'
                          : 'border-input focus:border-primary focus:ring-primary/20'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-base"
                    >
                      <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-error flex items-center space-x-1">
                      <Icon name="ExclamationCircleIcon" size={16} />
                      <span>{errors.password}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Confirm Password <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      placeholder="••••••••"
                      className={`w-full h-12 px-4 pr-12 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 ${errors.confirmPassword
                          ? 'border-error focus:border-error focus:ring-error/20'
                          : 'border-input focus:border-primary focus:ring-primary/20'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary transition-base"
                    >
                      <Icon name={showConfirmPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-error flex items-center space-x-1">
                      <Icon name="ExclamationCircleIcon" size={16} />
                      <span>{errors.confirmPassword}</span>
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="+1 (555) 123-4567"
                    className="w-full h-12 px-4 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Location <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="New York, NY"
                    className={`w-full h-12 px-4 bg-background border rounded-lg transition-base focus:outline-none focus:ring-2 ${errors.location
                        ? 'border-error focus:border-error focus:ring-error/20'
                        : 'border-input focus:border-primary focus:ring-primary/20'
                      }`}
                  />
                  {errors.location && (
                    <p className="mt-1 text-sm text-error flex items-center space-x-1">
                      <Icon name="ExclamationCircleIcon" size={16} />
                      <span>{errors.location}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
                <Icon name="AcademicCapIcon" size={20} className="text-primary" />
                <span>Professional Credentials</span>
              </h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Medical License Number
                    </label>
                    <input
                      type="text"
                      name="licenseNumber"
                      value={formData.licenseNumber}
                      onChange={handleInputChange}
                      placeholder="ML-123456789"
                      className="w-full h-12 px-4 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="yearsOfExperience"
                      value={formData.yearsOfExperience}
                      onChange={handleInputChange}
                      placeholder="10"
                      min="0"
                      className="w-full h-12 px-4 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                </div>

                <SpecialtySelector
                  value={formData.specialty}
                  onChange={(value) => {
                    setFormData((prev) => ({ ...prev, specialty: value }));
                    if (errors.specialty) {
                      setErrors((prev) => ({ ...prev, specialty: '' }));
                    }
                  }}
                  error={errors.specialty}
                />

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    Education Background
                  </label>
                  <input
                    type="text"
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    placeholder="MD, Harvard Medical School"
                    className="w-full h-12 px-4 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            {/* Document Upload - Coming Soon */}
            <div className="pt-6 border-t border-border">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
                <Icon name="DocumentTextIcon" size={20} className="text-primary" />
                <span>Document Verification</span>
              </h2>

              <div className="bg-muted/50 border border-dashed border-border rounded-xl p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon name="CloudArrowUpIcon" size={32} className="text-primary/50" />
                </div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">Coming Soon</h3>
                <p className="text-sm text-text-secondary mb-4">
                  Document upload feature will be available soon. For now, our team will verify your
                  credentials manually.
                </p>
                <span className="inline-flex items-center px-3 py-1 bg-warning/10 text-warning text-xs font-medium rounded-full">
                  <Icon name="ClockIcon" size={14} className="mr-1" />
                  Feature in Development
                </span>
              </div>
            </div>

            <div className="pt-6 border-t border-border">
              <h2 className="text-lg font-semibold text-text-primary mb-4 flex items-center space-x-2">
                <Icon name="BriefcaseIcon" size={20} className="text-primary" />
                <span>About You</span>
              </h2>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell patients about your experience, approach to care, and what makes you unique..."
                  rows={4}
                  className="w-full px-4 py-3 bg-background border border-input rounded-lg transition-base focus:outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 resize-none"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-border space-y-4">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agreeToTerms"
                  name="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-primary/20"
                />
                <label htmlFor="agreeToTerms" className="text-sm text-text-secondary">
                  I agree to the{' '}
                  <a href="#" className="text-primary hover:underline">
                    Terms and Conditions
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary hover:underline">
                    Privacy Policy
                  </a>
                </label>
              </div>
              {errors.agreeToTerms && (
                <p className="text-sm text-error flex items-center space-x-1">
                  <Icon name="ExclamationCircleIcon" size={16} />
                  <span>{errors.agreeToTerms}</span>
                </p>
              )}

              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="agreeToMedicalRegulations"
                  name="agreeToMedicalRegulations"
                  checked={formData.agreeToMedicalRegulations}
                  onChange={handleInputChange}
                  className="mt-1 w-4 h-4 text-primary border-input rounded focus:ring-2 focus:ring-primary/20"
                />
                <label htmlFor="agreeToMedicalRegulations" className="text-sm text-text-secondary">
                  I agree to comply with all medical practice regulations and telemedicine standards
                </label>
              </div>
              {errors.agreeToMedicalRegulations && (
                <p className="text-sm text-error flex items-center space-x-1">
                  <Icon name="ExclamationCircleIcon" size={16} />
                  <span>{errors.agreeToMedicalRegulations}</span>
                </p>
              )}
            </div>
          </div>

          <div className="pt-6 border-t border-border">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-gradient-to-r from-primary to-accent text-white font-semibold rounded-lg hover:shadow-elevation-2 active:scale-[0.98] transition-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Application...</span>
                </>
              ) : (
                <>
                  <Icon name="CheckCircleIcon" size={20} />
                  <span>Submit Registration</span>
                </>
              )}
            </button>

            <p className="mt-4 text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <a href="/login" className="text-primary font-medium hover:underline">
                Sign in here
              </a>
            </p>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center">
        <p className="text-xs text-text-secondary">
          Your application will be reviewed by an administrator. You will receive an email
          notification once your account is verified.
        </p>
      </div>
    </div>
  );
};

export default DoctorRegistrationForm;
