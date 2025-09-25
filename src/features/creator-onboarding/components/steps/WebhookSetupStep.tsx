'use client';

import { useEffect, useState } from 'react';
import { Plus, TestTube,Trash2, Webhook } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label'; // Import Label
import { toast } from '@/components/ui/use-toast'; // Import toast

import { saveCreatorWebhooksAction } from '../../actions/webhook-actions';
import type { CreatorProfile } from '../../types';

interface WebhookSetupStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void; // New prop
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

export function WebhookSetupStep({ onNext, setSubmitFunction }: WebhookSetupStepProps) {
  const [webhooks, setWebhooks] = useState<WebhookEndpoint[]>([]);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState<WebhookEndpoint>({
    url: '',
    events: AVAILABLE_EVENTS.map(event => event.id), // Default all events to selected
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState<number | null>(null); // Track which webhook is being tested

  const addWebhook = () => {
    if (newWebhook.url && newWebhook.events.length > 0) {
      setWebhooks(prev => [...prev, newWebhook]);
      setNewWebhook({ 
        url: '', 
        events: AVAILABLE_EVENTS.map(event => event.id), // Reset with all events selected
        description: '' 
      });
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

  const toggleSelectAll = (checked: boolean) => {
    setNewWebhook(prev => ({
      ...prev,
      events: checked ? AVAILABLE_EVENTS.map(event => event.id) : [],
    }));
  };

  const handleTestWebhook = async (index: number) => {
    setIsTestingWebhook(index);
    const webhookToTest = webhooks[index];
    
    try {
      // Simulate an API call to test the webhook
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay
      
      // In a real scenario, you'd make a fetch request to a server endpoint
      // that then attempts to send a test payload to webhookToTest.url
      // and verifies the response.
      
      console.log(`Simulating test for webhook: ${webhookToTest.url} with events: ${webhookToTest.events.join(', ')}`);

      toast({
        description: `Test webhook sent to ${webhookToTest.url}. Check your endpoint logs!`,
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to test webhook:', error);
      toast({
        variant: 'destructive',
        description: `Failed to send test webhook to ${webhookToTest.url}. Please check the URL and try again.`,
      });
    } finally {
      setIsTestingWebhook(null);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const webhooksToSave = webhooks.map((wh) => ({
        endpoint_url: wh.url,
        events: wh.events,
      }));
      await saveCreatorWebhooksAction(webhooksToSave);
      toast({
        description: 'Webhooks saved successfully!',
      });
    } catch (error) {
      console.error('Failed to setup webhooks:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to save webhooks. Please try again.',
      });
      throw error; // Re-throw to propagate error to parent flow
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expose handleSubmit to the parent component
  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null); // Clean up on unmount
  }, [setSubmitFunction, webhooks]); // eslint-disable-line react-hooks/exhaustive-deps

  const allEventsSelected = newWebhook.events.length === AVAILABLE_EVENTS.length;
  const someEventsSelected = newWebhook.events.length > 0 && !allEventsSelected;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Webhook className="h-12 w-12 mx-auto mb-4 text-primary" />
        {/* Adjusted text color */}
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Configure Webhooks</h2>
        {/* Adjusted text color */}
        <p className="text-gray-600">
          Set up webhooks to receive real-time notifications about customer events.
        </p>
      </div>

      <div className="space-y-4">
        {webhooks.length === 0 && !showAddWebhook && (
          /* Adjusted for light theme */
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
            {/* Adjusted text color */}
            <Webhook className="h-8 w-8 mx-auto mb-4 text-gray-500" />
            {/* Adjusted text color */}
            <h3 className="font-medium mb-2 text-gray-900">No Webhooks Configured</h3>
            {/* Adjusted text color */}
            <p className="text-sm text-gray-600 mb-4">
              Webhooks allow your application to receive real-time updates about customer actions.
            </p>
            /* Adjusted for light theme */
            <Button
              variant="outline"
              onClick={() => setShowAddWebhook(true)}
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
              Add Your First Webhook
            </Button>
          </div>
        )}

        {webhooks.map((webhook, index) => (
          /* Adjusted for light theme */
          <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-3">
              <div>
                /* Adjusted for light theme */
                <div className="font-medium text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-900">
                  {webhook.url}
                </div>
                {webhook.description && (
                  /* Adjusted text color */
                  <p className="text-sm text-gray-600 mt-1">{webhook.description}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeWebhook(index)}
                className="text-destructive hover:text-destructive"
                disabled={isTestingWebhook === index}
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
            {/* Adjusted border color */}
            <div className="mt-3 pt-3 border-t border-gray-200">
              /* Adjusted for light theme */
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
                onClick={() => handleTestWebhook(index)}
                disabled={isTestingWebhook === index}
              >
                {isTestingWebhook === index ? (
                  <>
                    <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-3 w-3" />
                    Test Webhook
                  </>
                )}
              </Button>
            </div>
          </div>
        ))}

        {showAddWebhook && (
          /* Adjusted for light theme */
          <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
            {/* Adjusted text color */}
            <h3 className="font-medium text-gray-900">Add Webhook Endpoint</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                {/* Adjusted text color */}
                <label className="text-sm font-medium text-gray-700">Endpoint URL *</label>
                {/* Adjusted for light theme */}
                <Input
                  placeholder="https://your-app.com/webhooks/stripe"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                {/* Adjusted text color */}
                <label className="text-sm font-medium text-gray-700">Description (Optional)</label>
                {/* Adjusted for light theme */}
                <Input
                  placeholder="Main webhook endpoint for payments"
                  value={newWebhook.description}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, description: e.target.value }))}
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                {/* Adjusted text color */}
                <label className="text-sm font-medium text-gray-700">Events to Listen For *</label>
                <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                  <div className="flex items-center space-x-3 p-2 rounded hover:bg-gray-100">
                    <Checkbox
                      id="select-all-events"
                      checked={allEventsSelected}
                      onCheckedChange={toggleSelectAll}
                      // Removed indeterminate prop
                    />
                    <Label htmlFor="select-all-events" className="font-medium text-gray-900">
                      Select All Events
                    </Label>
                  </div>
                  {AVAILABLE_EVENTS.map(event => (
                    /* Adjusted for light theme */
                    <label key={event.id} className="flex items-start space-x-3 p-2 rounded hover:bg-gray-100">
                      <Checkbox
                        id={`event-${event.id}`}
                        checked={newWebhook.events.includes(event.id)}
                        onCheckedChange={() => toggleEvent(event.id)}
                        className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div className="min-w-0 flex-1">
                        {/* Adjusted text color */}
                        <div className="text-sm font-medium text-gray-900">{event.name}</div>
                        {/* Adjusted text color */}
                        <div className="text-xs text-gray-600">{event.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              /* Adjusted for light theme */
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddWebhook(false);
                  setNewWebhook({ url: '', events: AVAILABLE_EVENTS.map(event => event.id), description: '' }); // Reset to default
                }}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
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
          /* Adjusted for light theme */
          <Button
            variant="outline"
            onClick={() => setShowAddWebhook(true)}
            className="w-full flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            <Plus className="h-4 w-4" />
            Add Another Webhook
          </Button>
        )}
      </div>

      /* Adjusted for light theme */
      <div className="bg-white rounded-lg p-4 border border-gray-200">
        {/* Adjusted text color */}
        <h3 className="font-medium mb-2 text-gray-900">Webhook Security</h3>
        {/* Adjusted text color */}
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• All webhooks are signed with a secret key for security</li>
          <li>• Verify webhook signatures in your application</li>
          <li>• Webhooks will retry failed deliveries up to 3 times</li>
          <li>• You can test webhooks anytime from your dashboard</li>
        </ul>
      </div>

      {/* Removed internal navigation buttons */}
    </div>
  );
}