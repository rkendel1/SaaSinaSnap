import { NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { AdvancedDataVisualizationAIWizard, type VisualizationRequest } from '@/features/creator/services/advanced-data-visualization-ai-wizard';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const creatorProfile = await getCreatorProfile(authenticatedUser.id);
    if (!creatorProfile) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }

    const body: VisualizationRequest = await request.json();
    
    const recommendations = await AdvancedDataVisualizationAIWizard.generateVisualizationRecommendations(
      creatorProfile as any,
      body
    );

    return NextResponse.json(recommendations);
  } catch (error) {
    console.error('Error in data visualization AI recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    );
  }
}
