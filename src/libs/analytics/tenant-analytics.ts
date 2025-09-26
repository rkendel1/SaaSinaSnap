/**
 * Tenant-Aware Analytics Service
 * Handles analytics events with tenant context for PostHog and internal tracking
 */

import { headers } from 'next/headers';
import { PostHog } from 'posthog-node';

import { ConnectorEventsService } from '../connectors/connector-events';
import { createSupabaseAdminClient } from '../supabase/supabase-admin';
import { ensureTenantContext, withTenantContext } from '../supabase/tenant-context';

// Initialize PostHog client
let posthogClient: PostHog | null = null;

if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com'
  });
}

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  try {
    return headers().get('x-tenant-id');
  } catch (error) {
    // headers() might not be available in all contexts
    return null;
  }
}

export interface AnalyticsEventData {
  eventName: string;
  distinctId: string;
  userId?: string;
  properties?: Record<string, any>;
  sessionId?: string;
  timestamp?: Date;
}

export class TenantAnalytics {
  /**
   * Capture an analytics event with validated tenant context
   */
  static async captureEvent(eventData: AnalyticsEventData): Promise<void> {
    let tenantId = getTenantIdFromHeaders();
    
    // If no tenant ID from headers, try to get current context
    if (!tenantId) {
      try {
        tenantId = await ensureTenantContext();
      } catch (error) {
        console.error('Analytics event attempted without tenant context:', {
          eventName: eventData.eventName,
          distinctId: eventData.distinctId,
          timestamp: new Date().toISOString()
        });
        throw new Error('Analytics operations require tenant context');
      }
    }

    // Enhance properties with tenant context
    const enhancedProperties = {
      ...eventData.properties,
      tenant_id: tenantId,
      timestamp: eventData.timestamp || new Date()
    };

    // Store event in our database for internal tracking
    await this.storeAnalyticsEvent({
      ...eventData,
      properties: enhancedProperties
    });

    // Send to PostHog if configured
    if (posthogClient) {
      try {
        posthogClient.capture({
          distinctId: eventData.distinctId,
          event: eventData.eventName,
          properties: enhancedProperties
        });

        // Log the PostHog connector event
        await ConnectorEventsService.logPostHogEvent(
          eventData.eventName,
          enhancedProperties,
          eventData.distinctId,
          eventData.userId
        );
      } catch (error) {
        console.error('Failed to send event to PostHog:', error);
      }
    }
  }

  /**
   * Store analytics event in our database with tenant context validation
   */
  private static async storeAnalyticsEvent(eventData: AnalyticsEventData): Promise<string> {
    return withTenantContext(async (supabase) => {
      const tenantId = await ensureTenantContext();
      
      console.debug('Storing analytics event with tenant context:', {
        tenantId,
        eventName: eventData.eventName,
        distinctId: eventData.distinctId
      });
      
      const { data, error } = await supabase
        .from('analytics_events')
        .insert({
          tenant_id: tenantId,
          user_id: eventData.userId || null,
          event_name: eventData.eventName,
          event_properties: eventData.properties || {},
          distinct_id: eventData.distinctId,
          session_id: eventData.sessionId || null,
          timestamp: eventData.timestamp?.toISOString() || new Date().toISOString(),
          sent_to_posthog: !!posthogClient,
          metadata: {}
        })
        .select('id')
        .single();

      if (error) {
        console.error('Failed to store analytics event:', {
          tenantId,
          error: error.message,
          eventData: eventData,
          timestamp: new Date().toISOString()
        });
        throw new Error(`Failed to store analytics event: ${error.message}`);
      }

      return data.id;
    });
  }

  /**
   * Track API calls
   */
  static async trackApiCall(
    distinctId: string,
    endpoint: string,
    method: string,
    responseTime?: number,
    statusCode?: number,
    userId?: string
  ): Promise<void> {
    await this.captureEvent({
      eventName: 'api_call',
      distinctId,
      userId,
      properties: {
        endpoint,
        method,
        response_time: responseTime,
        status_code: statusCode,
        event_type: 'api_usage'
      }
    });
  }

  /**
   * Track user authentication
   */
  static async trackAuth(
    distinctId: string,
    action: 'login' | 'logout' | 'signup' | 'failed_login',
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.captureEvent({
      eventName: `auth_${action}`,
      distinctId,
      userId,
      properties: {
        action,
        event_type: 'authentication',
        ...metadata
      }
    });
  }

  /**
   * Track subscription tier changes
   */
  static async trackTierChange(
    distinctId: string,
    oldTier: string | null,
    newTier: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.captureEvent({
      eventName: 'tier_changed',
      distinctId,
      userId,
      properties: {
        old_tier: oldTier,
        new_tier: newTier,
        event_type: 'subscription',
        ...metadata
      }
    });
  }

  /**
   * Track usage events
   */
  static async trackUsage(
    distinctId: string,
    metricName: string,
    value: number,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.captureEvent({
      eventName: 'usage_tracked',
      distinctId,
      userId,
      properties: {
        metric_name: metricName,
        value,
        event_type: 'usage',
        ...metadata
      }
    });
  }

  /**
   * Track feature usage
   */
  static async trackFeatureUsage(
    distinctId: string,
    featureName: string,
    action: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.captureEvent({
      eventName: 'feature_used',
      distinctId,
      userId,
      properties: {
        feature_name: featureName,
        action,
        event_type: 'feature_usage',
        ...metadata
      }
    });
  }

  /**
   * Track connector events
   */
  static async trackConnectorEvent(
    distinctId: string,
    connectorType: string,
    eventType: string,
    success: boolean,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.captureEvent({
      eventName: 'connector_event',
      distinctId,
      userId,
      properties: {
        connector_type: connectorType,
        event_type: eventType,
        success,
        event_category: 'connector',
        ...metadata
      }
    });
  }

  /**
   * Track page views
   */
  static async trackPageView(
    distinctId: string,
    pagePath: string,
    pageTitle?: string,
    userId?: string,
    sessionId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.captureEvent({
      eventName: 'page_view',
      distinctId,
      userId,
      sessionId,
      properties: {
        page_path: pagePath,
        page_title: pageTitle,
        event_type: 'navigation',
        ...metadata
      }
    });
  }

  /**
   * Track errors
   */
  static async trackError(
    distinctId: string,
    errorType: string,
    errorMessage: string,
    stackTrace?: string,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.captureEvent({
      eventName: 'error_occurred',
      distinctId,
      userId,
      properties: {
        error_type: errorType,
        error_message: errorMessage,
        stack_trace: stackTrace,
        event_type: 'error',
        ...metadata
      }
    });
  }

  /**
   * Identify user with tenant context
   */
  static async identifyUser(
    distinctId: string,
    userId: string,
    properties?: Record<string, any>
  ): Promise<void> {
    const tenantId = getTenantIdFromHeaders();
    
    const enhancedProperties = {
      ...properties,
      tenant_id: tenantId
    };

    if (posthogClient) {
      try {
        posthogClient.identify({
          distinctId,
          properties: enhancedProperties
        });
      } catch (error) {
        console.error('Failed to identify user in PostHog:', error);
      }
    }
  }

  /**
   * Set user properties
   */
  static async setUserProperties(
    distinctId: string,
    properties: Record<string, any>
  ): Promise<void> {
    const tenantId = getTenantIdFromHeaders();
    
    const enhancedProperties = {
      ...properties,
      tenant_id: tenantId
    };

    if (posthogClient) {
      try {
        posthogClient.identify({
          distinctId,
          properties: enhancedProperties
        });
      } catch (error) {
        console.error('Failed to set user properties in PostHog:', error);
      }
    }
  }

  /**
   * Get analytics events from database
   */
  static async getAnalyticsEvents(
    eventName?: string,
    distinctId?: string,
    userId?: string,
    limit: number = 100,
    offset: number = 0
  ) {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) {
      throw new Error('Tenant context not set for analytics event');
    }

    const supabase = await createSupabaseAdminClient(tenantId);
    
    let query = supabase
      .from('analytics_events')
      .select('*')
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (eventName) {
      query = query.eq('event_name', eventName);
    }
    
    if (distinctId) {
      query = query.eq('distinct_id', distinctId);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get analytics events: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Get analytics summary
   */
  static async getAnalyticsSummary(
    timeFrame: 'hour' | 'day' | 'week' | 'month' = 'day'
  ) {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) {
      throw new Error('Tenant context not set for analytics event');
    }

    const supabase = await createSupabaseAdminClient(tenantId);
    
    let interval = '1 day';
    switch (timeFrame) {
      case 'hour':
        interval = '1 hour';
        break;
      case 'week':
        interval = '7 days';
        break;
      case 'month':
        interval = '30 days';
        break;
    }
    
    const { data, error } = await supabase
      .from('analytics_events')
      .select('event_name, distinct_id, user_id, timestamp')
      .gte('timestamp', `now() - interval '${interval}'`);
    
    if (error) {
      throw new Error(`Failed to get analytics summary: ${error.message}`);
    }
    
    // Process summary data
    const summary = {
      total_events: data.length,
      unique_users: new Set(data.map(e => e.distinct_id)).size,
      authenticated_users: new Set(data.filter(e => e.user_id).map(e => e.user_id)).size,
      top_events: {} as Record<string, number>
    };
    
    // Count events by type  
    data.forEach(event => {
      summary.top_events[event.event_name] = (summary.top_events[event.event_name] || 0) + 1;
    });
    
    return summary;
  }
}