'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Icon from '@/components/ui/AppIcon';
import { authApi } from '@/lib/api';

interface LoginFormProps {
    onSubmit?: (email: string, password: string) => void;
}

const LoginForm = ({ onSubmit }: LoginFormProps) => {
    const router = useRouter();
    const [isHydrated, setIsHydrated] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [pendingVerification, setPendingVerification] = useState(false);
    const [errors, setErrors] = useState<{
        email?: string;
        password?: string;
        general?: string;
    }>({});

    useEffect(() => {
        setIsHydrated(true);
    }, []);



    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateForm = (): boolean => {
        const newErrors: typeof errors = {};

        if (!email) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});
        setPendingVerification(false);

        try {
            const response = await authApi.login(email, password);

            if (onSubmit) {
                onSubmit(email, password);
            }

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

            // Check for pending verification
            if (errorMessage.includes('pending_verification') || errorMessage.includes('awaiting')) {
                setPendingVerification(true);
                setErrors({
                    general: 'Your account is awaiting admin verification. Please check back later.'
                });
            } else if (errorMessage.includes('verification_rejected') || errorMessage.includes('rejected')) {
                setErrors({
                    general: 'Your doctor verification was rejected. Please contact support.'
                });
            } else {
                setErrors({
                    general: 'Invalid email or password. Please try again.'
                });
            }
            setIsLoading(false);
        }
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setEmail(e.target.value);
        if (errors.email) {
            setErrors({ ...errors, email: undefined });
        }
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPassword(e.target.value);
        if (errors.password) {
            setErrors({ ...errors, password: undefined });
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
                <h1 className="text-3xl font-heading font-semibold text-text-primary mb-2">
                    Welcome Back
                </h1>
                <p className="text-text-secondary">
                    Sign in to access your healthcare dashboard
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Pending Verification Banner */}
                {pendingVerification && (
                    <div className="p-4 bg-warning/10 border border-warning/20 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <Icon name="ClockIcon" size={24} className="text-warning flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-warning">Verification Pending</p>
                                <p className="text-xs text-text-secondary mt-1">
                                    Your doctor account is being reviewed by an administrator.
                                    You'll be notified once your account is verified.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {errors.general && !pendingVerification && (
                    <div className="p-4 bg-error/10 border border-error/20 rounded-lg">
                        <div className="flex items-start space-x-3">
                            <Icon name="ExclamationCircleIcon" size={20} className="text-error flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-error">{errors.general}</p>
                        </div>
                    </div>
                )}



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
                            value={email}
                            onChange={handleEmailChange}
                            placeholder="you@example.com"
                            className={`w-full h-12 pl-12 pr-4 bg-background border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 transition-base ${errors.email
                                ? 'border-error focus:ring-error/30'
                                : 'border-input focus:ring-ring'
                                }`}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-sm text-error flex items-center space-x-1">
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
                            value={password}
                            onChange={handlePasswordChange}
                            placeholder="••••••••"
                            className={`w-full h-12 pl-12 pr-12 bg-background border rounded-lg text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 transition-base ${errors.password
                                ? 'border-error focus:ring-error/30'
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
                    {errors.password && (
                        <p className="text-sm text-error flex items-center space-x-1">
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
                <p className="text-center text-sm text-text-secondary mb-4">
                    New to MediCare?
                </p>
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