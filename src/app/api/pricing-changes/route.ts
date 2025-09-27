import { NextRequest, NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { PricingChangeService } from '@/features/pricing/services/pricing-change-service';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const {
      productId,
      changeType,
      oldData,
      newData,
      effectiveDate,
      reason
    } = await request.json();

    if (!productId || !changeType || !oldData || !newData || !effectiveDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate the pricing change first
    const validation = await PricingChangeService.validatePricingChange(
      user.id,
      productId,
      { change_type: changeType, old_data: oldData, new_data: newData, effective_date: effectiveDate }
    );

    if (!validation.valid) {
      return NextResponse.json({
        error: 'Pricing change validation failed',
        details: validation.errors,
        warnings: validation.warnings,
        recommendations: validation.recommendations
      }, { status: 400 });
    }

    // Create the pricing change notification
    const result = await PricingChangeService.createPricingChangeNotification(
      user.id,
      productId,
      {
        change_type: changeType,
        old_data: oldData,
        new_data: newData,
        effective_date: effectiveDate,
        reason
      }
    );

    return NextResponse.json({
      success: true,
      notification: result.notification,
      impact_analysis: result.impact_analysis,
      validation: validation
    });
  } catch (error) {
    console.error('Error creating pricing change:', error);
    return NextResponse.json(
      { error: 'Failed to create pricing change' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');

    if (productId) {
      // Get pricing change validation/preview for a specific product
      const oldData = { price: 29.99 }; // Mock current data
      const newData = { price: 39.99 }; // Mock new data
      
      const validation = await PricingChangeService.validatePricingChange(
        user.id,
        productId,
        {
          change_type: 'price_increase',
          old_data: oldData,
          new_data: newData,
          effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      );

      const impact = await PricingChangeService.analyzeCreatorChangeImpact(
        user.id,
        productId,
        {
          change_type: 'price_increase',
          old_data: oldData,
          new_data: newData,
          effective_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      );

      return NextResponse.json({
        validation,
        impact_analysis: impact
      });
    }

    return NextResponse.json({
      message: 'Pricing changes API - provide productId for specific analysis'
    });
  } catch (error) {
    console.error('Error fetching pricing change data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pricing change data' },
      { status: 500 }
    );
  }
}