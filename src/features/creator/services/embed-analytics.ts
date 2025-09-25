export interface EmbedAnalyticsEvent {
  id: string;
  embed_id: string;
  event_type: 'impression' | 'click' | 'conversion' | 'error' | 'load';
  timestamp: string;
  user_id?: string;
  session_id: string;
  
  // Context data
  referrer?: string;
  user_agent?: string;
  viewport_size?: { width: number; height: number };
  device_type?: 'desktop' | 'mobile' | 'tablet';
  
  // Performance data
  load_time?: number;
  render_time?: number;
  
  // Interaction data
  click_position?: { x: number; y: number };
  scroll_depth?: number;
  time_on_embed?: number;
  
  // Custom properties
  properties?: Record<string, any>;
}

export interface EmbedMetrics {
  embed_id: string;
  date_range: { start: string; end: string };
  
  // Core metrics
  impressions: number;
  unique_impressions: number;
  clicks: number;
  conversions: number;
  
  // Calculated metrics
  click_through_rate: number;
  conversion_rate: number;
  bounce_rate: number;
  avg_time_spent: number;
  
  // Performance metrics
  avg_load_time: number;
  avg_render_time: number;
  error_rate: number;
  
  // Trends (compared to previous period)
  trends: {
    impressions_change: number;
    clicks_change: number;
    conversions_change: number;
    ctr_change: number;
  };
}

export interface EmbedInsights {
  embed_id: string;
  
  // Top performing aspects
  best_performing_days: Array<{ date: string; metric: string; value: number }>;
  best_performing_hours: Array<{ hour: number; metric: string; value: number }>;
  top_referrers: Array<{ referrer: string; impressions: number; conversions: number }>;
  
  // Device breakdown
  device_performance: Array<{
    device_type: string;
    impressions: number;
    conversions: number;
    conversion_rate: number;
  }>;
  
  // Geographic data (if available)
  geographic_performance?: Array<{
    country: string;
    impressions: number;
    conversions: number;
  }>;
  
  // Recommendations
  recommendations: Array<{
    type: 'optimization' | 'content' | 'timing' | 'placement';
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
  }>;
}

export class EmbedAnalyticsService {
  private static events: Map<string, EmbedAnalyticsEvent[]> = new Map();
  private static metricsCache: Map<string, EmbedMetrics> = new Map();

  /**
   * Track an analytics event
   */
  static async trackEvent(event: Omit<EmbedAnalyticsEvent, 'id' | 'timestamp'>): Promise<void> {
    const analyticsEvent: EmbedAnalyticsEvent = {
      ...event,
      id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    const embedEvents = this.events.get(event.embed_id) || [];
    embedEvents.push(analyticsEvent);
    this.events.set(event.embed_id, embedEvents);

    // Clear metrics cache for this embed to force recalculation
    this.clearMetricsCache(event.embed_id);
  }

  /**
   * Get metrics for an embed
   */
  static async getMetrics(
    embedId: string,
    dateRange: { start: string; end: string }
  ): Promise<EmbedMetrics> {
    const cacheKey = `${embedId}_${dateRange.start}_${dateRange.end}`;
    const cached = this.metricsCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    const events = this.getEventsInRange(embedId, dateRange);
    const metrics = this.calculateMetrics(embedId, events, dateRange);
    
    this.metricsCache.set(cacheKey, metrics);
    return metrics;
  }

  /**
   * Get insights for an embed
   */
  static async getInsights(embedId: string, dateRange: { start: string; end: string }): Promise<EmbedInsights> {
    const events = this.getEventsInRange(embedId, dateRange);
    return this.generateInsights(embedId, events);
  }

  /**
   * Get real-time metrics (last 24 hours)
   */
  static async getRealTimeMetrics(embedId: string): Promise<Partial<EmbedMetrics>> {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    const dateRange = {
      start: yesterday.toISOString(),
      end: now.toISOString()
    };

    return this.getMetrics(embedId, dateRange);
  }

  /**
   * Get performance comparison between embeds
   */
  static async compareEmbeds(
    embedIds: string[],
    dateRange: { start: string; end: string }
  ): Promise<Array<EmbedMetrics & { embed_id: string }>> {
    const comparisons = await Promise.all(
      embedIds.map(async (embedId) => {
        const metrics = await this.getMetrics(embedId, dateRange);
        return { ...metrics, embed_id: embedId };
      })
    );

    return comparisons.sort((a, b) => b.conversion_rate - a.conversion_rate);
  }

  /**
   * Get events in date range
   */
  private static getEventsInRange(
    embedId: string,
    dateRange: { start: string; end: string }
  ): EmbedAnalyticsEvent[] {
    const allEvents = this.events.get(embedId) || [];
    const startTime = new Date(dateRange.start).getTime();
    const endTime = new Date(dateRange.end).getTime();

    return allEvents.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return eventTime >= startTime && eventTime <= endTime;
    });
  }

  /**
   * Calculate metrics from events
   */
  private static calculateMetrics(
    embedId: string,
    events: EmbedAnalyticsEvent[],
    dateRange: { start: string; end: string }
  ): EmbedMetrics {
    const impressions = events.filter(e => e.event_type === 'impression').length;
    const clicks = events.filter(e => e.event_type === 'click').length;
    const conversions = events.filter(e => e.event_type === 'conversion').length;
    const errors = events.filter(e => e.event_type === 'error').length;

    // Unique impressions (by session)
    const uniqueSessions = new Set(
      events.filter(e => e.event_type === 'impression').map(e => e.session_id)
    );
    const unique_impressions = uniqueSessions.size;

    // Calculate rates
    const click_through_rate = impressions > 0 ? (clicks / impressions) * 100 : 0;
    const conversion_rate = impressions > 0 ? (conversions / impressions) * 100 : 0;
    const error_rate = events.length > 0 ? (errors / events.length) * 100 : 0;

    // Performance metrics
    const loadEvents = events.filter(e => e.event_type === 'load' && e.load_time);
    const avg_load_time = loadEvents.length > 0 
      ? loadEvents.reduce((sum, e) => sum + (e.load_time || 0), 0) / loadEvents.length 
      : 0;

    const renderEvents = events.filter(e => e.render_time);
    const avg_render_time = renderEvents.length > 0
      ? renderEvents.reduce((sum, e) => sum + (e.render_time || 0), 0) / renderEvents.length
      : 0;

    // Time spent calculation
    const timeEvents = events.filter(e => e.time_on_embed);
    const avg_time_spent = timeEvents.length > 0
      ? timeEvents.reduce((sum, e) => sum + (e.time_on_embed || 0), 0) / timeEvents.length
      : 0;

    // Bounce rate (sessions with only one impression)
    const sessionImpressions = new Map<string, number>();
    events.filter(e => e.event_type === 'impression').forEach(e => {
      sessionImpressions.set(e.session_id, (sessionImpressions.get(e.session_id) || 0) + 1);
    });
    const bounces = Array.from(sessionImpressions.values()).filter(count => count === 1).length;
    const bounce_rate = unique_impressions > 0 ? (bounces / unique_impressions) * 100 : 0;

    // Calculate trends (compare to previous period)
    const periodLength = new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime();
    const previousStart = new Date(new Date(dateRange.start).getTime() - periodLength).toISOString();
    const previousEnd = dateRange.start;
    
    const previousEvents = this.getEventsInRange(embedId, { start: previousStart, end: previousEnd });
    const previousImpressions = previousEvents.filter(e => e.event_type === 'impression').length;
    const previousClicks = previousEvents.filter(e => e.event_type === 'click').length;
    const previousConversions = previousEvents.filter(e => e.event_type === 'conversion').length;
    const previousCTR = previousImpressions > 0 ? (previousClicks / previousImpressions) * 100 : 0;

    return {
      embed_id: embedId,
      date_range: dateRange,
      impressions,
      unique_impressions,
      clicks,
      conversions,
      click_through_rate,
      conversion_rate,
      bounce_rate,
      avg_time_spent,
      avg_load_time,
      avg_render_time,
      error_rate,
      trends: {
        impressions_change: this.calculatePercentageChange(previousImpressions, impressions),
        clicks_change: this.calculatePercentageChange(previousClicks, clicks),
        conversions_change: this.calculatePercentageChange(previousConversions, conversions),
        ctr_change: this.calculatePercentageChange(previousCTR, click_through_rate)
      }
    };
  }

  /**
   * Generate insights from events
   */
  private static generateInsights(embedId: string, events: EmbedAnalyticsEvent[]): EmbedInsights {
    const recommendations: EmbedInsights['recommendations'] = [];

    // Analyze performance by time
    const hourlyPerformance = this.analyzeHourlyPerformance(events);
    const dailyPerformance = this.analyzeDailyPerformance(events);

    // Analyze device performance
    const devicePerformance = this.analyzeDevicePerformance(events);

    // Analyze referrer performance
    const referrerPerformance = this.analyzeReferrerPerformance(events);

    // Generate recommendations based on analysis
    if (devicePerformance.find(d => d.device_type === 'mobile')?.conversion_rate || 0 < 
        devicePerformance.find(d => d.device_type === 'desktop')?.conversion_rate || 0) {
      recommendations.push({
        type: 'optimization',
        title: 'Optimize for Mobile',
        description: 'Mobile conversion rate is lower than desktop. Consider mobile-specific optimizations.',
        impact: 'high'
      });
    }

    // Performance recommendations
    const avgLoadTime = events
      .filter(e => e.load_time)
      .reduce((sum, e) => sum + (e.load_time || 0), 0) / events.filter(e => e.load_time).length;

    if (avgLoadTime > 3000) { // 3 seconds
      recommendations.push({
        type: 'optimization',
        title: 'Improve Load Time',
        description: 'Average load time is above 3 seconds. Consider optimizing embed resources.',
        impact: 'high'
      });
    }

    return {
      embed_id: embedId,
      best_performing_days: dailyPerformance.slice(0, 5),
      best_performing_hours: hourlyPerformance.slice(0, 5),
      top_referrers: referrerPerformance.slice(0, 10),
      device_performance: devicePerformance,
      recommendations
    };
  }

  /**
   * Analyze performance by hour
   */
  private static analyzeHourlyPerformance(events: EmbedAnalyticsEvent[]): Array<{ hour: number; metric: string; value: number }> {
    const hourlyData = new Map<number, { impressions: number; conversions: number }>();

    events.forEach(event => {
      const hour = new Date(event.timestamp).getHours();
      const data = hourlyData.get(hour) || { impressions: 0, conversions: 0 };
      
      if (event.event_type === 'impression') data.impressions++;
      if (event.event_type === 'conversion') data.conversions++;
      
      hourlyData.set(hour, data);
    });

    return Array.from(hourlyData.entries())
      .map(([hour, data]) => ({
        hour,
        metric: 'conversion_rate',
        value: data.impressions > 0 ? (data.conversions / data.impressions) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Analyze performance by day
   */
  private static analyzeDailyPerformance(events: EmbedAnalyticsEvent[]): Array<{ date: string; metric: string; value: number }> {
    const dailyData = new Map<string, { impressions: number; conversions: number }>();

    events.forEach(event => {
      const date = event.timestamp.split('T')[0];
      const data = dailyData.get(date) || { impressions: 0, conversions: 0 };
      
      if (event.event_type === 'impression') data.impressions++;
      if (event.event_type === 'conversion') data.conversions++;
      
      dailyData.set(date, data);
    });

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        metric: 'conversions',
        value: data.conversions
      }))
      .sort((a, b) => b.value - a.value);
  }

  /**
   * Analyze device performance
   */
  private static analyzeDevicePerformance(events: EmbedAnalyticsEvent[]): EmbedInsights['device_performance'] {
    const deviceData = new Map<string, { impressions: number; conversions: number }>();

    events.forEach(event => {
      const device = event.device_type || 'unknown';
      const data = deviceData.get(device) || { impressions: 0, conversions: 0 };
      
      if (event.event_type === 'impression') data.impressions++;
      if (event.event_type === 'conversion') data.conversions++;
      
      deviceData.set(device, data);
    });

    return Array.from(deviceData.entries()).map(([device_type, data]) => ({
      device_type,
      impressions: data.impressions,
      conversions: data.conversions,
      conversion_rate: data.impressions > 0 ? (data.conversions / data.impressions) * 100 : 0
    }));
  }

  /**
   * Analyze referrer performance
   */
  private static analyzeReferrerPerformance(events: EmbedAnalyticsEvent[]): EmbedInsights['top_referrers'] {
    const referrerData = new Map<string, { impressions: number; conversions: number }>();

    events.forEach(event => {
      const referrer = event.referrer || 'direct';
      const data = referrerData.get(referrer) || { impressions: 0, conversions: 0 };
      
      if (event.event_type === 'impression') data.impressions++;
      if (event.event_type === 'conversion') data.conversions++;
      
      referrerData.set(referrer, data);
    });

    return Array.from(referrerData.entries())
      .map(([referrer, data]) => ({
        referrer,
        impressions: data.impressions,
        conversions: data.conversions
      }))
      .sort((a, b) => b.impressions - a.impressions);
  }

  /**
   * Calculate percentage change
   */
  private static calculatePercentageChange(oldValue: number, newValue: number): number {
    if (oldValue === 0) return newValue > 0 ? 100 : 0;
    return ((newValue - oldValue) / oldValue) * 100;
  }

  /**
   * Clear metrics cache for an embed
   */
  private static clearMetricsCache(embedId: string): void {
    const keysToDelete = Array.from(this.metricsCache.keys()).filter(key => key.startsWith(embedId));
    keysToDelete.forEach(key => this.metricsCache.delete(key));
  }

  /**
   * Export analytics data
   */
  static async exportData(
    embedId: string,
    dateRange: { start: string; end: string },
    format: 'csv' | 'json' = 'json'
  ): Promise<string> {
    const events = this.getEventsInRange(embedId, dateRange);
    const metrics = await this.getMetrics(embedId, dateRange);

    if (format === 'csv') {
      return this.exportToCSV(events, metrics);
    } else {
      return JSON.stringify({ events, metrics }, null, 2);
    }
  }

  /**
   * Export to CSV format
   */
  private static exportToCSV(events: EmbedAnalyticsEvent[], metrics: EmbedMetrics): string {
    const headers = ['timestamp', 'event_type', 'user_id', 'session_id', 'referrer', 'device_type'];
    const rows = events.map(event => [
      event.timestamp,
      event.event_type,
      event.user_id || '',
      event.session_id,
      event.referrer || '',
      event.device_type || ''
    ]);

    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }
}