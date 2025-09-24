import { NextRequest, NextResponse } from 'next/server';

import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
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
  const { searchParams } = new URL(request.url);
  const creatorId = searchParams.get('creatorId');
  const supabase = await createSupabaseServerClient();

  if (!creatorId) {
    return NextResponse.json(
      { error: 'Missing creatorId parameter. Please use the latest embed script.' },
      { status: 400, headers: corsHeaders }
    );
  }

  try {
    // Fetch the creator profile first, as we always need it for branding
    const creator = await getCreatorBySlug(creatorId);
    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404, headers: corsHeaders });
    }

    // Check if the creator is the platform owner
    const { data: platformSettings } = await supabase
      .from('platform_settings')
      .select('owner_id')
      .eq('owner_id', creatorId)
      .maybeSingle();
    
    const isPlatformOwner = !!platformSettings;

    // If the requester is the platform owner, check the main products table first
    if (isPlatformOwner) {
      const { data: platformProduct } = await supabase
        .from('products')
        .select('*, prices(*)')
        .eq('id', productId)
        .eq('active', true)
        .maybeSingle();

      if (platformProduct) {
        const monthlyPrice = (platformProduct as ProductWithPrices).prices.find(p => p.interval === 'month');
        const normalizedProduct = {
          ...platformProduct,
          creator_id: creator.id,
          price: monthlyPrice ? (monthlyPrice.unit_amount ?? 0) / 100 : 0,
          currency: monthlyPrice?.currency ?? 'usd',
          product_type: monthlyPrice ? 'subscription' : 'one_time',
          stripe_product_id: platformProduct.id,
          stripe_price_id: monthlyPrice?.id ?? null,
          image_url: platformProduct.image,
        };
        return NextResponse.json({ product: normalizedProduct, creator }, { status: 200, headers: corsHeaders });
      }
    }

    // If not a platform product, or if the requester is not the owner, check creator_products
    const { data: creatorProduct } = await supabase
      .from('creator_products')
      .select('*')
      .eq('stripe_product_id', productId)
      .eq('creator_id', creatorId)
      .eq('active', true)
      .maybeSingle();

    if (creatorProduct) {
      return NextResponse.json({ product: creatorProduct, creator }, { status: 200, headers: corsHeaders });
    }

    // If nothing is found
    return NextResponse.json(
      { error: 'Product not found or not active for this creator' },
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