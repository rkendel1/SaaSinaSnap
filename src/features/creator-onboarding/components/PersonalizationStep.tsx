'use client';

import { useState } from 'react';
import { ArrowRight, Briefcase, Code, Gamepad2, GraduationCap, Heart, PenTool, ShoppingBag, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/utils/cn';

export interface BusinessTypeOption {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  suggestedFeatures: string[];
}

const businessTypes: BusinessTypeOption[] = [
  {
    id: 'digital_products',
    title: 'Digital Products',
    description: 'Courses, ebooks, templates, software',
    icon: Code,
    color: 'from-blue-500 to-purple-600',
    suggestedFeatures: ['product_catalog', 'instant_delivery', 'customer_support']
  },
  {
    id: 'services',
    title: 'Professional Services',
    description: 'Consulting, coaching, design, marketing',
    icon: Briefcase,
    color: 'from-green-500 to-teal-600',
    suggestedFeatures: ['booking_system', 'client_portal', 'project_management']
  },
  {
    id: 'education',
    title: 'Education & Training',
    description: 'Online courses, tutoring, workshops',
    icon: GraduationCap,
    color: 'from-orange-500 to-red-600',
    suggestedFeatures: ['course_builder', 'student_progress', 'certificates']
  },
  {
    id: 'ecommerce',
    title: 'E-commerce',
    description: 'Physical products, dropshipping, retail',
    icon: ShoppingBag,
    color: 'from-pink-500 to-rose-600',
    suggestedFeatures: ['inventory_management', 'shipping_integration', 'order_tracking']
  },
  {
    id: 'creative',
    title: 'Creative Services',
    description: 'Art, photography, writing, design',
    icon: PenTool,
    color: 'from-violet-500 to-purple-600',
    suggestedFeatures: ['portfolio_gallery', 'custom_orders', 'licensing_options']
  },
  {
    id: 'saas_tools',
    title: 'SaaS & Tools',
    description: 'Software as a service, web apps, APIs',
    icon: Gamepad2,
    color: 'from-cyan-500 to-blue-600',
    suggestedFeatures: ['subscription_tiers', 'usage_tracking', 'api_access']
  },
  {
    id: 'community',
    title: 'Community & Memberships',
    description: 'Memberships, forums, communities',
    icon: Users,
    color: 'from-indigo-500 to-purple-600',
    suggestedFeatures: ['member_tiers', 'community_features', 'exclusive_content']
  },
  {
    id: 'nonprofit',
    title: 'Non-profit & Causes',
    description: 'Donations, fundraising, advocacy',
    icon: Heart,
    color: 'from-emerald-500 to-green-600',
    suggestedFeatures: ['donation_forms', 'impact_tracking', 'volunteer_management']
  }
];

interface PersonalizationStepProps {
  onComplete: (businessType: BusinessTypeOption, features: string[]) => void;
  onSkip: () => void;
}

export function PersonalizationStep({ onComplete, onSkip }: PersonalizationStepProps) {
  const [selectedType, setSelectedType] = useState<BusinessTypeOption | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const handleTypeSelect = (type: BusinessTypeOption) => {
    setSelectedType(type);
    setSelectedFeatures(type.suggestedFeatures);
  };

  const handleFeatureToggle = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature)
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const handleComplete = () => {
    if (selectedType) {
      onComplete(selectedType, selectedFeatures);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-4">
          <Heart className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Let&apos;s personalize your experience</h2>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tell us about your business so we can customize your onboarding and suggest the best features for your needs.
        </p>
      </div>

      {/* Business Type Selection */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-center">What type of business are you starting?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {businessTypes.map((type) => {
            const Icon = type.icon;
            const isSelected = selectedType?.id === type.id;
            
            return (
              <button
                key={type.id}
                onClick={() => handleTypeSelect(type)}
                className={cn(
                  'p-6 rounded-xl border-2 text-left transition-all duration-200 hover:shadow-lg',
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/30 bg-card'
                )}
              >
                <div className="space-y-3">
                  <div className={cn(
                    'w-12 h-12 rounded-lg flex items-center justify-center bg-gradient-to-br',
                    type.color
                  )}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm mb-1">{type.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {type.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Feature Recommendations */}
      {selectedType && (
        <div className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-6">
            <h4 className="font-semibold mb-2 text-primary">
              Recommended features for {selectedType.title}
            </h4>
            <p className="text-sm text-muted-foreground mb-4">
              Based on your business type, we recommend these features. You can change these anytime later.
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedType.suggestedFeatures.map((feature) => (
                <button
                  key={feature}
                  onClick={() => handleFeatureToggle(feature)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                    selectedFeatures.includes(feature)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {feature.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-8">
        <Button
          variant="outline"
          onClick={onSkip}
          className="w-full sm:w-auto"
        >
          Skip personalization
        </Button>
        <Button
          onClick={handleComplete}
          disabled={!selectedType}
          className="w-full sm:w-auto min-w-32"
        >
          Continue
          <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>

      {/* Progress indicator */}
      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          This helps us customize your experience • Step 1 of 5
        </p>
      </div>
    </div>
  );
}