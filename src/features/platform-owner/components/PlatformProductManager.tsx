'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Archive, Calendar, CheckCircle, Code, Edit, Package, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { EmbedCodeDialog } from '@/features/creator/components/EmbedCodeDialog';
import { CreatorProfile } from '@/features/creator/types'; // Import CreatorProfile
import { EnvironmentSwitcher } from '@/features/platform-owner-onboarding/components/EnvironmentSwitcher';
import { ProductDeploymentManager } from '@/features/platform-owner-onboarding/components/ProductDeploymentManager';
import { PlatformSettings } from '@/features/platform-owner-onboarding/types';
import { ProductWithPrices } from '@/features/pricing/types';

import { approvePlatformProductAction,createPlatformProductAction, updatePlatformProductAction } from '../actions/product-actions';

interface PlatformProductManagerProps {
  initialProducts: ProductWithPrices[];
  settings: PlatformSettings;
}

export function PlatformProductManager({
  initialProducts,
  settings,
}: PlatformProductManagerProps) {
  const [products, setProducts] = useState<ProductWithPrices[]>(initialProducts);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithPrices | null>(null);
  const [isActive, setIsActive] = useState(true);
  
  // Environment-aware state
  const [currentEnvironment, setCurrentEnvironment] = useState<'test' | 'production'>(
    settings.stripe_environment || 'test'
  );

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsActive(true);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (product: ProductWithPrices) => {
    setSelectedProduct(product);
    setIsActive(product.active ?? true);
    setIsFormDialogOpen(true);
  };

  const handleEmbed = (product: ProductWithPrices) => {
    setSelectedProduct(product);
    setIsEmbedDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const productData = {
      id: selectedProduct?.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image') as string,
      monthlyPrice: parseFloat(formData.get('monthlyPrice') as string),
      yearlyPrice: parseFloat(formData.get('yearlyPrice') as string),
      active: isActive,
    };

    try {
      let updatedProducts;
      if (selectedProduct) {
        updatedProducts = await updatePlatformProductAction(productData);
        toast({ description: 'Product updated successfully.' });
      } else {
        updatedProducts = await createPlatformProductAction(productData);
        toast({ description: 'Product created successfully.' });
      }
      setProducts(updatedProducts);
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({ variant: 'destructive', description: 'Failed to save product. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (product: ProductWithPrices) => {
    if (!confirm(`Are you sure you want to archive "${product.name}"? This will make it unavailable for new subscriptions.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      const productData = {
        id: product.id,
        name: product.name || '',
        description: product.description || '',
        image: product.image || '',
        monthlyPrice: (product.prices.find((p: any) => p.interval === 'month')?.unit_amount ?? 0) / 100,
        yearlyPrice: (product.prices.find((p: any) => p.interval === 'year')?.unit_amount ?? 0) / 100,
        active: false,
      };
      const updatedProducts = await updatePlatformProductAction(productData);
      setProducts(updatedProducts);
      toast({ description: 'Product archived successfully.' });
    } catch (error) {
      console.error('Failed to archive product:', error);
      toast({ variant: 'destructive', description: 'Failed to archive product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproval = async (product: ProductWithPrices, approved: boolean) => {
    setIsSubmitting(true);
    try {
      await approvePlatformProductAction(product.id, approved);
      
      // Update the local state
      setProducts(prevProducts => 
        prevProducts.map(p => 
          p.id === product.id 
            ? { ...p, approved } as ProductWithPrices
            : p
        )
      );
      
      toast({ 
        description: `Product ${approved ? 'approved' : 'unapproved'} successfully.`,
        variant: approved ? 'default' : 'destructive'
      });
    } catch (error) {
      console.error('Failed to update product approval:', error);
      toast({ 
        variant: 'destructive', 
        description: 'Failed to update product approval.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriceDefaultValue = (product: ProductWithPrices | null, interval: 'month' | 'year') => {
    const amount = product?.prices.find((p: any) => p.interval === interval)?.unit_amount;
    return amount ? amount / 100 : '';
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Create a mock CreatorProfile for the platform owner to pass to EmbedCodeDialog
  const platformOwnerProfile: CreatorProfile = {
    id: settings.owner_id || 'platform-owner', // Fallback ID
    business_name: 'SaaSinaSnap Platform',
    business_description: 'The main platform for SaaSinaSnap',
    business_website: null,
    business_logo_url: null,
    stripe_account_id: settings.stripe_account_id,
    stripe_account_enabled: settings.stripe_account_enabled,
    onboarding_completed: true, // Assume completed for platform owner
    onboarding_step: null,
    brand_color: settings.default_creator_brand_color || '#ea580c',
    brand_gradient: settings.default_creator_gradient as any,
    brand_pattern: settings.default_creator_pattern as any,
    page_slug: settings.owner_id || 'platform', // Use owner_id as page_slug
    created_at: settings.created_at,
    updated_at: settings.updated_at,
    stripe_access_token: settings.stripe_access_token,
    stripe_refresh_token: settings.stripe_refresh_token,
    branding_extracted_at: null,
    branding_extraction_error: null,
    branding_extraction_status: null,
    extracted_branding_data: null,
    // Added missing fields for CreatorProfile type
    billing_email: null,
    billing_phone: null,
    billing_address: null,
  };

  return (
    <div>
      {/* Connection Status & Header */}
      <div className="mb-6">
        {(settings.stripe_test_enabled || settings.stripe_production_enabled) ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h4 className="font-medium text-green-800">Stripe Environments Connected</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-green-700">
              {settings.stripe_test_enabled && (
                <div>
                  <p className="font-medium">✓ Test Environment</p>
                  <p className="font-mono text-xs">{settings.stripe_test_account_id}</p>
                </div>
              )}
              {settings.stripe_production_enabled && (
                <div>
                  <p className="font-medium">✓ Production Environment</p>
                  <p className="font-mono text-xs">{settings.stripe_production_account_id}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="font-medium text-red-800">Stripe Account Not Connected</h4>
              <p className="text-sm text-red-700">
                You must connect your Stripe account to create products and accept payments.
                <Link href="/platform-owner-onboarding" className="ml-2 font-semibold underline hover:no-underline">
                  Connect Stripe Now
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Manage Platform Products</h1>
          <EnvironmentSwitcher
            currentEnvironment={currentEnvironment}
            testEnabled={settings.stripe_test_enabled || false}
            productionEnabled={settings.stripe_production_enabled || false}
            onEnvironmentChange={setCurrentEnvironment}
          />
        </div>
        <Button 
          onClick={handleAddNew} 
          disabled={!settings.stripe_test_enabled && !settings.stripe_production_enabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Product
        </Button>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {products.map((product) => (
            <div key={product.id} className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  {product.image ? (
                    <Image src={product.image} alt={product.name || ''} width={40} height={40} className="rounded-md object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                      <Package className="h-5 w-5 text-gray-400" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      {(product as any).approved ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approved
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Pending Approval
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{product.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <ProductDeploymentManager
                    productId={product.id}
                    productName={product.name}
                    isTestProduct={currentEnvironment === 'test'}
                    hasProductionVersion={!!product.stripe_production_product_id}
                    lastDeployedAt={product.last_deployed_to_production}
                    onDeploymentComplete={() => {
                      // Refresh the products list
                      window.location.reload();
                    }}
                  />
                  <Button variant="ghost" size="sm" onClick={() => handleEmbed(product)}><Code className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleApproval(product, !(product as any).approved)}
                    className={`${(product as any).approved ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'}`}
                    disabled={isSubmitting}
                  >
                    {(product as any).approved ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </Button>
                  {product.active && (
                    <Button variant="ghost" size="sm" onClick={() => handleArchive(product)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                  )}
                </div>
              </div>
              <div className="mt-4 pl-14">
                <h4 className="text-sm font-medium text-gray-800 mb-2">Prices</h4>
                <div className="space-y-2">
                  {product.prices.map((price: any) => (
                    <div key={price.id} className="bg-gray-50 border border-gray-200 rounded-md p-3 text-sm">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className={`font-medium ${price.active ? 'text-green-600' : 'text-red-600'}`}>
                            {price.active ? 'Active' : 'Archived'}
                          </span>
                          <span className="font-semibold text-gray-900">
                            ${(price.unit_amount ?? 0) / 100} / {price.interval}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">Created: {formatDate(price.created_at)}</span>
                      </div>
                      <div className="mt-2">
                        <code className="text-xs text-gray-500 bg-gray-200 px-1 py-0.5 rounded">ID: {price.id}</code>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Approval Status Section */}
                <div className="mt-4 border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">Platform Approval Status</h4>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {(product as any).approved ? (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Approved for Pricing Page</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Pending Approval</span>
                          </>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          {(product as any).approved ? 'Visible on pricing page' : 'Hidden from pricing page'}
                        </span>
                        <Switch 
                          checked={(product as any).approved || false}
                          onCheckedChange={(checked) => handleApproval(product, checked)}
                          disabled={isSubmitting}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      {(product as any).approved 
                        ? 'This product is approved and will appear on the public pricing page.'
                        : 'This product is pending approval and will not appear on the public pricing page until approved.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit/Add Product Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Add a new product'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Update the details for this subscription plan.' : 'Create a new subscription plan to offer your creators.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name (required)</Label>
                <Input id="name" name="name" defaultValue={selectedProduct?.name || ''} required />
                <p className="text-xs text-gray-500 mt-1">Name of the product or service, visible to customers.</p>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selectedProduct?.description || ''} />
                <p className="text-xs text-gray-500 mt-1">Appears at checkout, on the customer portal, and in quotes.</p>
              </div>
              <div>
                <Label htmlFor="image">Image URL</Label>
                <Input id="image" name="image" placeholder="https://..." defaultValue={selectedProduct?.image || ''} />
                <p className="text-xs text-gray-500 mt-1">Appears at checkout. Must be a public URL.</p>
              </div>
            </div>
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium">Pricing</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="monthlyPrice">Monthly Price (USD)</Label>
                  <Input id="monthlyPrice" name="monthlyPrice" type="number" step="0.01" min="0" defaultValue={getPriceDefaultValue(selectedProduct, 'month')} required />
                </div>
                <div>
                  <Label htmlFor="yearlyPrice">Yearly Price (USD)</Label>
                  <Input id="yearlyPrice" name="yearlyPrice" type="number" step="0.01" min="0" defaultValue={getPriceDefaultValue(selectedProduct, 'year')} required />
                </div>
              </div>
            </div>
            {selectedProduct && (
              <div className="flex items-center justify-between border-t pt-4">
                <Label htmlFor="active-status">Product Status</Label>
                <div className="flex items-center gap-2">
                  <Switch id="active-status" checked={isActive} onCheckedChange={setIsActive} />
                  <span className="text-sm">{isActive ? 'Active' : 'Archived'}</span>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsFormDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : selectedProduct ? 'Save Changes' : 'Add Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      {selectedProduct && settings.owner_id && (
        <EmbedCodeDialog
          isOpen={isEmbedDialogOpen}
          onOpenChange={setIsEmbedDialogOpen}
          product={selectedProduct}
          creatorProfile={platformOwnerProfile}
        />
      )}
    </div>
  );
}