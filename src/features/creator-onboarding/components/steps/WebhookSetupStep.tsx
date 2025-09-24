'use client';

import { useState } from 'react';
import { Plus, TestTube,Trash2, Webhook } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import type { CreatorProfile } from '../../types';

interface WebhookSetupStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

interface WebhookEndpoint {
  url: string;
  events: string[];
  description: string;
}

const AVAILABLE_EVENTS = [
  { id: 'payment.completed', name: 'Payment Completed', description: 'When a customer successfully completes a payment' },
  { id: 'subscription.created', name: 'Subscription Created', description: 'When a new subscription is created' },
  { id: 'subscription.updated', name: 'Subscription Updated', description: 'When a subscription is modified' },
  { id: 'subscription.cancelled', name: 'Subscription Cancelled', description: 'When a subscription is cancelled' },
  { id: 'customer.created', name: 'Customer Created', description: 'When a new customer is added' },
  { id: 'refund.created', name: 'Refund Created', description: 'When a refund is processed' },
];

export function WebhookSetupStep({ onNext }: WebhookSetupStepProps) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState<WebhookEndpoint>({
    url: '',
    events: [],
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addWebhook = () => {
    if (newWebhook.url && newWebhook.events.length > 0) {
      setWebhooks(prev => [...prev, newWebhook]);
      setNewWebhook({ url: '', events: [], description: '' });
      setShowAddWebhook(false);
    }
  };

  const removeWebhook = (index: number) => {
    setWebhooks(prev => prev.filter((_, i) => i !== index));
  };

  const toggleEvent = (eventId: string) => {
    setNewWebhook(prev => ({
      ...prev,
      events: prev.events.includes(eventId)
        ? prev.events.filter(e => e !== eventId)
        : [...prev.events, eventId],
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Save webhooks to database
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onNext();
    } catch (error) {
      console.error('Failed to setup webhooks:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Webhook className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Configure Webhooks</h2>
        <p className="text-muted-foreground">
          Set up webhooks to receive real-time notifications about customer events.
        </p>
      </div>

      <div className="space-y-4">
        {webhooks.length === 0 && !showAddWebhook && (
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Webhook className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
            <h3 className="font-medium mb-2">No Webhooks Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Webhooks allow your application to receive real-time updates about customer actions.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowAddWebhook(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Your First Webhook
            </Button>
          </div>
        )}

        {webhooks.map((webhook, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <div className="font-medium text-sm font-mono bg-muted px-2 py-1 rounded">
                  {webhook.url}
                </div>
                {webhook.description && (
                  <p className="text-sm text-muted-foreground mt-1">{webhook.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeWebhook(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {webhook.events.map(event => (
                <span
                  key={event}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary"
                >
                  {event}
                </span>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <TestTube className="h-3 w-3" />
                Test Webhook
              </Button>
            </div>
          </div>
        ))}

        {showAddWebhook && (
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-medium">Add Webhook Endpoint</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Endpoint URL *</label>
                <Input
                  placeholder="https://your-app.com/webhooks/stripe"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Description (Optional)</label>
                <Input
                  placeholder="Main webhook endpoint for payments"
                  value={newWebhook.description}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Events to Listen For *</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  {AVAILABLE_EVENTS.map(event => (
                    <label key={event.id} className="flex items-start space-x-3 p-2 rounded hover:bg-muted">
                      <input
                        type="checkbox"
                        checked={newWebhook.events.includes(event.id)}
                        onChange={() => toggleEvent(event.id)}
                        className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{event.name}</div>
                        <div className="text-xs text-muted-foreground">{event.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddWebhook(false);
                  setNewWebhook({ url: '', events: [], description: '' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={addWebhook}
                disabled={!newWebhook.url || newWebhook.events.length === 0}
              >
                Add Webhook
              </Button>
            </div>
          </div>
        )}

        {webhooks.length > 0 && !showAddWebhook && (
          <Button
            variant="outline"
            onClick={() => setShowAddWebhook(true)}
            className="w-full flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Another Webhook
          </Button>
        )}
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h3 className="font-medium mb-2">Webhook Security</h3>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• All webhooks are signed with a secret key for security</li>
          <li>• Verify webhook signatures in your application</li>
          <li>• Webhooks will retry failed deliveries up to 3 times</li>
          <li>• You can test webhooks anytime from your dashboard</li>
        </ul>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onNext}>
          Skip Webhooks
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}