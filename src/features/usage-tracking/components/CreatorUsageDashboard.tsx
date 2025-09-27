'use client';

import React, { useEffect, useState } from 'react';
import { Activity,AlertTriangle, BarChart3, Eye, TrendingUp, Users } from 'lucide-react';

import { type CreatorUsageAnalytics,EnhancedUsageService } from '../services/enhanced-usage-service';

interface CreatorUsageDashboardProps {
  creatorId: string;
  className?: string;
}

export default function CreatorUsageDashboard({ creatorId, className }: CreatorUsageDashboardProps) {
  const [analytics, setAnalytics] = useState<CreatorUsageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [creatorId, dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const now = new Date();
      const daysBack = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90;
      const start = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();
      
      const data = await EnhancedUsageService.getCreatorUsageAnalytics(creatorId, {
        start,
        end: now.toISOString(),
      });
      
      setAnalytics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Error fetching usage analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-500 mx-auto mb-2" />
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className={`bg-white rounded-lg shadow-sm border p-6 ${className}`}>
        <div className="text-center py-8">
          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600">No usage data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Usage Analytics</h2>
            <p className="text-sm text-gray-600 mt-1">
              Track subscriber activity and usage patterns
            </p>
          </div>
          
          {/* Date Range Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  dateRange === range
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {range === '7d' ? '7 days' : range === '30d' ? '30 days' : '90 days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-600">Active Subscribers</p>
                <p className="text-2xl font-bold text-blue-900">
                  {analytics.total_active_subscribers.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-green-600">Total Usage Events</p>
                <p className="text-2xl font-bold text-green-900">
                  {analytics.top_usage_events
                    .reduce((sum, event) => sum + event.total_quantity, 0)
                    .toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-purple-600">Avg Usage Growth</p>
                <p className="text-2xl font-bold text-purple-900">
                  {analytics.usage_trends.length > 1 
                    ? `+${Math.round(
                        ((analytics.usage_trends[analytics.usage_trends.length - 1]?.total_usage || 0) /
                        (analytics.usage_trends[0]?.total_usage || 1) - 1) * 100
                      )}%`
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Usage by Tier */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage by Subscription Tier</h3>
          <div className="space-y-4">
            {analytics.usage_by_tier.map((tier) => (
              <div key={tier.tier_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{tier.tier_name}</h4>
                  <span className="text-sm text-gray-600">
                    {tier.subscriber_count} subscriber{tier.subscriber_count !== 1 ? 's' : ''}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                  <div>
                    <p className="text-xs text-gray-600">Total Usage</p>
                    <p className="font-semibold">{tier.total_usage.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Average Usage</p>
                    <p className="font-semibold">{Math.round(tier.average_usage).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Usage Cap</p>
                    <p className="font-semibold">{tier.usage_cap.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600">Utilization</p>
                    <p className={`font-semibold ${
                      tier.utilization_rate > 0.8 ? 'text-red-600' : 
                      tier.utilization_rate > 0.6 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {Math.round(tier.utilization_rate * 100)}%
                    </p>
                  </div>
                </div>

                {/* Utilization Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      tier.utilization_rate > 0.8 ? 'bg-red-500' : 
                      tier.utilization_rate > 0.6 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(tier.utilization_rate * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Usage Events */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Usage Events</h3>
          <div className="overflow-hidden border border-gray-200 rounded-lg">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Event Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unique Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg per User
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.top_usage_events.slice(0, 5).map((event, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {event.event_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {event.total_quantity.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {event.unique_users.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {event.unique_users > 0 ? Math.round(event.total_quantity / event.unique_users) : 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Usage Trends Chart */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage Trends</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Chart visualization would be implemented here
                </p>
                <p className="text-xs text-gray-500">
                  Showing {analytics.usage_trends.length} data points
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}