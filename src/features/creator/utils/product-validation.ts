/**
 * Product validation utilities for enhanced error handling and diagnostics
 */

import type { EnhancedProductData } from '@/features/creator/types';

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates enhanced product data before submission
 */
export function validateProductData(productData: Partial<EnhancedProductData>): ValidationResult {
  const errors: ValidationError[] = [];

  // Required field validations
  if (!productData.name || productData.name.trim() === '') {
    errors.push({
      field: 'name',
      message: 'Product name is required and cannot be empty.'
    });
  } else if (productData.name.length > 250) {
    errors.push({
      field: 'name',
      message: 'Product name cannot exceed 250 characters.'
    });
  }

  if (!productData.price || productData.price <= 0) {
    errors.push({
      field: 'price',
      message: 'Product price must be greater than 0.'
    });
  } else if (productData.price > 999999.99) {
    errors.push({
      field: 'price',
      message: 'Product price cannot exceed $999,999.99.'
    });
  }

  if (!productData.currency || productData.currency.trim() === '') {
    errors.push({
      field: 'currency',
      message: 'Currency is required.'
    });
  } else if (!/^[a-z]{3}$/.test(productData.currency)) {
    errors.push({
      field: 'currency',
      message: 'Currency must be a valid 3-letter ISO code (e.g., "usd").'
    });
  }

  if (!productData.product_type) {
    errors.push({
      field: 'product_type',
      message: 'Product type is required.'
    });
  } else if (!['one_time', 'subscription', 'usage_based'].includes(productData.product_type)) {
    errors.push({
      field: 'product_type',
      message: 'Product type must be one of: one_time, subscription, usage_based.'
    });
  }

  // Optional field validations
  if (productData.description && productData.description.length > 5000) {
    errors.push({
      field: 'description',
      message: 'Product description cannot exceed 5000 characters.'
    });
  }

  if (productData.statement_descriptor && productData.statement_descriptor.length > 22) {
    errors.push({
      field: 'statement_descriptor',
      message: 'Statement descriptor cannot exceed 22 characters.'
    });
  }

  if (productData.images && productData.images.length > 8) {
    errors.push({
      field: 'images',
      message: 'Cannot have more than 8 product images (Stripe limit).'
    });
  }

  // Subscription-specific validations
  if (productData.product_type === 'subscription') {
    if (productData.billing_interval && !['day', 'week', 'month', 'year'].includes(productData.billing_interval)) {
      errors.push({
        field: 'billing_interval',
        message: 'Billing interval must be one of: day, week, month, year.'
      });
    }

    if (productData.billing_interval_count && (productData.billing_interval_count < 1 || productData.billing_interval_count > 12)) {
      errors.push({
        field: 'billing_interval_count',
        message: 'Billing interval count must be between 1 and 12.'
      });
    }

    if (productData.trial_period_days && (productData.trial_period_days < 1 || productData.trial_period_days > 730)) {
      errors.push({
        field: 'trial_period_days',
        message: 'Trial period must be between 1 and 730 days.'
      });
    }
  }

  // Usage-based validations
  if (productData.product_type === 'usage_based') {
    if (productData.usage_type && !['metered', 'licensed'].includes(productData.usage_type)) {
      errors.push({
        field: 'usage_type',
        message: 'Usage type must be either "metered" or "licensed".'
      });
    }

    if (productData.aggregate_usage && !['sum', 'last_during_period', 'last_ever', 'max'].includes(productData.aggregate_usage)) {
      errors.push({
        field: 'aggregate_usage',
        message: 'Aggregate usage must be one of: sum, last_during_period, last_ever, max.'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validates Stripe connection for a creator
 */
export interface StripeConnectionValidation {
  isValid: boolean;
  error?: string;
  accountId?: string;
}

export function validateStripeConnection(stripeAccountId: string | null | undefined): StripeConnectionValidation {
  if (!stripeAccountId || stripeAccountId.trim() === '') {
    return {
      isValid: false,
      error: 'Stripe account not connected. Please complete Stripe onboarding first.'
    };
  }

  // Basic Stripe account ID format validation
  if (!stripeAccountId.startsWith('acct_')) {
    return {
      isValid: false,
      error: 'Invalid Stripe account ID format.',
      accountId: stripeAccountId
    };
  }

  return {
    isValid: true,
    accountId: stripeAccountId
  };
}

/**
 * Sanitizes product data for safe storage/transmission
 */
export function sanitizeProductData(productData: EnhancedProductData): EnhancedProductData {
  return {
    ...productData,
    name: productData.name.trim(),
    description: productData.description?.trim() || undefined,
    images: productData.images?.filter(img => img && img.trim() !== '') || [],
    statement_descriptor: productData.statement_descriptor?.trim().substring(0, 22) || undefined,
    unit_label: productData.unit_label?.trim() || undefined,
    currency: productData.currency.toLowerCase().trim(),
    features: productData.features?.filter(f => f && f.trim() !== '') || [],
    tags: productData.tags?.filter(t => t && t.trim() !== '') || [],
    category: productData.category?.trim() || undefined,
  };
}

/**
 * Formats validation errors into a user-friendly message
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  if (errors.length === 0) return '';
  
  if (errors.length === 1) {
    return errors[0].message;
  }

  return `Please fix the following errors:\n${errors.map(e => `• ${e.message}`).join('\n')}`;
}
