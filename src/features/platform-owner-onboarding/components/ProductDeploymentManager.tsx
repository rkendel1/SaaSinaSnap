'use client';

import { useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, History,Rocket } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';

import { deployProductToProductionAction, getProductDeploymentHistoryAction } from '../actions/environment-actions';
import type { ProductEnvironmentDeployment } from '../types';

interface ProductDeploymentManagerProps {
  productId: string;
  productName: string;
  isTestProduct: boolean;
  hasProductionVersion: boolean;
  lastDeployedAt?: string;
  onDeploymentComplete?: () => void;
}

export function ProductDeploymentManager({ 
  productId, 
  productName, 
  isTestProduct,
  hasProductionVersion, 
  lastDeployedAt,
  onDeploymentComplete 
}: ProductDeploymentManagerProps) {
  const [isDeployDialogOpen, setIsDeployDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentHistory, setDeploymentHistory] = useState<ProductEnvironmentDeployment[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      await deployProductToProductionAction(productId);
      
      toast({
        description: `${productName} deployed to production successfully!`,
        variant: 'default',
      });
      
      setIsDeployDialogOpen(false);
      onDeploymentComplete?.();
      
    } catch (error) {
      console.error('Failed to deploy product:', error);
      toast({
        description: 'Failed to deploy product to production. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsDeploying(false);
    }
  };

  const loadDeploymentHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const history = await getProductDeploymentHistoryAction(productId);
      setDeploymentHistory(history);
    } catch (error) {
      console.error('Failed to load deployment history:', error);
      toast({
        description: 'Failed to load deployment history.',
        variant: 'destructive',
      });
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'deploying':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  // Only show for test products that can be deployed
  if (!isTestProduct) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {/* Deploy to Production Button */}
      <Dialog open={isDeployDialogOpen} onOpenChange={setIsDeployDialogOpen}>
        <DialogTrigger asChild>
          <Button 
            size="sm" 
            variant={hasProductionVersion ? "outline" : "default"}
            className="flex items-center gap-1"
          >
            <Rocket className="h-3 w-3" />
            {hasProductionVersion ? 'Redeploy' : 'Deploy to Prod'}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {hasProductionVersion ? 'Redeploy to Production' : 'Deploy to Production'}
            </DialogTitle>
            <DialogDescription>
              {hasProductionVersion 
                ? 'This will update the production version with the current test configuration.'
                : 'This will create a live version of your product that customers can purchase.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-800">Production Deployment</p>
                  <p className="text-yellow-700 mt-1">
                    This product will be available for real purchases with live payments. 
                    Make sure you&apos;ve tested it thoroughly in the test environment.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900">Product Details</h4>
              <p className="text-sm text-gray-600 mt-1">
                <strong>Name:</strong> {productName}
              </p>
              {lastDeployedAt && (
                <p className="text-sm text-gray-600">
                  <strong>Last deployed:</strong> {formatDate(lastDeployedAt)}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDeployDialogOpen(false)}
              disabled={isDeploying}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleDeploy}
              disabled={isDeploying}
            >
              {isDeploying ? 'Deploying...' : 'Deploy to Production'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Deployment History Button */}
      {hasProductionVersion && (
        <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              size="sm" 
              variant="ghost"
              className="flex items-center gap-1"
              onClick={() => {
                setIsHistoryDialogOpen(true);
                loadDeploymentHistory();
              }}
            >
              <History className="h-3 w-3" />
              History
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Deployment History</DialogTitle>
              <DialogDescription>
                View all deployments for {productName}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Clock className="h-6 w-6 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-500">Loading history...</span>
                </div>
              ) : deploymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No deployment history found.
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {deploymentHistory.map((deployment) => (
                    <div 
                      key={deployment.id} 
                      className="flex items-start gap-3 p-3 border rounded-lg"
                    >
                      {getStatusIcon(deployment.deployment_status)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium capitalize">
                            {deployment.deployment_status}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatDate(deployment.created_at)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {deployment.source_environment} → {deployment.target_environment}
                        </p>
                        {deployment.error_message && (
                          <p className="text-xs text-red-600 mt-1">
                            {deployment.error_message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsHistoryDialogOpen(false)}
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}