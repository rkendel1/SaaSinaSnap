'use client';

import { useEffect,useState } from 'react';
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
  X} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { CreatorProduct, CreatorProfile, EnhancedProductData, ProductStatus } from '@/features/creator/types';

import { 
  archiveCreatorProductAction, 
  bulkArchiveProductsAction,
  bulkDeleteProductsAction,
  createOrUpdateEnhancedProductAction, 
  deleteCreatorProductAction,
  duplicateCreatorProductAction} from '../actions/product-actions';

import { EmbedCodeDialog } from './EmbedCodeDialog';

interface ProductStats {
  total: number;
  active: number;
  archived: number;
  deleted: number;
}

export function EnhancedProductManager({
  initialProducts,
  profile,
  stats,
}: {
  initialProducts: CreatorProduct[];
  profile: CreatorProfile;
  stats: ProductStats;
}) {
  const [products, setProducts] = useState<CreatorProduct[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<CreatorProduct[]>(initialProducts);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [isEmbedDialogOpen, setIsEmbedDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<CreatorProduct | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [selectedProducts, setSelectedProducts] = new useState<Set<string>>(new Set());
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProductStatus[]>(['active']);
  const [showArchived, setShowArchived] = useState(false);
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Form states for enhanced product creation
  const [productImages, setProductImages] = useState<string[]>(['']);
  const [productMetadata, setProductMetadata] = useState<Record<string, string>>({});
  const [productFeatures, setProductFeatures] = useState<string[]>(['']);

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
  }, [products, searchQuery, statusFilter, showArchived, showDeleted]);

  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsActive(true);
    setProductImages(['']);
    setProductMetadata({});
    setProductFeatures(['']);
    setIsFormDialogOpen(true);
  };

  const handleEdit = (product: CreatorProduct) => {
    setSelectedProduct(product);
    setIsActive(product.active ?? true);
    setProductImages(product.image_url ? [product.image_url] : ['']);
    setProductMetadata(typeof product.metadata === 'object' && product.metadata ? 
      product.metadata as Record<string, string> : {});
    setProductFeatures(
      product.metadata && 
      typeof product.metadata === 'object' && 
      (product.metadata as any).features ? 
      (product.metadata as any).features.split(',').filter(Boolean) : ['']
    );
    setIsFormDialogOpen(true);
  };

  const handleEmbed = (product: CreatorProduct) => {
    setSelectedProduct(product);
    setIsEmbedDialogOpen(true);
  };

  const handleDuplicate = async (product: CreatorProduct) => {
    setIsSubmitting(true);
    try {
      await duplicateCreatorProductAction(product.id, `${product.name} (Copy)`);
      toast({ description: 'Product duplicated successfully.' });
      window.location.reload();
    } catch (error) {
      console.error('Failed to duplicate product:', error);
      toast({ variant: 'destructive', description: 'Failed to duplicate product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    
    const enhancedProductData: EnhancedProductData = {
      id: selectedProduct?.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      images: productImages.filter(img => img.trim() !== ''),
      price: parseFloat(formData.get('price') as string),
      currency: formData.get('currency') as string || 'usd',
      product_type: formData.get('product_type') as 'one_time' | 'subscription',
      active: isActive,
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
      toast({ description: selectedProduct ? 'Product updated successfully.' : 'Product created successfully.' });
      setIsFormDialogOpen(false);
      window.location.reload();
    } catch (error) {
      console.error('Failed to save product:', error);
      toast({ variant: 'destructive', description: 'Failed to save product. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArchive = async (product: CreatorProduct) => {
    if (!confirm(`Are you sure you want to archive "${product.name}"? This will make it unavailable for new subscriptions.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await archiveCreatorProductAction(product.id, 'Manually archived from dashboard');
      toast({ description: 'Product archived successfully.' });
      window.location.reload();
    } catch (error) {
      console.error('Failed to archive product:', error);
      toast({ variant: 'destructive', description: 'Failed to archive product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (product: CreatorProduct) => {
    if (!confirm(`Are you sure you want to permanently delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteCreatorProductAction(product.id, 'Manually deleted from dashboard');
      toast({ description: 'Product deleted successfully.' });
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast({ variant: 'destructive', description: 'Failed to delete product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkArchive = async () => {
    if (selectedProducts.size === 0) return;
    
    if (!confirm(`Archive ${selectedProducts.size} selected products?`)) return;
    
    setIsSubmitting(true);
    try {
      const result = await bulkArchiveProductsAction(Array.from(selectedProducts));
      toast({ description: `${result.succeeded} products archived, ${result.failed} failed.` });
      setSelectedProducts(new Set());
      window.location.reload();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to archive products.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.size === 0) return;
    
    if (!confirm(`Permanently delete ${selectedProducts.size} selected products? This cannot be undone.`)) return;
    
    setIsSubmitting(true);
    try {
      const result = await bulkDeleteProductsAction(Array.from(selectedProducts));
      toast({ description: `${result.succeeded} products deleted, ${result.failed} failed.` });
      setSelectedProducts(new Set());
      window.location.reload();
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to delete products.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addImageField = () => {
    setProductImages([...productImages, '']);
  };

  const removeImageField = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  const updateImageField = (index: number, value: string) => {
    const updated = [...productImages];
    updated[index] = value;
    setProductImages(updated);
  };

  const addFeatureField = () => {
    setProductFeatures([...productFeatures, '']);
  };

  const removeFeatureField = (index: number) => {
    setProductFeatures(productFeatures.filter((_, i) => i !== index));
  };

  const updateFeatureField = (index: number, value: string) => {
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

  return (
    <div>
      {/* Connection Status & Header */}
      <div className="mb-6">
        {profile.stripe_account_enabled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Stripe Account Connected</h4>
              <p className="text-sm text-green-700">
                Account ID: <span className="font-mono">{profile.stripe_account_id}</span>
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

      {/* Statistics Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Total</h3>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <h3 className="font-semibold text-gray-900">Active</h3>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Archive className="h-5 w-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Archived</h3>
          </div>
          <p className="text-2xl font-bold text-orange-600">{stats.archived}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            <h3 className="font-semibold text-gray-900">Deleted</h3>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.deleted}</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Manage Your Products</h1>
        <div className="flex gap-2">
          <Button onClick={handleAddNew} disabled={!profile.stripe_account_enabled}>
            <Plus className="h-4 w-4 mr-2" />
            Add New Product
          </Button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search products..."
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
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedProducts.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-blue-800">
              {selectedProducts.size} product{selectedProducts.size > 1 ? 's' : ''} selected
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleBulkArchive} disabled={isSubmitting}>
                <Archive className="h-4 w-4 mr-1" />
                Archive Selected
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={isSubmitting}>
                <Trash2 className="h-4 w-4 mr-1" />
                Delete Selected
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelectedProducts(new Set())}>
                <X className="h-4 w-4 mr-1" />
                Clear Selection
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Product List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {filteredProducts.map((product) => {
            const productStatus = getProductStatus(product);
            return (
              <div key={product.id} className="p-4 flex items-center gap-4">
                <Checkbox
                  checked={selectedProducts.has(product.id)}
                  onCheckedChange={(checked) => {
                    const newSelected = new Set(selectedProducts);
                    if (checked) {
                      newSelected.add(product.id);
                    } else {
                      newSelected.delete(product.id);
                    }
                    setSelectedProducts(newSelected);
                  }}
                />
                
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
                        {new Date(product.created_at).toLocaleDateString()}
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
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEdit(product)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleEmbed(product)} disabled={!product.stripe_product_id}>
                      <Code className="h-4 w-4 mr-2" />
                      Embed Code
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicate(product)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {product.active && (
                      <DropdownMenuItem onClick={() => handleArchive(product)} className="text-orange-600">
                        <Archive className="h-4 w-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => handleDelete(product)} className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Permanently
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      </div>

      {/* Enhanced Edit/Add Product Dialog */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProduct ? 'Edit Product' : 'Create New Product'}</DialogTitle>
            <DialogDescription>
              {selectedProduct ? 'Update the details for this product.' : 'Create a new product with advanced Stripe capabilities.'}
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
                  <Input id="category" name="category" placeholder="e.g., Digital Products" />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={selectedProduct?.description || ''} />
              </div>
              <div>
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" name="tags" placeholder="e.g., premium, featured, popular" />
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
                    onChange={(e) => updateImageField(index, e.target.value)}
                  />
                  {productImages.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeImageField(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addImageField}>
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
                  <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={selectedProduct?.price || ''} required />
                </div>
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    name="currency"
                    defaultValue={selectedProduct?.currency || 'usd'}
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
                    onChange={(e) => updateFeatureField(index, e.target.value)}
                  />
                  {productFeatures.length > 1 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => removeFeatureField(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addFeatureField}>
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
                {isSubmitting ? 'Saving...' : selectedProduct ? 'Save Changes' : 'Create Product'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Embed Code Dialog */}
      {selectedProduct && (
        <EmbedCodeDialog
          isOpen={isEmbedDialogOpen}
          onOpenChange={setIsEmbedDialogOpen}
          product={selectedProduct} // Pass the full product object
          creatorProfile={profile} // Pass the full creator profile
        />
      )}
    </div>
  );
}