'use client';

import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle, DollarSign, Eye, FlaskConical, Package, RefreshCw, Users, AlertCircle, XCircle, Calendar, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Json } from '@/libs/supabase/types'; // Import Json type

import { getRecentCreatorAnalytics } from '../controllers/get-creator-analytics';
import { CreatorProfile } from '../types';

interface CreatorAnalyticsDashboardProps {
  creatorProfile: CreatorProfile;
  initialStats: {
    total_revenue: number;
    total_sales: number;
    active_products: number;
    recent_sales_count: number;
  };
}

// Using a generic type for analytics events from Supabase
interface CreatorAnalyticsEvent {
  id: string;
  metric_name: string;
  metric_value: number | null;
  metric_data: Json | null; // Changed to Json | null
  created_at: string;
}

export function CreatorAnalyticsDashboard({ creatorProfile, initialStats }: CreatorAnalyticsDashboardProps) {
  const [recentEvents, setRecentEvents] = useState<CreatorAnalyticsEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [stats, setStats] = useState(initialStats); // Use initial stats

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const events = await getRecentCreatorAnalytics(creatorProfile.id, 10); // Fetch from Supabase
      setRecentEvents(events);
    } catch (error) {
      console.error('Failed to fetch analytics events:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to load recent analytics events. Please try again.',
      });
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [creatorProfile.id]);

  const formatEvent = (event: CreatorAnalyticsEvent) => {
    const { metric_name, metric_data, created_at } = event;
    const time = new Date(created_at).toLocaleString();

    // Safely access properties from metric_data, assuming it's an object when not null
    const properties = (metric_data && typeof metric_data === 'object') ? metric_data as Record<string, any> : {};

    switch (metric_name) {
      case 'page_view': // Example metric name for page views
        return `Viewed page: ${properties.url || 'N/A'} at ${time}`;
      case 'embed_viewed':
        return `Embed viewed: ${properties.embed_type} (ID: ${properties.embed_id}) on ${properties.current_url} at ${time}`;
      case 'embed_checkout_button_clicked':
        return `Checkout button clicked for product: ${properties.product_name} (ID: ${properties.product_id}) on ${properties.current_url} at ${time}`;
      case 'embed_checkout_initiated':
        return `Checkout initiated for product: ${properties.product_name} (ID: ${properties.product_id}) at ${time}`;
      case 'checkout_completed':
        return `Checkout completed for product: ${properties.product_name} - $${event.metric_value?.toFixed(2)} ${properties.currency?.toUpperCase()} at ${time}`;
      case 'payment_failed':
        return `Payment failed for invoice: ${properties.invoice_id} - $${event.metric_value?.toFixed(2)} ${properties.currency?.toUpperCase()} at ${time}`;
      case 'subscription_created':
        return `New subscription created for product: ${properties.product_id} (Status: ${properties.status}) at ${time}`;
      case 'subscription_updated':
        return `Subscription updated for product: ${properties.product_id} (Status: ${properties.status}) at ${time}`;
      case 'subscription_deleted':
        return `Subscription cancelled for product: ${properties.product_id} at ${time}`;
      case 'platform_fee':
        return `Platform fee collected: $${event.metric_value?.toFixed(2)} ${properties.currency?.toUpperCase()} at ${time}`;
      case 'payment_succeeded':
        return `Payment succeeded: $${event.metric_value?.toFixed(2)} ${properties.currency?.toUpperCase()} at ${time}`;
      default:
        return `Event: ${metric_name} at ${time}`;
    }
  };

  const getEventIcon = (eventName: string) => {
    switch (eventName) {
      case 'page_view':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'embed_viewed':
        return <FlaskConical className="h-4 w-4 text-purple-500" />;
      case 'embed_checkout_button_clicked':
      case 'embed_checkout_initiated':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'checkout_completed':
      case 'payment_succeeded':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'payment_failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'subscription_created':
      case 'subscription_updated':
        return <Users className="h-4 w-4 text-indigo-500" />;
      case 'subscription_deleted':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'platform_fee':
        return <Package className="h-4 w-4 text-gray-500" />;
      default:
        return <BarChart3 className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-600 mt-1">Monitor your platform performance and insights</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${stats.total_revenue.toFixed(2)}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_sales}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active_products}</p>
              </div>
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Sales (30d)</p>
                <p className="text-2xl font-bold text-gray-900">{stats.recent_sales_count}</p>
              </div>
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-8">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchEvents} disabled={isLoadingEvents}>
            {isLoadingEvents ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-6 pt-0">
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="ml-3 text-gray-600">Loading events...</p>
            </div>
          ) : recentEvents.length > 0 ? (
            <div className="space-y-4">
              {recentEvents.map((event, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex-shrink-0 mt-1">
                    {getEventIcon(event.metric_name)}
                  </div>
                  <p className="text-sm text-gray-700 flex-1">{formatEvent(event)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No recent events</p>
              <p className="text-sm">Activity will appear here as customers interact with your embeds and products.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}