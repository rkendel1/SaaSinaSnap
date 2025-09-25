# Staryer Usage Tracking SDK

A lightweight SDK for tracking usage events in your SaaS application with automatic billing and analytics.

## Installation

```bash
npm install @staryer/usage-sdk
```

## Quick Start

```javascript
import { initUsageTracking, trackUsage } from '@staryer/usage-sdk';

// Initialize the SDK
initUsageTracking({
  creatorId: 'your-creator-id',
  baseURL: 'https://your-platform.com'
});

// Track usage events
trackUsage({
  userId: 'user-123',
  eventName: 'api_calls',
  value: 1,
  properties: {
    endpoint: '/api/users',
    method: 'GET'
  }
});
```

## Usage Examples

### API Call Tracking

```javascript
import { useUsageTracking } from '@staryer/usage-sdk';

function MyComponent() {
  const { trackAPICall } = useUsageTracking();

  const handleAPICall = async () => {
    await fetch('/api/data');
    trackAPICall('user-123', '/api/data', 'GET');
  };

  return <button onClick={handleAPICall}>Fetch Data</button>;
}
```

### Feature Usage Tracking

```javascript
import { useUsageTracking } from '@staryer/usage-sdk';

function FeatureComponent() {
  const { trackFeatureUsage } = useUsageTracking();

  useEffect(() => {
    const startTime = Date.now();
    
    return () => {
      const duration = Date.now() - startTime;
      trackFeatureUsage('user-123', 'dashboard', duration);
    };
  }, []);

  return <div>Feature Content</div>;
}
```

### Message/Event Tracking

```javascript
import { useUsageTracking } from '@staryer/usage-sdk';

function ChatComponent() {
  const { trackMessageSent } = useUsageTracking();

  const sendMessage = (message) => {
    // Send message logic
    trackMessageSent('user-123', 'text');
  };

  return <MessageInput onSend={sendMessage} />;
}
```

## Available Methods

### Core Methods

- `initUsageTracking(config)` - Initialize the SDK
- `trackUsage(options)` - Track a custom usage event
- `useUsageTracking()` - React hook for usage tracking

### Convenience Methods

- `trackAPICall(userId, endpoint, method)` - Track API calls
- `trackFeatureUsage(userId, featureName, duration)` - Track feature usage
- `trackMessageSent(userId, messageType)` - Track messages sent
- `trackDataProcessed(userId, bytes, dataType)` - Track data processing
- `trackProjectCreated(userId, projectType)` - Track project creation
- `trackStorageUsed(userId, bytes, storageType)` - Track storage usage

## Configuration

```javascript
initUsageTracking({
  creatorId: 'your-creator-id',    // Required: Your creator ID
  baseURL: 'https://your-app.com', // Optional: Custom API endpoint
  apiKey: 'your-api-key'          // Optional: API key for authentication
});
```

## Error Handling

The SDK handles errors gracefully and won't break your application:

```javascript
const result = await trackUsage({
  userId: 'user-123',
  eventName: 'api_calls'
});

if (!result.success) {
  console.error('Tracking failed:', result.error);
}
```

## Types

```typescript
interface TrackEventOptions {
  userId: string;
  eventName: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp?: string;
}

interface UsageSDKConfig {
  apiKey?: string;
  baseURL?: string;
  creatorId: string;
}
```

## Support

For support and documentation, visit [Staryer Documentation](https://docs.staryer.com) or open an issue on [GitHub](https://github.com/rkendel1/Staryer/issues).