'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AlertTriangle, CheckCircle, Edit, Package, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { PlatformSettings } from '@/features/platform-owner-onboarding/types';
import { ProductWithPrices } from '@/features/pricing/types';

import { createPlatformProductAction, updatePlatformProductAction } from '../actions/product-actions';

export function PlatformProductManager({
  initialProducts,
  settings,
}: {
  initialProducts: ProductWithPrices[];
  settings: PlatformSettings;
}) {
  const [products, setProducts] = useState<ProductWithPrices[]>(initialProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWithPrices | null>(null);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: ProductWithPrices) => {
    setEditingProduct(product);
    setIsActive(product.active ?? true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const productData = {
      id: editingProduct?.id,
      name: formData.get('name') as string,
      description: formData.get('description') as string,
      image: formData.get('image') as string,
      monthlyPrice: parseFloat(formData.get('monthlyPrice') as string),
      yearlyPrice: parseFloat(formData.get('yearlyPrice') as string),
      active: isActive,
    };

    try {
      let updatedProducts;
      if (editingProduct) {
        updatedProducts = await updatePlatformProductAction(productData);
        toast({ description: 'Product updated successfully.' });
      } else {
        updatedProducts = await createPlatformProductAction(productData);
        toast({ description: 'Product created successfully.' });
      }
      setProducts(updatedProducts);
      setIsDialogOpen(false);
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
        monthlyPrice: (product.prices.find(p => p.interval === 'month')?.unit_amount ?? 0) / 100,
        yearlyPrice: (product.prices.find(p => p.interval === 'year')?.unit_amount ?? 0) / 100,
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

  const getPriceDefaultValue = (product: ProductWithPrices | null, interval: 'month' | 'year') => {
    const amount = product?.prices.find(p => p.interval === interval)?.unit_amount;
    return amount ? amount / 100 : '';
  };

  return (
    <div>
      <div className="mb-6">
        {settings.stripe_account_enabled ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="font-medium text-green-800">Stripe Account Connected</h4>
              <p className="text-sm text-green-700">
                Account ID: <span className="font-mono">{settings.stripe_account_id}</span>
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
                <Link href="/platform-owner-onboarding" className="ml-2 font-semibold underline hover:no-underline">
                  Connect Stripe Now
                </Link>
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Platform Products</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} disabled={!settings.stripe_account_enabled}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add a new product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update the details for this subscription plan.' : 'Create a new subscription plan to offer your creators.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name (required)</Label>
                  <Input id="name" name="name" defaultValue={editingProduct?.name || ''} required />
                  <p className="text-xs text-gray-500 mt-1">Name of the product or service, visible to customers.</p>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingProduct?.description || ''} />
                  <p className="text-xs text-gray-500 mt-1">Appears at checkout, on the customer portal, and in quotes.</p>
                </div>
                <div>
                  <Label htmlFor="image">Image URL</Label>
                  <Input id="image" name="image" placeholder="https://..." defaultValue={editingProduct?.image || ''} />
                  <p className="text-xs text-gray-500 mt-1">Appears at checkout. Must be a public URL.</p>
                </div>
              </div>
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyPrice">Monthly Price (USD)</Label>
                    <Input id="monthlyPrice" name="monthlyPrice" type="number" step="0.01" min="0" defaultValue={getPriceDefaultValue(editingProduct, 'month')} required />
                  </div>
                  <div>
                    <Label htmlFor="yearlyPrice">Yearly Price (USD)</Label>
                    <Input id="yearlyPrice" name="yearlyPrice" type="number" step="0.01" min="0" defaultValue={getPriceDefaultValue(editingProduct, 'year')} required />
                  </div>
                </div>
              </div>
              {editingProduct && (
                <div className="flex items-center justify-between border-t pt-4">
                  <Label htmlFor="active-status">Product Status</Label>
                  <div className="flex items-center gap-2">
                    <Switch id="active-status" checked={isActive} onCheckedChange={setIsActive} />
                    <span className="text-sm">{isActive ? 'Active' : 'Archived'}</span>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Add Product'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="divide-y divide-gray-200">
          {products.map((product) => (
            <div key={product.id} className="p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                {product.image ? (
                  <Image src={product.image} alt={product.name || ''} width={40} height={40} className="rounded-md object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span>Monthly: ${(product.prices.find(p => p.interval === 'month')?.unit_amount ?? 0) / 100}</span>
                    <span>Yearly: ${(product.prices.find(p => p.interval === 'year')?.unit_amount ?? 0) / 100}</span>
                    <span className={`font-medium ${product.active ? 'text-green-600' : 'text-red-600'}`}>
                      {product.active ? 'Active' : 'Archived'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
                {product.active && (
                  <Button variant="ghost" size="sm" onClick={() => handleArchive(product)} className="text-red-600 hover:text-red-700"><Trash2 className="h-4 w-4" /></Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}