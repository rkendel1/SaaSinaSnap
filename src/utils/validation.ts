import { z } from 'zod';

// Email validation schema
export const emailSchema = z.string().email('Please enter a valid email address');

// Business name validation schema
export const businessNameSchema = z
  .string()
  .min(2, 'Business name must be at least 2 characters')
  .max(100, 'Business name must be less than 100 characters')
  .regex(/^[a-zA-Z0-9\s\-_.&]+$/, 'Business name contains invalid characters');

// Website URL validation schema
export const websiteSchema = z
  .string()
  .url('Please enter a valid website URL')
  .optional()
  .or(z.literal(''));

// Phone number validation schema
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Please enter a valid phone number (E.164 format)')
  .optional()
  .or(z.literal(''));

// Billing address schema
export const billingAddressSchema = z.object({
  line1: z.string().min(1, 'Address Line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State/Province is required'),
  postal_code: z.string().min(1, 'Postal Code is required'),
  country: z.string().min(1, 'Country is required'),
}).partial(); // Make all fields optional for initial setup, can be refined later

// Password validation schema (for potential future use)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number');

// Validation utilities
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateEmail(email: string): ValidationResult {
  try {
    emailSchema.parse(email);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid email' };
  }
}

export function validateBusinessName(name: string): ValidationResult {
  try {
    businessNameSchema.parse(name);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid business name' };
  }
}

export function validateWebsite(url: string): ValidationResult {
  try {
    websiteSchema.parse(url);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid website URL' };
  }
}

export function validatePhone(phone: string): ValidationResult {
  try {
    phoneSchema.parse(phone);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid phone number' };
  }
}

export function validateBillingAddress(address: any): ValidationResult {
  try {
    billingAddressSchema.parse(address);
    return { isValid: true };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message };
    }
    return { isValid: false, error: 'Invalid billing address' };
  }
}

// Real-time validation hook (will be used in components)
import { useEffect, useState } from 'react';

export function useRealTimeValidation<T>(
  value: T,
  validator: (value: T) => ValidationResult,
  debounceMs: number = 300
) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({ isValid: true });
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!value) {
      setValidationResult({ isValid: true });
      return;
    }

    setIsValidating(true);
    const timeoutId = setTimeout(() => {
      const result = validator(value);
      setValidationResult(result);
      setIsValidating(false);
    }, debounceMs);

    return () => clearTimeout(timeoutId);
  }, [value, validator, debounceMs]);

  return { ...validationResult, isValidating };
}