# RLS (Row-Level Security) Guide

## Overview

This document provides guidance on Row-Level Security (RLS) policies for the SaaSinaSnap platform, focusing on creator-based access control and public content visibility.

## Access Control Architecture

### Creator-Based Security
The platform uses creator-based RLS policies to ensure:
1. **Creator isolation**: Creators can only manage their own content
2. **Public access**: Active content is publicly viewable
3. **User privacy**: Users can only access their own data

## Feature Categorization

### 🔒 Creator-Specific Features (Requires Authentication)
These features require authentication and creator ownership:

#### Creator Dashboard Features
- **Creator Profile Management**: Edit business info, branding, settings
- **Product Management**: Create, edit, delete products
- **Page Management**: Create, edit, delete white-labeled pages
- **Analytics Viewing**: View creator performance metrics
- **Usage Tracking**: View usage metrics and billing information

#### Customer/User Features
- **Account Management**: User profile and settings
- **Subscription Management**: View and manage subscriptions
- **Usage Monitoring**: View personal usage statistics

### 🌐 Public Features (No Authentication Required)
These features provide public access:

#### Public Viewing Features
- **Product Catalog Browsing**: View active products from any creator
- **Landing Page Access**: View white-labeled pages when active
- **Creator Profile Viewing**: View public creator information
- **Pricing Display**: Show pricing information for products

#### Embed Functionality
- **Product Embeds**: Display products on external websites
- **Pricing Embeds**: Show pricing tables on external sites
- **Creator Branding**: Display creator logos, colors, styling
- **Checkout Process**: Process purchases from embedded widgets
- **Trial Access**: Provide trial access to products

#### Public APIs
- **Health Checks**: System status and monitoring
- **Asset Serving**: Serve public assets and configurations
- **CORS-enabled Endpoints**: Support cross-origin requests

## RLS Policy Examples

### 1. Hybrid Access Pattern (Recommended)
For tables that need both public viewing and private management:

```sql
-- Example: creator_products table
-- Public can view active products
create policy "Public can view active products" on creator_products
  for select using (active = true);

-- Creators can manage their own products
create policy "Creators can manage their own products" on creator_products
  for all using (auth.uid() = creator_id);
```

### 2. Creator-Only Access Pattern
For sensitive tables that should only be accessible by the creator:

```sql
-- Example: creator_analytics table
create policy "Creators can view their own analytics" on creator_analytics
  for all using (auth.uid() = creator_id);
```

### 3. User-Specific Access Pattern
For user data:

```sql
-- Example: users table
create policy "Users can manage own data" on users
  for all using (auth.uid() = id);
```

### 4. Public Read, Private Write Pattern
For content that should be publicly readable but privately managed:

```sql
-- Example: white_labeled_pages
create policy "Public read access for active pages" on white_labeled_pages
  for select using (active = true);

create policy "Creators can manage their own pages" on white_labeled_pages
  for insert, update, delete using (auth.uid() = creator_id);
```

## Implementation Patterns

### Client-Side Implementation

#### For Public APIs (Embed functionality)
```typescript
// Use regular server client (respects RLS policies)
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  
  // This will use public access policies
  const { data } = await supabase
    .from('creator_products')
    .select('*')
    .eq('active', true)
    .eq('creator_id', creatorId);
}
```

#### For Creator-Specific APIs (Dashboard functionality)
```typescript
// Use authenticated server client
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const supabase = await createSupabaseServerClient();
  // RLS policies will automatically filter by creator_id
  const { data } = await supabase
    .from('creator_products')
    .select('*')
    .eq('creator_id', user.id);
}
```

## Testing Guidelines

### 1. Public Access Tests
```typescript
describe('Public Access', () => {
  it('should allow viewing active products without authentication', async () => {
    const response = await fetch('/api/products/public');
    expect(response.status).toBe(200);
  });
});
```

### 2. Creator Isolation Tests
```typescript
describe('Creator Isolation', () => {
  it('should prevent cross-creator data access', async () => {
    // Test that creator A cannot access creator B's data
    const creator1Products = await getCreatorProducts(creator1Id);
    const creator2Products = await getCreatorProducts(creator2Id);
    
    expect(creator1Products).not.toContain(creator2Products[0]);
  });
});
```

## Security Considerations

### 1. Data Exposure Prevention
- Always use `active = true` condition for public policies
- Never expose sensitive fields in public policies
- Implement proper field-level security where needed

### 2. Performance Impact
- Index creator_id columns for efficient filtering
- Monitor query performance with RLS enabled
- Consider materialized views for complex public queries

## Conclusion

The RLS implementation provides secure access control while maintaining public accessibility:

- **Public accessibility** for marketing and embed use cases
- **Creator isolation** for management operations  
- **Security boundaries** between different creators
- **User privacy** protection

This approach provides the flexibility needed for a creator-focused SaaS platform while maintaining security standards.