import { NextRequest, NextResponse } from 'next/server';

import { AdvancedURLExtractionService } from '@/features/creator-onboarding/services/advanced-url-extraction';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    // Extract branding data using the enhanced service
    const extractedData = await AdvancedURLExtractionService.extractFromURL(url);
    
    return NextResponse.json({
      success: true,
      data: extractedData,
      message: 'URL analysis completed successfully'
    });
  } catch (error) {
    console.error('Enhanced URL extraction error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to extract branding data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Enhanced URL Extraction API',
    endpoints: {
      'POST /api/enhanced-extraction': 'Extract advanced branding data from URL',
    },
    features: [
      'Advanced design token extraction',
      'Voice and tone analysis',
      'Layout pattern detection',
      'Interaction pattern analysis',
      'Enhanced confidence scoring'
    ]
  });
}