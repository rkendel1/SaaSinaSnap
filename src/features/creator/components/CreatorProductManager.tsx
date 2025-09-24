'use client';

import { useState } from 'react';
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
import { CreatorProfile, CreatorProduct } from '@/features/creator/types';

import { archiveCreatorProductAction, createOrUpdateCreatorProductAction } from '../actions/product-actions';

export function CreatorProductManager({
  initialProducts,
  profile,
}: {
  initialProducts: CreatorProduct[];
  profile: CreatorProfile;
}) {
  const [products, setProducts] = useState<CreatorProduct[]>(initialProducts);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CreatorProduct | null>(null);
  const [isActive, setIsActive] = useState(true);

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsActive(true);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: CreatorProduct) => {
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
      image_url: formData.get('image_url') as string,
      price: parseFloat(formData.get('price') as string),
      product_type: formData.get('product_type') as 'one_time' | 'subscription',
      active: isActive,
    };

    try {
      await createOrUpdateCreatorProductAction(productData);
      // Refetch products after save
      // const updatedProducts = await getCreatorProducts(profile.id); // This is a server function
      // setProducts(updatedProducts);
      toast({ description: editingProduct ? 'Product updated successfully.' : 'Product created successfully.' });
      setIsDialogOpen(false);
      // For now, we rely on revalidation. A more advanced implementation might refetch.
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
      await archiveCreatorProductAction(product.id);
      toast({ description: 'Product archived successfully.' });
      window.location.reload();
    } catch (error) {
      console.error('Failed to archive product:', error);
      toast({ variant: 'destructive', description: 'Failed to archive product.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
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

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manage Your Products</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} disabled={!profile.stripe_account_enabled}>
              <Plus className="h-4 w-4 mr-2" />
              Add New Product
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingProduct ? 'Edit Product' : 'Add a new product'}</DialogTitle>
              <DialogDescription>
                {editingProduct ? 'Update the details for this product.' : 'Create a new product to sell on your storefront.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Name (required)</Label>
                  <Input id="name" name="name" defaultValue={editingProduct?.name || ''} required />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" name="description" defaultValue={editingProduct?.description || ''} />
                </div>
                <div>
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input id="image_url" name="image_url" placeholder="https://..." defaultValue={editingProduct?.metadata?.image_url || ''} />
                </div>
              </div>
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-medium">Pricing</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">Price (USD)</Label>
                    <Input id="price" name="price" type="number" step="0.01" min="0" defaultValue={editingProduct?.price || ''} required />
                  </div>
                  <div>
                    <Label htmlFor="product_type">Product Type</Label>
                    <select
                      id="product_type"
                      name="product_type"
                      defaultValue={editingProduct?.product_type || 'subscription'}
                      className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <option value="subscription">Subscription (Monthly)</option>
                      <option value="one_time">One-time</option>
                    </select>
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
                {product.metadata?.image_url ? (
                  <Image src={product.metadata.image_url} alt={product.name || ''} width={40} height={40} className="rounded-md object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center">
                    <Package className="h-5 w-5 text-gray-400" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.description}</p>
                  <div className="flex gap-4 mt-2 text-sm">
                    <span className="font-semibold">${product.price} {product.product_type === 'subscription' ? '/ month' : ''}</span>
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