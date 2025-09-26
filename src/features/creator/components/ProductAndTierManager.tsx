'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  AlertTriangle, 
  Archive,
  Calendar,
  CheckCircle, 
  Code, 
  Copy,
  DollarSign,
  Edit, 
  Eye,
  EyeOff,
  Filter,
  MoreHorizontal,
  Package, 
  Plus, 
  Search,
  Tag,
  Trash2, 
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  HelpCircle,
  LayoutTemplate // Added for White-Label Sites cross-link
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { CreateTierRequest, SubscriptionTier, UpdateTierRequest } from '@/features/usage-tracking/types';
// Removed: import { TierManagementService } from '@/features/usage-tracking/services/tier-management-service';

import { 
  archiveCreatorProductAction, 
  createOrUpdateEnhancedProductAction, 
  deleteCreatorProductAction,
  duplicateCreatorProductAction} from '../actions/product-actions';
import { EmbedCodeDialog } from '../components/EmbedCodeDialog';
// Removed: import { ProductMetadata, priceCardVariantSchema } from '../models/product-metadata';
import { CreatorProduct, CreatorProfile, EnhancedProductData, ProductStatus } from '../types';

interface ProductAndTierManagerProps {
  initialProducts: CreatorProduct[];
  initialTiers: SubscriptionTier[];
  creatorProfile: CreatorProfile;
}

export function ProductAndTierManager({
  initialProducts,
  initialTiers,
  creatorProfile,
}: ProductAndTierManagerProps) {
  const [products, setProducts] = useState<CreatorProduct[]>(initialProducts);
  const [tiers, setTiers] = useState<SubscriptionTier[]>(initialTiers);
  const [filteredProducts, setFilteredProducts] = useState<CreatorProduct[]>(initialProducts);
  
  // Product Dialog States
  const [isProductFormDialogOpen, setIsProductFormDialogOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<CreatorProduct | null>(null);
  const [isProductSubmitting, setIsProductSubmitting] = useState(false);
  const [productActiveStatus, setProductActiveStatus] = useState(true);
  const [productImages, setProductImages] = useState<string[]>(['']);
  const [productMetadata, setProductMetadata] = useState<Record<string, string>>({});
  const [productFeatures, setProductFeatures] = useState<string[]>(['']);

  // Tier Dialog States
  const [isTierFormDialogOpen, setIsTierFormDialogOpen] = useState(false);
  const [selectedTierForEdit, setSelectedTierForEdit] = useState<SubscriptionTier | null>(null);
  const [isTierSubmitting, setIsTierSubmitting] = useState(false);
  const [tierFormData, setTierFormData] = useState<Partial<CreateTierRequest>>({});
  const [tierValidationErrors, setTierValidationErrors] = useState<string[]>([]);
  const [tierPreviewData, setTierPreviewData] = useState<any>(null);
  const [showTierPreviewModal, setShowTierPreviewModal] = useState(false);
  const [tierActiveStatus, setTierActiveStatus] = useState(true);
  const [showTierTemplates, setShowTierTemplates] = useState(false);
  const [tierWizardMode, setTierWizardMode] = useState(false);
  const [currentWizardStep, setCurrentWizardStep] = useState(1);

  // Embed Dialog States
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
  const [selectedProductForEmbed, setSelectedProductForEmbed] = useState<CreatorProduct | null>(null);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  const [openProductIds, setOpenProductIds] = new useState<Set<string>>(); // Initialize with new Set()

  // Filter products based on current filters
  useEffect(() => {
    let filtered = products.filter(product => {
      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!product.name.toLowerCase().includes(query) && 
            !product.description?.toLowerCase().includes(query)) {
          return false;
        }
      }
      
      // Status filter
      const isDeleted = product.metadata && 
        typeof product.metadata === 'object' && 
        'deleted_at' in (product.metadata as any);
      const isArchived = !product.active && !isDeleted;
      const isActive = product.active && !isDeleted;
      
      if (showDeleted && !isDeleted) return false;
      if (showArchived && !isArchived) return false;
      if (!showDeleted && !showArchived && !isActive) return false;
      
      return true;
    });
    
    setFilteredProducts(filtered);
  }, [products, searchQuery, showArchived, showDeleted]);

  // --- Product Management Handlers ---
  const handleAddNewProduct = () => {
    setSelectedProductForEdit(null);
    setProductActiveStatus(true);
    setProductImages(['']);
    setProductMetadata({});
    setProductFeatures(['']);
    setIsProductFormDialogOpen(true);
  };

  const handleEditProduct = (product: CreatorProduct) => {
    setSelectedProductForEdit(product);
    setProductActiveStatus(product.active ?? true);
    setProductImages(product.image_url ? [product.image_url] : ['']);
    setProductMetadata(typeof product.metadata === 'object' && product.metadata ? 
      product.metadata as Record<string, string> : {});
    setProductFeatures(
      product.metadata && 
      typeof product.metadata === 'object' && 
      (product.metadata as any).features ? 
      (product.metadata as any).features.split(',').filter(Boolean) : ['']
    );
    setIsProductFormDialogOpen(true);
  };

  const handleProductSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsProductSubmitting(true);

    const formData = new FormData(event.currentTarget);
    
    const enhancedProductData: EnhancedProductData = {
      id: selectedProductForEdit?.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      images: productImages.filter(img => img.trim() !== ''),
      price: parseFloat(formData.get('price') as string),
      currency: formData.get('currency') as string || 'usd',
      product_type: formData.get('product_type') as 'one_time' | 'subscription',
      active: productActiveStatus,
      metadata: productMetadata,
      features: productFeatures.filter(f => f.trim() !== ''),
      billing_interval: formData.get('billing_interval') as any,
      billing_interval_count: parseInt(formData.get('billing_interval_count') as string) || 1,
      trial_period_days: parseInt(formData.get('trial_period_days') as string) || undefined,
      statement_descriptor: formData.get('statement_descriptor') as string || undefined,
      unit_label: formData.get('unit_label') as string || undefined,
      category: formData.get('category') as string || undefined,
      tags: (formData.get('tags') as string)?.split(',').map(t => t.trim()).filter(Boolean) || [],
    };

    try {
      await createOrUpdateEnhancedProductAction(enhancedProductData);
      toast({ description: selectedProductForEdit ? 'Product updated successfully.' : 'Product created successfully.' });
      setIsProductFormDialogOpen(false);
      // Re-fetch all products and tiers to update the UI
      await Promise.all([fetchProducts(), fetchTiersData()]);
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({ variant: 'destructive', description: 'Failed to save product. Please try again.' });
    } finally {
      setIsProductSubmitting(false);
    }
  };

  const handleArchiveProduct = async (product: CreatorProduct) => {
    if (!confirm(`Are you sure you want to archive "${product.name}"? This will make it unavailable for new subscriptions.`)) {
      return;
    }
    setIsProductSubmitting(true);
    try {
      await archiveCreatorProductAction(product.id, 'Manually archived from dashboard');
      toast({ description: 'Product archived successfully.' });
      await fetchProducts();
    } catch (error) {
      console.error('Failed to archive product:', error);
      toast({ variant: 'destructive', description: 'Failed to archive product.' });
    } finally {
      setIsProductSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product: CreatorProduct) => {
    if (!confirm(`Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }
    setIsProductSubmitting(true);
    try {
      await deleteCreatorProductAction(product.id, 'Manually deleted from dashboard');
      toast({ description: 'Product deleted successfully.' });
      await fetchProducts();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({ variant: 'destructive', description: 'Failed to delete product.' });
    } finally {
      setIsProductSubmitting(false);
    }
  };

  const handleDuplicateProduct = async (product: CreatorProduct) => {
    setIsProductSubmitting(true);
    try {
      await duplicateCreatorProductAction(product.id, `${product.name} (Copy)`);
      toast({ description: 'Product duplicated successfully.' });
      await fetchProducts();
    } catch (error) {
      console.error('Failed to duplicate product:', error);
      toast({ variant: 'destructive', description: 'Failed to duplicate product.' });
    } finally {
      setIsProductSubmitting(false);
    }
  };

  const addProductImageField = () => setProductImages([...productImages, '']);
  const removeProductImageField = (index: number) => setProductImages(productImages.filter((_, i) => i !== index));
  const updateProductImageField = (index: number, value: string) => {
    const updated = [...productImages];
    updated[index] = value;
    setProductImages(updated);
  };

  const addProductFeatureField = () => setProductFeatures([...productFeatures, '']);
  const removeProductFeatureField = (index: number) => setProductFeatures(productFeatures.filter((_, i) => i !== index));
  const updateProductFeatureField = (index: number, value: string) => {
    const updated = [...productFeatures];
    updated[index] = value;
    setProductFeatures(updated);
  };

  const getProductStatus = (product: CreatorProduct): { status: ProductStatus; label: string; color: string } => {
    const isDeleted = product.metadata && 
      typeof product.metadata === 'object' && 
      'deleted_at' in (product.metadata as any);
    
    if (isDeleted) {
      return { status: 'deleted', label: 'Deleted', color: 'bg-red-100 text-red-800' };
    }
    
    if (!product.active) {
      return { status: 'archived', label: 'Archived', color: 'bg-orange-100 text-orange-800' };
    }
    
    return { status: 'active', label: 'Active', color: 'bg-green-100 text-green-800' };
  };

  // --- Tier Management Handlers ---
  const handleAddNewTier = (productId: string) => {
    setSelectedTierForEdit(null);
    setTierFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'usd',
      billing_cycle: 'monthly',
      feature_entitlements: [], // Initialize as array
      usage_caps: {}, // Initialize as object
      is_default: false,
      trial_period_days: 0,
      // stripe_product_id is handled by TierManagementService internally for new tiers
    });
    setTierActiveStatus(true);
    setIsTierFormDialogOpen(true);
  };

  const handleEditTier = (tier: SubscriptionTier) => {
    setSelectedTierForEdit(tier);
    setTierFormData({
      name: tier.name,
      description: tier.description || '',
      price: tier.price,
      currency: tier.currency || 'usd',
      billing_cycle: tier.billing_cycle,
      feature_entitlements: tier.feature_entitlements || [], // Ensure array
      usage_caps: tier.usage_caps || {}, // Ensure object
      is_default: tier.is_default || false,
      trial_period_days: tier.trial_period_days || 0,
      stripe_product_id: tier.stripe_product_id,
      stripe_price_id: tier.stripe_price_id,
    });
    setTierActiveStatus(tier.active ?? true);
    setIsTierFormDialogOpen(true);
  };

  const handleTierFormChange = (field: keyof Partial<CreateTierRequest>, value: any) => {
    setTierFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateTierForm = () => {
    const errors: string[] = [];
    if (!tierFormData.name?.trim()) errors.push('Tier name is required.');
    if (tierFormData.price === undefined || tierFormData.price < 0) errors.push('Price must be a non-negative number.');
    
    const usageLines = (tierFormData.usage_caps as string || '').split('\n').filter(line => line.trim());
    const usedMetrics = new Set<string>();
    for (const line of usageLines) {
      const [metric] = line.split(':');
      if (metric && usedMetrics.has(metric.trim())) {
        errors.push(`Duplicate usage metric: ${metric.trim()}.`);
        break;
      }
      if (metric) usedMetrics.add(metric.trim());
    }
    setTierValidationErrors(errors);
    return errors.length === 0;
  };

  const handleTierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateTierForm()) return;

    setIsTierSubmitting(true);
    try {
      const features = (tierFormData.feature_entitlements as string[] || [])
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const usageCaps: Record<string, number> = {};
      (tierFormData.usage_caps as string || '') // Treat as string for parsing
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
        name: tierFormData.name!,
        description: tierFormData.description || undefined,
        price: tierFormData.price!,
        currency: tierFormData.currency || 'usd',
        billing_cycle: tierFormData.billing_cycle || 'monthly',
        feature_entitlements: features,
        usage_caps: usageCaps,
        is_default: tierFormData.is_default,
        trial_period_days: tierFormData.trial_period_days,
        active: tierActiveStatus,
        // stripe_product_id is handled by TierManagementService internally for new tiers
      };

      if (selectedTierForEdit) {
        const response = await fetch(`/api/usage/tiers/${selectedTierForEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to update tier');
        toast({ description: 'Tier updated successfully.' });
      } else {
        const response = await fetch('/api/usage/tiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await response.json();
        if (!data.success) throw new Error(data.error || 'Failed to create tier');
        toast({ description: 'Tier created successfully.' });
      }
      setIsTierFormDialogOpen(false);
      await fetchTiersData();
    } catch (error) {
      console.error('Failed to save tier:', error);
      toast({ variant: 'destructive', description: 'Failed to save tier. Please try again.' });
    } finally {
      setIsTierSubmitting(false);
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm('Are you sure you want to delete this tier? This action cannot be undone.')) {
      return;
    }
    setIsTierSubmitting(true);
    try {
      const response = await fetch(`/api/usage/tiers/${tierId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to delete tier');
      toast({ description: 'Tier deleted successfully.' });
      await fetchTiersData();
    } catch (error) {
      console.error('Failed to delete tier:', error);
      toast({ variant: 'destructive', description: 'Failed to delete tier.' });
    } finally {
      setIsTierSubmitting(false);
    }
  };

  const handleCloneTier = async (tier: SubscriptionTier) => {
    setIsTierSubmitting(true);
    try {
      const response = await fetch(`/api/usage/tiers/${tier.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `${tier.name} (Copy)` })
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to clone tier');
      toast({ description: 'Tier duplicated successfully.' });
      await fetchTiersData();
    } catch (error) {
      console.error('Failed to clone tier:', error);
      toast({ variant: 'destructive', description: 'Failed to clone tier.' });
    } finally {
      setIsTierSubmitting(false);
    }
  };

  const handlePreviewTierImpact = async () => {
    if (!validateTierForm()) return;

    setIsTierSubmitting(true);
    try {
      const features = (tierFormData.feature_entitlements as string[] || [])
        .map(f => f.trim())
        .filter(f => f.length > 0);

      const usageCaps: Record<string, number> = {};
      (tierFormData.usage_caps as string || '')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .forEach(line => {
          const [key, value] = line.split(':');
          if (key && value) {
            usageCaps[key.trim()] = parseInt(value.trim(), 10);
          }
        });

      const payload: CreateTierRequest = {
        name: tierFormData.name!,
        description: tierFormData.description || undefined,
        price: tierFormData.price!,
        currency: tierFormData.currency || 'usd',
        billing_cycle: tierFormData.billing_cycle || 'monthly',
        feature_entitlements: features,
        usage_caps: usageCaps,
        is_default: tierFormData.is_default,
        trial_period_days: tierFormData.trial_period_days,
      };

      const response = await fetch('/api/usage/tiers/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setTierPreviewData(data.preview);
        setShowTierPreviewModal(true);
      } else {
        toast({ variant: 'destructive', description: data.error || 'Failed to preview tier impact.' });
      }
    } catch (error) {
      console.error('Error previewing tier impact:', error);
      toast({ variant: 'destructive', description: 'Failed to preview tier impact.' });
    } finally {
      setIsTierSubmitting(false);
    }
  };

  const fetchProducts = async () => {
    const response = await fetch('/api/creator/products'); // Assuming an API endpoint
    const data = await response.json();
    setProducts(data.products || []);
  };

  const fetchTiersData = async () => {
    const response = await fetch('/api/usage/tiers'); // Assuming an API endpoint
    const data = await response.json();
    setTiers(data.tiers || []);
  };

  // --- Embed Dialog Handlers ---
  const handleOpenEmbedDialog = (product: CreatorProduct) => {
    setSelectedProductForEmbed(product);
    setIsEmbedDialogOpen(true);
  };

  // --- Utility Functions ---
  const getTiersForProduct = (productId: string) => {
    return tiers.filter(tier => tier.stripe_product_id === products.find(p => p.id === productId)?.stripe_product_id);
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div>
      {/* Connection Status */}
      <div className="mb-6">
        {creatorProfile.stripe_account_enabled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Stripe Account Connected</h4>
              <p className="text-sm text-green-700">
                Account ID: <span className="font-mono">{creatorProfile.stripe_account_id}</span>
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <div>
              <h4 className="font-medium text-red-800">Stripe Account Not Connected</h4>
              <p className="text-sm text-red-700">
                You must connect your Stripe account to create products and accept payments.
                <Link href="/creator/onboarding" className="ml-2 font-semibold underline hover:no-underline">
                  Connect Stripe Now
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Product & Tier Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products or tiers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            Archived
          </Button>
          <Button
            variant={showDeleted ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowDeleted(!showDeleted)}
          >
            {showDeleted ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            Deleted
          </Button>
          <Button onClick={handleAddNewProduct} disabled={!creatorProfile.stripe_account_enabled}>
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Product List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {filteredProducts.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium mb-2">No products found</p>
              <p className="text-sm">Create your first product to get started.</p>
            </div>
          ) : (
            filteredProducts.map((product) => {
              const productStatus = getProductStatus(product);
              const productTiers = getTiersForProduct(product.id);
              const isOpen = openProductIds.has(product.id);

              return (
                <Collapsible 
                  key={product.id} 
                  open={isOpen} 
                  onOpenChange={() => {
                    setOpenProductIds(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(product.id)) newSet.delete(product.id);
                      else newSet.add(product.id);
                      return newSet;
                    });
                  }}
                  className="w-full"
                >
                  <div className="p-4 flex items-center gap-4">
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto">
                        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </Button>
                    </CollapsibleTrigger>
                    
                    <div className="flex items-center gap-4 flex-1">
                      {product.image_url ? (
                        <Image src={product.image_url} alt={product.name || ''} width={48} height={48} className="rounded-md object-cover" />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{product.name}</h3>
                          <Badge className={productStatus.color}>{productStatus.label}</Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                        <div className="flex gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            ${product.price} {product.product_type === 'subscription' ? '/ month' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(product.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Product Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleEditProduct(product)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Product
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleOpenEmbedDialog(product)} disabled={!product.stripe_product_id}>
                          <Code className="h-4 w-4 mr-2" />
                          Embed Code
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicateProduct(product)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate Product
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {product.active && (
                          <DropdownMenuItem onClick={() => handleArchiveProduct(product)} className="text-orange-600">
                            <Archive className="h-4 w-4 mr-2" />
                            Archive Product
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDeleteProduct(product)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Product
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <CollapsibleContent className="space-y-3 p-4 pl-16 bg-gray-50 border-t border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold text-gray-900">Tiers for {product.name} ({productTiers.length})</h4>
                      <Button size="sm" onClick={() => handleAddNewTier(product.id)} disabled={!creatorProfile.stripe_account_enabled || !product.stripe_product_id}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Tier
                      </Button>
                    </div>
                    {productTiers.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        <p className="text-sm">No tiers configured for this product.</p>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {productTiers.map(tier => (
                          <div key={tier.id} className={`bg-white rounded-lg shadow-sm border ${tier.is_default ? 'border-blue-500' : 'border-gray-200'} p-4 flex justify-between items-center`}>
                            <div>
                              <div className="flex items-center gap-2">
                                <h5 className="font-medium text-gray-900">{tier.name}</h5>
                                {tier.is_default && <Badge className="bg-blue-100 text-blue-800">Default</Badge>}
                                <Badge variant={tier.active ? 'default' : 'secondary'}>{tier.active ? 'Active' : 'Inactive'}</Badge>
                              </div>
                              <p className="text-sm text-gray-600">
                                {formatPrice(tier.price, tier.currency || 'usd')} / {formatBillingCycle(tier.billing_cycle)}
                                {tier.trial_period_days && tier.trial_period_days > 0 && ` (${tier.trial_period_days} day trial)`}
                              </p>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Tier Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => handleEditTier(tier)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Tier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleCloneTier(tier)}>
                                  <Copy className="h-4 w-4 mr-2" />
                                  Clone Tier
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePreviewTierImpact()}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview Impact
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteTier(tier.id)} className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Tier
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })
          )}
        </div>
      </div>

      {/* Product Edit/Add Dialog */}
      <Dialog open={isProductFormDialogOpen} onOpenChange={setIsProductFormDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProductForEdit ? 'Edit Product' : 'Create New Product'}</DialogTitle>
            <DialogDescription>
              {selectedProductForEdit ? 'Update the details for this product.' : 'Create a new product with advanced Stripe capabilities.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name (required)</Label>
                  <Input id="name" name="name" defaultValue={selectedProductForEdit?.name || ''} required />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" name="category" placeholder="e.g., Digital Products" />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selectedProductForEdit?.description || ''} />
              </div>
              <div>
                  <Label htmlFor="tags">Tags (comma-separated)</Label>
                  <Input id="tags" name="tags" placeholder="e.g., premium, featured, popular" defaultValue={selectedProductForEdit?.metadata?.tags || ''} />
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
                    onChange={(e) => updateProductImageField(index, e.target.value)}
                  />
                  {productImages.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeProductImageField(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addProductImageField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Image
              </Button>
            </div>

            {/* Pricing */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-lg">Pricing</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="price">Price</Label>
                  <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={selectedProductForEdit?.price || ''} required />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    name="currency"
                    defaultValue={selectedProductForEdit?.currency || 'usd'}
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                    <option value="gbp">GBP</option>
                    <option value="cad">CAD</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="product_type">Product Type</Label>
                  <select
                    id="product_type"
                    name="product_type"
                    defaultValue={selectedProductForEdit?.product_type || 'subscription'}
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
                    defaultValue="month"
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="day">Daily</option>
                    <option value="week">Weekly</option>
                    <option value="month">Monthly</option>
                    <option value="year">Yearly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="billing_interval_count">Interval Count</Label>
                  <Input id="billing_interval_count" name="billing_interval_count" type="number" min="1" defaultValue="1" />
                </div>
                <div>
                  <Label htmlFor="trial_period_days">Trial Period (days)</Label>
                  <Input id="trial_period_days" name="trial_period_days" type="number" min="0" placeholder="0" />
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-lg">Advanced Options</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="statement_descriptor">Statement Descriptor</Label>
                  <Input id="statement_descriptor" name="statement_descriptor" placeholder="Appears on card statements" />
                </div>
                <div>
                  <Label htmlFor="unit_label">Unit Label</Label>
                  <Input id="unit_label" name="unit_label" placeholder="e.g., per user, per seat" />
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
                    onChange={(e) => updateProductFeatureField(index, e.target.value)}
                  />
                  {productFeatures.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeProductFeatureField(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addProductFeatureField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Feature
              </Button>
            </div>

            {selectedProductForEdit && (
              <div className="flex items-center justify-between border-t pt-4">
                <Label htmlFor="active-status">Product Status</Label>
                <div className="flex items-center gap-2">
                  <Switch id="active-status" checked={productActiveStatus} onCheckedChange={setProductActiveStatus} />
                  <span className="text-sm">{productActiveStatus ? 'Active' : 'Archived'}</span>
                </div>
              </div>
            )}
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsProductFormDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isProductSubmitting}>
                {isProductSubmitting ? 'Saving...' : selectedProductForEdit ? 'Save Changes' : 'Add Product'}
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
                    <Input id="tier-trial-days" type="number" min="0" value={tierFormData.trial_period_days ?? 0} onChange={(e) => handleTierFormChange('trial_period_days', parseInt(e.target.value))} />
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
          creatorProfile={creatorProfile}
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