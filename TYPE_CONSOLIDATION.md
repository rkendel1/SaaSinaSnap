# Type Consolidation - CreatorProfile and CreatorProduct

## Overview

This document describes the consolidation of `CreatorProfile` and `CreatorProduct` type definitions that were previously duplicated across multiple locations in the codebase.

## Problem Statement

Previously, `CreatorProfile` and `CreatorProduct` types were defined in multiple places:

1. **src/features/creator-onboarding/types/index.ts** - Type extending database Row
2. **src/features/creator/types/index.ts** - Interface with similar fields
3. **src/features/creator/components/PostHogSaaSDashboardDemo.tsx** - Local interface for demo purposes (intentionally kept separate)

This duplication led to:
- Potential type inconsistencies
- Maintenance overhead when adding new fields
- Confusion about which type definition to use
- Risk of types diverging over time

## Solution

### 1. Created Centralized Types Directory

Created a new shared types directory at `src/features/shared/types/` to house centralized type definitions used across multiple features.

**File structure:**
```
src/features/shared/
├── index.ts                 # Re-exports from types
└── types/
    └── index.ts            # Centralized type definitions
```

### 2. Centralized Type Definitions

#### CreatorProfile

The centralized `CreatorProfile` type extends the database schema with additional typed fields:

```typescript
export type CreatorProfile = Database['public']['Tables']['creator_profiles']['Row'] & {
  // Typed JSON fields (converted from generic Json type)
  brand_gradient?: GradientConfig | null;
  brand_pattern?: PatternConfig | null;
  extracted_branding_data?: ExtractedBrandingData | null;
  
  // Additional billing fields not in database schema
  business_email?: string | null;
  billing_email?: string | null;
  billing_phone?: string | null;
  billing_address?: BillingAddress | null;
  
  // Additional integration fields
  enabled_integrations?: string[] | null;
  webhook_endpoints?: WebhookEndpoint[] | null;
  
  // Stripe access tokens (may not be persisted for security)
  stripe_access_token?: string | null;
  stripe_refresh_token?: string | null;
};
```

**Key points:**
- Extends database Row type from Supabase
- Provides typed interfaces for JSON columns (brand_gradient, brand_pattern, extracted_branding_data)
- Includes application-level fields not in the database (business_email, billing fields, integrations)
- Documents which fields are DB-backed vs. application-level

#### CreatorProduct

The centralized `CreatorProduct` type:

```typescript
export type CreatorProduct = Database['public']['Tables']['creator_products']['Row'] & {
  // Application-level extensions
  image_url?: string | null;
  status?: ProductStatus | string | null;
};
```

**Key points:**
- Extends database Row type
- All environment management fields (stripe_test_*, stripe_production_*, etc.) are now in the database schema
- Only adds application-level extensions (image_url, status)

### 3. Updated Existing Type Files

#### creator-onboarding/types/index.ts

Changed from defining types to re-exporting them:

```typescript
// Re-export centralized types from shared directory
export type {
  CreatorProfile,
  CreatorProfileInsert,
  CreatorProfileUpdate,
  CreatorProduct,
  CreatorProductInsert,
  CreatorProductUpdate,
  ProductStatus,
} from '@/features/shared/types';

// Import types for use in this file
import type {
  CreatorProfile,
  CreatorProduct,
} from '@/features/shared/types';
```

#### creator/types/index.ts

Similarly updated to re-export:

```typescript
export type {
  CreatorProfile,
  CreatorProduct,
  ProductStatus,
} from '@/features/shared/types';

// Import ProductStatus for use in this file
import type { ProductStatus } from '@/features/shared/types';
```

### 4. Import Patterns

After consolidation, all imports of `CreatorProfile` and `CreatorProduct` follow this pattern:

```typescript
// Preferred: Import from feature-specific types (which re-export from shared)
import { CreatorProfile } from '@/features/creator/types';
import { CreatorProfile } from '@/features/creator-onboarding/types';

// Also valid: Import directly from shared (for new code)
import { CreatorProfile } from '@/features/shared/types';
```

All three patterns work correctly because feature-specific type files re-export from shared.

## Benefits

1. **Single Source of Truth**: One definition of CreatorProfile and CreatorProduct
2. **Consistency**: No risk of types diverging across features
3. **Maintainability**: Updates to types only need to be made in one place
4. **Documentation**: Comprehensive inline documentation in the centralized types
5. **Type Safety**: Better TypeScript checking with unified types
6. **Backward Compatible**: Existing imports continue to work via re-exports

## Files Changed

### New Files
- `src/features/shared/index.ts` - Shared feature exports
- `src/features/shared/types/index.ts` - Centralized type definitions

### Modified Files
- `src/features/creator-onboarding/types/index.ts` - Changed to re-export from shared
- `src/features/creator/types/index.ts` - Changed to re-export from shared

### Unchanged Files
- `src/features/creator/components/PostHogSaaSDashboardDemo.tsx` - Kept local interface for demo (intentional)
- All other files importing CreatorProfile/CreatorProduct continue to work without changes

## Pre-existing Issues Found

During this refactoring, several pre-existing type issues were identified (not caused by this change):

1. **Missing Database Fields**: Some code uses fields that don't exist in the database schema:
   - `page_slug` on CreatorProfile (used in several services)
   - `business_logo` instead of `business_logo_url`
   - `business_type` and `target_market` fields

2. **Type Mismatches**: Some mock data objects don't include all required database fields:
   - `PlatformDesignStudioClient.tsx` creates incomplete CreatorProfile objects

3. **Database Schema vs. Types**: Some fields in the application types are not in the database:
   - `image_url` on CreatorProduct (application-level only)
   - `status` on CreatorProduct (application-level only)

These issues existed before the consolidation and are documented here for future fixes.

## Testing

The consolidation was validated by:

1. **TypeScript Compilation**: Verified types compile without module resolution errors
2. **Import Resolution**: Confirmed all re-exports work correctly
3. **Linting**: Fixed import/export sorting per project standards
4. **Build Process**: Ensured application builds successfully

## Migration Guide

For future developers:

### Adding New Fields to CreatorProfile

1. First, add the field to the database migration if it's a database field
2. Update the Supabase types: `npm run generate-types`
3. Add any application-level fields to the extended type in `src/features/shared/types/index.ts`
4. Document the field with inline comments

### Adding New Fields to CreatorProduct

Same process as CreatorProfile.

### Creating New Shared Types

1. Add the type definition to `src/features/shared/types/index.ts`
2. Export it from the file
3. Import it where needed from `@/features/shared/types`

## Related Documentation

- Database schema: `supabase/migrations/`
- Type generation: `npm run generate-types`
- Supabase types: `src/libs/supabase/types.ts`
