'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Icon from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/Toast';
import { useFormValidation } from '@/hooks/useFormValidation';
import { patientsApi } from '@/lib/api';
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
  const { showToast } = useToast();
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

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

  // Validation rules for each step
  const getValidationRules = useCallback((step: number) => {
    const baseRules: any = {};
    
    if (step === 1) {
      return {
        firstName: { required: true, minLength: 2 },
        lastName: { required: true, minLength: 2 },
        dateOfBirth: { required: true },
        gender: { required: true },
      };
    }
    
    if (step === 2) {
      return {
        email: { required: true, email: true },
        phone: { required: true, pattern: /^[\d\s\-\+\(\)]{10,}$/ },
        address: { required: true, minLength: 5 },
        city: { required: true, minLength: 2 },
        state: { required: true, minLength: 2 },
        zipCode: { required: true, pattern: /^\d{5}(-\d{4})?$/ },
      };
    }
    
    if (step === 4) {
      return {
        password: { 
          required: true, 
          minLength: 8,
          custom: (value: string) => {
            const hasUpper = /[A-Z]/.test(value);
            const hasLower = /[a-z]/.test(value);
            const hasNumber = /\d/.test(value);
            const hasSpecial = /[^A-Za-z0-9]/.test(value);
            return hasUpper && hasLower && hasNumber && hasSpecial;
          }
        },
        confirmPassword: { required: true, match: 'password' },
      };
    }
    
    return baseRules;
  }, []);

  const {
    errors,
    handleChange: validateChange,
    handleBlur: validateBlur,
    validateAll,
    isFieldInvalid,
    isFieldValid,
    touched,
  } = useFormValidation({
    rules: getValidationRules(currentStep),
    validateOnChange: true,
    validateOnBlur: true,
  });

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const handleChange = (field: keyof FormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (typeof value === 'string') {
      validateChange(field, value);
    }
    setSubmitError('');
  };

  const handleBlur = (field: keyof FormData) => {
    setTouchedFields((prev) => new Set(prev).add(field));
    if (typeof formData[field] === 'string') {
      validateBlur(field, formData[field] as string);
    }
  };

  const validateStep = (step: number): boolean => {
    const rules = getValidationRules(step);
    const fieldsToValidate: Record<string, string> = {};
    
    Object.keys(rules).forEach((field) => {
      const value = formData[field as keyof FormData];
      if (typeof value === 'string') {
        fieldsToValidate[field] = value;
      }
    });

    const validationErrors = validateAll(fieldsToValidate);
    
    // Mark all fields in current step as touched
    Object.keys(rules).forEach((field) => {
      setTouchedFields((prev) => new Set(prev).add(field));
    });

    // Additional validation for step 4
    if (step === 4) {
      if (!formData.agreeToTerms) {
        validationErrors.agreeToTerms = 'You must agree to the Terms of Service';
      }
      if (!formData.agreeToPrivacy) {
        validationErrors.agreeToPrivacy = 'You must acknowledge the Privacy Practices';
      }
    }

    return Object.keys(validationErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showToast({
        type: 'success',
        title: `Step ${currentStep} Complete`,
        message: 'Proceeding to next step...',
      });
    } else {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors before continuing.',
      });
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep(4)) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix all errors before submitting.',
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const response = await patientsApi.register({
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
      });

      showToast({
        type: 'success',
        title: 'Registration Successful!',
        message: 'Your account has been created. Redirecting to login...',
        duration: 5000,
      });

      // Registration successful - redirect to login
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 1500);
    } catch (error: any) {
      const errorMessage = error.message || 'Registration failed';
      setSubmitError(errorMessage);
      showToast({
        type: 'error',
        title: 'Registration Failed',
        message: errorMessage,
        duration: 8000,
      });
      setIsSubmitting(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <Icon name="ArrowPathIcon" size={32} className="text-primary" />
        </div>
      </div>
    );
  }

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
              {submitError && (
                <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <Icon name="ExclamationCircleIcon" size={20} className="text-error flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-error">{submitError}</p>
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <PersonalInfoSection 
                  formData={formData} 
                  errors={errors} 
                  touched={touchedFields}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isFieldValid={isFieldValid}
                  isFieldInvalid={isFieldInvalid}
                />
              )}

              {currentStep === 2 && (
                <ContactDetailsSection
                  formData={formData}
                  errors={errors}
                  touched={touchedFields}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isFieldValid={isFieldValid}
                  isFieldInvalid={isFieldInvalid}
                />
              )}

              {currentStep === 3 && (
                <MedicalHistorySection formData={formData} onChange={handleChange} />
              )}

              {currentStep === 4 && (
                <AccountSetupSection 
                  formData={formData} 
                  errors={errors}
                  touched={touchedFields}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isFieldValid={isFieldValid}
                  isFieldInvalid={isFieldInvalid}
                />
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

            <TrustSignals />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegistrationInteractive;
