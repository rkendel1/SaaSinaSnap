import { NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { BulkDataImportAIWizard, type DataImportRequest } from '@/features/creator/services/bulk-data-import-ai-wizard';
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

    const body: DataImportRequest = await request.json();
    
    const mappings = await BulkDataImportAIWizard.generateImportRecommendations(
      creatorProfile as any,
      body
    );

    return NextResponse.json(mappings);
  } catch (error) {
    console.error('Error in data import AI mappings:', error);
    return NextResponse.json(
      { error: 'Failed to generate mappings' },
      { status: 500 }
    );
  }
}
