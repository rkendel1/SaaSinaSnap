/**
 * Test suite for default creator branding and white-label configuration
 */

// Mock Stripe first before any imports
jest.mock('stripe', () => {
  const mockStripe = jest.fn().mockImplementation(() => ({}));
  return { default: mockStripe };
});

jest.mock('@/libs/stripe/stripe-admin', () => ({
  stripeAdmin: {},
}));

// Mock dependencies
jest.mock('@/features/account/controllers/get-authenticated-user');
jest.mock('../controllers/platform-settings');

import { saveDefaultCreatorBrandingAction, saveDefaultWhiteLabeledPageConfigAction } from '../actions/platform-actions';
import { updatePlatformSettings } from '../controllers/platform-settings';
import type { DefaultCreatorBranding, DefaultWhiteLabeledPageConfig } from '../types';

const mockGetAuthenticatedUser = require('@/features/account/controllers/get-authenticated-user').getAuthenticatedUser;
const mockUpdatePlatformSettings = updatePlatformSettings as jest.MockedFunction<typeof updatePlatformSettings>;

describe('Default Creator Branding Actions', () => {
  const mockUserId = 'test-user-id';
  
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAuthenticatedUser.mockResolvedValue({ id: mockUserId, email: 'test@example.com' });
  });

  describe('saveDefaultCreatorBrandingAction', () => {
    it('should save default creator branding to platform settings', async () => {
      const mockBranding: DefaultCreatorBranding = {
        brandColor: '#ea580c',
        brandGradient: { type: 'linear', colors: ['#ea580c', '#fb923c'], direction: 45 },
        brandPattern: { type: 'dots', intensity: 0.1, angle: 0 },
      };

      const mockUpdatedSettings = {
        id: 'settings-id',
        owner_id: mockUserId,
        default_creator_brand_color: mockBranding.brandColor,
        default_creator_gradient: mockBranding.brandGradient,
        default_creator_pattern: mockBranding.brandPattern,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockUpdatePlatformSettings.mockResolvedValue(mockUpdatedSettings as any);

      const result = await saveDefaultCreatorBrandingAction(mockBranding);

      expect(mockUpdatePlatformSettings).toHaveBeenCalledWith(mockUserId, {
        default_creator_brand_color: mockBranding.brandColor,
        default_creator_gradient: mockBranding.brandGradient,
        default_creator_pattern: mockBranding.brandPattern,
      });

      expect(result).toBeDefined();
      expect(result.default_creator_brand_color).toBe(mockBranding.brandColor);
    });

    it('should throw error if user is not authenticated', async () => {
      mockGetAuthenticatedUser.mockResolvedValue(null);

      const mockBranding: DefaultCreatorBranding = {
        brandColor: '#ea580c',
        brandGradient: { type: 'linear', colors: ['#ea580c', '#fb923c'], direction: 45 },
        brandPattern: { type: 'dots', intensity: 0.1, angle: 0 },
      };

      await expect(saveDefaultCreatorBrandingAction(mockBranding)).rejects.toThrow('Not authenticated');
    });
  });

  describe('saveDefaultWhiteLabeledPageConfigAction', () => {
    it('should save default white-labeled page config to platform settings', async () => {
      const mockPageConfig: DefaultWhiteLabeledPageConfig = {
        heroTitle: 'Welcome to Our Platform',
        heroSubtitle: 'Build amazing SaaS products',
        ctaText: 'Get Started Now',
        showTestimonials: true,
        showPricing: true,
        showFaq: true,
      };

      const mockUpdatedSettings = {
        id: 'settings-id',
        owner_id: mockUserId,
        default_white_labeled_page_config: mockPageConfig,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockUpdatePlatformSettings.mockResolvedValue(mockUpdatedSettings as any);

      const result = await saveDefaultWhiteLabeledPageConfigAction(mockPageConfig);

      expect(mockUpdatePlatformSettings).toHaveBeenCalledWith(mockUserId, {
        default_white_labeled_page_config: mockPageConfig,
      });

      expect(result).toBeDefined();
      expect(result.default_white_labeled_page_config).toEqual(mockPageConfig);
    });

    it('should throw error if user is not authenticated', async () => {
      mockGetAuthenticatedUser.mockResolvedValue(null);

      const mockPageConfig: DefaultWhiteLabeledPageConfig = {
        heroTitle: 'Welcome to Our Platform',
        heroSubtitle: 'Build amazing SaaS products',
        ctaText: 'Get Started Now',
        showTestimonials: true,
        showPricing: true,
        showFaq: true,
      };

      await expect(saveDefaultWhiteLabeledPageConfigAction(mockPageConfig)).rejects.toThrow('Not authenticated');
    });

    it('should handle all optional page config fields', async () => {
      const mockPageConfig: DefaultWhiteLabeledPageConfig = {
        heroTitle: 'Custom Hero Title',
        heroSubtitle: 'Custom Subtitle',
        ctaText: 'Custom CTA',
        showTestimonials: false,
        showPricing: false,
        showFaq: false,
      };

      const mockUpdatedSettings = {
        id: 'settings-id',
        owner_id: mockUserId,
        default_white_labeled_page_config: mockPageConfig,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockUpdatePlatformSettings.mockResolvedValue(mockUpdatedSettings as any);

      const result = await saveDefaultWhiteLabeledPageConfigAction(mockPageConfig);

      expect(result.default_white_labeled_page_config).toEqual(mockPageConfig);
    });
  });
});
