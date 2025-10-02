# Integration Examples - Next.js, Express, and React

Complete integration examples for implementing the Tiering and Usage Service in popular frameworks.

## Table of Contents

1. [Next.js Integration](#nextjs-integration)
2. [Express.js Integration](#expressjs-integration)
3. [React Integration](#react-integration)
4. [Vue.js Integration](#vuejs-integration)
5. [Node.js SDK](#nodejs-sdk)

## Next.js Integration

### Setup

```bash
npm install @saasinasnap/usage-sdk
```

### Configuration

```typescript
// lib/usage-config.ts
export const usageConfig = {
  creatorId: process.env.NEXT_PUBLIC_CREATOR_ID!,
  apiKey: process.env.USAGE_API_KEY!,
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.saasinasnap.com'
};
```

### Server-Side API Route with Usage Tracking

```typescript
// app/api/data/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check usage enforcement BEFORE processing
    const enforcementResponse = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/usage/customer/enforcement`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creatorId: process.env.NEXT_PUBLIC_CREATOR_ID,
          metricName: 'api_calls',
          requestedUsage: 1
        })
      }
    );

    const enforcement = await enforcementResponse.json();

    // Block if usage limit exceeded
    if (!enforcement.enforcement.allowed) {
      return NextResponse.json({
        error: 'Usage limit exceeded',
        message: 'Please upgrade your plan to continue',
        upgrade_url: '/pricing',
        usage: {
          current: enforcement.enforcement.current_usage,
          limit: enforcement.enforcement.limit_value
        }
      }, { status: 429 });
    }

    // Process the actual request
    const data = await fetchData(request);

    // Track the usage event (fire and forget)
    trackUsageAsync({
      meterId: process.env.USAGE_METER_ID_API_CALLS!,
      eventName: 'api_calls',
      userId: session.user.id,
      eventValue: 1,
      properties: {
        endpoint: request.nextUrl.pathname,
        method: request.method
      }
    });

    // Add usage warning header if approaching limit
    const headers: Record<string, string> = {};
    if (enforcement.enforcement.should_warn) {
      headers['X-Usage-Warning'] = 
        `${enforcement.enforcement.usage_percentage}% of limit used`;
    }

    return NextResponse.json({ 
      success: true, 
      data 
    }, { headers });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper to track usage asynchronously
async function trackUsageAsync(event: any) {
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/usage/track`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.USAGE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
  } catch (error) {
    console.error('Usage tracking failed:', error);
  }
}

async function fetchData(request: NextRequest) {
  // Your data fetching logic
  return { message: 'Data fetched successfully' };
}
```

### Client-Side Usage Display Component

```tsx
// components/UsageDisplay.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface UsageData {
  tier: {
    name: string;
    price: number;
  };
  usage_summary: Record<string, {
    current_usage: number;
    limit_value: number | null;
    usage_percentage: number;
  }>;
  next_billing_date: string;
}

export default function UsageDisplay() {
  const { data: session } = useSession();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      fetchUsageData();
    }
  }, [session]);

  const fetchUsageData = async () => {
    try {
      const response = await fetch(
        `/api/usage/customer/tier?creatorId=${process.env.NEXT_PUBLIC_CREATOR_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${session?.accessToken}`
          }
        }
      );

      const data = await response.json();
      setUsageData(data.tier_info);
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse">Loading usage data...</div>;
  }

  if (!usageData) {
    return <div>No subscription found</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        Your Plan: {usageData.tier.name}
      </h3>

      <div className="space-y-4">
        {Object.entries(usageData.usage_summary).map(([metric, data]) => (
          <div key={metric} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium capitalize">
                {metric.replace('_', ' ')}
              </span>
              <span>
                {data.current_usage.toLocaleString()} 
                {data.limit_value && ` / ${data.limit_value.toLocaleString()}`}
              </span>
            </div>

            {data.limit_value && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    data.usage_percentage > 90 ? 'bg-red-600' :
                    data.usage_percentage > 75 ? 'bg-yellow-500' :
                    'bg-green-600'
                  }`}
                  style={{ width: `${Math.min(data.usage_percentage, 100)}%` }}
                />
              </div>
            )}

            {data.usage_percentage > 80 && (
              <p className="text-sm text-orange-600">
                ⚠️ You're approaching your limit
              </p>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t">
        <p className="text-sm text-gray-600">
          Next billing: {new Date(usageData.next_billing_date).toLocaleDateString()}
        </p>
        <button className="mt-2 text-blue-600 text-sm hover:underline">
          Upgrade Plan →
        </button>
      </div>
    </div>
  );
}
```

### Middleware for Global Usage Tracking

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Track page views if authenticated
  if (request.cookies.has('session-token')) {
    // Fire and forget - don't block the request
    trackPageView(request).catch(console.error);
  }

  return response;
}

async function trackPageView(request: NextRequest) {
  const sessionToken = request.cookies.get('session-token')?.value;
  
  if (!sessionToken) return;

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/usage/track`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.USAGE_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      meterId: process.env.USAGE_METER_ID_PAGE_VIEWS!,
      eventName: 'page_views',
      userId: sessionToken,
      eventValue: 1,
      properties: {
        path: request.nextUrl.pathname,
        referrer: request.headers.get('referer') || 'direct'
      }
    })
  });
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
```

---

## Express.js Integration

### Setup

```bash
npm install express @saasinasnap/usage-sdk
```

### Usage Tracking Middleware

```javascript
// middleware/usageTracking.js
const fetch = require('node-fetch');

const config = {
  apiKey: process.env.USAGE_API_KEY,
  creatorId: process.env.CREATOR_ID,
  baseURL: process.env.API_URL || 'https://api.saasinasnap.com'
};

// Middleware to check usage limits
async function checkUsageLimit(req, res, next) {
  try {
    // Skip for unauthenticated requests
    if (!req.user) {
      return next();
    }

    const response = await fetch(
      `${config.baseURL}/api/usage/customer/enforcement`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${req.user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          creatorId: config.creatorId,
          metricName: 'api_calls',
          requestedUsage: 1
        })
      }
    );

    const enforcement = await response.json();

    if (!enforcement.enforcement.allowed) {
      return res.status(429).json({
        error: 'Usage limit exceeded',
        message: 'Please upgrade your plan to continue',
        usage: {
          current: enforcement.enforcement.current_usage,
          limit: enforcement.enforcement.limit_value
        }
      });
    }

    // Add usage info to request for later use
    req.usageInfo = enforcement.enforcement;

    // Add warning header if approaching limit
    if (enforcement.enforcement.should_warn) {
      res.setHeader(
        'X-Usage-Warning',
        `${enforcement.enforcement.usage_percentage}% of limit used`
      );
    }

    next();
  } catch (error) {
    console.error('Usage check failed:', error);
    // Don't block requests on usage check failures
    next();
  }
}

// Middleware to track usage after request
function trackUsage(metricName) {
  return async (req, res, next) => {
    // Override res.json to track after sending response
    const originalJson = res.json.bind(res);
    
    res.json = function(data) {
      // Track usage asynchronously
      if (req.user) {
        trackUsageAsync({
          meterId: process.env[`METER_ID_${metricName.toUpperCase()}`],
          eventName: metricName,
          userId: req.user.id,
          eventValue: 1,
          properties: {
            endpoint: req.path,
            method: req.method,
            status: res.statusCode
          }
        }).catch(console.error);
      }
      
      return originalJson(data);
    };

    next();
  };
}

async function trackUsageAsync(event) {
  try {
    await fetch(`${config.baseURL}/api/v1/usage/track`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(event)
    });
  } catch (error) {
    console.error('Usage tracking failed:', error);
  }
}

module.exports = {
  checkUsageLimit,
  trackUsage
};
```

### Using the Middleware

```javascript
// app.js
const express = require('express');
const { checkUsageLimit, trackUsage } = require('./middleware/usageTracking');

const app = express();

// Apply to all API routes
app.use('/api', checkUsageLimit);

// Track specific endpoints
app.get('/api/users', 
  trackUsage('api_calls'),
  async (req, res) => {
    const users = await getUsers();
    res.json({ success: true, users });
  }
);

app.post('/api/projects',
  trackUsage('projects_created'),
  async (req, res) => {
    const project = await createProject(req.body);
    res.json({ success: true, project });
  }
);

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

### Usage Dashboard Route

```javascript
// routes/usage.js
const express = require('express');
const router = express.Router();

router.get('/usage', async (req, res) => {
  try {
    const response = await fetch(
      `${process.env.API_URL}/api/usage/customer/tier?creatorId=${process.env.CREATOR_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${req.user.token}`
        }
      }
    );

    const data = await response.json();

    res.render('usage', {
      tier: data.tier_info.tier,
      usage: data.tier_info.usage_summary,
      nextBilling: data.tier_info.next_billing_date
    });
  } catch (error) {
    console.error('Failed to fetch usage:', error);
    res.status(500).render('error');
  }
});

module.exports = router;
```

---

## React Integration

### Custom Hook for Usage Tracking

```typescript
// hooks/useUsageTracking.ts
import { useCallback } from 'react';
import { useAuth } from './useAuth';

interface TrackEventOptions {
  eventName: string;
  eventValue?: number;
  properties?: Record<string, any>;
}

export function useUsageTracking() {
  const { user, token } = useAuth();

  const trackEvent = useCallback(async (options: TrackEventOptions) => {
    if (!user || !token) {
      console.warn('User not authenticated, skipping usage tracking');
      return;
    }

    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/v1/usage/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meterId: process.env[`REACT_APP_METER_ID_${options.eventName.toUpperCase()}`],
          eventName: options.eventName,
          userId: user.id,
          eventValue: options.eventValue || 1,
          properties: options.properties
        })
      });
    } catch (error) {
      console.error('Usage tracking failed:', error);
    }
  }, [user, token]);

  const trackApiCall = useCallback((endpoint: string, method: string) => {
    return trackEvent({
      eventName: 'api_calls',
      properties: { endpoint, method }
    });
  }, [trackEvent]);

  const trackFeatureUsage = useCallback((featureName: string) => {
    return trackEvent({
      eventName: 'feature_usage',
      properties: { feature: featureName }
    });
  }, [trackEvent]);

  return {
    trackEvent,
    trackApiCall,
    trackFeatureUsage
  };
}
```

### Usage Display Component

```typescript
// components/UsageDisplay.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface UsageSummary {
  [metric: string]: {
    current_usage: number;
    limit_value: number | null;
    usage_percentage: number;
  };
}

export function UsageDisplay() {
  const { token } = useAuth();
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, [token]);

  const fetchUsage = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/api/usage/customer/tier?creatorId=${process.env.REACT_APP_CREATOR_ID}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      const data = await response.json();
      setUsage(data.tier_info.usage_summary);
    } catch (error) {
      console.error('Failed to fetch usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!usage) return <div>No usage data</div>;

  return (
    <div className="usage-display">
      <h3>Your Usage</h3>
      {Object.entries(usage).map(([metric, data]) => (
        <div key={metric} className="usage-metric">
          <div className="metric-header">
            <span>{metric.replace('_', ' ')}</span>
            <span>
              {data.current_usage}
              {data.limit_value && ` / ${data.limit_value}`}
            </span>
          </div>
          {data.limit_value && (
            <div className="progress-bar">
              <div
                className={`progress-fill ${
                  data.usage_percentage > 90 ? 'critical' :
                  data.usage_percentage > 75 ? 'warning' :
                  'normal'
                }`}
                style={{ width: `${Math.min(data.usage_percentage, 100)}%` }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Higher-Order Component for Feature Gating

```typescript
// hoc/withFeatureAccess.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface FeatureAccessProps {
  featureName: string;
  fallback?: React.ReactNode;
}

export function withFeatureAccess<P extends object>(
  Component: React.ComponentType<P>,
  featureName: string,
  fallback?: React.ReactNode
) {
  return function FeatureGatedComponent(props: P) {
    const { token } = useAuth();
    const [hasAccess, setHasAccess] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
      checkAccess();
    }, [token]);

    const checkAccess = async () => {
      try {
        const response = await fetch(
          `${process.env.REACT_APP_API_URL}/api/usage/customer/tier?creatorId=${process.env.REACT_APP_CREATOR_ID}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        const data = await response.json();
        const features = data.tier_info.tier.feature_entitlements || [];
        
        const hasFeature = features.some((f: string) =>
          f === featureName || f.startsWith(`${featureName}:`)
        );

        setHasAccess(hasFeature);
      } catch (error) {
        console.error('Failed to check feature access:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    if (loading) {
      return <div>Loading...</div>;
    }

    if (!hasAccess) {
      return fallback || (
        <div className="access-denied">
          <h3>Upgrade Required</h3>
          <p>This feature is not available in your current plan.</p>
          <button onClick={() => window.location.href = '/pricing'}>
            View Plans
          </button>
        </div>
      );
    }

    return <Component {...props} />;
  };
}

// Usage:
const AdvancedAnalytics = () => <div>Advanced analytics content</div>;
export const AdvancedAnalyticsGated = withFeatureAccess(
  AdvancedAnalytics,
  'advanced_analytics'
);
```

---

## Vue.js Integration

### Composable for Usage Tracking

```typescript
// composables/useUsageTracking.ts
import { ref } from 'vue';
import { useAuth } from './useAuth';

export function useUsageTracking() {
  const { user, token } = useAuth();
  const isTracking = ref(false);

  const trackEvent = async (
    eventName: string,
    eventValue: number = 1,
    properties?: Record<string, any>
  ) => {
    if (!user.value || !token.value) {
      console.warn('User not authenticated');
      return;
    }

    isTracking.value = true;

    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/v1/usage/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          meterId: import.meta.env[`VITE_METER_ID_${eventName.toUpperCase()}`],
          eventName,
          userId: user.value.id,
          eventValue,
          properties
        })
      });
    } catch (error) {
      console.error('Usage tracking failed:', error);
    } finally {
      isTracking.value = false;
    }
  };

  return {
    trackEvent,
    isTracking
  };
}
```

### Usage Display Component

```vue
<!-- components/UsageDisplay.vue -->
<template>
  <div class="usage-display">
    <h3>Your Usage</h3>
    
    <div v-if="loading">Loading...</div>
    
    <div v-else-if="usage" class="metrics">
      <div
        v-for="(data, metric) in usage"
        :key="metric"
        class="metric"
      >
        <div class="metric-header">
          <span>{{ formatMetricName(metric) }}</span>
          <span>
            {{ data.current_usage }}
            <span v-if="data.limit_value"> / {{ data.limit_value }}</span>
          </span>
        </div>
        
        <div v-if="data.limit_value" class="progress-bar">
          <div
            class="progress-fill"
            :class="getProgressClass(data.usage_percentage)"
            :style="{ width: `${Math.min(data.usage_percentage, 100)}%` }"
          />
        </div>
        
        <div
          v-if="data.usage_percentage > 80"
          class="warning"
        >
          ⚠️ Approaching limit
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth';

const { token } = useAuth();
const usage = ref(null);
const loading = ref(true);

onMounted(async () => {
  await fetchUsage();
});

const fetchUsage = async () => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/usage/customer/tier?creatorId=${import.meta.env.VITE_CREATOR_ID}`,
      {
        headers: {
          'Authorization': `Bearer ${token.value}`
        }
      }
    );

    const data = await response.json();
    usage.value = data.tier_info.usage_summary;
  } catch (error) {
    console.error('Failed to fetch usage:', error);
  } finally {
    loading.value = false;
  }
};

const formatMetricName = (metric: string) => {
  return metric.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

const getProgressClass = (percentage: number) => {
  if (percentage > 90) return 'critical';
  if (percentage > 75) return 'warning';
  return 'normal';
};
</script>

<style scoped>
.usage-display {
  padding: 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metrics {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.progress-bar {
  width: 100%;
  height: 0.5rem;
  background: #e5e7eb;
  border-radius: 0.25rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.progress-fill.normal {
  background: #10b981;
}

.progress-fill.warning {
  background: #f59e0b;
}

.progress-fill.critical {
  background: #ef4444;
}

.warning {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #f59e0b;
}
</style>
```

---

## Node.js SDK

For backend services, use the official SDK:

```javascript
// Usage SDK for Node.js
const { UsageClient } = require('@saasinasnap/usage-sdk');

const client = new UsageClient({
  apiKey: process.env.USAGE_API_KEY,
  creatorId: process.env.CREATOR_ID
});

// Track usage
await client.trackUsage({
  eventName: 'api_calls',
  userId: 'user_123',
  eventValue: 1
});

// Check enforcement
const enforcement = await client.checkEnforcement(
  'user_123',
  'api_calls',
  1
);

if (!enforcement.allowed) {
  throw new Error('Usage limit exceeded');
}

// Get tier info
const tierInfo = await client.getTierInfo('user_123');
console.log('Current tier:', tierInfo.tier.name);
```

## Summary

These integration examples show how to:
- ✅ Track usage in various frameworks
- ✅ Enforce usage limits before processing requests
- ✅ Display usage information to customers
- ✅ Gate features based on tier entitlements
- ✅ Handle errors gracefully

Choose the integration pattern that best fits your application architecture!
