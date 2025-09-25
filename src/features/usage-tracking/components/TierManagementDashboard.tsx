'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Users, DollarSign, BarChart3 } from 'lucide-react';

import type { SubscriptionTier } from '../types';

export function TierManagementDashboard() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);

  useEffect(() => {
    fetchTiers();
  }, []);

  const fetchTiers = async () => {
    try {
      const response = await fetch('/api/usage/tiers');
      const data = await response.json();
      
      if (data.success) {
        setTiers(data.tiers);
      } else {
        console.error('Failed to fetch tiers:', data.error);
      }
    } catch (error) {
      console.error('Error fetching tiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteTier = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this tier? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/usage/tiers/${tierId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setTiers(tiers.filter(tier => tier.id !== tierId));
      } else {
        alert('Failed to delete tier: ' + data.error);
      }
    } catch (error) {
      console.error('Error deleting tier:', error);
      alert('An error occurred while deleting the tier');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Subscription Tiers</h2>
          <p className="text-sm text-gray-600">
            {tiers.length} tier{tiers.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Tier
        </button>
      </div>

      {/* Tiers Grid */}
      {tiers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No subscription tiers yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first subscription tier to start monetizing your SaaS product
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Your First Tier
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers.map((tier) => (
            <TierCard
              key={tier.id}
              tier={tier}
              onEdit={() => setSelectedTier(tier)}
              onDelete={() => deleteTier(tier.id)}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || selectedTier) && (
        <TierModal
          tier={selectedTier}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTier(null);
          }}
          onSave={() => {
            setShowCreateModal(false);
            setSelectedTier(null);
            fetchTiers();
          }}
        />
      )}
    </div>
  );
}

function TierCard({ 
  tier, 
  onEdit, 
  onDelete 
}: { 
  tier: SubscriptionTier; 
  onEdit: () => void; 
  onDelete: () => void; 
}) {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(price);
  };

  const formatBillingCycle = (cycle: string) => {
    const cycles: Record<string, string> = {
      monthly: 'month',
      yearly: 'year',
      weekly: 'week',
      daily: 'day'
    };
    return cycles[cycle] || cycle;
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border-2 ${tier.is_default ? 'border-blue-500' : 'border-gray-200'} p-6 relative`}>
      {tier.is_default && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Default
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
          {tier.description && (
            <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
          )}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-gray-900">
          {formatPrice(tier.price, tier.currency)}
          <span className="text-sm font-normal text-gray-600">
            /{formatBillingCycle(tier.billing_cycle)}
          </span>
        </div>
        {tier.trial_period_days > 0 && (
          <p className="text-sm text-green-600 mt-1">
            {tier.trial_period_days} day free trial
          </p>
        )}
      </div>

      {/* Features */}
      {tier.feature_entitlements && tier.feature_entitlements.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Features</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            {tier.feature_entitlements.slice(0, 3).map((feature, index) => (
              <li key={index} className="flex items-center">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
                {feature.includes(':') ? feature.split(':')[0] + ': ' + feature.split(':')[1] : feature}
              </li>
            ))}
            {tier.feature_entitlements.length > 3 && (
              <li className="text-xs text-gray-500">
                +{tier.feature_entitlements.length - 3} more features
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Usage Caps */}
      {tier.usage_caps && Object.keys(tier.usage_caps).length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Limits</h4>
          <div className="space-y-1">
            {Object.entries(tier.usage_caps).slice(0, 2).map(([metric, limit]) => (
              <div key={metric} className="flex justify-between text-sm">
                <span className="text-gray-600 capitalize">{metric.replace('_', ' ')}</span>
                <span className="text-gray-900 font-medium">
                  {limit.toLocaleString()}
                </span>
              </div>
            ))}
            {Object.keys(tier.usage_caps).length > 2 && (
              <p className="text-xs text-gray-500">
                +{Object.keys(tier.usage_caps).length - 2} more limits
              </p>
            )}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className={`w-2 h-2 rounded-full ${tier.active ? 'bg-green-500' : 'bg-gray-400'} mr-2`}></div>
          <span className="text-sm text-gray-600">
            {tier.active ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>0</span>
          </div>
          <div className="flex items-center">
            <DollarSign className="w-4 h-4 mr-1" />
            <span>$0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TierModal({ 
  tier, 
  onClose, 
  onSave 
}: { 
  tier: SubscriptionTier | null; 
  onClose: () => void; 
  onSave: () => void; 
}) {
  const [formData, setFormData] = useState({
    name: tier?.name || '',
    description: tier?.description || '',
    price: tier?.price || 0,
    currency: tier?.currency || 'usd',
    billing_cycle: tier?.billing_cycle || 'monthly',
    feature_entitlements: tier?.feature_entitlements?.join('\n') || '',
    usage_caps: tier?.usage_caps ? Object.entries(tier.usage_caps).map(([k, v]) => `${k}:${v}`).join('\n') : '',
    is_default: tier?.is_default || false,
    trial_period_days: tier?.trial_period_days || 0
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Parse feature entitlements
      const features = formData.feature_entitlements
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

      // Parse usage caps
      const usageCaps: Record<string, number> = {};
      formData.usage_caps
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .forEach(line => {
          const [key, value] = line.split(':');
          if (key && value) {
            usageCaps[key.trim()] = parseInt(value.trim(), 10);
          }
        });

      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        currency: formData.currency,
        billing_cycle: formData.billing_cycle,
        feature_entitlements: features,
        usage_caps: usageCaps,
        is_default: formData.is_default,
        trial_period_days: formData.trial_period_days
      };

      const url = tier ? `/api/usage/tiers/${tier.id}` : '/api/usage/tiers';
      const method = tier ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (data.success) {
        onSave();
      } else {
        alert('Failed to save tier: ' + data.error);
      }
    } catch (error) {
      console.error('Error saving tier:', error);
      alert('An error occurred while saving the tier');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {tier ? 'Edit Tier' : 'Create New Tier'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tier Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Pro, Enterprise"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Price
              </label>
              <div className="flex">
                <select
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="usd">USD</option>
                  <option value="eur">EUR</option>
                  <option value="gbp">GBP</option>
                </select>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                  className="flex-1 px-3 py-2 border border-l-0 border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="29.99"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Billing Cycle
              </label>
              <select
                value={formData.billing_cycle}
                onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Trial Period (days)
              </label>
              <input
                type="number"
                min="0"
                value={formData.trial_period_days}
                onChange={(e) => setFormData({ ...formData, trial_period_days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of this tier"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Feature Entitlements
            </label>
            <textarea
              value={formData.feature_entitlements}
              onChange={(e) => setFormData({ ...formData, feature_entitlements: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="One feature per line, e.g.:&#10;custom_domain&#10;team_seats:10&#10;api_access"
            />
            <p className="text-xs text-gray-500 mt-1">
              One feature per line. Use format "feature:limit" for features with limits.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usage Caps
            </label>
            <textarea
              value={formData.usage_caps}
              onChange={(e) => setFormData({ ...formData, usage_caps: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="One limit per line, e.g.:&#10;api_calls:50000&#10;projects_created:100&#10;storage_gb:10"
            />
            <p className="text-xs text-gray-500 mt-1">
              One usage limit per line in format "metric:limit".
            </p>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="is_default" className="ml-2 block text-sm text-gray-900">
              Set as default tier for new customers
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (tier ? 'Update Tier' : 'Create Tier')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}