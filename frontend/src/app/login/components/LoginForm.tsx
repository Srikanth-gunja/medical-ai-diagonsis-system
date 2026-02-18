'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { useToast } from '@/components/ui/Toast';
import { authApi } from '@/lib/api';
import { useFormValidation } from '@/hooks/useFormValidation';

interface LoginFormProps {
  onSubmit?: (email: string, password: string) => void;
}

const REMEMBERED_EMAIL_KEY = 'medicare-remembered-email';

const LoginForm = ({ onSubmit }: LoginFormProps) => {
  const router = useRouter();
  const { showToast } = useToast();
  const [isHydrated, setIsHydrated] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  const {
    errors,
    handleChange,
    handleBlur,
    validateAll,
    isFieldInvalid,
    isFieldValid,
    touched,
  } = useFormValidation({
    rules: {
      email: { required: true, email: true },
      password: { required: true, minLength: 6 },
    },
    validateOnChange: true,
    validateOnBlur: true,
  });

  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBERED_EMAIL_KEY);
    if (rememberedEmail) {
      setFormData((prev) => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
    setIsHydrated(true);
  }, []);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    handleChange(field, value);
  };

  const handleInputBlur = (field: keyof typeof formData) => {
    handleBlur(field, formData[field]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateAll(formData);
    if (Object.keys(validationErrors).length > 0) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please fix the errors in the form.',
      });
      return;
    }

    setIsLoading(true);
    setPendingVerification(false);

    try {
      const response = await authApi.login(formData.email, formData.password);
      if (rememberMe) {
        localStorage.setItem(REMEMBERED_EMAIL_KEY, formData.email.trim());
      } else {
        localStorage.removeItem(REMEMBERED_EMAIL_KEY);
      }

      if (onSubmit) {
        onSubmit(formData.email, formData.password);
      }

      showToast({
        type: 'success',
        title: 'Welcome Back!',
        message: 'Successfully signed in.',
      });

      // Redirect based on role
      if (response.user.role === 'admin') {
        router.push('/admin-dashboard');
      } else if (response.user.role === 'doctor') {
        router.push('/doctor-dashboard');
      } else {
        router.push('/patient-dashboard');
      }
    } catch (error: any) {
      const errorMessage = error.message || '';

      if (errorMessage.includes('pending_verification') || errorMessage.includes('awaiting')) {
        setPendingVerification(true);
        showToast({
          type: 'warning',
          title: 'Verification Pending',
          message: 'Your account is awaiting admin verification. Please check back later.',
          duration: 8000,
        });
      } else if (
        errorMessage.includes('verification_rejected') ||
        errorMessage.includes('rejected')
      ) {
        showToast({
          type: 'error',
          title: 'Verification Rejected',
          message: 'Your doctor verification was rejected. Please contact support.',
          duration: 8000,
        });
      } else {
        showToast({
          type: 'error',
          title: 'Login Failed',
          message: 'Invalid email or password. Please try again.',
        });
      }
      setIsLoading(false);
    }
  };

  if (!isHydrated) {
    return (
      <div className="w-full max-w-md mx-auto p-8 bg-card/80 backdrop-blur-xl rounded-2xl border border-border shadow-elevation-3">
        <div className="space-y-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-3/4 mx-auto" />
          <div className="space-y-4">
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
            <div className="h-12 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 sm:p-8 bg-card/80 backdrop-blur-xl rounded-2xl border border-border shadow-elevation-3">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-accent">
          <Icon name="HeartIcon" variant="solid" size={32} className="text-white" />
        </div>
        <h1 className="text-3xl font-heading font-semibold text-text-primary mb-2">Welcome Back</h1>
        <p className="text-text-secondary">Sign in to access your healthcare dashboard</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Input */}
        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-text-primary">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon name="EnvelopeIcon" size={20} className="text-text-tertiary" />
            </div>
            <input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              onBlur={() => handleInputBlur('email')}
              placeholder="you@example.com"
              className={`w-full h-12 pl-12 pr-12 bg-background border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 transition-base ${
                isFieldInvalid('email')
                  ? 'border-error focus:ring-error/30'
                  : isFieldValid('email')
                  ? 'border-success focus:ring-success/30'
                  : 'border-input focus:ring-ring'
              }`}
            />
            {isFieldValid('email') && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <Icon name="CheckCircleIcon" size={20} className="text-success" />
              </div>
            )}
            {isFieldInvalid('email') && (
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                <Icon name="ExclamationCircleIcon" size={20} className="text-error" />
              </div>
            )}
          </div>
          {touched.email && errors.email && (
            <p className="text-sm text-error flex items-center gap-1 animate-fade-in">
              <Icon name="ExclamationCircleIcon" size={14} />
              <span>{errors.email}</span>
            </p>
          )}
        </div>

        {/* Password Input */}
        <div className="space-y-2">
          <label htmlFor="password" className="block text-sm font-medium text-text-primary">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Icon name="LockClosedIcon" size={20} className="text-text-tertiary" />
            </div>
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              onBlur={() => handleInputBlur('password')}
              placeholder="••••••••"
              className={`w-full h-12 pl-12 pr-12 bg-background border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 transition-base ${
                isFieldInvalid('password')
                  ? 'border-error focus:ring-error/30'
                  : isFieldValid('password')
                  ? 'border-success focus:ring-success/30'
                  : 'border-input focus:ring-ring'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-text-tertiary hover:text-text-secondary transition-base"
            >
              <Icon name={showPassword ? 'EyeSlashIcon' : 'EyeIcon'} size={20} />
            </button>
          </div>
          {touched.password && errors.password && (
            <p className="text-sm text-error flex items-center gap-1 animate-fade-in">
              <Icon name="ExclamationCircleIcon" size={14} />
              <span>{errors.password}</span>
            </p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-input text-primary focus:ring-ring"
            />
            <span className="text-sm text-text-secondary">Remember me</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full h-12 bg-primary text-primary-foreground font-medium rounded-lg hover:shadow-elevation-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-base flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <Icon name="ArrowRightOnRectangleIcon" size={20} />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Signup Link */}
      <div className="mt-8 pt-6 border-t border-border">
        <p className="text-center text-sm text-text-secondary mb-4">New to MediCare?</p>
        <div className="flex gap-3">
          <Link
            href="/patient-registration"
            className="flex-1 py-3 px-4 border border-primary text-primary rounded-lg font-medium hover:bg-primary/5 transition-base text-center text-sm"
          >
            Register as Patient
          </Link>
          <Link
            href="/doctor-registration"
            className="flex-1 py-3 px-4 border border-accent text-accent rounded-lg font-medium hover:bg-accent/5 transition-base text-center text-sm"
          >
            Register as Doctor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
