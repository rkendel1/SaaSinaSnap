import { Button } from '@/components/ui/button';
import { CreatorProfile, CreatorProduct } from '../types';

interface CreatorProductCardProps {
  product: CreatorProduct;
  creator: CreatorProfile;
  createCheckoutAction: (params: {
    creatorId: string;
    productId: string;
    stripePriceId: string;
  }) => void;
  trialConfig?: {
    enabled: boolean;
    duration_days: number;
  };
}

export function CreatorProductCard({ product, creator, createCheckoutAction, trialConfig }: CreatorProductCardProps) {
  const brandColor = creator.brand_color || '#3b82f6';
  
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  const getPriceLabel = (productType: string) => {
    switch (productType) {
      case 'subscription':
        return '/month';
      case 'usage_based':
        return '/usage';
      default:
        return '';
    }
  };

  const handleCheckout = () => {
    if (!product.stripe_price_id) {
      console.error('No Stripe price ID available for this product');
      return;
    }

    createCheckoutAction({
      creatorId: creator.id,
      productId: product.id,
      stripePriceId: product.stripe_price_id,
    });
  };

  const showTrialOption = trialConfig?.enabled && product.product_type === 'subscription';

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-gray-600 text-sm mb-4">
            {product.description}
          </p>
        )}
        <div className="flex items-baseline justify-center">
          <span className="text-3xl font-bold text-gray-900">
            {formatPrice(product.price, product.currency)}
          </span>
          <span className="text-gray-600 ml-1">
            {getPriceLabel(product.product_type)}
          </span>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Full access to all features
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          24/7 customer support
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Cancel anytime
        </div>
        {showTrialOption && (
          <div className="flex items-center text-sm text-blue-600 font-medium">
            <svg className="w-4 h-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {trialConfig?.duration_days} day free trial
          </div>
        )}
      </div>

      <Button
        className="w-full"
        style={{ backgroundColor: brandColor }}
        onClick={handleCheckout}
        disabled={!product.stripe_price_id}
      >
        {showTrialOption 
          ? `Start ${trialConfig?.duration_days} Day Trial`
          : product.product_type === 'subscription' 
            ? 'Start Subscription' 
            : 'Purchase Now'
        }
      </Button>
    </div>
  );
}