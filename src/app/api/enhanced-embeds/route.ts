import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { type EmbedGenerationOptions,EnhancedEmbedGeneratorService } from '@/features/creator/services/enhanced-embed-generator';
import { getPlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

// Helper to check if user is a platform owner
async function isPlatformOwner(userId: string): Promise<boolean> {
  const supabase = await createSupabaseAdminClient();
  const { data: { user } } = await supabase.auth.admin.getUserById(userId);
  return user?.user_metadata?.role === 'platform_owner';
}

// Helper to verify user can generate embeds for a creator profile
async function canGenerateEmbedsFor(userId: string, creatorId: string): Promise<boolean> {
  // Direct match - user owns the creator profile
  if (userId === creatorId) {
    return true;
  }
  
  // Check if user is platform owner and creator profile is platform-owned
  const isOwner = await isPlatformOwner(userId);
  if (!isOwner) {
    return false;
  }
  
  // For platform owners, check if the creatorId matches their owner_id in platform_settings
  const platformSettings = await getPlatformSettings(userId);
  return platformSettings?.owner_id === creatorId;
}

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

    // Verify the user can generate embeds for this creator (supports both creators and platform owners)
    const canGenerate = await canGenerateEmbedsFor(user.id, options.creator.id);
    if (!canGenerate) {
      return NextResponse.json(
        { error: 'Unauthorized: Cannot generate embeds for this creator' },
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