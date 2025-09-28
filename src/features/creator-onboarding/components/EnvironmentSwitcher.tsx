'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, Loader2, TestTube, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

import { checkGoLiveReadinessAction, getConnectionStatusAction, switchEnvironmentAction } from '../actions/onboarding-actions';

interface ConnectionStatus {
  test: {
    connected: boolean;
    accountId?: string;
    enabled: boolean;
  };
  production: {
    connected: boolean;
    accountId?: string;
    enabled: boolean;
  };
  current: 'test' | 'production';
  canGoLive: boolean;
}

interface GoLiveRequirement {
  name: string;
  completed: boolean;
  description: string;
}

export function EnvironmentSwitcher() {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [requirements, setRequirements] = useState<GoLiveRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      const [connectionStatus, readinessCheck] = await Promise.all([
        getConnectionStatusAction(),
        checkGoLiveReadinessAction()
      ]);
      
      setStatus(connectionStatus);
      setRequirements(readinessCheck.requirements);
    } catch (error) {
      console.error('Failed to load environment status:', error);
      toast({
        title: "Failed to load status",
        description: "Could not load environment information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  const handleEnvironmentSwitch = async (targetEnvironment: 'test' | 'production') => {
    if (!status) return;

    setSwitching(true);
    try {
      const result = await switchEnvironmentAction(targetEnvironment);
      if (result.success) {
        toast({
          title: "Environment switched",
          description: `Successfully switched to ${targetEnvironment} environment.`,
        });
        await loadStatus(); // Reload status
      } else {
        toast({
          title: "Switch failed",
          description: result.error || "Failed to switch environment.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Environment switch error:', error);
      toast({
        title: "Switch failed",
        description: "An error occurred while switching environments.",
        variant: "destructive",
      });
    } finally {
      setSwitching(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading environment status...</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-900">Failed to load environment status</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold text-lg mb-4">Stripe Environment Status</h3>
        
        {/* Current Environment */}
        <div className="flex items-center gap-3 mb-6">
          {status.current === 'test' ? (
            <TestTube className="h-6 w-6 text-blue-600" />
          ) : (
            <Zap className="h-6 w-6 text-green-600" />
          )}
          <div>
            <p className="font-medium">
              Current Environment: <span className={status.current === 'test' ? 'text-blue-700' : 'text-green-700'}>
                {status.current === 'test' ? 'Test Mode' : 'Production Mode'}
              </span>
            </p>
            <p className="text-sm text-gray-600">
              {status.current === 'test' 
                ? 'Safe for testing - no real payments will be processed'
                : 'Live environment - real payments are being processed'
              }
            </p>
          </div>
        </div>

        {/* Environment Connections */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className={`border rounded-lg p-4 ${status.test.connected ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <TestTube className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Test Environment</span>
              {status.test.connected && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
            <p className="text-sm text-gray-600">
              {status.test.connected 
                ? `Connected (${status.test.accountId?.slice(-6)})`
                : 'Not connected'
              }
            </p>
          </div>

          <div className={`border rounded-lg p-4 ${status.production.connected ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="font-medium">Production Environment</span>
              {status.production.connected && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
            <p className="text-sm text-gray-600">
              {status.production.connected 
                ? `Connected (${status.production.accountId?.slice(-6)})`
                : 'Not connected'
              }
            </p>
          </div>
        </div>

        {/* Environment Switching */}
        <div className="space-y-3">
          <h4 className="font-medium">Switch Environment</h4>
          <div className="flex gap-3">
            {status.test.connected && (
              <Button
                onClick={() => handleEnvironmentSwitch('test')}
                disabled={switching || status.current === 'test'}
                variant={status.current === 'test' ? 'default' : 'outline'}
                size="sm"
              >
                {switching && status.current !== 'test' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <TestTube className="h-4 w-4 mr-2" />
                Use Test Mode
              </Button>
            )}
            
            {status.production.connected && (
              <Button
                onClick={() => handleEnvironmentSwitch('production')}
                disabled={switching || status.current === 'production'}
                variant={status.current === 'production' ? 'default' : 'outline'}
                size="sm"
              >
                {switching && status.current !== 'production' && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                <Zap className="h-4 w-4 mr-2" />
                Use Production Mode
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Go-Live Readiness */}
      {status.test.connected && !status.production.connected && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="font-semibold text-lg mb-4">Ready to Go Live?</h3>
          <div className="space-y-3">
            {requirements.map((req, index) => (
              <div key={index} className="flex items-start gap-3">
                {req.completed ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange-500 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium ${req.completed ? 'text-green-900' : 'text-orange-900'}`}>
                    {req.name}
                  </p>
                  <p className={`text-sm ${req.completed ? 'text-green-700' : 'text-orange-700'}`}>
                    {req.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
          
          {status.canGoLive && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
              <p className="text-sm text-green-800 font-medium">🎉 You're ready to go live!</p>
              <p className="text-xs text-green-700 mt-1">
                Connect your production Stripe account to start accepting real payments.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}