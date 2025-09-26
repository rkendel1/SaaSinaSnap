/**
 * Audit Logging Service
 * Handles audit trail for all changes with tenant context
 */

import { createSupabaseAdminClient } from '../supabase/supabase-admin';
import { Json } from '../supabase/types';

export interface AuditLogEntry {
  action: string;
  resourceType: string;
  resourceId?: string | null; // Allow null
  oldValue?: Record<string, any> | null; // Allow null
  newValue?: Record<string, any> | null; // Allow null
  metadata?: Record<string, any> | null; // Allow null
  ipAddress?: string | null; // Allow null
  userAgent?: string | null; // Allow null
}

export class AuditLogger {
  /**
   * Log an audit event
   */
  static async log(entry: AuditLogEntry): Promise<string> {
    const supabase = await createSupabaseAdminClient();
    
    const { data, error } = await supabase.rpc('add_audit_log', {
      p_action: entry.action,
      p_resource_type: entry.resourceType,
      p_resource_id: entry.resourceId || null,
      p_old_value: entry.oldValue || null,
      p_new_value: entry.newValue || null,
      p_metadata: entry.metadata || {}
    });
    
    if (error) {
      console.error('Failed to create audit log:', error);
      throw new Error(`Failed to create audit log: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Log user creation/registration
   */
  static async logUserCreated(userId: string, userData: Record<string, any>, metadata?: Record<string, any> | null) {
    return this.log({
      action: 'user_created',
      resourceType: 'user',
      resourceId: userId,
      newValue: userData,
      metadata
    });
  }

  /**
   * Log user profile update
   */
  static async logUserUpdated(
    userId: string, 
    oldData: Record<string, any> | null, 
    newData: Record<string, any> | null, 
    metadata?: Record<string, any> | null
  ) {
    return this.log({
      action: 'user_updated',
      resourceType: 'user',
      resourceId: userId,
      oldValue: oldData,
      newValue: newData,
      metadata
    });
  }

  /**
   * Log subscription tier changes
   */
  static async logTierChanged(
    customerId: string,
    oldTier: Record<string, any> | null,
    newTier: Record<string, any> | null,
    metadata?: Record<string, any> | null
  ) {
    return this.log({
      action: 'tier_changed',
      resourceType: 'subscription_tier',
      resourceId: customerId,
      oldValue: oldTier,
      newValue: newTier,
      metadata
    });
  }

  /**
   * Log usage events
   */
  static async logUsageEvent(
    meterId: string,
    eventData: Record<string, any> | null,
    metadata?: Record<string, any> | null
  ) {
    return this.log({
      action: 'usage_tracked',
      resourceType: 'usage_event',
      resourceId: meterId,
      newValue: eventData,
      metadata
    });
  }

  /**
   * Log API access
   */
  static async logApiAccess(
    endpoint: string,
    method: string,
    userId?: string | null,
    requestData?: Record<string, any> | null,
    metadata?: Record<string, any> | null
  ) {
    return this.log({
      action: 'api_access',
      resourceType: 'api_endpoint',
      resourceId: `${method} ${endpoint}`,
      newValue: {
        user_id: userId,
        request_data: requestData
      },
      metadata
    });
  }

  /**
   * Log connector events
   */
  static async logConnectorEvent(
    connectorType: string,
    eventType: string,
    eventData: Record<string, any> | null,
    metadata?: Record<string, any> | null
  ) {
    return this.log({
      action: `connector_${eventType}`,
      resourceType: 'connector',
      resourceId: connectorType,
      newValue: eventData,
      metadata
    });
  }

  /**
   * Log authentication events
   */
  static async logAuthEvent(
    action: 'login' | 'logout' | 'failed_login' | 'password_reset',
    userId?: string | null,
    metadata?: Record<string, any> | null
  ) {
    return this.log({
      action: `auth_${action}`,
      resourceType: 'authentication',
      resourceId: userId,
      metadata
    });
  }

  /**
   * Log data access events (for compliance)
   */
  static async logDataAccess(
    resourceType: string,
    resourceId: string,
    accessType: 'read' | 'write' | 'delete',
    userId?: string | null,
    metadata?: Record<string, any> | null
  ) {
    return this.log({
      action: `data_${accessType}`,
      resourceType,
      resourceId,
      newValue: {
        user_id: userId,
        access_type: accessType
      },
      metadata
    });
  }

  /**
   * Log configuration changes
   */
  static async logConfigChange(
    configType: string,
    oldConfig: Record<string, any> | null,
    newConfig: Record<string, any> | null,
    metadata?: Record<string, any> | null
  ) {
    return this.log({
      action: 'config_changed',
      resourceType: 'configuration',
      resourceId: configType,
      oldValue: oldConfig,
      newValue: newConfig,
      metadata
    });
  }

  /**
   * Get audit logs for a specific resource
   */
  static async getAuditLogs(
    resourceType?: string,
    resourceId?: string | null,
    limit: number = 100,
    offset: number = 0
  ) {
    const supabase = await createSupabaseAdminClient();
    
    let query = supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }
    
    if (resourceId) {
      query = query.eq('resource_id', resourceId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw new Error(`Failed to get audit logs: ${error.message}`);
    }
    
    return data;
  }
}