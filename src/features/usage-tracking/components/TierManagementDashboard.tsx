'use client';

import React, { useEffect, useState } from 'react';
import { 
  BarChart3, 
  Copy, 
  DollarSign, 
  Edit, 
  Eye, 
  HelpCircle, 
  Plus, 
  Sparkles, 
  Trash2, 
  TrendingUp, 
  Users,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

import type { CreateTierRequest, SubscriptionTier, UpdateTierRequest } from '../types';

export function TierManagementDashboard() {
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [wizardMode, setWizardMode] = useState(false);
  const [selectedTiers, setSelectedTiers] = useState<Set<string>>(new Set());

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

  const cloneTier = async (tier: SubscriptionTier) => {
    try {
      const response = await fetch(`/api/usage/tiers/${tier.id}/clone`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        fetchTiers();
      } else {
        alert('Failed to clone tier: ' + data.error);
      }
    } catch (error) {
      console.error('Error cloning tier:', error);
      alert('An error occurred while cloning the tier');
    }
  };

  const createFromTemplate = async (template: CreateTierRequest) => {
    try {
      const response = await fetch('/api/usage/tiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(template)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowTemplates(false);
        fetchTiers();
      } else {
        alert('Failed to create tier from template: ' + data.error);
      }
    } catch (error) {
      console.error('Error creating tier from template:', error);
      alert('An error occurred while creating the tier');
    }
  };

  const toggleSelection = (tierId: string) => {
    const newSelection = new Set(selectedTiers);
    if (newSelection.has(tierId)) {
      newSelection.delete(tierId);
    } else {
      newSelection.add(tierId);
    }
    setSelectedTiers(newSelection);
  };

  const bulkEdit = async (updates: Partial<UpdateTierRequest>) => {
    if (selectedTiers.size === 0) return;

    try {
      const promises = Array.from(selectedTiers).map(tierId =>
        fetch(`/api/usage/tiers/${tierId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updates)
        })
      );

      await Promise.all(promises);
      setSelectedTiers(new Set());
      fetchTiers();
    } catch (error) {
      console.error('Error bulk editing tiers:', error);
      alert('An error occurred during bulk edit');
    }
  };

  const previewTierImpact = async (tierData: CreateTierRequest) => {
    try {
      const response = await fetch('/api/usage/tiers/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tierData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setPreviewData(data.preview);
        setShowPreview(true);
      }
    } catch (error) {
      console.error('Error previewing tier impact:', error);
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
      {/* Header with Create Button and Bulk Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Your Subscription Tiers</h2>
          <p className="text-sm text-gray-600">
            {tiers.length} tier{tiers.length !== 1 ? 's' : ''} configured
            {selectedTiers.size > 0 && ` • ${selectedTiers.size} selected`}
          </p>
        </div>
        <div className="flex space-x-3">
          {selectedTiers.size > 0 && (
            <div className="flex space-x-2">
              <button
                onClick={() => bulkEdit({ active: true })}
                className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-md hover:bg-green-200"
              >
                Activate Selected
              </button>
              <button
                onClick={() => bulkEdit({ active: false })}
                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-md hover:bg-red-200"
              >
                Deactivate Selected
              </button>
            </div>
          )}
          <button
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Templates
          </button>
          <button
            onClick={() => setWizardMode(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            <HelpCircle className="w-4 h-4 mr-2" />
            Wizard
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Tier
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Tiers</p>
              <p className="text-2xl font-semibold text-gray-900">{tiers.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Tiers</p>
              <p className="text-2xl font-semibold text-gray-900">
                {tiers.filter(t => t.active).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Users className="h-5 w-5 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-semibold text-gray-900">0</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">$0</p>
            </div>
          </div>
        </div>
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
              selected={selectedTiers.has(tier.id)}
              onSelect={() => toggleSelection(tier.id)}
              onEdit={() => setSelectedTier(tier)}
              onDelete={() => deleteTier(tier.id)}
              onClone={() => cloneTier(tier)}
              onPreview={() => previewTierImpact({
                name: tier.name,
                description: tier.description,
                price: tier.price,
                currency: tier.currency,
                billing_cycle: tier.billing_cycle,
                feature_entitlements: tier.feature_entitlements,
                usage_caps: tier.usage_caps,
                trial_period_days: tier.trial_period_days
              })}
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
          onPreview={previewTierImpact}
        />
      )}

      {/* Template Selection Modal */}
      {showTemplates && (
        <TemplateModal
          onClose={() => setShowTemplates(false)}
          onSelect={createFromTemplate}
        />
      )}

      {/* Preview Modal */}
      {showPreview && previewData && (
        <PreviewModal
          data={previewData}
          onClose={() => setShowPreview(false)}
        />
      )}

      {/* Wizard Modal */}
      {wizardMode && (
        <WizardModal
          onClose={() => setWizardMode(false)}
          onComplete={() => {
            setWizardMode(false);
            fetchTiers();
          }}
        />
      )}
    </div>
  );
}

function TierCard({ 
  tier, 
  selected,
  onSelect,
  onEdit, 
  onDelete,
  onClone,
  onPreview
}: { 
  tier: SubscriptionTier;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void; 
  onDelete: () => void;
  onClone: () => void;
  onPreview: () => void;
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
    <div className={`bg-white rounded-lg shadow-md border-2 ${
      tier.is_default 
        ? 'border-blue-500' 
        : selected 
          ? 'border-purple-500' 
          : 'border-gray-200'
    } p-6 relative transition-all duration-200 hover:shadow-lg`}>
      {/* Selection Checkbox */}
      <div className="absolute top-4 left-4">
        <input
          type="checkbox"
          checked={selected}
          onChange={onSelect}
          className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
        />
      </div>

      {tier.is_default && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            Default
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-start mb-4 mt-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{tier.name}</h3>
          {tier.description && (
            <p className="text-sm text-gray-600 mt-1">{tier.description}</p>
          )}
        </div>
        <div className="flex space-x-1">
          <button
            onClick={onPreview}
            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-full"
            title="Preview Impact"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onClone}
            className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-full"
            title="Clone Tier"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={onEdit}
            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
            title="Edit Tier"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
            title="Delete Tier"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-2xl font-bold text-gray-900">
          {formatPrice(tier.price, tier.currency ?? 'usd')}
          <span className="text-sm font-normal text-gray-600">
            /{formatBillingCycle(tier.billing_cycle)}
          </span>
        </div>
        {tier.trial_period_days && tier.trial_period_days > 0 && (
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
  onSave,
  onPreview 
}: { 
  tier: SubscriptionTier | null; 
  onClose: () => void; 
  onSave: () => void;
  onPreview?: (data: CreateTierRequest) => void; 
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
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Real-time validation
  useEffect(() => {
    const errors: string[] = [];
    
    if (!formData.name.trim()) {
      errors.push('Tier name is required');
    }
    
    if (formData.price < 0) {
      errors.push('Price cannot be negative');
    }
    
    // Check for duplicate usage caps
    const usageLines = formData.usage_caps.split('\n').filter(line => line.trim());
    const usedMetrics = new Set<string>();
    for (const line of usageLines) {
      const [metric] = line.split(':');
      if (metric && usedMetrics.has(metric.trim())) {
        errors.push(`Duplicate usage metric: ${metric.trim()}`);
        break;
      }
      if (metric) usedMetrics.add(metric.trim());
    }
    
    setValidationErrors(errors);
  }, [formData]);

  const handlePreview = () => {
    if (onPreview && validationErrors.length === 0) {
      const features = formData.feature_entitlements
        .split('\n')
        .map(f => f.trim())
        .filter(f => f.length > 0);

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

      onPreview({
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        currency: formData.currency,
        billing_cycle: formData.billing_cycle as 'monthly' | 'yearly' | 'weekly' | 'daily',
        feature_entitlements: features,
        usage_caps: usageCaps,
        is_default: formData.is_default,
        trial_period_days: formData.trial_period_days
      });
    }
  };

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

      const payload: CreateTierRequest | UpdateTierRequest = {
        name: formData.name,
        description: formData.description || undefined,
        price: formData.price,
        currency: formData.currency,
        billing_cycle: formData.billing_cycle as 'monthly' | 'yearly' | 'weekly' | 'daily',
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
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">
              {tier ? 'Edit Tier' : 'Create New Tier'}
            </h3>
            {validationErrors.length > 0 && (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="w-4 h-4 mr-1" />
                <span className="text-sm">{validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </div>
          {validationErrors.length > 0 && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
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
          <div className="flex justify-between pt-6 border-t border-gray-200">
            <div className="flex space-x-3">
              {onPreview && (
                <button
                  type="button"
                  onClick={handlePreview}
                  disabled={validationErrors.length > 0}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Impact
                </button>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || validationErrors.length > 0}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : (tier ? 'Update Tier' : 'Create Tier')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// Template Selection Modal
function TemplateModal({ 
  onClose, 
  onSelect 
}: { 
  onClose: () => void; 
  onSelect: (template: CreateTierRequest) => void; 
}) {
  // Define templates directly in component to avoid server-side import
  const templates: CreateTierRequest[] = [
    {
      name: 'Starter',
      description: 'Perfect for individuals and small projects',
      price: 9.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'basic_support',
        'core_features',
        'user_accounts:1'
      ],
      usage_caps: {
        api_calls: 10000,
        storage_gb: 5,
        projects_created: 3
      },
      trial_period_days: 14
    },
    {
      name: 'Pro',
      description: 'Advanced features for growing businesses',
      price: 29.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'priority_support',
        'advanced_analytics',
        'team_collaboration',
        'user_accounts:10',
        'api_access'
      ],
      usage_caps: {
        api_calls: 100000,
        storage_gb: 50,
        projects_created: 25
      },
      trial_period_days: 14
    },
    {
      name: 'Enterprise',
      description: 'Full-featured solution for large organizations',
      price: 99.99,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [
        'dedicated_support',
        'custom_integrations',
        'advanced_security',
        'user_accounts:unlimited',
        'api_access',
        'white_labeling'
      ],
      usage_caps: {
        api_calls: 1000000,
        storage_gb: 500,
        projects_created: 100
      },
      trial_period_days: 30
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Choose a Tier Template</h3>
          <p className="text-sm text-gray-600 mt-1">
            Start with a pre-configured tier template that you can customize
          </p>
        </div>

        <div className="p-6">
          <div className="grid gap-6 md:grid-cols-3">
            {templates.map((template, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6 hover:border-blue-300 transition-colors">
                <div className="flex items-center mb-4">
                  <Sparkles className="w-5 h-5 text-blue-600 mr-2" />
                  <h4 className="text-lg font-semibold text-gray-900">{template.name}</h4>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="mb-4">
                  <div className="text-2xl font-bold text-gray-900">
                    ${template.price}
                    <span className="text-sm font-normal text-gray-600">/{template.billing_cycle}</span>
                  </div>
                  {template.trial_period_days && template.trial_period_days > 0 && (
                    <p className="text-sm text-green-600">{template.trial_period_days} day free trial</p>
                  )}
                </div>

                <div className="space-y-3 mb-6">
                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Features</h5>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {template.feature_entitlements?.slice(0, 3).map((feature, idx) => (
                        <li key={idx} className="flex items-center">
                          <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                          {feature.includes(':') ? feature.split(':')[0] + ': ' + feature.split(':')[1] : feature}
                        </li>
                      ))}
                      {template.feature_entitlements && template.feature_entitlements.length > 3 && (
                        <li className="text-xs text-gray-500">+{template.feature_entitlements.length - 3} more</li>
                      )}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Usage Limits</h5>
                    <div className="space-y-1">
                      {Object.entries(template.usage_caps || {}).slice(0, 2).map(([metric, limit]) => (
                        <div key={metric} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{metric.replace('_', ' ')}</span>
                          <span className="text-gray-900 font-medium">{limit.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onSelect(template)}
                  className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Use This Template
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// Preview Modal
function PreviewModal({ 
  data, 
  onClose 
}: { 
  data: any; 
  onClose: () => void; 
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tier Impact Preview</h3>
          <p className="text-sm text-gray-600 mt-1">
            See how this tier configuration affects revenue and usage
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Revenue Impact */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-blue-900 mb-3">Revenue Impact</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-blue-700">Base Revenue</p>
                <p className="text-lg font-semibold text-blue-900">
                  ${data.revenueImpact?.baseRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Overage Revenue</p>
                <p className="text-lg font-semibold text-blue-900">
                  ${data.revenueImpact?.overageRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">Total Revenue</p>
                <p className="text-xl font-bold text-blue-900">
                  ${data.revenueImpact?.totalRevenue?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </div>

          {/* Projected Overages */}
          {data.projectedOverages && data.projectedOverages.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">Projected Overages</h4>
              <div className="space-y-3">
                {data.projectedOverages.map((overage: any, index: number) => (
                  <div key={index} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-yellow-900 capitalize">
                          {overage.metric.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-yellow-700">
                          {overage.currentUsage.toLocaleString()} / {overage.newLimit.toLocaleString()} 
                          ({overage.projectedOverage.toLocaleString()} over)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-yellow-900">
                          ${overage.overageCost.toFixed(2)}
                        </p>
                        <p className="text-xs text-yellow-700">overage cost</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.projectedOverages && data.projectedOverages.length === 0 && (
            <div className="bg-green-50 p-4 rounded-lg text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-900">No Projected Overages</p>
              <p className="text-xs text-green-700">Current usage is within all limits</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Wizard Modal
function WizardModal({ 
  onClose, 
  onComplete 
}: { 
  onClose: () => void; 
  onComplete: () => void; 
}) {
  const [step, setStep] = useState(1);
  const [wizardData, setWizardData] = useState<Partial<CreateTierRequest>>({});

  const steps = [
    { title: 'Basic Info', description: 'Name and pricing' },
    { title: 'Features', description: 'What you provide' },
    { title: 'Usage Limits', description: 'Set boundaries' },
    { title: 'Review', description: 'Confirm details' }
  ];

  const handleNext = () => {
    if (step < steps.length) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleComplete = async () => {
    try {
      const response = await fetch('/api/usage/tiers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(wizardData)
      });
      
      if (response.ok) {
        onComplete();
      }
    } catch (error) {
      console.error('Error creating tier:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Tier Setup Wizard</h3>
          <div className="mt-4">
            <div className="flex items-center space-x-4">
              {steps.map((s, index) => (
                <div key={index} className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    index + 1 <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="ml-2">
                    <p className={`text-sm font-medium ${
                      index + 1 === step ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {s.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-0.5 ml-4 ${
                      index + 1 < step ? 'bg-blue-600' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6 min-h-[400px]">
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h4 className="text-xl font-semibold text-gray-900">Let&apos;s start with the basics</h4>
                <p className="text-gray-600">Give your tier a name and set the pricing</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tier Name
                  </label>
                  <input
                    type="text"
                    required
                    value={wizardData.name || ''}
                    onChange={(e) => setWizardData({ ...wizardData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Pro, Enterprise"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={wizardData.price || ''}
                      onChange={(e) => setWizardData({ ...wizardData, price: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="29.99"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Billing Cycle
                    </label>
                    <select
                      value={wizardData.billing_cycle || 'monthly'}
                      onChange={(e) => setWizardData({ ...wizardData, billing_cycle: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="weekly">Weekly</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h4 className="text-xl font-semibold text-gray-900">What features do you offer?</h4>
                <p className="text-gray-600">List the features included in this tier</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Features (one per line)
                </label>
                <textarea
                  value={(wizardData.feature_entitlements || []).join('\n')}
                  onChange={(e) => setWizardData({ 
                    ...wizardData, 
                    feature_entitlements: e.target.value.split('\n').filter(f => f.trim()) 
                  })}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="custom_domain&#10;team_seats:10&#10;api_access&#10;priority_support"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h4 className="text-xl font-semibold text-gray-900">Set usage limits</h4>
                <p className="text-gray-600">Define boundaries for resource usage</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usage Caps (format: metric:limit)
                </label>
                <textarea
                  value={wizardData.usage_caps ? 
                    Object.entries(wizardData.usage_caps).map(([k, v]) => `${k}:${v}`).join('\n') : 
                    ''
                  }
                  onChange={(e) => {
                    const caps: Record<string, number> = {};
                    e.target.value.split('\n').forEach(line => {
                      const [key, value] = line.split(':');
                      if (key && value) {
                        caps[key.trim()] = parseInt(value.trim(), 10);
                      }
                    });
                    setWizardData({ ...wizardData, usage_caps: caps });
                  }}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="api_calls:50000&#10;projects_created:100&#10;storage_gb:10"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h4 className="text-xl font-semibold text-gray-900">Review your tier</h4>
                <p className="text-gray-600">Make sure everything looks correct</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Basic Details</h5>
                    <p><strong>Name:</strong> {wizardData.name}</p>
                    <p><strong>Price:</strong> ${wizardData.price}/{wizardData.billing_cycle}</p>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Features</h5>
                    <ul className="text-sm space-y-1">
                      {(wizardData.feature_entitlements || []).slice(0, 3).map((feature, idx) => (
                        <li key={idx}>• {feature}</li>
                      ))}
                      {(wizardData.feature_entitlements || []).length > 3 && (
                        <li>• +{(wizardData.feature_entitlements || []).length - 3} more</li>
                      )}
                    </ul>
                  </div>
                </div>
                {wizardData.usage_caps && Object.keys(wizardData.usage_caps).length > 0 && (
                  <div className="mt-4">
                    <h5 className="font-medium text-gray-900 mb-2">Usage Limits</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(wizardData.usage_caps).map(([metric, limit]) => (
                        <div key={metric} className="flex justify-between text-sm">
                          <span className="capitalize">{metric.replace('_', ' ')}</span>
                          <span>{limit.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <div className="flex space-x-3">
            {step > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            {step < steps.length ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!wizardData.name || !wizardData.price}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Next
              </button>
            ) : (
              <button
                type="button"
                onClick={handleComplete}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Create Tier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}