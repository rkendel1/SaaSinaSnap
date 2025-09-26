import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables, TablesInsert } from '@/libs/supabase/types';

import type {
  CreateMeterRequest,
  TrackUsageRequest,
  UsageAnalytics,
  UsageMeter,
  UsageSummary,
} from '../types';

export class UsageTrackingService {
  /**
   * Create a new usage meter
   */
  static async createMeter(creatorId: string, meterData: CreateMeterRequest): Promise<UsageMeter> {
    const supabase = await createSupabaseServerClient();

    const { data: meter, error } = await supabase
      .from('usage_meters')
      .insert({
        creator_id: creatorId,
        event_name: meterData.event_name,
        display_name: meterData.display_name,
        description: meterData.description,
        aggregation_type: meterData.aggregation_type,
        unit_name: meterData.unit_name || 'units',
        billing_model: meterData.billing_model || 'metered'
      } as TablesInsert<'usage_meters'>) // Cast to Insert type
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create meter: ${error.message}`);
    }

    return meter as UsageMeter; // Cast to UsageMeter
  }

  /**
   * Get all meters for a creator
   */
  static async getMeters(creatorId: string): Promise<UsageMeter[]> {
    const supabase = await createSupabaseServerClient();

    const { data: meters, error } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch meters: ${error.message}`);
    }

    return meters as UsageMeter[] || []; // Cast to UsageMeter[]
  }

  /**
   * Track a usage event
   */
  static async trackUsage(creatorId: string, request: TrackUsageRequest): Promise<string> {
    const supabase = await createSupabaseServerClient();

    // Find the meter
    const { data: meter, error: meterError } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('event_name', request.event_name)
      .eq('active', true)
      .single();

    if (meterError || !meter) {
      throw new Error(`Meter not found for event: ${request.event_name}`);
    }

    // Insert the usage event
    const { data: event, error: eventError } = await supabase
      .from('usage_events')
      .insert({
        meter_id: meter.id,
        user_id: request.user_id,
        event_value: request.event_value || 1,
        properties: request.properties,
        event_timestamp: request.timestamp || new Date().toISOString()
      } as TablesInsert<'usage_events'>) // Cast to Insert type
      .select()
      .single();

    if (eventError) {
      throw new Error(`Failed to track usage: ${eventError.message}`);
    }

    return event.id;
  }

  /**
   * Get usage summary for a user and meter
   */
  static async getUsageSummary(
    meterId: string, 
    userId: string, 
    planName: string,
    billingPeriod?: string
  ): Promise<UsageSummary> {
    const supabase = await createSupabaseServerClient();

    // Get meter info
    const { data: meter, error: meterError } = await supabase
      .from('usage_meters')
      .select('*')
      .eq('id', meterId)
      .single();

    if (meterError || !meter) {
      throw new Error('Meter not found');
    }

    // Mock data for now since we don't have aggregates working yet
    const currentUsage = Math.floor(Math.random() * 1000);
    
    return {
      meter_id: meterId,
      meter_name: meter.display_name,
      user_id: userId,
      current_usage: currentUsage,
      limit_value: 1000,
      usage_percentage: (currentUsage / 1000) * 100,
      overage_amount: Math.max(0, currentUsage - 1000),
      plan_name: planName,
      billing_period: billingPeriod || new Date().toISOString().substring(0, 7),
      alerts: []
    };
  }

  /**
   * Get usage analytics for a creator
   */
  static async getUsageAnalytics(
    creatorId: string, 
    dateRange: { start: string; end: string }
  ): Promise<UsageAnalytics> {
    // Mock data for now
    return {
      total_usage: Math.floor(Math.random() * 10000),
      usage_by_user: [
        { user_id: 'user-1', usage: Math.floor(Math.random() * 1000), plan: 'pro' },
        { user_id: 'user-2', usage: Math.floor(Math.random() * 1000), plan: 'starter' },
        { user_id: 'user-3', usage: Math.floor(Math.random() * 1000), plan: 'enterprise' }
      ],
      usage_trends: [
        { period: '2024-01', usage: Math.floor(Math.random() * 5000) },
        { period: '2024-02', usage: Math.floor(Math.random() * 5000) },
        { period: '2024-03', usage: Math.floor(Math.random() * 5000) }
      ],
      revenue_impact: {
        base_revenue: Math.floor(Math.random() * 1000),
        overage_revenue: Math.floor(Math.random() * 500),
        total_revenue: Math.floor(Math.random() * 1500)
      },
      top_users: [
        { user_id: 'user-1', usage: Math.floor(Math.random() * 2000), revenue: Math.floor(Math.random() * 200) },
        { user_id: 'user-2', usage: Math.floor(Math.random() * 1500), revenue: Math.floor(Math.random() * 150) },
        { user_id: 'user-3', usage: Math.floor(Math.random() * 1200), revenue: Math.floor(Math.random() * 120) }
      ],
      // Added for tenant-aware analytics
      total_events: Math.floor(Math.random() * 100),
      unique_users: Math.floor(Math.random() * 50),
      meters: {
        'api_calls': { total_events: 50, total_value: 5000, unique_users: 20, unit_name: 'calls' },
        'storage_gb': { total_events: 10, total_value: 100, unique_users: 5, unit_name: 'GB' }
      },
      period_start: dateRange.start,
      period_end: dateRange.end
    };
  }
}