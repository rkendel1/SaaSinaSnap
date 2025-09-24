import { NextRequest, NextResponse } from 'next/server';

import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { CreatorProduct } from '@/features/creator/types';
import { ProductWithPrices } from '@/features/pricing/types';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ productId: string }> }
) {
  const resolvedParams = await context.params;
  const { productId } = resolvedParams;
  const supabase = await createSupabaseServerClient();

  try {
    // First, try to find the product in the creator_products table by Stripe Product ID
    const { data: creatorProduct } = await supabase
      .from('creator_products')
      .select('*')
      .eq('stripe_product_id', productId)
      .eq('active', true)
      .maybeSingle();

    if (creatorProduct) {
      const creator = await getCreatorBySlug(creatorProduct.creator_id);
      if (creator) {
        return NextResponse.json({ product: creatorProduct, creator }, { status: 200, headers: corsHeaders });
      }
    }

    // If not found, check if it's a platform product from the main products table
    const { data: platformProduct } = await supabase
      .from('products')
      .select('*, prices(*)')
      .eq('id', productId)
      .eq('active', true)
      .maybeSingle();

    if (platformProduct) {
      // Find the platform owner to use for branding
      const { data: platformSettings } = await supabase
        .from('platform_settings')
        .select('owner_id')
        .limit(1)
        .single();
      
      if (platformSettings?.owner_id) {
        const platformOwnerProfile = await getCreatorBySlug(platformSettings.owner_id);
        if (platformOwnerProfile) {
          // Normalize the platform product to match the CreatorProduct shape expected by the embed
          const monthlyPrice = (platformProduct as ProductWithPrices).prices.find(p => p.interval === 'month');
          const normalizedProduct = {
            ...platformProduct,
            creator_id: platformOwnerProfile.id,
            price: monthlyPrice ? (monthlyPrice.unit_amount ?? 0) / 100 : 0,
            currency: monthlyPrice?.currency ?? 'usd',
            product_type: monthlyPrice ? 'subscription' : 'one_time',
            stripe_product_id: platformProduct.id,
            stripe_price_id: monthlyPrice?.id ?? null,
            image_url: platformProduct.image,
          };
          return NextResponse.json({ product: normalizedProduct, creator: platformOwnerProfile }, { status: 200, headers: corsHeaders });
        }
      }
    }

    // If neither is found, return 404
    return NextResponse.json(
      { error: 'Product not found or not active' },
      { status: 404, headers: corsHeaders }
    );

  } catch (error) {
    console.error('Error in embed product API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}