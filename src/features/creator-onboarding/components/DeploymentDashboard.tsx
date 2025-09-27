'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle, Clock, TestTube, TrendingUp,Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';

import {
  batchDeployCreatorProductsAction,
  deployCreatorProductToProductionAction,
  getCreatorDeploymentSummaryAction,
  getCreatorEnvironmentStatusAction,
  getCreatorProductDeploymentPreviewAction,
  validateCreatorProductsForDeploymentAction,
} from '../actions/creator-environment-actions';
import type { CreatorEnvironmentStatus, DeploymentSummary,ProductDeploymentPreview } from '../services/creator-environment-service';

interface DeploymentDashboardProps {
  creatorId: string;
  className?: string;
}

export function DeploymentDashboard({ creatorId, className = '' }: DeploymentDashboardProps) {
  const [environmentStatus, setEnvironmentStatus] = useState<CreatorEnvironmentStatus | null>(null);
  const [productPreviews, setProductPreviews] = useState<ProductDeploymentPreview[]>([]);
  const [deploymentSummary, setDeploymentSummary] = useState<DeploymentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deployingProducts, setDeployingProducts] = useState<Set<string>>(new Set());
  const [validationResults, setValidationResults] = useState<{
    readyToDeploy: string[];
    needsAttention: Array<{
      productId: string;
      productName: string;
      issues: Array<{
        check: string;
        message: string;
        critical: boolean;
      }>;
    }>;
  } | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [status, previews, summary, validation] = await Promise.all([
        getCreatorEnvironmentStatusAction(),
        getCreatorProductDeploymentPreviewAction(),
        getCreatorDeploymentSummaryAction(),
        validateCreatorProductsForDeploymentAction(),
      ]);

      setEnvironmentStatus(status);
      setProductPreviews(previews);
      setDeploymentSummary(summary);
      setValidationResults(validation);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        description: 'Failed to load deployment dashboard. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeployProduct = async (productId: string, productName: string) => {
    setDeployingProducts(prev => new Set(prev).add(productId));
    
    try {
      const result = await deployCreatorProductToProductionAction(productId);
      
      if (result.success) {
        toast({
          description: `🎉 ${productName} successfully deployed to production!`,
          variant: 'default',
        });
        await loadDashboardData(); // Reload data
      } else {
        toast({
          description: `Failed to deploy ${productName}: ${result.error}`,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Deployment error:', error);
      toast({
        description: `Deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setDeployingProducts(prev => {
        const newSet = new Set(prev);
        newSet.delete(productId);
        return newSet;
      });
    }
  };

  const handleBatchDeploy = async () => {
    if (!validationResults || validationResults.readyToDeploy.length === 0) {
      toast({
        description: 'No products are ready to deploy.',
        variant: 'default',
      });
      return;
    }

    const productIds = validationResults.readyToDeploy;
    setDeployingProducts(new Set(productIds));

    try {
      const result = await batchDeployCreatorProductsAction(productIds);
      
      toast({
        description: `Batch deployment completed: ${result.summary.successful} successful, ${result.summary.failed} failed`,
        variant: result.summary.failed === 0 ? 'default' : 'destructive',
      });
      
      await loadDashboardData(); // Reload data
    } catch (error) {
      console.error('Batch deployment error:', error);
      toast({
        description: `Batch deployment failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive',
      });
    } finally {
      setDeployingProducts(new Set());
    }
  };

  if (isLoading) {
    return (
      <div className={`${className} flex items-center justify-center py-12`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!environmentStatus || !deploymentSummary) {
    return (
      <div className={`${className} text-center py-8`}>
        <p className="text-gray-600">Unable to load deployment dashboard.</p>
        <Button onClick={loadDashboardData} className="mt-2">Try Again</Button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Environment Status Header */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Environment Status</h2>
            <p className="text-gray-600">Manage your test and production environments</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="flex items-center gap-1 text-blue-700 font-semibold">
                <TestTube className="h-4 w-4" />
                {environmentStatus.productsInTest}
              </div>
              <p className="text-xs text-blue-600">Test Products</p>
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400" />
            <div className="text-center">
              <div className="flex items-center gap-1 text-green-700 font-semibold">
                <Zap className="h-4 w-4" />
                {environmentStatus.productsInProduction}
              </div>
              <p className="text-xs text-green-600">Live Products</p>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-lg font-semibold text-gray-900">{deploymentSummary.totalProducts}</div>
            <p className="text-xs text-gray-600">Total Products</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-lg font-semibold text-green-700">{deploymentSummary.readyToDeploy}</div>
            <p className="text-xs text-gray-600">Ready to Deploy</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-lg font-semibold text-amber-700">{deploymentSummary.needsAttention}</div>
            <p className="text-xs text-gray-600">Needs Attention</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <div className="text-lg font-semibold text-gray-700">{deploymentSummary.estimatedDowntime}</div>
            <p className="text-xs text-gray-600">Downtime</p>
          </div>
        </div>
      </div>

      {/* Deployment Actions */}
      {validationResults && validationResults.readyToDeploy.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-900">Ready for Production</h3>
              <p className="text-sm text-green-700">
                {validationResults.readyToDeploy.length} products are validated and ready to deploy
              </p>
            </div>
            <Button
              onClick={handleBatchDeploy}
              disabled={deployingProducts.size > 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {deployingProducts.size > 0 ? 'Deploying...' : `Deploy All (${validationResults.readyToDeploy.length})`}
            </Button>
          </div>
        </div>
      )}

      {/* Products List */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Your Products</h3>
        
        {productPreviews.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
            <TestTube className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h4>
            <p className="text-gray-600">Create your first product to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {productPreviews.map((product) => (
              <div key={product.productId} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{product.productName}</h4>
                      {product.isDeployed ? (
                        <div className="flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                          <Zap className="h-3 w-3" />
                          Live
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          <TestTube className="h-3 w-3" />
                          Test Only
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3">${product.testPrice}/month</p>
                    
                    {/* Validation Status */}
                    <div className="space-y-1">
                      {product.validationResults.map((result, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          {result.status === 'passed' ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : result.status === 'warning' ? (
                            <AlertCircle className="h-3 w-3 text-yellow-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span className={
                            result.status === 'passed' ? 'text-green-700' :
                            result.status === 'warning' ? 'text-yellow-700' : 'text-red-700'
                          }>
                            {result.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 ml-4">
                    {!product.isDeployed && 
                     product.validationResults.every(r => r.status !== 'failed') && (
                      <Button 
                        size="sm"
                        onClick={() => handleDeployProduct(product.productId, product.productName)}
                        disabled={deployingProducts.has(product.productId)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {deployingProducts.has(product.productId) ? (
                          <>
                            <Clock className="h-4 w-4 mr-1 animate-spin" />
                            Deploying...
                          </>
                        ) : (
                          <>
                            <ArrowRight className="h-4 w-4 mr-1" />
                            Deploy Live
                          </>
                        )}
                      </Button>
                    )}
                    
                    {product.isDeployed && (
                      <div className="flex items-center gap-1 text-sm text-green-700">
                        <TrendingUp className="h-4 w-4" />
                        Production Ready
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Issues that need attention */}
      {validationResults && validationResults.needsAttention.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="font-semibold text-amber-900 mb-3">Products Needing Attention</h3>
          <div className="space-y-3">
            {validationResults.needsAttention.map((item) => (
              <div key={item.productId} className="bg-white rounded p-3 border border-amber-200">
                <h4 className="font-medium text-amber-900 mb-2">{item.productName}</h4>
                <div className="space-y-1">
                  {item.issues.map((issue, index) => (
                    <div key={index} className="flex items-center gap-2 text-sm text-amber-800">
                      <AlertCircle className="h-3 w-3" />
                      {issue.message}
                      {issue.critical && <span className="text-red-600 font-medium">(Critical)</span>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Last Deployment Info */}
      {environmentStatus.lastDeployment && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Recent Activity</h4>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            {environmentStatus.lastDeployment.status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span>
              {environmentStatus.lastDeployment.productName} 
              {environmentStatus.lastDeployment.status === 'success' ? ' deployed successfully' : ' deployment failed'}
            </span>
            <span className="text-gray-500">
              • {new Date(environmentStatus.lastDeployment.date).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}