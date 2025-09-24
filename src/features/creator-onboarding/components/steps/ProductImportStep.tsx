'use client';

import { useEffect, useState } from 'react';
import { Package, Plus, RefreshCw, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox'; // Import Checkbox component
import { Label } from '@/components/ui/label'; // Import Label component
import { toast } from '@/components/ui/use-toast'; // Import toast

import { fetchStripeProductsForCreatorAction, importProductsFromStripeAction } from '../../actions/product-actions';
import type { CreatorProfile, ProductFormItem, ProductType } from '../../types';

interface ProductImportStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void; // New prop
}

export function ProductImportStep({ profile, onNext, setSubmitFunction }: ProductImportStepProps) {
  const [productsToManage, setProductsToManage] = useState<ProductFormItem[]>([]);
  const [existingStripeProducts, setExistingStripeProducts] = useState<ProductFormItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingStripeProducts, setIsLoadingStripeProducts] = useState(true);

  useEffect(() => {
    const loadStripeProducts = async () => {
      if (!profile.stripe_access_token) {
        setIsLoadingStripeProducts(false);
        return;
      }
      try {
        const fetchedProducts = await fetchStripeProductsForCreatorAction();
        setExistingStripeProducts(fetchedProducts);
        // Pre-select products already linked to our DB
        setProductsToManage(fetchedProducts.filter(p => p.isLinkedToOurDb));
      } catch (error) {
        console.error('Failed to load existing Stripe products:', error);
        toast({
          variant: 'destructive',
          description: 'Failed to load existing Stripe products. Please try again.',
        });
      } finally {
        setIsLoadingStripeProducts(false);
      }
    };

    loadStripeProducts();
  }, [profile.stripe_access_token]);

  const addEmptyProduct = () => {
    setProductsToManage(prev => [
      ...prev,
      {
        name: '',
        description: '',
        price: 0,
        currency: 'usd',
        type: 'one_time',
        active: true,
        isExistingStripeProduct: false,
        isLinkedToOurDb: false,
      },
    ]);
  };

  const removeProduct = (index: number) => {
    setProductsToManage(prev => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof ProductFormItem, value: string | number | boolean) => {
    setProductsToManage(prev =>
      prev.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      )
    );
  };

  const handleToggleExistingStripeProduct = (product: ProductFormItem, isChecked: boolean) => {
    setProductsToManage(prev => {
      if (isChecked) {
        // Add to productsToManage if not already there
        if (!prev.some(p => p.stripeProductId === product.stripeProductId)) {
          return [...prev, { ...product, active: true }];
        }
      } else {
        // Remove from productsToManage
        return prev.filter(p => p.stripeProductId !== product.stripeProductId);
      }
      return prev;
    });
  };

  const handleSubmit = async () => {
    const validProducts = productsToManage.filter(p => p.name.trim() && p.price > 0);
    
    if (validProducts.length === 0) {
      // If no products are managed, inform the user and proceed
      toast({
        description: 'No products were added. You can add them later from your dashboard.',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await importProductsFromStripeAction(validProducts);
      toast({
        description: 'Products updated successfully!',
      });
    } catch (error) {
      console.error('Failed to import products:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to update products. Please try again.',
      });
      throw error; // Re-throw to propagate error to parent flow
    } finally {
      setIsSubmitting(false);
    }
  };

  // Expose handleSubmit to the parent component
  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null); // Clean up on unmount
  }, [setSubmitFunction, productsToManage]); // eslint-disable-line react-hooks/exhaustive-deps

  const isFormValid = productsToManage.some(p => p.name.trim() && p.price > 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Add Your Products</h2>
        <p className="text-gray-600">
          Manage products you want to sell through your SaaS platform.
        </p>
      </div>

      {profile.stripe_access_token && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Existing Stripe Products</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsLoadingStripeProducts(true);
                // Re-fetch products
                fetchStripeProductsForCreatorAction().then(fetchedProducts => {
                  setExistingStripeProducts(fetchedProducts);
                  setProductsToManage(prev => {
                    // Keep existing selections, but update details from re-fetch
                    const updatedManaged = prev.map(managedP => {
                      const matchingFetched = fetchedProducts.find(fp => fp.stripeProductId === managedP.stripeProductId);
                      return matchingFetched ? { ...matchingFetched, active: managedP.active } : managedP;
                    });
                    // Add any newly linked products from the re-fetch that weren't previously managed
                    const newLinked = fetchedProducts.filter(fp => fp.isLinkedToOurDb && !prev.some(p => p.stripeProductId === fp.stripeProductId));
                    return [...updatedManaged, ...newLinked];
                  });
                }).catch(error => {
                  console.error('Failed to refresh Stripe products:', error);
                  toast({
                    variant: 'destructive',
                    description: 'Failed to refresh Stripe products. Please try again.',
                  });
                }).finally(() => setIsLoadingStripeProducts(false));
              }}
              disabled={isLoadingStripeProducts || isSubmitting}
              className="flex items-center gap-1 text-xs text-gray-600 hover:bg-gray-100"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh
            </Button>
          </div>

          {isLoadingStripeProducts ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : existingStripeProducts.length > 0 ? (
            <div className="space-y-3">
              {existingStripeProducts.map((product, index) => {
                const isManaged = productsToManage.some(p => p.stripeProductId === product.stripeProductId);
                const isLinked = product.isLinkedToOurDb;

                return (
                  <div key={product.stripeProductId || index} className="border border-gray-200 rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id={`stripe-product-${product.stripeProductId}`}
                          checked={isManaged}
                          onCheckedChange={(checked: boolean) => handleToggleExistingStripeProduct(product, checked)}
                          disabled={isSubmitting}
                        />
                        <Label htmlFor={`stripe-product-${product.stripeProductId}`} className="font-medium text-gray-900">
                          {product.name}
                          {isLinked && <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">Linked</span>}
                        </Label>
                      </div>
                      <span className="text-sm text-gray-600">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: product.currency.toUpperCase() }).format(product.price)}
                        {product.type === 'subscription' ? '/month' : ''}
                      </span>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-600 mt-2 ml-8">{product.description}</p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <p>No active products found in your Stripe account.</p>
              <p className="text-sm mt-2">You can add new products below.</p>
            </div>
          )}
        </div>
      )}

      <h3 className="font-medium text-gray-900 mt-8">Add New Products</h3>
      <p className="text-gray-600 text-sm mb-4">
        Create new products that will be added to your Stripe account and PayLift store.
      </p>

      <div className="space-y-4">
        {productsToManage.filter(p => !p.isExistingStripeProduct).map((product, index) => (
          <div key={`new-product-${index}`} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-900">New Product {index + 1}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeProduct(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Product Name *</label>
                <Input
                  placeholder="e.g., Pro Plan, Premium Course"
                  value={product.name}
                  onChange={(e) => updateProduct(index, 'name', e.target.value)}
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Price *</label>
                <div className="flex">
                  <select
                    value={product.currency}
                    onChange={(e) => updateProduct(index, 'currency', e.target.value as string)}
                    className="flex h-9 w-16 rounded-l-md border border-gray-300 bg-white px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-gray-900"
                  >
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                    <option value="gbp">GBP</option>
                  </select>
                  <Input
                    type="number"
                    placeholder="29.99"
                    min="0"
                    step="0.01"
                    value={product.price || ''}
                    onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                    className="rounded-l-none border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="Describe your product..."
                  value={product.description}
                  onChange={(e) => updateProduct(index, 'description', e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Product Type</label>
                <select
                  value={product.type}
                  onChange={(e) => updateProduct(index, 'type', e.target.value as ProductType)}
                  className="flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-gray-900"
                >
                  <option value="one_time">One-time Payment</option>
                  <option value="subscription">Subscription</option>
                  <option value="usage_based">Usage-based</option>
                </select>
              </div>
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={addEmptyProduct}
          className="w-full flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
          Add New Product
        </Button>
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
        <div className="text-center">
          <Upload className="h-8 w-8 mx-auto mb-4 text-gray-500" />
          <h3 className="font-medium mb-2 text-gray-900">Import from Existing Store</h3>
          <p className="text-sm text-gray-600 mb-4">
            Already have products in Shopify, WooCommerce, or another platform? Import them automatically.
          </p>
          <Button variant="outline" disabled className="border-gray-300 text-gray-700 hover:bg-gray-100">
            Import Products (Coming Soon)
          </Button>
        </div>
      </div>
    </div>
  );
}