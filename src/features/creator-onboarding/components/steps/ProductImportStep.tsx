'use client';

import { useState } from 'react';
import { Package, Plus, Trash2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { importProductsFromStripeAction } from '../../actions/product-actions';
import type { CreatorProfile, ProductImportItem } from '../../types';

interface ProductImportStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function ProductImportStep({ profile, onNext }: ProductImportStepProps) {
  const [products, setProducts] = useState<ProductImportItem[]>([
    {
      name: '',
      description: '',
      price: 0,
      currency: 'usd',
      type: 'one_time',
    },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addProduct = () => {
    setProducts(prev => [
      ...prev,
      {
        name: '',
        description: '',
        price: 0,
        currency: 'usd',
        type: 'one_time',
      },
    ]);
  };

  const removeProduct = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof ProductImportItem, value: string | number) => {
    setProducts(prev =>
      prev.map((product, i) =>
        i === index ? { ...product, [field]: value } : product
      )
    );
  };

  const handleSubmit = async () => {
    const validProducts = products.filter(p => p.name.trim() && p.price > 0);
    
    if (validProducts.length === 0) {
      onNext(); // Skip if no products
      return;
    }

    setIsSubmitting(true);
    try {
      await importProductsFromStripeAction(validProducts);
      onNext();
    } catch (error) {
      console.error('Failed to import products:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = products.some(p => p.name.trim() && p.price > 0);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-50">Add Your Products</h2>
        <p className="text-gray-300">
          Add products you want to sell through your SaaS platform.
        </p>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          <div key={index} className="border border-gray-700 rounded-lg p-4 space-y-4 bg-gray-900">
            <div className="flex justify-between items-center">
              <h3 className="font-medium text-gray-100">Product {index + 1}</h3>
              {products.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeProduct(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Product Name *</label>
                <Input
                  placeholder="e.g., Pro Plan, Premium Course"
                  value={product.name}
                  onChange={(e) => updateProduct(index, 'name', e.target.value)}
                  className="border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-400"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Price *</label>
                <div className="flex">
                  <select
                    value={product.currency}
                    onChange={(e) => updateProduct(index, 'currency', e.target.value)}
                    className="flex h-9 w-16 rounded-l-md border border-gray-700 bg-gray-800 px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-gray-100"
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
                    className="rounded-l-none border-gray-700 bg-gray-800 text-gray-100 placeholder:text-gray-400"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-gray-300">Description</label>
                <textarea
                  placeholder="Describe your product..."
                  value={product.description}
                  onChange={(e) => updateProduct(index, 'description', e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm ring-offset-background placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-gray-100"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Product Type</label>
                <select
                  value={product.type}
                  onChange={(e) => updateProduct(index, 'type', e.target.value)}
                  className="flex h-9 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-gray-100"
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
          onClick={addProduct}
          className="w-full flex items-center gap-2 border-gray-700 text-gray-100 hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Another Product
        </Button>
      </div>

      <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 bg-gray-900">
        <div className="text-center">
          <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
          <h3 className="font-medium mb-2 text-gray-100">Import from Existing Store</h3>
          <p className="text-sm text-gray-300 mb-4">
            Already have products in Shopify, WooCommerce, or another platform? Import them automatically.
          </p>
          <Button variant="outline" disabled className="border-gray-700 text-gray-100 hover:bg-gray-800">
            Import Products (Coming Soon)
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onNext} className="border-gray-700 text-gray-100 hover:bg-gray-800">
          Skip for Now
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Importing...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}