'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, Archive, Calendar, CheckCircle, Code, Edit, Eye, MoreHorizontal, Package, Plus, Tag, TestTube, Trash2, X, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [selectedProductForEmbed, setSelectedProductForEmbed] = useState<ProductWithPrices | null>(null);
  const [isActive, setIsActive] = useState(true);
  
  // New states for extensive product configuration
  const [productImages, setProductImages] = useState<string[]>(['']);
  const [productFeatures, setProductFeatures] = useState<string[]>(['']);
  const [productCategory, setProductCategory] = useState('');
  const [productTags, setProductTags] = useState('');
  const [statementDescriptor, setStatementDescriptor] = useState('');
  const [unitLabel, setUnitLabel] = useState('');
  const [billingInterval, setBillingInterval] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [billingIntervalCount, setBillingIntervalCount] = useState(1);
  const [trialPeriodDays, setTrialPeriodDays] = useState(0);

  // Tier Dialog States (adding these to fix reference error)
  const [isTierFormDialogOpen, setIsTierFormDialogOpen] = useState(false);
  const [selectedTierForEdit, setSelectedTierForEdit] = useState<any | null>(null);
  const [isTierSubmitting, setIsTierSubmitting] = useState(false);
  const [tierFormData, setTierFormData] = useState<any>({});
  const [tierValidationErrors, setTierValidationErrors] = useState<string[]>([]);
  const [tierPreviewData, setTierPreviewData] = useState<any>(null);
  const [showTierPreviewModal, setShowTierPreviewModal] = useState(false);
  const [tierActiveStatus, setTierActiveStatus] = useState(true);

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
    // Reset new states for new product
    setProductImages(['']);
    setProductFeatures(['']);
    setProductCategory('');
    setProductTags('');
    setStatementDescriptor('');
    setUnitLabel('');
    setBillingInterval('month');
    setBillingIntervalCount(1);
    setTrialPeriodDays(0);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (product: ProductWithPrices) => {
    setSelectedProduct(product);
    setIsActive(product.active ?? true);
    // Initialize new states from existing product
    setProductImages(product.image ? [product.image] : ['']);
    setProductFeatures(product.metadata?.features?.split(',').filter(Boolean) || ['']);
    setProductCategory(product.metadata?.category || '');
    setProductTags(product.metadata?.tags || '');
    setStatementDescriptor(product.statement_descriptor || '');
    setUnitLabel(product.unit_label || '');
    setBillingInterval((product.prices.find(p => p.recurring?.interval)?.interval as any) || 'month');
    setBillingIntervalCount(product.prices.find(p => p.recurring?.interval_count)?.interval_count || 1);
    setTrialPeriodDays(product.prices.find(p => p.recurring?.trial_period_days)?.trial_period_days || 0);
    setIsFormDialogOpen(true);
  };

  const handleEmbed = (product: ProductWithPrices) => {
    setSelectedProductForEmbed(product);
    setIsEmbedDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    
    // Ensure 'id' is truly undefined for new products, not the string "$undefined"
    const productId = selectedProduct?.id || undefined;

    const productData = {
      id: productId,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: productImages[0] || undefined, // Use first image for DB 'image' column
      images: productImages.filter(img => img.trim() !== ''), // All images for Stripe
      monthlyPrice: parseFloat(formData.get('monthlyPrice') as string),
      yearlyPrice: parseFloat(formData.get('yearlyPrice') as string),
      active: isActive,
      // New fields
      statement_descriptor: statementDescriptor,
      unit_label: unitLabel,
      features: productFeatures.filter(f => f.trim() !== ''),
      category: productCategory,
      tags: productTags.split(',').map(t => t.trim()).filter(Boolean),
      billing_interval: billingInterval,
      billing_interval_count: billingIntervalCount,
      trial_period_days: trialPeriodDays,
    };

    try {
      let updatedProducts;
      if (productId) { // If productId exists, it's an update
        updatedProducts = await updatePlatformProductAction(productData);
        toast({ description: 'Product updated successfully.' });
      } else { // Otherwise, it's a new creation
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

  // Dummy Tier Management Handlers (to prevent crashes on interaction)
  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Tier management is not yet implemented for platform products.", variant: "destructive" });
  };
  const handleTierFormChange = (field: string, value: any) => {
    setTierFormData(prev => ({ ...prev, [field]: value }));
  };
  const handlePreviewTierImpact = async () => {
    toast({ title: "Tier impact preview is not yet implemented.", variant: "destructive" });
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
    custom_domain: settings.owner_id || 'platform', // Use owner_id as page_slug
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
      <Dialog key={isFormDialogOpen ? 'product-dialog-open' : 'product-dialog-closed'} open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Update the details for this subscription plan.' : 'Create a new subscription plan to offer your creators.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name (required)</Label>
                  <Input id="name" name="name" defaultValue={selectedProduct?.name || ''} required />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" placeholder="e.g., Digital Products" defaultValue={selectedProduct?.metadata?.category || ''} />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selectedProduct?.description || ''} />
              </div>
              <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" name="tags" placeholder="e.g., premium, featured, popular" defaultValue={selectedProduct?.metadata?.tags || ''} />
              </div>
            </div>

            {/* Product Images */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Product Images</h3>
              {productImages.map((image, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder={`Image URL ${index + 1}`}
                    value={image}
                    onChange={(e) => {
                      const updated = [...productImages];
                      updated[index] = e.target.value;
                      setProductImages(updated);
                    }}
                  />
                  {productImages.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setProductImages(productImages.filter((_, i) => i !== index))}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setProductImages([...productImages, ''])}>
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>

            {/* Pricing */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-lg">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="monthlyPrice">Monthly Price</Label>
                  <Input id="monthlyPrice" name="monthlyPrice" type="number" step="0.01" min="0" defaultValue={getPriceDefaultValue(selectedProduct, 'month')} required />
                </div>
                <div>
                  <Label htmlFor="yearlyPrice">Yearly Price</Label>
                  <Input id="yearlyPrice" name="yearlyPrice" type="number" step="0.01" min="0" defaultValue={getPriceDefaultValue(selectedProduct, 'year')} required />
                </div>
                <div>
                  <Label htmlFor="product_type">Product Type</Label>
                  <select
                    id="product_type"
                    name="product_type"
                    defaultValue={selectedProduct?.product_type || 'subscription'}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="subscription">Subscription</option>
                    <option value="one_time">One-time</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Subscription Options */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-lg">Subscription Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="billing_interval">Billing Interval</Label>
                  <select
                    id="billing_interval"
                    name="billing_interval"
                    value={billingInterval}
                    onChange={(e) => setBillingInterval(e.target.value as any)}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="billing_interval_count">Interval Count</Label>
                  <Input id="billing_interval_count" name="billing_interval_count" type="number" min="1" value={billingIntervalCount} onChange={(e) => setBillingIntervalCount(parseInt(e.target.value) || 1)} />
                </div>
                <div>
                  <Label htmlFor="trial_period_days">Trial Period (days)</Label>
                  <Input id="trial_period_days" name="trial_period_days" type="number" min="0" placeholder="0" value={trialPeriodDays} onChange={(e) => setTrialPeriodDays(parseInt(e.target.value) || 0)} />
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-lg">Advanced Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="statement_descriptor">Statement Descriptor</Label>
                  <Input id="statement_descriptor" name="statement_descriptor" placeholder="Appears on card statements" value={statementDescriptor} onChange={(e) => setStatementDescriptor(e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="unit_label">Unit Label</Label>
                  <Input id="unit_label" name="unit_label" placeholder="e.g., per user, per seat" value={unitLabel} onChange={(e) => setUnitLabel(e.target.value)} />
                </div>
              </div>
            </div>

            {/* Product Features */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-lg">Product Features</h3>
              {productFeatures.map((feature, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Input
                    placeholder={`Feature ${index + 1}`}
                    value={feature}
                    onChange={(e) => {
                      const updated = [...productFeatures];
                      updated[index] = e.target.value;
                      setProductFeatures(updated);
                    }}
                  />
                  {productFeatures.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => setProductFeatures(productFeatures.filter((_, i) => i !== index))}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => setProductFeatures([...productFeatures, ''])}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
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

      {/* Tier Edit/Add Dialog */}
      <Dialog open={isTierFormDialogOpen} onOpenChange={setIsTierFormDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedTierForEdit ? 'Edit Tier' : 'Create New Tier'}</DialogTitle>
            <DialogDescription>
              {selectedTierForEdit ? 'Update the details for this tier.' : 'Create a new subscription tier for your product.'}
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="pricing">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="usage">Usage Limits</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>
            <form onSubmit={handleTierSubmit} className="space-y-6 p-4">
              <TabsContent value="pricing" className="space-y-4">
                <div>
                  <Label htmlFor="tier-name">Tier Name (required)</Label>
                  <Input id="tier-name" value={tierFormData.name ?? ''} onChange={(e) => handleTierFormChange('name', e.target.value)} required />
                </div>
                <div>
                  <Label htmlFor="tier-description">Description</Label>
                  <Textarea id="tier-description" value={tierFormData.description ?? ''} onChange={(e) => handleTierFormChange('description', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tier-price">Price (required)</Label>
                    <Input id="tier-price" type="number" step="0.01" min="0" value={tierFormData.price ?? ''} onChange={(e) => handleTierFormChange('price', parseFloat(e.target.value))} required />
                  </div>
                  <div>
                    <Label htmlFor="tier-currency">Currency</Label>
                    <Select value={tierFormData.currency ?? 'usd'} onValueChange={(value) => handleTierFormChange('currency', value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="usd">USD</SelectItem>
                        <SelectItem value="eur">EUR</SelectItem>
                        <SelectItem value="gbp">GBP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tier-billing-cycle">Billing Cycle</Label>
                    <Select value={tierFormData.billing_cycle ?? 'monthly'} onValueChange={(value) => handleTierFormChange('billing_cycle', value as 'monthly' | 'yearly' | 'weekly' | 'daily')}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tier-trial-days">Trial Period (days)</Label>
                    <Input id="tier-trial-days" type="number" min="0" value={tierFormData.trial_period_days ?? 0} onChange={(e) => handleTierFormChange('trial_period_days', parseInt(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="tier-is-default">Set as Default Tier</Label>
                  <Switch id="tier-is-default" checked={tierFormData.is_default ?? false} onCheckedChange={(checked) => handleTierFormChange('is_default', checked)} />
                </div>
                {selectedTierForEdit && (
                  <div className="flex items-center justify-between">
                    <Label htmlFor="tier-active-status">Tier Status</Label>
                    <Switch id="tier-active-status" checked={tierActiveStatus} onCheckedChange={setTierActiveStatus} />
                  </div>
                )}
              </TabsContent>
              <TabsContent value="features" className="space-y-4">
                <div>
                  <Label htmlFor="tier-features">Feature Entitlements (one per line)</Label>
                  <Textarea id="tier-features" value={(tierFormData.feature_entitlements as string[] || []).join('\n')} onChange={(e) => handleTierFormChange('feature_entitlements', e.target.value.split('\n').filter(f => f.trim()))} rows={6} placeholder="custom_domain&#10;team_seats:10&#10;api_access" />
                </div>
              </TabsContent>
              <TabsContent value="usage" className="space-y-4">
                <div>
                  <Label htmlFor="tier-usage-caps">Usage Caps (metric:limit per line)</Label>
                  <Textarea id="tier-usage-caps" value={Object.entries(tierFormData.usage_caps || {}).map(([k, v]) => `${k}:${v}`).join('\n')} onChange={(e) => handleTierFormChange('usage_caps', e.target.value)} rows={6} placeholder="api_calls:50000&#10;projects_created:100&#10;storage_gb:10" />
                </div>
              </TabsContent>
              <TabsContent value="preview" className="space-y-4">
                <Button type="button" onClick={handlePreviewTierImpact} disabled={isTierSubmitting || tierValidationErrors.length > 0}>
                  <Eye className="h-4 w-4 mr-2" />
                  Generate Preview
                </Button>
                {tierPreviewData && (
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <h4 className="font-semibold mb-2">Revenue Impact</h4>
                    <p>Base Revenue: ${tierPreviewData.revenueImpact?.baseRevenue?.toFixed(2)}</p>
                    <p>Overage Revenue: ${tierPreviewData.revenueImpact?.overageRevenue?.toFixed(2)}</p>
                    <p>Total Revenue: ${tierPreviewData.revenueImpact?.totalRevenue?.toFixed(2)}</p>
                    <h4 className="font-semibold mt-4 mb-2">Projected Overages</h4>
                    {tierPreviewData.projectedOverages.length === 0 ? (
                      <p>No projected overages with this configuration.</p>
                    ) : (
                      <ul>
                        {tierPreviewData.projectedOverages.map((overage: any, idx: number) => (
                          <li key={idx}>{overage.metric}: {overage.projectedOverage} units (${overage.overageCost.toFixed(2)})</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </TabsContent>
              {tierValidationErrors.length > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <ul className="text-sm text-red-700 space-y-1">
                    {tierValidationErrors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsTierFormDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isTierSubmitting || tierValidationErrors.length > 0}>
                  {isTierSubmitting ? 'Saving...' : selectedTierForEdit ? 'Save Changes' : 'Create Tier'}
                </Button>
              </DialogFooter>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      {selectedProductForEmbed && (
        <EmbedCodeDialog
          isOpen={isEmbedDialogOpen}
          onOpenChange={setIsEmbedDialogOpen}
          product={selectedProductForEmbed}
          creatorProfile={platformOwnerProfile}
        />
      )}

      {/* Tier Preview Modal */}
      <Dialog open={showTierPreviewModal} onOpenChange={setShowTierPreviewModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tier Impact Preview</DialogTitle>
            <DialogDescription>
              See how this tier configuration affects revenue and usage.
            </DialogDescription>
          </DialogHeader>
          {tierPreviewData && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Revenue Impact</h4>
                <p>Base Revenue: ${tierPreviewData.revenueImpact?.baseRevenue?.toFixed(2)}</p>
                <p>Overage Revenue: ${tierPreviewData.revenueImpact?.overageRevenue?.toFixed(2)}</p>
                <p>Total Revenue: ${tierPreviewData.revenueImpact?.totalRevenue?.toFixed(2)}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Projected Overages</h4>
                {tierPreviewData.projectedOverages.length === 0 ? (
                  <p>No projected overages with this configuration.</p>
                ) : (
                      <ul>
                        {tierPreviewData.projectedOverages.map((overage: any, idx: number) => (
                          <li key={idx}>{overage.metric}: {overage.projectedOverage} units (${overage.overageCost.toFixed(2)})</li>
                        ))}
                      </ul>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowTierPreviewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}