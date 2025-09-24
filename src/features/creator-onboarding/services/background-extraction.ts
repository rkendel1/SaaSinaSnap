import { updateCreatorProfile } from '../controllers/creator-profile';
import type { BrandingExtractionResult } from '../types';
import { Json } from '@/libs/supabase/types';

import { URLExtractionService } from './url-extraction';

/**
 * Background Extraction Service
 * Handles non-blocking URL extraction and database updates
 */

export class BackgroundExtractionService {
  /**
   * Start background extraction for a creator's website
   */
  static async processCreatorURL(creatorId: string, websiteUrl: string): Promise<void> {
    try {
      // Mark extraction as pending
      await updateCreatorProfile(creatorId, {
        branding_extraction_status: 'pending',
        branding_extraction_error: null,
      });

      // Process in background (don't await)
      this.performExtractionAsync(creatorId, websiteUrl).catch(error => {
        console.error(`Background extraction failed for creator ${creatorId}:`, error);
      });

    } catch (error) {
      console.error(`Failed to start background extraction for creator ${creatorId}:`, error);
      
      // Update status to failed
      await updateCreatorProfile(creatorId, {
        branding_extraction_status: 'failed',
        branding_extraction_error: error instanceof Error ? error.message : 'Unknown error',
      }).catch(updateError => {
        console.error(`Failed to update extraction status for creator ${creatorId}:`, updateError);
      });
    }
  }

  /**
   * Perform the actual extraction asynchronously
   */
  private static async performExtractionAsync(creatorId: string, websiteUrl: string): Promise<void> {
    try {
      // Update status to processing
      await updateCreatorProfile(creatorId, {
        branding_extraction_status: 'processing',
      });

      // Extract branding data
      const extractedData = await URLExtractionService.extractFromURL(websiteUrl);

      // Store the extracted data
      await updateCreatorProfile(creatorId, {
        extracted_branding_data: extractedData as Json, // Cast to Json
        branding_extraction_status: 'completed',
        branding_extracted_at: new Date().toISOString(),
        branding_extraction_error: null,
      });

      console.log(`Successfully extracted branding data for creator ${creatorId}`);

    } catch (error) {
      console.error(`Extraction failed for creator ${creatorId}:`, error);
      
      // Update status to failed with error message
      await updateCreatorProfile(creatorId, {
        branding_extraction_status: 'failed',
        branding_extraction_error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get extraction status for a creator
   */
  static async getExtractionStatus(creatorId: string): Promise<BrandingExtractionResult | null> {
    // This would typically query the database
    // For now, we'll return null as this requires the profile data
    // In practice, this would be called from a controller that already has the profile
    return null;
  }

  /**
   * Retry failed extraction
   */
  static async retryExtraction(creatorId: string, websiteUrl: string): Promise<void> {
    console.log(`Retrying extraction for creator ${creatorId}`);
    await this.processCreatorURL(creatorId, websiteUrl);
  }

  /**
   * Check if extraction is supported for a URL
   */
  static isExtractionSupported(url: string): boolean {
    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(normalizedUrl);
      
      // Skip certain domains that are not useful for branding extraction
      const unsupportedDomains = [
        'localhost',
        '127.0.0.1',
        'example.com',
        'test.com',
        'github.com',
        'gitlab.com',
      ];
      
      return !unsupportedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch {
      return false;
    }
  }
}