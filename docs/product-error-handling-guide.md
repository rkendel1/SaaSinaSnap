# Product Creation Error Handling and Diagnostics Guide

## Overview

This guide documents the comprehensive error handling and diagnostic improvements made to the product creation system to eliminate 500 errors and provide actionable error messages to users.

## Key Features

### 1. Comprehensive Error Handling

All product creation and update operations now include:
- **Try-catch blocks** around all external API calls (Stripe, Supabase)
- **Detailed error logging** with context at each step
- **Specific error messages** instead of generic 500 errors
- **Separate handling** for Stripe vs Supabase failures

### 2. Input Validation

Product data is validated before submission:
- **Required fields**: name, price, currency, product_type
- **Field constraints**: character limits, numeric ranges, format validation
- **Type-specific validation**: subscription billing intervals, usage-based pricing settings
- **Stripe limits**: image count (max 8), statement descriptor length (max 22 chars)

### 3. Detailed Logging

Every operation logs:
- **Operation start**: with input parameters
- **Progress updates**: at each major step
- **Error details**: with error type, code, and full context
- **Success confirmation**: with result IDs and status

### 4. User-Friendly Error Messages

Errors are formatted to be actionable:
- Clear description of what went wrong
- Guidance on how to fix the issue
- Specific field names for validation errors
- Connection status for Stripe/network issues

## Error Types and Messages

### Authentication Errors

**Error**: "Not authenticated. Please log in and try again."
- **Cause**: User session expired or not logged in
- **Solution**: Log in and retry the operation

### Stripe Connection Errors

**Error**: "Stripe account not connected. Please complete Stripe onboarding first."
- **Cause**: Creator hasn't connected their Stripe account
- **Solution**: Complete the Stripe Connect onboarding flow

**Error**: "Invalid Stripe account ID format."
- **Cause**: Stored Stripe account ID is corrupted
- **Solution**: Reconnect Stripe account through onboarding

### Validation Errors

**Error**: "Product name is required and cannot be empty."
- **Cause**: Empty or whitespace-only product name
- **Solution**: Provide a valid product name

**Error**: "Product price must be greater than 0."
- **Cause**: Invalid price (zero or negative)
- **Solution**: Set a positive price value

**Error**: "Currency must be a valid 3-letter ISO code (e.g., 'usd')."
- **Cause**: Invalid currency format
- **Solution**: Use a valid ISO currency code

**Error**: "Cannot have more than 8 product images (Stripe limit)."
- **Cause**: Too many images provided
- **Solution**: Reduce image count to 8 or fewer

### Stripe API Errors

**Error**: "Failed to create product in Stripe: [specific Stripe error]"
- **Cause**: Stripe API rejected the request
- **Solution**: Check error details and fix the issue (often invalid data format)

**Error**: "Failed to create price in Stripe: [specific Stripe error]"
- **Cause**: Stripe API rejected the price creation
- **Solution**: Verify price amount and currency are valid

**Error**: "Failed to update product in Stripe: [specific Stripe error]"
- **Cause**: Stripe API rejected the update
- **Solution**: Check if product exists and data is valid

### Database Errors

**Error**: "Failed to save product to database: [specific error]"
- **Cause**: Database constraint violation or connection issue
- **Solution**: Check for duplicate data or network connectivity

**Error**: "Failed to fetch existing product: [specific error]"
- **Cause**: Product doesn't exist or database error
- **Solution**: Verify product ID is correct

**Error**: "Product not found. It may have been deleted."
- **Cause**: Attempting to update non-existent product
- **Solution**: Create a new product instead

## Diagnostic Logging

### Log Format

All logs follow this format:
```
[Operation Name] Message: { context }
```

Example:
```
[Product Action] Starting product creation/update: { 
  productId: "123", 
  productName: "My Product",
  hasDescription: true,
  hasImages: true,
  price: 29.99,
  currency: "usd"
}
```

### Log Levels

1. **Info logs** (`console.log`): Normal operation progress
2. **Warning logs** (`console.warn`): Non-critical issues
3. **Error logs** (`console.error`): Failures with full context

### Key Log Points

#### Product Creation Flow:
1. Operation start with input data
2. User authentication confirmation
3. Product data validation success
4. Creator profile retrieval
5. Stripe connection validation
6. Optional fields sanitization
7. Supabase admin client connection
8. Stripe product creation (with result)
9. Stripe price creation (with result)
10. Database insertion (with result)
11. Path revalidation
12. Operation completion

#### Error Logging:
- Error message and type
- Error code (Stripe/Supabase specific)
- Full error stack trace
- Operation context (IDs, values)
- Timestamp

## Using the Utilities

### Product Validation

```typescript
import { validateProductData, formatValidationErrors } from '@/features/creator/utils/product-validation';

// Validate before submission
const validation = validateProductData(productData);
if (!validation.isValid) {
  const errorMessage = formatValidationErrors(validation.errors);
  // Show to user
  toast.error(errorMessage);
  return;
}
```

### Stripe Connection Validation

```typescript
import { validateStripeConnection } from '@/features/creator/utils/product-validation';

const stripeValidation = validateStripeConnection(creatorProfile?.stripe_account_id);
if (!stripeValidation.isValid) {
  toast.error(stripeValidation.error);
  return;
}
```

### Product Data Sanitization

```typescript
import { sanitizeProductData } from '@/features/creator/utils/product-validation';

// Sanitize before submission
const sanitized = sanitizeProductData(productData);
await createOrUpdateEnhancedProductAction(sanitized);
```

### Error Formatting

```typescript
import { formatStripeError, formatSupabaseError } from '@/features/creator/utils/error-logging';

try {
  await createProduct();
} catch (error) {
  if (error.type?.startsWith('Stripe')) {
    toast.error(formatStripeError(error));
  } else {
    toast.error(formatSupabaseError(error));
  }
}
```

## Troubleshooting Guide

### Product Creation Fails

1. **Check browser console** for detailed error logs
2. **Verify Stripe connection** is active and valid
3. **Validate all required fields** are filled
4. **Check field lengths** don't exceed limits
5. **Verify price** is positive and reasonable
6. **Check network connectivity** for API calls

### Finding Root Cause

1. **Search console logs** for `[Product Action]` entries
2. **Look for error logs** with red highlighting
3. **Check error context** for specific values
4. **Verify Stripe Dashboard** for account issues
5. **Check Supabase logs** for database errors

### Common Issues and Fixes

| Issue | Cause | Solution |
|-------|-------|----------|
| 500 error on creation | Missing error handling | Update to latest code with enhanced error handling |
| "Not authenticated" | Session expired | Log in again |
| "Stripe account not connected" | Incomplete onboarding | Complete Stripe Connect flow |
| "Product name is required" | Empty name field | Provide valid name |
| "Invalid currency" | Wrong format | Use 3-letter ISO code (e.g., 'usd') |
| "Cannot have more than 8 images" | Too many images | Reduce to 8 or fewer |
| Database constraint error | Duplicate data | Use unique values or update existing |

## Best Practices

### For Developers

1. **Always use validation** before API calls
2. **Log at every major step** for debugging
3. **Use specific error messages** not generic ones
4. **Include context** in error logs
5. **Handle both Stripe and Supabase errors** separately
6. **Test error paths** not just happy paths

### For Users

1. **Fill all required fields** before submitting
2. **Use valid formats** for currency, prices, etc.
3. **Stay within limits** (image count, text lengths)
4. **Complete Stripe onboarding** before creating products
5. **Check network connection** if operations fail
6. **Contact support** with console logs for persistent issues

## API Reference

See the full API documentation in:
- `docs/product-management-api.md`
- `src/features/creator/utils/product-validation.ts`
- `src/features/creator/utils/error-logging.ts`

## Support

For issues or questions:
1. Check console logs for detailed error information
2. Review this guide for common solutions
3. Check Stripe Dashboard for account issues
4. Contact technical support with:
   - Error message
   - Console logs
   - Steps to reproduce
   - User ID and product details
