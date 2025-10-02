import { NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { BulkDataImportAIWizard } from '@/features/creator/services/bulk-data-import-ai-wizard';

export async function POST(request: Request) {
  try {
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { data, dataType, mappings } = body;
    
    const validationResult = await BulkDataImportAIWizard.validateImportedData(
      data,
      dataType,
      mappings
    );

    return NextResponse.json(validationResult);
  } catch (error) {
    console.error('Error validating data:', error);
    return NextResponse.json(
      { error: 'Failed to validate data' },
      { status: 500 }
    );
  }
}
