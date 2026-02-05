'use client';

import { useState, useCallback } from 'react';

interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  match?: string;
  custom?: (value: string) => boolean;
}

interface ValidationRules {
  [key: string]: ValidationRule;
}

interface ValidationErrors {
  [key: string]: string;
}

interface ValidationState {
  errors: ValidationErrors;
  touched: { [key: string]: boolean };
  isValid: boolean;
}

interface UseFormValidationOptions {
  rules: ValidationRules;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

const defaultMessages = {
  required: 'This field is required',
  minLength: (min: number) => `Must be at least ${min} characters`,
  maxLength: (max: number) => `Must be no more than ${max} characters`,
  pattern: 'Invalid format',
  email: 'Please enter a valid email address',
  match: 'Fields do not match',
  custom: 'Invalid value',
};

export function useFormValidation({ 
  rules, 
  validateOnChange = true, 
  validateOnBlur = true 
}: UseFormValidationOptions) {
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const validateField = useCallback((name: string, value: string, allValues?: { [key: string]: string }): string => {
    const rule = rules[name];
    if (!rule) return '';

    // Required check
    if (rule.required && (!value || value.trim() === '')) {
      return defaultMessages.required;
    }

    // Skip other validations if empty and not required
    if (!value && !rule.required) {
      return '';
    }

    // Min length
    if (rule.minLength && value.length < rule.minLength) {
      return defaultMessages.minLength(rule.minLength);
    }

    // Max length
    if (rule.maxLength && value.length > rule.maxLength) {
      return defaultMessages.maxLength(rule.maxLength);
    }

    // Email validation
    if (rule.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return defaultMessages.email;
      }
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(value)) {
      return defaultMessages.pattern;
    }

    // Match validation (for password confirmation)
    if (rule.match && allValues) {
      if (value !== allValues[rule.match]) {
        return defaultMessages.match;
      }
    }

    // Custom validation
    if (rule.custom && !rule.custom(value)) {
      return defaultMessages.custom;
    }

    return '';
  }, [rules]);

  const validateAll = useCallback((values: { [key: string]: string }): ValidationErrors => {
    const newErrors: ValidationErrors = {};
    
    Object.keys(rules).forEach((field) => {
      const error = validateField(field, values[field] || '', values);
      if (error) {
        newErrors[field] = error;
      }
    });

    return newErrors;
  }, [rules, validateField]);

  const handleChange = useCallback((name: string, value: string, allValues?: { [key: string]: string }) => {
    if (validateOnChange && touched[name]) {
      const error = validateField(name, value, allValues);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [validateOnChange, touched, validateField]);

  const handleBlur = useCallback((name: string, value: string, allValues?: { [key: string]: string }) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    
    if (validateOnBlur) {
      const error = validateField(name, value, allValues);
      setErrors(prev => ({
        ...prev,
        [name]: error,
      }));
    }
  }, [validateOnBlur, validateField]);

  const setFieldError = useCallback((name: string, error: string) => {
    setErrors(prev => ({
      ...prev,
      [name]: error,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
    setTouched({});
  }, []);

  const clearFieldError = useCallback((name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const isFieldValid = useCallback((name: string): boolean => {
    return touched[name] && !errors[name];
  }, [touched, errors]);

  const isFieldInvalid = useCallback((name: string): boolean => {
    return touched[name] && !!errors[name];
  }, [touched, errors]);

  return {
    errors,
    touched,
    validateField,
    validateAll,
    handleChange,
    handleBlur,
    setFieldError,
    clearErrors,
    clearFieldError,
    isFieldValid,
    isFieldInvalid,
  };
}

// Password strength checker
export function usePasswordStrength() {
  const checkStrength = useCallback((password: string): { 
    score: number; 
    label: string; 
    color: string;
    requirements: { met: boolean; label: string }[];
  } => {
    const requirements = [
      { met: password.length >= 8, label: 'At least 8 characters' },
      { met: /[A-Z]/.test(password), label: 'One uppercase letter' },
      { met: /[a-z]/.test(password), label: 'One lowercase letter' },
      { met: /[0-9]/.test(password), label: 'One number' },
      { met: /[^A-Za-z0-9]/.test(password), label: 'One special character' },
    ];

    const metCount = requirements.filter(r => r.met).length;
    const score = metCount;

    let label = 'Very Weak';
    let color = '#DC2626'; // red-600

    if (score === 5) {
      label = 'Strong';
      color = '#059669'; // emerald-600
    } else if (score >= 3) {
      label = 'Medium';
      color = '#F59E0B'; // amber-500
    } else if (score >= 2) {
      label = 'Weak';
      color = '#EA580C'; // orange-600
    }

    return { score, label, color, requirements };
  }, []);

  return { checkStrength };
}

export default useFormValidation;
