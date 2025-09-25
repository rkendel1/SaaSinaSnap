'use client';

import React, { useEffect, useState } from 'react';
import { Calendar, CreditCard, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

import type { CustomerTierInfo, TierUpgradeOption } from '../types';

interface CustomerTierPortalProps {
  creatorId: string;
}

export function CustomerTierPortal({ creatorId }: CustomerTierPortalProps) {
  const [tierInfo, setTierInfo] = useState<CustomerTierInfo | null>(null);
  const [upgradeOptions, setUpgradeOptions] = useState<TierUpgradeOption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTierInfo();
    fetchUpgradeOptions();
  }, [creatorId]);

  const fetchTierInfo = async () => {
    try {
      const response = await fetch(`/api/usage/customer/tier?creatorId=${creatorId}`);
      const data = await response.json();
      
      if (data.success) {
        setTierInfo(data.tier_info);
      } else {
        console.error('Failed to fetch tier info:', data.error);
      }
    } catch (error) {
      console.error('Error fetching tier info:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpgradeOptions = async () => {
    try {
      const response = await fetch(`/api/usage/customer/upgrade-options?creatorId=${creatorId}`);
      const data = await response.json();
      
      if (data.success) {
        setUpgradeOptions(data.upgrade_options || []);
      }
    } catch (error) {
      console.error('Error fetching upgrade options:', error);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 75) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getUsageBarColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-orange-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!tierInfo) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Subscription</h3>
        <p className="text-gray-600 mb-4">
          You don't have an active subscription. Upgrade to unlock premium features.
        </p>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          View Plans
        </button>
      </div>
    );
  }

  const { tier, assignment, usage_summary, overages, next_billing_date } = tierInfo;

  return (
    <div className="space-y-6">
      {/* Current Plan Overview */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{tier.name} Plan</h2>
            <p className="text-sm text-gray-600">
              {assignment.status === 'trialing' ? 'Free Trial' : 'Active Subscription'}
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">
              {formatPrice(tier.price, tier.currency)}
            </div>
            <div className="text-sm text-gray-600">
              per {tier.billing_cycle.replace('ly', '')}
            </div>
          </div>
        </div>

        {tier.description && (
          <p className="text-gray-600 mb-4">{tier.description}</p>
        )}

        {/* Status and Next Billing */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full ${
              assignment.status === 'active' ? 'bg-green-100' : 
              assignment.status === 'trialing' ? 'bg-blue-100' : 'bg-yellow-100'
            }`}>
              {assignment.status === 'active' ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : assignment.status === 'trialing' ? (
                <Clock className="w-5 h-5 text-blue-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 capitalize">{assignment.status}</p>
              <p className="text-sm text-gray-600">
                {assignment.status === 'trialing' && assignment.trial_end
                  ? `Trial ends ${formatDate(assignment.trial_end)}`
                  : 'Subscription status'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-full bg-gray-100">
              <Calendar className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Next Billing</p>
              <p className="text-sm text-gray-600">{formatDate(next_billing_date)}</p>
            </div>
          </div>
        </div>

        {/* Feature Entitlements */}
        {tier.feature_entitlements && tier.feature_entitlements.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Included Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {tier.feature_entitlements.map((feature, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-gray-700">
                    {feature.includes(':') 
                      ? `${feature.split(':')[0]}: ${feature.split(':')[1]}`
                      : feature.replace('_', ' ')
                    }
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Usage Summary */}
      {Object.keys(usage_summary).length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Usage This Month</h3>
          <div className="space-y-4">
            {Object.entries(usage_summary).map(([metric, data]) => {
              const percentage = data.usage_percentage || 0;
              const isOverage = data.overage_amount > 0;
              
              return (
                <div key={metric} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-gray-900 capitalize">
                        {metric.replace('_', ' ')}
                      </span>
                      {isOverage && (
                        <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Over Limit
                        </span>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-medium text-gray-900">
                        {data.current_usage.toLocaleString()}
                        {data.limit_value && ` / ${data.limit_value.toLocaleString()}`}
                      </span>
                      {percentage > 0 && (
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ml-2 ${getUsageColor(percentage)}`}>
                          {percentage.toFixed(0)}%
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {data.limit_value && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getUsageBarColor(percentage)}`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {isOverage && (
                    <p className="text-sm text-red-600">
                      {data.overage_amount.toLocaleString()} over limit
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overages */}
      {overages.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-red-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-900">Usage Overages</h3>
          </div>
          <p className="text-sm text-red-700 mb-4">
            You've exceeded your plan limits. These overages will be billed on your next invoice.
          </p>
          <div className="space-y-3">
            {overages.map((overage, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-900 capitalize">
                    {overage.meter?.event_name?.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-red-700">
                    {overage.overage_amount.toLocaleString()} units over limit
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-red-900">
                    {formatPrice(overage.overage_cost, tier.currency)}
                  </p>
                  <p className="text-xs text-red-600">
                    @ {formatPrice(overage.overage_price, tier.currency)} per unit
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade Options */}
      {upgradeOptions.length > 0 && (
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Upgrade Options</h3>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Consider upgrading to save on overage costs and unlock additional features.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {upgradeOptions.slice(0, 2).map((option, index) => (
              <div key={index} className={`p-4 rounded-lg border-2 ${
                option.recommended ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}>
                {option.recommended && (
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500 text-white mb-2">
                    Recommended
                  </div>
                )}
                <h4 className="font-semibold text-gray-900">{option.tier.name}</h4>
                <p className="text-2xl font-bold text-gray-900">
                  {formatPrice(option.tier.price, option.tier.currency)}
                  <span className="text-sm font-normal text-gray-600">
                    /{option.tier.billing_cycle.replace('ly', '')}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mb-3">
                  +{formatPrice(option.upgrade_cost, tier.currency)} from current plan
                </p>
                {option.reason && (
                  <p className="text-sm text-blue-700 mb-3">{option.reason}</p>
                )}
                <button className="w-full px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 transition-colors">
                  Upgrade Now
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}