'use client';

import { useState } from 'react';
import { Building, Globe, Palette, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';

interface CreatorSetupStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function CreatorSetupStep({ profile, onNext }: CreatorSetupStepProps) {
  const [formData, setFormData] = useState({
    businessName: profile.business_name || '',
    businessDescription: profile.business_description || '',
    businessWebsite: profile.business_website || '',
    brandColor: profile.brand_color || '#000000',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await updateCreatorProfileAction({
        business_name: formData.businessName,
        business_description: formData.businessDescription,
        business_website: formData.businessWebsite,
        brand_color: formData.brandColor,
        onboarding_step: 2,
      });
      onNext();
    } catch (error) {
      console.error('Failed to update creator profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.businessName.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Building className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2">Tell us about your business</h2>
        <p className="text-muted-foreground">
          We&apos;ll use this information to create your personalized SaaS platform.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="businessName" className="text-sm font-medium">
            Business Name *
          </label>
          <Input
            id="businessName"
            placeholder="Enter your business name"
            value={formData.businessName}
            onChange={handleInputChange('businessName')}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="businessDescription" className="text-sm font-medium">
            Business Description
          </label>
          <textarea
            id="businessDescription"
            placeholder="Describe what your business does..."
            value={formData.businessDescription}
            onChange={handleInputChange('businessDescription')}
            className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="businessWebsite" className="text-sm font-medium flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Business Website
          </label>
          <Input
            id="businessWebsite"
            placeholder="https://yourwebsite.com"
            type="url"
            value={formData.businessWebsite}
            onChange={handleInputChange('businessWebsite')}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="brandColor" className="text-sm font-medium flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Brand Color
          </label>
          <div className="flex gap-2 items-center">
            <Input
              id="brandColor"
              type="color"
              value={formData.brandColor}
              onChange={handleInputChange('brandColor')}
              className="w-16 h-10"
            />
            <Input
              placeholder="#000000"
              value={formData.brandColor}
              onChange={handleInputChange('brandColor')}
              className="flex-1"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Business Logo (Optional)
          </label>
          <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload your business logo
            </p>
            <Button variant="outline" size="sm" disabled>
              Choose File (Coming Soon)
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={handleSubmit} 
          disabled={!isFormValid || isSubmitting}
          className="min-w-[120px]"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}