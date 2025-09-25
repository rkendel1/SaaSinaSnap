/**
 * Usage Tracking Example
 * 
 * This example shows how a SaaS creator would integrate usage tracking
 * into their application using the Staryer platform.
 */

// Example 1: Initialize the SDK
import { initUsageTracking, useUsageTracking } from '@staryer/usage-sdk';

// Initialize once in your app
initUsageTracking({
  creatorId: 'creator_123',
  baseURL: 'https://your-staryer-platform.com'
});

// Example 2: Track API calls
async function handleAPIRequest(req, res, userId) {
  try {
    // Your API logic here
    const data = await fetchUserData(userId);
    
    // Track the API call
    await trackUsage({
      userId: userId,
      eventName: 'api_calls',
      value: 1,
      properties: {
        endpoint: req.path,
        method: req.method,
        response_time: Date.now() - req.startTime
      }
    });
    
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Example 3: Track feature usage in React
function AdvancedDashboard({ userId }) {
  const { trackFeatureUsage } = useUsageTracking();
  
  useEffect(() => {
    const startTime = Date.now();
    
    // Track when feature is accessed
    trackFeatureUsage(userId, 'advanced_dashboard');
    
    return () => {
      // Track session duration
      const duration = Date.now() - startTime;
      trackFeatureUsage(userId, 'advanced_dashboard_session', duration);
    };
  }, [userId]);
  
  return <div>Advanced Dashboard Content</div>;
}

// Example 4: Track storage usage
async function uploadFile(userId, file) {
  try {
    // Upload the file
    const uploadResult = await storage.upload(file);
    
    // Track storage usage
    await trackUsage({
      userId: userId,
      eventName: 'storage_used',
      value: file.size, // bytes
      properties: {
        file_type: file.type,
        file_name: file.name
      }
    });
    
    return uploadResult;
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// Example 5: Create meters via API (server-side)
async function setupUsageMeters() {
  const apiKey = process.env.STARYER_API_KEY;
  
  // Create API calls meter
  await fetch('/api/usage/meters', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event_name: 'api_calls',
      display_name: 'API Calls',
      description: 'Number of API requests made by users',
      aggregation_type: 'count',
      unit_name: 'calls',
      billing_model: 'metered',
      plan_limits: [
        {
          plan_name: 'starter',
          limit_value: 10000,
          overage_price: 0.01,
          soft_limit_threshold: 0.8,
          hard_cap: false
        },
        {
          plan_name: 'pro',
          limit_value: 50000,
          overage_price: 0.005,
          soft_limit_threshold: 0.9,
          hard_cap: false
        },
        {
          plan_name: 'enterprise',
          limit_value: null, // unlimited
          overage_price: null,
          soft_limit_threshold: 1.0,
          hard_cap: false
        }
      ]
    })
  });
}

export {
  handleAPIRequest,
  AdvancedDashboard,
  uploadFile,
  setupUsageMeters
};