import { CreatorProduct, CreatorProfile, WhiteLabeledPage } from '../types';

export type TemplateTheme = 'classic' | 'modern' | 'minimal' | 'corporate';

export interface TemplateConfig {
  theme: TemplateTheme;
  name: string;
  description: string;
  preview: string;
  features: string[];
}

export interface TemplateProps {
  creator: CreatorProfile;
  products: CreatorProduct[];
  pageConfig: WhiteLabeledPage;
  theme: TemplateTheme;
}

export interface PageTemplateProps extends TemplateProps {
  pageType: 'landing' | 'pricing' | 'account';
}

export const TEMPLATE_CONFIGS: Record<TemplateTheme, TemplateConfig> = {
  classic: {
    theme: 'classic',
    name: 'Classic Business',
    description: 'Professional and timeless design with clean layouts and traditional styling',
    preview: '/templates/classic-preview.jpg',
    features: [
      'Clean, professional layout',
      'Traditional color schemes',
      'Clear navigation',
      'Business-focused design',
      'Excellent readability'
    ]
  },
  modern: {
    theme: 'modern',
    name: 'Modern Startup',
    description: 'Contemporary design with bold gradients, animations, and modern UI elements',
    preview: '/templates/modern-preview.jpg',
    features: [
      'Bold gradient backgrounds',
      'Modern typography',
      'Interactive elements',
      'Responsive animations',
      'Startup-style design'
    ]
  },
  minimal: {
    theme: 'minimal',
    name: 'Minimal Clean',
    description: 'Clean, minimalist design focusing on content with plenty of white space',
    preview: '/templates/minimal-preview.jpg',
    features: [
      'Minimalist layout',
      'Abundant white space',
      'Focus on content',
      'Clean typography',
      'Distraction-free design'
    ]
  },
  corporate: {
    theme: 'corporate',
    name: 'Corporate Enterprise',
    description: 'Enterprise-grade design with sophisticated layouts and professional styling',
    preview: '/templates/corporate-preview.jpg',
    features: [
      'Enterprise-grade design',
      'Sophisticated layouts',
      'Professional color schemes',
      'Data-driven layouts',
      'Trust-building elements'
    ]
  }
};