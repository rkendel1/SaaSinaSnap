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
        {/* Adjusted text color */}
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Add Your Products</h2>
        {/* Adjusted text color */}
        <p className="text-gray-600">
          Add products you want to sell through your SaaS platform.
        </p>
      </div>

      <div className="space-y-4">
        {products.map((product, index) => (
          /* Adjusted for light theme */
          <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
            <div className="flex justify-between items-center">
              {/* Adjusted text color */}
              <h3 className="font-medium text-gray-900">Product {index + 1}</h3>
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
                {/* Adjusted text color */}
                <label className="text-sm font-medium text-gray-700">Product Name *</label>
                {/* Adjusted for light theme */}
                <Input
                  placeholder="e.g., Pro Plan, Premium Course"
                  value={product.name}
                  onChange={(e) => updateProduct(index, 'name', e.target.value)}
                  className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <div className="space-y-2">
                {/* Adjusted text color */}
                <label className="text-sm font-medium text-gray-700">Price *</label>
                <div className="flex">
                  {/* Adjusted for light theme */}
                  <select
                    value={product.currency}
                    onChange={(e) => updateProduct(index, 'currency', e.target.value)}
                    className="flex h-9 w-16 rounded-l-md border border-gray-300 bg-white px-2 py-1 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-gray-900"
                  >
                    <option value="usd">USD</option>
                    <option value="eur">EUR</option>
                    <option value="gbp">GBP</option>
                  </select>
                  {/* Adjusted for light theme */}
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
                {/* Adjusted text color */}
                <label className="text-sm font-medium text-gray-700">Description</label>
                {/* Adjusted for light theme */}
                <textarea
                  placeholder="Describe your product..."
                  value={product.description}
                  onChange={(e) => updateProduct(index, 'description', e.target.value)}
                  className="flex min-h-[80px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                {/* Adjusted text color */}
                <label className="text-sm font-medium text-gray-700">Product Type</label>
                {/* Adjusted for light theme */}
                <select
                  value={product.type}
                  onChange={(e) => updateProduct(index, 'type', e.target.value)}
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

        /* Adjusted for light theme */
        <Button
          variant="outline"
          onClick={addProduct}
          className="w-full flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          <Plus className="h-4 w-4" />
          Add Another Product
        </Button>
      </div>

      /* Adjusted for light theme */
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 bg-gray-50">
        <div className="text-center">
          {/* Adjusted text color */}
          <Upload className="h-8 w-8 mx-auto mb-4 text-gray-500" />
          {/* Adjusted text color */}
          <h3 className="font-medium mb-2 text-gray-900">Import from Existing Store</h3>
          {/* Adjusted text color */}
          <p className="text-sm text-gray-600 mb-4">
            Already have products in Shopify, WooCommerce, or another platform? Import them automatically.
          </p>
          {/* Adjusted for light theme */}
          <Button variant="outline" disabled className="border-gray-300 text-gray-700 hover:bg-gray-100">
            Import Products (Coming Soon)
          </Button>
        </div>
      </div>

      <div className="flex justify-between">
        /* Adjusted for light theme */
        <Button variant="outline" onClick={onNext} className="border-gray-300 text-gray-700 hover:bg-gray-100">
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