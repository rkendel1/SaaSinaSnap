'use client';

import { useState } from 'react';
import { AlertTriangle,TestTube, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/components/ui/use-toast';

import { switchStripeEnvironmentAction } from '../actions/environment-actions';
import type { StripeEnvironment } from '../types';

interface EnvironmentSwitcherProps {
  currentEnvironment: StripeEnvironment;
  testEnabled: boolean;
  productionEnabled: boolean;
  onEnvironmentChange?: (environment: StripeEnvironment) => void;
}

export function EnvironmentSwitcher({ 
  currentEnvironment, 
  testEnabled, 
  productionEnabled,
  onEnvironmentChange 
}: EnvironmentSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<StripeEnvironment>(currentEnvironment);
  const [isLoading, setIsLoading] = useState(false);

  const handleSwitch = async () => {
    if (selectedEnvironment === currentEnvironment) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await switchStripeEnvironmentAction(selectedEnvironment);
      
      toast({
        description: `Switched to ${selectedEnvironment} environment successfully!`,
        variant: 'default',
      });
      
      onEnvironmentChange?.(selectedEnvironment);
      setIsOpen(false);
      
      // Refresh the page to ensure all components reflect the new environment
      window.location.reload();
      
    } catch (error) {
      console.error('Failed to switch environment:', error);
      toast({
        description: 'Failed to switch environment. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getEnvironmentIcon = (env: StripeEnvironment) => {
    return env === 'test' ? <TestTube className="h-4 w-4" /> : <Zap className="h-4 w-4" />;
  };

  // Check if the target environment is available
  const canSwitchTo = (env: StripeEnvironment) => {
    return env === 'test' ? testEnabled : productionEnabled;
  };

  return (
    <div className="flex items-center gap-2">
      {/* Current Environment Indicator */}
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
        currentEnvironment === 'test' 
          ? 'bg-blue-100 text-blue-800' 
          : 'bg-green-100 text-green-800'
      }`}>
        {getEnvironmentIcon(currentEnvironment)}
        {currentEnvironment === 'test' ? 'Test Mode' : 'Production Mode'}
      </div>

      {/* Switch Environment Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            disabled={!testEnabled && !productionEnabled}
          >
            Switch Environment
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Switch Stripe Environment</DialogTitle>
            <DialogDescription>
              Choose which Stripe environment to use for your platform operations.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Label className="text-base font-medium">Select Environment</Label>
            <RadioGroup 
              value={selectedEnvironment} 
              onValueChange={(value) => setSelectedEnvironment(value as StripeEnvironment)}
              className="mt-3"
            >
              {/* Test Environment Option */}
              <div className={`flex items-center space-x-3 p-3 border rounded-lg ${
                !testEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${selectedEnvironment === 'test' ? 'border-blue-300 bg-blue-50' : 'border-gray-200'}`}>
                <RadioGroupItem 
                  value="test" 
                  id="test" 
                  disabled={!testEnabled}
                />
                <div className="flex items-center gap-2 flex-1">
                  <TestTube className="h-4 w-4 text-blue-500" />
                  <div className="flex-1">
                    <Label htmlFor="test" className={`cursor-pointer ${!testEnabled ? 'cursor-not-allowed' : ''}`}>
                      <span className="font-medium">Test Environment</span>
                      {currentEnvironment === 'test' && (
                        <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded">Current</span>
                      )}
                    </Label>
                    <p className="text-sm text-gray-500">Safe for testing products and payments</p>
                    {!testEnabled && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        Not connected
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Production Environment Option */}
              <div className={`flex items-center space-x-3 p-3 border rounded-lg ${
                !productionEnabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              } ${selectedEnvironment === 'production' ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}>
                <RadioGroupItem 
                  value="production" 
                  id="production" 
                  disabled={!productionEnabled}
                />
                <div className="flex items-center gap-2 flex-1">
                  <Zap className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <Label htmlFor="production" className={`cursor-pointer ${!productionEnabled ? 'cursor-not-allowed' : ''}`}>
                      <span className="font-medium">Production Environment</span>
                      {currentEnvironment === 'production' && (
                        <span className="ml-2 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded">Current</span>
                      )}
                    </Label>
                    <p className="text-sm text-gray-500">Live payments with real money</p>
                    {!productionEnabled && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        Not connected
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </RadioGroup>

            {/* Warning for production switch */}
            {selectedEnvironment === 'production' && currentEnvironment === 'test' && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800">Switching to Production</p>
                    <p className="text-yellow-700">
                      You&apos;re about to switch to the production environment where real payments will be processed. 
                      Make sure your products are ready for live transactions.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSwitch}
              disabled={isLoading || !canSwitchTo(selectedEnvironment) || selectedEnvironment === currentEnvironment}
            >
              {isLoading ? 'Switching...' : `Switch to ${selectedEnvironment === 'test' ? 'Test' : 'Production'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}