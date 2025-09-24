import { NextRequest, NextResponse } from 'next/server';

import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { getCreatorProducts } from '@/features/creator/controllers/get-creator-products';
import { getWhiteLabeledPage } from '@/features/creator/controllers/get-white-labeled-page';

import { renderEmbeddablePage } from './embed-renderer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ creatorSlug: string; pageSlug: string }> }
) {
  try {
    const { creatorSlug, pageSlug } = await params;
    const searchParams = request.nextUrl.searchParams;
    const mode = searchParams.get('mode') || 'inline';

    // Get creator profile
    const creator = await getCreatorBySlug(creatorSlug);
    if (!creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get creator's products and white-labeled page config
    const [products, pageConfig] = await Promise.all([
      getCreatorProducts(creator.id),
      getWhiteLabeledPage(creator.id, pageSlug)
    ]);

    // Render embeddable content based on mode
    const embeddableContent = await renderEmbeddablePage({
      creator,
      products,
      pageConfig,
      pageSlug,
      mode: mode as 'inline' | 'iframe'
    });

    // Set CORS headers for embedding
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Frame-Options': 'ALLOWALL',
      'Content-Security-Policy': "frame-ancestors *;"
    });

    return NextResponse.json(embeddableContent, { headers });

  } catch (error) {
    console.error('Embed API Error:', error);
    return NextResponse.json(
      { error: 'Failed to load embeddable content' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}