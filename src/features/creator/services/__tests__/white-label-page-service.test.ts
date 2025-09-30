/**
 * Test suite for white-label page service with platform defaults
 */

import type { CreatorProfile } from '../../types';
import { createDefaultWhiteLabelPages } from '../white-label-page-service';

// Mock dependencies
jest.mock('@/features/platform-owner-onboarding/controllers/get-platform-settings');
jest.mock('@/libs/supabase/supabase-admin');

const mockGetPlatformSettings = require('@/features/platform-owner-onboarding/controllers/get-platform-settings').getPlatformSettings;
const mockCreateSupabaseAdminClient = require('@/libs/supabase/supabase-admin').createSupabaseAdminClient;

describe('White Label Page Service', () => {
  const mockCreatorId = 'creator-123';
  const mockCreatorProfile: CreatorProfile = {
    id: mockCreatorId,
    business_name: 'Test Business',
    business_description: 'A test business description',
    business_website: 'https://testbusiness.com',
    brand_color: '#ea580c',
    page_slug: 'test-business',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    business_logo_url: null,
    stripe_account_id: null,
    stripe_account_enabled: null,
    onboarding_completed: true,
    onboarding_step: null,
    brand_gradient: null,
    brand_pattern: null,
    stripe_access_token: null,
    stripe_refresh_token: null,
    branding_extracted_at: null,
    branding_extraction_error: null,
    branding_extraction_status: null,
    extracted_branding_data: null,
  };

  let mockSupabaseClient: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockSupabaseClient = {
      from: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockResolvedValue({ error: null }),
    };

    mockCreateSupabaseAdminClient.mockResolvedValue(mockSupabaseClient);
  });

  describe('createDefaultWhiteLabelPages', () => {
    it('should create pages with default platform config', async () => {
      const mockPlatformSettings = {
        default_white_labeled_page_config: {
          heroTitle: 'Welcome to SaaSinaSnap',
          heroSubtitle: 'Platform subtitle',
          ctaText: 'Join Now',
          showTestimonials: false,
          showPricing: false,
          showFaq: true,
        },
      };

      mockGetPlatformSettings.mockResolvedValue(mockPlatformSettings);

      await createDefaultWhiteLabelPages(mockCreatorId, mockCreatorProfile);

      expect(mockGetPlatformSettings).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('white_labeled_pages');
      expect(mockSupabaseClient.upsert).toHaveBeenCalled();

      const upsertCall = mockSupabaseClient.upsert.mock.calls[0][0];
      const landingPage = upsertCall.find((page: any) => page.page_slug === 'landing');

      expect(landingPage).toBeDefined();
      expect(landingPage.page_config.heroTitle).toContain('Test Business');
      expect(landingPage.page_config.ctaText).toBe('Join Now');
      expect(landingPage.page_config.showTestimonials).toBe(false);
      expect(landingPage.page_config.showPricing).toBe(false);
      expect(landingPage.page_config.showFaq).toBe(true);
    });

    it('should use fallback values when platform settings are not available', async () => {
      mockGetPlatformSettings.mockResolvedValue(null);

      await createDefaultWhiteLabelPages(mockCreatorId, mockCreatorProfile);

      expect(mockGetPlatformSettings).toHaveBeenCalled();
      expect(mockSupabaseClient.from).toHaveBeenCalledWith('white_labeled_pages');
      expect(mockSupabaseClient.upsert).toHaveBeenCalled();

      const upsertCall = mockSupabaseClient.upsert.mock.calls[0][0];
      const landingPage = upsertCall.find((page: any) => page.page_slug === 'landing');

      expect(landingPage).toBeDefined();
      expect(landingPage.page_config.ctaText).toBe('Get Started');
      expect(landingPage.page_config.showTestimonials).toBe(true);
      expect(landingPage.page_config.showPricing).toBe(true);
      expect(landingPage.page_config.showFaq).toBe(true);
    });

    it('should replace platform name with business name in titles', async () => {
      const mockPlatformSettings = {
        default_white_labeled_page_config: {
          heroTitle: 'Welcome to SaaSinaSnap',
          heroSubtitle: 'SaaSinaSnap helps you succeed',
          ctaText: 'Get Started',
          showTestimonials: true,
          showPricing: true,
          showFaq: true,
        },
      };

      mockGetPlatformSettings.mockResolvedValue(mockPlatformSettings);

      await createDefaultWhiteLabelPages(mockCreatorId, mockCreatorProfile);

      const upsertCall = mockSupabaseClient.upsert.mock.calls[0][0];
      const landingPage = upsertCall.find((page: any) => page.page_slug === 'landing');

      expect(landingPage.page_config.heroTitle).toBe('Welcome to Test Business');
      expect(landingPage.page_config.heroSubtitle).toBe('Test Business helps you succeed');
    });

    it('should use creator brand color for all pages', async () => {
      mockGetPlatformSettings.mockResolvedValue({
        default_white_labeled_page_config: {
          heroTitle: 'Welcome',
          heroSubtitle: 'Subtitle',
          ctaText: 'Get Started',
          showTestimonials: true,
          showPricing: true,
          showFaq: true,
        },
      });

      await createDefaultWhiteLabelPages(mockCreatorId, mockCreatorProfile);

      const upsertCall = mockSupabaseClient.upsert.mock.calls[0][0];
      
      upsertCall.forEach((page: any) => {
        expect(page.page_config.primaryColor).toBe(mockCreatorProfile.brand_color);
      });
    });

    it('should handle platform settings error gracefully', async () => {
      mockGetPlatformSettings.mockRejectedValue(new Error('Database error'));

      await createDefaultWhiteLabelPages(mockCreatorId, mockCreatorProfile);

      expect(mockSupabaseClient.upsert).toHaveBeenCalled();
      const upsertCall = mockSupabaseClient.upsert.mock.calls[0][0];
      const landingPage = upsertCall.find((page: any) => page.page_slug === 'landing');

      // Should still create pages with default values
      expect(landingPage).toBeDefined();
      expect(landingPage.page_config.ctaText).toBe('Get Started');
    });

    it('should create multiple page types with appropriate defaults', async () => {
      const mockPlatformSettings = {
        default_white_labeled_page_config: {
          heroTitle: 'Platform Title',
          heroSubtitle: 'Platform Subtitle',
          ctaText: 'Platform CTA',
          showTestimonials: true,
          showPricing: true,
          showFaq: true,
        },
      };

      mockGetPlatformSettings.mockResolvedValue(mockPlatformSettings);

      await createDefaultWhiteLabelPages(mockCreatorId, mockCreatorProfile);

      const upsertCall = mockSupabaseClient.upsert.mock.calls[0][0];
      
      // Check that multiple page types are created
      const pageSlugs = upsertCall.map((page: any) => page.page_slug);
      expect(pageSlugs).toContain('landing');
      expect(pageSlugs).toContain('pricing');
      expect(pageSlugs).toContain('testimonials');
      expect(pageSlugs).toContain('about');
      expect(pageSlugs).toContain('contact');
    });
  });
});
