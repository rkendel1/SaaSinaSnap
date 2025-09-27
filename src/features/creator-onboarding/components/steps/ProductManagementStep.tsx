'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, ArrowRight, CheckCircle, Eye, Plus, Settings,TestTube, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';

import { fetchStripeProductsForCreatorAction,importProductsFromStripeAction } from '../../actions/product-actions';
import { type CreatorEnvironmentStatus,deployCreatorProductToProduction, getCreatorEnvironmentStatus, getProductDeploymentPreview, type ProductDeploymentPreview } from '../../services/creator-environment-service';
import type { CreatorProfile, ProductFormItem } from '../../types';

interface ProductManagementStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

interface NewProductForm {
  name: string;
  description: string;
  price: number;
  productType: 'one_time' | 'subscription';
  currency: string;
}

export function ProductManagementStep({ 
  profile, 
  onNext, 
  setSubmitFunction 
}: ProductManagementStepProps) {
  const [environmentStatus, setEnvironmentStatus] = useState<CreatorEnvironmentStatus | null>(null);
  const [productPreviews, setProductPreviews] = useState<ProductDeploymentPreview[]>([]);
  const [existingStripeProducts, setExistingStripeProducts] = useState<ProductFormItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [isImportingProducts, setIsImportingProducts] = useState(false);
  const [showNewProductDialog, setShowNewProductDialog] = useState(false);
  const [newProductForm, setNewProductForm] = useState<NewProductForm>({
    name: '',
    description: '',
    price: 0,
    productType: 'subscription',
    currency: 'usd',
  });

  // Load initial data
  useEffect(() => {
    loadData();
  }, [profile.id]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [status, previews, stripeProducts] = await Promise.all([
        getCreatorEnvironmentStatus(profile.id),
        getProductDeploymentPreview(profile.id),
        fetchStripeProductsForCreatorAction(),
      ]);
      
      setEnvironmentStatus(status);
      setProductPreviews(previews);
      setExistingStripeProducts(stripeProducts);
    } catch (error) {
      console.error('Error loading product data:', error);
      toast({
        description: 'Failed to load product data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!newProductForm.name || newProductForm.price <= 0) {
      toast({
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingProduct(true);
    try {
      const productData: ProductFormItem = {
        name: newProductForm.name,
        description: newProductForm.description,
        price: newProductForm.price,
        currency: newProductForm.currency,
        type: newProductForm.productType,
        active: true,
        isExistingStripeProduct: false,
        stripeProductId: '',
        stripePriceId: '',
      };

      await importProductsFromStripeAction([productData]);
      
      toast({
        description: 'Product created successfully in test environment!',
        variant: 'default',
      });

      setShowNewProductDialog(false);
      setNewProductForm({
        name: '',
        description: '',
        price: 0,
        productType: 'subscription',
        currency: 'usd',
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        description: 'Failed to create product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingProduct(false);
    }
  };

  const handleImportProducts = async () => {
    if (existingStripeProducts.length === 0) {
      toast({
        description: 'No products found in your Stripe account to import.',
        variant: 'default',
      });
      return;
    }

    setIsImportingProducts(true);
    try {
      await importProductsFromStripeAction(existingStripeProducts);
      
      toast({
        description: `Successfully imported ${existingStripeProducts.length} products from Stripe!`,
        variant: 'default',
      });

      // Reload data
      await loadData();
    } catch (error) {
      console.error('Error importing products:', error);
      toast({
        description: 'Failed to import products. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsImportingProducts(false);
    }
  };

  const handleDeployProduct = async (productId: string, productName: string) => {
    try {
      const result = await deployCreatorProductToProduction(profile.id, productId);
      
      if (result.success) {
        toast({
          description: `${productName} successfully deployed to production! 🎉`,
          variant: 'default',
        });
        await loadData(); // Reload data to reflect changes
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
    }
  };

  const handleSubmit = async () => {
    if (productPreviews.length === 0) {
      toast({
        description: 'Please create at least one product before continuing.',
        variant: 'destructive',
      });
      return;
    }
    onNext();
  };

  useEffect(() => {
    setSubmitFunction(() => handleSubmit);
    return () => setSubmitFunction(null);
  }, [setSubmitFunction, productPreviews.length, onNext]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Manage Your Products</h2>
        <p className="text-gray-600">
          Create and manage your products in the test environment. You can deploy them to production when ready.
        </p>
      </div>

      {/* Environment Status */}
      {environmentStatus && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-blue-900">Test Environment Active</span>
            </div>
            <div className="text-sm text-blue-700">
              {environmentStatus.productsInTest} test products
            </div>
          </div>
          <p className="text-sm text-blue-800">
            Perfect! You're in test mode where you can safely create and experiment with products.
            Use test card 4242424242424242 to validate payment flows.
          </p>
        </div>
      )}

      {/* Product Actions */}
      <div className="grid md:grid-cols-2 gap-4">
        <Button 
          className="h-auto p-6 flex-col items-start text-left"
          onClick={() => setShowNewProductDialog(true)}
        >
          <div className="flex items-center gap-2 mb-2">
            <Plus className="h-5 w-5" />
            <span className="font-semibold">Create New Product</span>
          </div>
          <p className="text-sm text-gray-600">
            Design a new subscription tier or one-time product from scratch
          </p>
        </Button>

        {existingStripeProducts.length > 0 && (
          <Button 
            variant="outline" 
            className="h-auto p-6 flex-col items-start text-left"
            onClick={handleImportProducts}
            disabled={isImportingProducts}
          >
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-5 w-5" />
              <span className="font-semibold">Import from Stripe</span>
            </div>
            <p className="text-sm text-gray-600">
              Import {existingStripeProducts.length} existing products from your Stripe account
            </p>
            {isImportingProducts && (
              <div className="mt-2 text-xs text-gray-500">Importing...</div>
            )}
          </Button>
        )}
      </div>

      {/* New Product Modal */}
      {showNewProductDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">Create New Product</h3>
              <p className="text-sm text-gray-600">
                This will create a new product in your Stripe test environment
              </p>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="productName">Product Name *</Label>
                <Input
                  id="productName"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Pro Plan"
                />
              </div>
              <div>
                <Label htmlFor="productDescription">Description</Label>
                <Textarea
                  id="productDescription"
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this product offers..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="productPrice">Price *</Label>
                  <Input
                    id="productPrice"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProductForm.price || ''}
                    onChange={(e) => setNewProductForm(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    placeholder="29.99"
                  />
                </div>
                <div>
                  <Label htmlFor="productCurrency">Currency</Label>
                  <Select 
                    value={newProductForm.currency} 
                    onValueChange={(value) => setNewProductForm(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD</SelectItem>
                      <SelectItem value="eur">EUR</SelectItem>
                      <SelectItem value="gbp">GBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="productType">Product Type</Label>
                <Select 
                  value={newProductForm.productType} 
                  onValueChange={(value: 'one_time' | 'subscription') => setNewProductForm(prev => ({ ...prev, productType: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="subscription">Monthly Subscription</SelectItem>
                    <SelectItem value="one_time">One-Time Payment</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleCreateProduct} 
                  disabled={isCreatingProduct}
                  className="flex-1"
                >
                  {isCreatingProduct ? 'Creating...' : 'Create Product'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowNewProductDialog(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products List */}
      {productPreviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900">Your Products</h3>
          <div className="space-y-3">
            {productPreviews.map((product) => (
              <div key={product.productId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
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
                    <p className="text-sm text-gray-600 mb-2">${product.testPrice}/month</p>
                    
                    {/* Validation Results */}
                    <div className="flex gap-2 mb-3">
                      {product.validationResults.map((result, index) => (
                        <div key={index} className="flex items-center gap-1">
                          {result.status === 'passed' ? (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          ) : result.status === 'warning' ? (
                            <AlertCircle className="h-3 w-3 text-yellow-500" />
                          ) : (
                            <AlertCircle className="h-3 w-3 text-red-500" />
                          )}
                          <span className={`text-xs ${
                            result.status === 'passed' ? 'text-green-700' :
                            result.status === 'warning' ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {result.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    {!product.isDeployed && 
                     product.validationResults.every(r => r.status !== 'failed') && (
                      <Button 
                        size="sm"
                        onClick={() => handleDeployProduct(product.productId, product.productName)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Deploy Live
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {productPreviews.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Plus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Products Yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first product to start building your SaaS offering
          </p>
          <Button onClick={() => setShowNewProductDialog(true)}>
            Create Your First Product
          </Button>
        </div>
      )}

      {/* Next Steps Hint */}
      {productPreviews.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Next Steps</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Test your products using Stripe test cards</li>
            <li>• Deploy to production when you're ready to accept real payments</li>
            <li>• Your embeds will automatically work with both test and live products</li>
          </ul>
        </div>
      )}
    </div>
  );
}