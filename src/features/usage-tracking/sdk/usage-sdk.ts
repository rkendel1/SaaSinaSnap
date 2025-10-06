/**
 * Usage Tracking SDK
 * Simple SDK for tracking usage events in client applications
 */

export interface UsageSDKConfig {
  apiKey?: string;
  baseURL?: string;
  creatorId: string;
}

export interface TrackEventOptions {
  userId: string;
  eventName: string;
  value?: number;
  properties?: Record<string, any>;
  timestamp?: string;
}

export class UsageSDK {
  private config: UsageSDKConfig;
  private baseURL: string;

  constructor(config: UsageSDKConfig) {
    this.config = config;
    this.baseURL = config.baseURL || (typeof window !== 'undefined' ? window.location.origin : 'http://127.0.0.1:32100');
  }

  /**
   * Track a usage event
   */
  async track(options: TrackEventOptions): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const response = await fetch(`${this.baseURL}/api/usage/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          event_name: options.eventName,
          user_id: options.userId,
          value: options.value || 1,
          properties: options.properties,
          timestamp: options.timestamp || new Date().toISOString()
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to track usage');
      }

      return {
        success: true,
        eventId: data.event_id
      };
    } catch (error) {
      console.error('Usage tracking error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Convenience methods for common events
   */
  async trackAPICall(userId: string, endpoint: string, method: string = 'GET'): Promise<void> {
    await this.track({
      userId,
      eventName: 'api_calls',
      value: 1,
      properties: { endpoint, method }
    });
  }

  async trackFeatureUsage(userId: string, featureName: string, duration?: number): Promise<void> {
    await this.track({
      userId,
      eventName: 'feature_usage',
      value: duration || 1,
      properties: { feature: featureName }
    });
  }

  async trackMessageSent(userId: string, messageType: string = 'text'): Promise<void> {
    await this.track({
      userId,
      eventName: 'messages_sent',
      value: 1,
      properties: { type: messageType }
    });
  }
}

/**
 * Global usage tracking instance
 */
let globalUsageSDK: UsageSDK | null = null;

/**
 * Initialize global usage tracking
 */
export function initUsageTracking(config: UsageSDKConfig): UsageSDK {
  globalUsageSDK = new UsageSDK(config);
  return globalUsageSDK;
}

/**
 * Get global usage tracking instance
 */
export function getUsageSDK(): UsageSDK {
  if (!globalUsageSDK) {
    throw new Error('Usage tracking not initialized. Call initUsageTracking() first.');
  }
  return globalUsageSDK;
}

// Note: Types are already exported above, so we don't need to re-export them