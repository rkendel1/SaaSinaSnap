/**
 * Connector Events Service
 * Handles logging and tracking of connector integration events with tenant context
 */

import { headers } from 'next/headers';

import { createSupabaseAdminClient } from '../supabase/supabase-admin';

export type ConnectorType = 'slack' | 'zapier' | 'posthog' | 'crm' | 'webhook' | 'email' | 'sms';
export type ConnectorEventStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retrying';

export interface ConnectorEventData {
  connectorType: ConnectorType;
  eventType: string;
  eventData: Record<string, any>;
  userId?: string;
  externalId?: string;
  metadata?: Record<string, any>;
}

export class ConnectorEventsService {
  /**
   * Log a connector event
   */
  static async logEvent(eventData: ConnectorEventData): Promise<string> {
    const supabase = await createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('connector_events')
      .insert({
        user_id: eventData.userId || null,
        connector_type: eventData.connectorType,
        event_type: eventData.eventType,
        event_data: eventData.eventData,
        status: 'pending',
        external_id: eventData.externalId || null,
        metadata: eventData.metadata || {}
      })
      .select('id')
      .single();
    
    if (error) {
      throw new Error(`Failed to log connector event: ${error.message}`);
    }
    
    return data.id;
  }

  /**
   * Update connector event status
   */
  static async updateEventStatus(
    eventId: string,
    status: ConnectorEventStatus,
    errorMessage?: string,
    externalId?: string
  ): Promise<void> {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) {
      throw new Error('Tenant context not set for connector event');
    }

    const supabase = await createSupabaseAdminClient();
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };
    
    if (errorMessage) {
      updateData.error_message = errorMessage;
    }
    
    if (externalId) {
      updateData.external_id = externalId;
    }
    
    // Increment retry count if status is retrying
    if (status === 'retrying') {
      const { data: currentEvent } = await supabase
        .from('connector_events')
        .select('retry_count')
        .eq('id', eventId)
        .single();
      
      updateData.retry_count = (currentEvent?.retry_count || 0) + 1;
    }
    
    const { error } = await supabase
      .from('connector_events')
      .update(updateData)
      .eq('id', eventId);
    
    if (error) {
      throw new Error(`Failed to update connector event status: ${error.message}`);
    }
  }

  /**
   * Slack connector methods
   */
  static async logSlackMessage(
    channelId: string,
    message: string,
    userId?: string,
    messageId?: string
  ): Promise<string> {
    return this.logEvent({
      connectorType: 'slack',
      eventType: 'message_sent',
      eventData: { channelId, message },
      userId,
      externalId: messageId
    });
  }

  /**
   * Zapier connector methods
   */
  static async logZapierTrigger(
    triggerType: string,
    triggerData: Record<string, any>,
    userId?: string,
    zapId?: string
  ): Promise<string> {
    return this.logEvent({
      connectorType: 'zapier',
      eventType: 'trigger_fired',
      eventData: { triggerType, ...triggerData },
      userId,
      externalId: zapId
    });
  }

  /**
   * PostHog connector methods
   */
  static async logPostHogEvent(
    eventName: string,
    eventProperties: Record<string, any>,
    distinctId: string,
    userId?: string
  ): Promise<string> {
    return this.logEvent({
      connectorType: 'posthog',
      eventType: 'analytics_event',
      eventData: { eventName, eventProperties, distinctId },
      userId
    });
  }

  /**
   * CRM connector methods
   */
  static async logCrmSync(
    crmType: string,
    syncType: 'contact' | 'deal' | 'company',
    syncData: Record<string, any>,
    userId?: string,
    crmRecordId?: string
  ): Promise<string> {
    return this.logEvent({
      connectorType: 'crm',
      eventType: `${syncType}_sync`,
      eventData: { crmType, syncType, ...syncData },
      userId,
      externalId: crmRecordId
    });
  }

  /**
   * Webhook connector methods
   */
  static async logWebhookCall(
    webhookUrl: string,
    payload: Record<string, any>,
    method: string = 'POST',
    userId?: string
  ): Promise<string> {
    return this.logEvent({
      connectorType: 'webhook',
      eventType: 'webhook_call',
      eventData: { webhookUrl, payload, method },
      userId
    });
  }

  /**
   * Email connector methods
   */
  static async logEmailSent(
    to: string,
    subject: string,
    template?: string,
    userId?: string,
    emailId?: string
  ): Promise<string> {
    return this.logEvent({
      connectorType: 'email',
      eventType: 'email_sent',
      eventData: { to, subject, template },
      userId,
      externalId: emailId
    });
  }

  /**
   * Get connector events with filters
   */
  static async getEvents(
    connectorType?: ConnectorType,
    status?: ConnectorEventStatus,
    userId?: string,
    limit: number = 100,
    offset: number = 0
  ) {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) {
      throw new Error('Tenant context not set for connector event');
    }

    const supabase = await createSupabaseAdminClient();
    
    let query = supabase
      .from('connector_events')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (connectorType) {
      query = query.eq('connector_type', connectorType);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get connector events: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Get failed events for retry
   */
  static async getFailedEvents(
    maxRetries: number = 3,
    limit: number = 50
  ) {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) {
      throw new Error('Tenant context not set for connector event');
    }

    const supabase = await createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('connector_events')
      .select('*')
      .eq('status', 'failed')
      .lt('retry_count', maxRetries)
      .order('created_at', { ascending: true })
      .limit(limit);
    
    if (error) {
      throw new Error(`Failed to get failed connector events: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Get connector statistics
   */
  static async getConnectorStats(
    connectorType?: ConnectorType,
    timeFrame: 'hour' | 'day' | 'week' | 'month' = 'day'
  ) {
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) {
      throw new Error('Tenant context not set for connector event');
    }

    const supabase = await createSupabaseAdminClient();
    
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
    
    let query = supabase
      .from('connector_events')
      .select('status, connector_type, created_at')
      .gte('created_at', `now() - interval '${interval}'`);
    
    if (connectorType) {
      query = query.eq('connector_type', connectorType);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get connector stats: ${error.message}`);
    }
    
    // Process stats
    const stats = data.reduce((acc: any, event: any) => {
      const type = event.connector_type;
      const status = event.status;
      
      if (!acc[type]) {
        acc[type] = { total: 0, completed: 0, failed: 0, pending: 0, processing: 0, retrying: 0 };
      }
      
      acc[type].total++;
      acc[type][status]++;
      
      return acc;
    }, {});
    
    return stats;
  }
}