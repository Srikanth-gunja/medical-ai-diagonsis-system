'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import Icon from '@/components/ui/AppIcon';
import RegistrationProgress from './RegistrationProgress';
import PersonalInfoSection from './PersonalInfoSection';
import ContactDetailsSection from './ContactDetailsSection';
import MedicalHistorySection from './MedicalHistorySection';
import AccountSetupSection from './AccountSetupSection';
import TrustSignals from './TrustSignals';

interface FormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  allergies: string;
  currentMedications: string;
  chronicConditions: string[];
  previousSurgeries: string;
  insuranceProvider: string;
  insurancePolicyNumber: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
  agreeToPrivacy: boolean;
  agreeToMarketing: boolean;
}

const RegistrationInteractive = () => {
  const router = useRouter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    bloodGroup: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    currentMedications: '',
    chronicConditions: [],
    previousSurgeries: '',
    insuranceProvider: '',
    insurancePolicyNumber: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    agreeToPrivacy: false,
    agreeToMarketing: false,
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Icon name="ArrowPathIcon" size={32} className="text-primary" />
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!formData.gender) newErrors.gender = 'Gender is required';
    }

    if (step === 2) {
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Invalid email format';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
    }

    if (step === 4) {
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      } else if (
        !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.password)
      ) {
        newErrors.password =
          'Password must include uppercase, lowercase, number, and special character';
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
      if (!formData.agreeToTerms) {
        newErrors.agreeToTerms = 'You must agree to the Terms of Service';
      }
      if (!formData.agreeToPrivacy) {
        newErrors.agreeToPrivacy = 'You must acknowledge the Privacy Practices';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: 'patient',
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          address: formData.address,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          bloodGroup: formData.bloodGroup,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          emergencyContactName: formData.emergencyContactName,
          emergencyContactPhone: formData.emergencyContactPhone,
          allergies: formData.allergies,
          currentMedications: formData.currentMedications,
          chronicConditions: formData.chronicConditions,
          previousSurgeries: formData.previousSurgeries,
          insuranceProvider: formData.insuranceProvider,
          insurancePolicyNumber: formData.insurancePolicyNumber,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ submit: data.error || 'Registration failed' });
        setIsSubmitting(false);
        return;
      }

      // Registration successful - redirect to login
      router.push('/login?registered=true');
    } catch (error) {
      setErrors({ submit: 'Network error. Please try again.' });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 py-8 sm:py-12">
      <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
        <div className="glassmorphism rounded-2xl shadow-elevation-3 overflow-hidden">
          <div className="p-6 sm:p-8 lg:p-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent">
                <Icon name="UserPlusIcon" variant="solid" size={32} className="text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-heading font-bold text-text-primary mb-2">
                Create Your Account
              </h1>
              <p className="text-text-secondary">
                Join MediCare and start your journey to better health
              </p>
            </div>

            <RegistrationProgress currentStep={currentStep} totalSteps={4} />

            <form onSubmit={handleSubmit} className="space-y-8">
              {currentStep === 1 && (
                <PersonalInfoSection formData={formData} errors={errors} onChange={handleChange} />
              )}

              {currentStep === 2 && (
                <ContactDetailsSection
                  formData={formData}
                  errors={errors}
                  onChange={handleChange}
                />
              )}

              {currentStep === 3 && (
                <MedicalHistorySection formData={formData} onChange={handleChange} />
              )}

              {currentStep === 4 && (
                <AccountSetupSection formData={formData} errors={errors} onChange={handleChange} />
              )}

              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="flex items-center justify-center space-x-2 h-12 px-6 border-2 border-primary text-primary font-medium rounded-lg hover:bg-primary/5 transition-base"
                  >
                    <Icon name="ChevronLeftIcon" size={20} />
                    <span>Back</span>
                  </button>
                )}

                {currentStep < 4 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 flex items-center justify-center space-x-2 h-12 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 active:scale-[0.97] transition-base"
                  >
                    <span>Continue</span>
                    <Icon name="ChevronRightIcon" size={20} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 flex items-center justify-center space-x-2 h-12 px-6 bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 active:scale-[0.97] transition-base disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin">
                          <Icon name="ArrowPathIcon" size={20} />
                        </div>
                        <span>Creating Account...</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <Icon name="CheckIcon" size={20} />
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {currentStep === 4 && (
              <div className="mt-8">
                <TrustSignals />
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-text-secondary">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline font-medium">
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegistrationInteractive;
