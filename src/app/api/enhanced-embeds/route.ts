import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { type EmbedGenerationOptions,EnhancedEmbedGeneratorService } from '@/features/creator/services/enhanced-embed-generator';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const options: EmbedGenerationOptions = await request.json();
    
    if (!options.embedType || !options.creator) {
      return NextResponse.json(
        { error: 'embedType and creator are required' },
        { status: 400 }
      );
    }

    // Verify the user owns this creator profile
    if ((options.creator as any).id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot generate embeds for other creators' },
        { status: 403 }
      );
    }

    // Generate the enhanced embed
    const generatedEmbed = await EnhancedEmbedGeneratorService.generateEmbed(options);
    
    return NextResponse.json({
      success: true,
      embed: generatedEmbed,
      message: 'Enhanced embed generated successfully'
    });
  } catch (error) {
    console.error('Enhanced embed generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate enhanced embed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Enhanced Embed Generation API',
    supportedEmbedTypes: [
      'product_card',
      'checkout_button', 
      'pricing_table',
      'header',
      'hero_section',
      'product_description',
      'testimonial_section',
      'footer',
      'custom'
    ],
    features: [
      'AI-powered customization',
      'Brand alignment scoring',
      'Voice and tone adaptation',
      'Multi-type embed generation',
      'Real-time customization'
    ]
  });
}