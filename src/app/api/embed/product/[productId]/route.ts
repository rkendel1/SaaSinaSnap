import { NextRequest, NextResponse } from 'next/server';

import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { CreatorProduct } from '@/features/creator/types';
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
  context: { params: Promise<{ productId: string; }> } // Adjusted params type to match validator's expectation
) {
  const resolvedParams = await context.params; // Await the promise
  const { productId } = resolvedParams;
  const supabase = await createSupabaseServerClient();

  try {
    // 1. Fetch the specific CreatorProduct
    const { data: product, error: productError } = await supabase
      .from('creator_products')
      .select('*')
      .eq('id', productId)
      .eq('active', true)
      .single();

    if (productError || !product) {
      console.error('Error fetching product for embed:', productError);
      return NextResponse.json(
        { error: 'Product not found or not active' },
        { status: 404, headers: corsHeaders }
      );
    }

    // 2. Fetch the CreatorProfile using the product's creator_id
    const creator = await getCreatorBySlug((product as CreatorProduct).creator_id);

    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found for this product' },
        { status: 404, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { product, creator },
      { status: 200, headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in embed product API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}