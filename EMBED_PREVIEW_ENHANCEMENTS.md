# Embed Preview and Generation Enhancements

## Overview
This document outlines the enhancements made to the embed generation and preview functionality in the SaaSinaSnap platform, specifically addressing issues with platform owner embed generation and improving the overall preview experience.

## Issues Addressed

### 1. Platform Owner Authorization Failure ✅
**Problem**: Platform owners were unable to generate embeds because the authorization check in `generateEmbedAction` only allowed users where `user.id === options.creator.id`. For platform owners, the `options.creator.id` is set to `settings.owner_id`, which differs from the authenticated user's ID.

**Solution**: 
- Created helper functions to properly identify platform owners and validate embed generation permissions
- Added `isPlatformOwner(userId)` function to check user role
- Added `canGenerateEmbedsFor(userId, creatorId)` function to validate authorization for both creators and platform owners
- Updated authorization logic in:
  - `src/features/creator/actions/ai-actions.ts` - `generateEmbedAction()` and `startAISessionAction()`
  - `src/app/api/enhanced-embeds/route.ts` - POST endpoint

### 2. Enhanced Embed Preview Page ✅
**Problem**: The embed preview page lacked user-friendly features and integration with other parts of the application.

**Solution**:
- **Redesigned UI** (`src/app/embed-preview/page.tsx`):
  - Modern gradient background (gray-50 to blue-50)
  - Improved layout with better visual hierarchy
  - Added copy and clear functionality
  - Support for both old (div + script) and new (script only) embed formats
  
- **URL Parameter Support**:
  - Pre-fills embed code via `?code=` query parameter
  - Auto-renders preview when code is provided via URL
  - Enables deep linking from other pages

- **Quick Actions Section**:
  - Links to Creator Design Studio
  - Links to Product Embeds
  - Links to Platform Design Studio

### 3. Centralized Preview Integration ✅
**Problem**: No easy way to view embeds from where they are generated.

**Solution**:

#### EmbedBuilderClient
- Added "View in Preview Studio" button alongside "Copy Code" button
- Opens embed preview page in new tab with code pre-filled
- Location: `src/features/creator/components/EmbedBuilderClient.tsx`

#### EnhancedAssetLibraryManager
- Added "View in Preview Studio" option in asset dropdown menu
- Enhanced preview dialog with:
  - Visual preview of the embed
  - Embed code display with copy button
  - "Open in Preview Studio" button
  - Asset metadata (views, conversions, last updated)
- Location: `src/features/creator/components/EnhancedAssetLibraryManager.tsx`

## Technical Implementation Details

### Authorization Logic
```typescript
// Helper to check if user is a platform owner
async function isPlatformOwner(userId: string): Promise<boolean> {
  const supabase = await createSupabaseAdminClient();
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  return user?.user_metadata?.role === 'platform_owner';
}

// Helper to verify user can generate embeds for a creator profile
async function canGenerateEmbedsFor(userId: string, creatorId: string): Promise<boolean> {
  // Direct match - user owns the creator profile
  if (userId === creatorId) {
    return true;
  }
  
  // Check if user is platform owner and creator profile is platform-owned
  const isOwner = await isPlatformOwner(userId);
  if (!isOwner) {
    return false;
  }
  
  // For platform owners, check if the creatorId matches their owner_id in platform_settings
  const platformSettings = await getPlatformSettings(userId);
  return platformSettings?.owner_id === creatorId;
}
```

### Embed Preview URL Integration
The preview page now accepts a `code` query parameter to pre-fill and auto-render embeds:
```typescript
// In embed-preview/page.tsx
useEffect(() => {
  const codeParam = searchParams.get('code');
  if (codeParam) {
    const decodedCode = decodeURIComponent(codeParam);
    setEmbedCode(decodedCode);
    // Auto-render
    setTimeout(() => {
      handleRenderPreview();
    }, 500);
  }
}, [searchParams]);
```

Usage example:
```typescript
window.open(`/embed-preview?code=${encodeURIComponent(embedCode)}`, '_blank');
```

## User Experience Improvements

### For Platform Owners
1. Can now successfully generate embeds for platform products
2. Embeds inherit platform branding and settings
3. Full access to embed generation tools and preview functionality

### For All Users
1. **Improved Embed Preview Page**:
   - Beautiful, modern design
   - Easy-to-use copy and clear buttons
   - Quick navigation to embed generation tools
   - Support for multiple embed formats

2. **Seamless Preview Integration**:
   - "View in Preview Studio" buttons wherever embed codes are displayed
   - Auto-populated preview from generated embeds
   - Comprehensive preview dialog showing code, visual preview, and metadata

3. **Better Workflow**:
   - Generate embed → Copy code → Preview in one click
   - Direct links from asset library to preview studio
   - Consistent experience across creator and platform owner dashboards

## Files Modified

1. `src/features/creator/actions/ai-actions.ts`
   - Added platform owner authorization helpers
   - Updated `generateEmbedAction()` and `startAISessionAction()`

2. `src/app/api/enhanced-embeds/route.ts`
   - Added platform owner authorization to POST endpoint
   - Duplicated helper functions for API route context

3. `src/app/embed-preview/page.tsx`
   - Complete UI redesign
   - URL parameter support for pre-filling code
   - Auto-render functionality
   - Quick action links

4. `src/features/creator/components/EmbedBuilderClient.tsx`
   - Added "View in Preview Studio" button
   - Improved code section layout

5. `src/features/creator/components/EnhancedAssetLibraryManager.tsx`
   - Added "View in Preview Studio" dropdown option
   - Enhanced preview dialog with embed code and metadata
   - Added Textarea import

## Testing Recommendations

### Manual Testing Checklist
- [ ] Platform owner can generate product embeds
- [ ] Platform owner embeds render correctly
- [ ] Creator embeds still work as expected
- [ ] Embed preview page loads correctly
- [ ] Copy button works in preview page
- [ ] Clear button works in preview page
- [ ] URL parameter pre-fills and auto-renders
- [ ] "View in Preview Studio" buttons work from:
  - [ ] EmbedBuilderClient
  - [ ] EnhancedAssetLibraryManager dropdown
  - [ ] EnhancedAssetLibraryManager preview dialog
- [ ] Asset preview dialog shows:
  - [ ] Visual preview
  - [ ] Embed code
  - [ ] Copy button
  - [ ] Preview Studio button
  - [ ] Metadata

### Automated Testing Suggestions
1. Unit tests for authorization helpers:
   - `isPlatformOwner()` returns correct boolean
   - `canGenerateEmbedsFor()` validates all scenarios

2. Integration tests for embed generation:
   - Platform owner can generate embeds
   - Creators can generate embeds
   - Unauthorized users cannot generate embeds

3. E2E tests for preview workflow:
   - Navigate to preview page
   - Paste embed code
   - Verify rendering
   - Test copy functionality
   - Test URL parameter flow

## Next Steps

### Potential Enhancements
1. **Real-time Preview Updates**: Live preview as user types embed code
2. **Embed Templates Library**: Pre-built embed templates for common use cases
3. **Analytics Integration**: Track embed views and conversions
4. **Responsive Preview**: Toggle between desktop/mobile/tablet views
5. **A/B Testing Integration**: Compare different embed variations
6. **Custom CSS Editor**: Allow users to customize embed styles inline
7. **Embed Performance Metrics**: Show load times and performance scores

### Known Limitations
- Embed preview simulates external website environment but may not perfectly match all CSS scenarios
- Platform owner authorization checks require database queries which may impact performance at scale
- URL parameter length limits may affect very large embed codes

## Conclusion

These enhancements successfully address the original issues with platform owner embed generation and significantly improve the overall embed preview experience. The implementation maintains backward compatibility while adding powerful new features that benefit all users of the platform.
