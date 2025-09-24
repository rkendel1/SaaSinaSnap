'use client';

import { useState } from 'react';

import { generateAutoGradient, type GradientConfig, gradientToCss, type PatternConfig, patternToCss } from '@/utils/gradient-utils';

// Simple gradient selector component
function SimpleGradientSelector({ value, onChange, primaryColor }: {
  value: GradientConfig;
  onChange: (gradient: GradientConfig) => void;
  primaryColor: string;
}) {
  const handleAutoGenerate = () => {
    const autoGradient = generateAutoGradient(primaryColor, value.type);
    onChange(autoGradient);
  };

  const handleTypeChange = (type: 'linear' | 'radial') => {
    onChange({
      ...value,
      type,
      direction: type === 'linear' ? (value.direction || 45) : undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Brand Gradient</label>
      </div>

      {/* Preview */}
      <div 
        className="w-full h-20 rounded-lg border"
        style={{ background: gradientToCss(value) }}
      />

      <div className="flex gap-2">
        <button 
          type="button"
          className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          onClick={handleAutoGenerate}
        >
          Auto Generate
        </button>
        <button 
          type="button"
          className={`px-3 py-1 text-sm border rounded ${value.type === 'linear' ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
          onClick={() => handleTypeChange('linear')}
        >
          Linear
        </button>
        <button 
          type="button"
          className={`px-3 py-1 text-sm border rounded ${value.type === 'radial' ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
          onClick={() => handleTypeChange('radial')}
        >
          Radial
        </button>
      </div>
    </div>
  );
}

// Simple pattern selector component
function SimplePatternSelector({ value, onChange, primaryColor, gradientCss }: {
  value: PatternConfig;
  onChange: (pattern: PatternConfig) => void;
  primaryColor: string;
  gradientCss: string;
}) {
  const handleTypeChange = (type: PatternConfig['type']) => {
    onChange({
      ...value,
      type,
    });
  };

  const getPatternPreview = (pattern: PatternConfig) => {
    const patternCss = patternToCss(pattern, primaryColor);
    return {
      background: gradientCss,
      backgroundImage: patternCss,
      backgroundSize: pattern.type === 'dots' ? '20px 20px' : undefined,
    };
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium">Background Pattern</label>

      {/* Preview */}
      <div 
        className="w-full h-20 rounded-lg border"
        style={getPatternPreview(value)}
      />

      {/* Pattern Type */}
      <div className="flex gap-2">
        <button 
          type="button"
          className={`px-3 py-1 text-sm border rounded ${value.type === 'none' ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
          onClick={() => handleTypeChange('none')}
        >
          None
        </button>
        <button 
          type="button"
          className={`px-3 py-1 text-sm border rounded ${value.type === 'stripes' ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
          onClick={() => handleTypeChange('stripes')}
        >
          Stripes
        </button>
        <button 
          type="button"
          className={`px-3 py-1 text-sm border rounded ${value.type === 'dots' ? 'bg-blue-100' : 'hover:bg-gray-50'}`}
          onClick={() => handleTypeChange('dots')}
        >
          Dots
        </button>
      </div>
    </div>
  );
}

export default function BrandingDemoPage() {
  const [brandColor, setBrandColor] = useState('#3b82f6');
  const [gradient, setGradient] = useState<GradientConfig>(() => 
    generateAutoGradient('#3b82f6')
  );
  const [pattern, setPattern] = useState<PatternConfig>({
    type: 'none',
    intensity: 0.1,
    angle: 0,
  });

  const handleColorChange = (color: string) => {
    setBrandColor(color);
    setGradient(generateAutoGradient(color, gradient.type));
  };

  const gradientCss = gradientToCss(gradient);
  const patternCss = patternToCss(pattern, brandColor);

  const brandingStyles = {
    brandColor,
    gradientBackground: {
      background: gradientCss,
      backgroundImage: patternCss || undefined,
      backgroundSize: pattern.type === 'dots' ? '20px 20px' : undefined,
    },
    subtleGradientBackground: {
      background: `linear-gradient(135deg, ${brandColor}05, ${brandColor}15)`,
    },
    gradientText: {
      background: gradientCss,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
    },
    primaryButton: {
      background: gradientCss,
      border: 'none',
      color: 'white',
    },
    accent: {
      backgroundColor: brandColor,
    },
    brandBorder: {
      borderColor: brandColor,
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={brandingStyles.gradientText}>
            Creator Branding Demo
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore gradient and pattern options for your creator branding. 
            See how your selections look on white-labeled pages in real-time.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Controls Panel */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h2 className="text-2xl font-semibold mb-6">Branding Controls</h2>
              
              {/* Brand Color */}
              <div className="space-y-4 mb-8">
                <label className="text-sm font-medium">Primary Brand Color</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="w-16 h-10 rounded border"
                  />
                  <input
                    type="text"
                    value={brandColor}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md"
                    placeholder="#000000"
                  />
                </div>
              </div>

              {/* Gradient Selector */}
              <SimpleGradientSelector
                value={gradient}
                onChange={setGradient}
                primaryColor={brandColor}
              />

              {/* Pattern Selector */}
              <SimplePatternSelector
                value={pattern}
                onChange={setPattern}
                primaryColor={brandColor}
                gradientCss={gradientCss}
              />
            </div>
          </div>

          {/* Preview Panel */}
          <div className="space-y-8">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <h2 className="text-2xl font-semibold p-6 pb-4">Live Preview</h2>
              
              {/* Mock White-labeled Page */}
              <div className="border-t">
                {/* Header Preview */}
                <div className="p-4" style={brandingStyles.subtleGradientBackground}>
                  <div className="flex items-center justify-between">
                    <div className="text-xl font-bold" style={brandingStyles.gradientText}>
                      Your SaaS Business
                    </div>
                    <nav className="flex gap-4">
                      <a href="#" className="text-sm hover:underline" style={{ color: brandingStyles.brandColor }}>
                        Home
                      </a>
                      <a href="#" className="text-sm hover:underline" style={{ color: brandingStyles.brandColor }}>
                        Pricing
                      </a>
                    </nav>
                  </div>
                </div>

                {/* Hero Section Preview */}
                <div className="p-8 text-center text-white" style={brandingStyles.gradientBackground}>
                  <h1 className="text-3xl font-bold mb-4">
                    Welcome to Your Platform
                  </h1>
                  <p className="text-white/90 mb-6">
                    Experience the power of custom branding with gradients and patterns
                  </p>
                  <button 
                    className="px-6 py-3 rounded-lg font-semibold text-white transition-transform hover:scale-105"
                    style={brandingStyles.primaryButton}
                  >
                    Get Started
                  </button>
                </div>

                {/* Content Section Preview */}
                <div className="p-8" style={brandingStyles.subtleGradientBackground}>
                  <h2 className="text-2xl font-bold mb-6" style={brandingStyles.gradientText}>
                    Our Features
                  </h2>
                  
                  <div className="grid gap-4">
                    {[1, 2, 3].map((i) => (
                      <div 
                        key={i}
                        className="bg-white p-4 rounded-lg border-2 transition-transform hover:scale-105"
                        style={brandingStyles.brandBorder}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={brandingStyles.accent}
                          />
                          <span className="font-medium">Feature {i}</span>
                        </div>
                        <p className="text-gray-600 text-sm mt-2">
                          This is a sample feature description showcasing your brand colors.
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Pricing Card Preview */}
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-center mb-6" style={brandingStyles.gradientText}>
                    Choose Your Plan
                  </h2>
                  
                  <div className="max-w-sm mx-auto">
                    <div className="bg-white border-2 rounded-lg p-6 shadow-sm" style={brandingStyles.brandBorder}>
                      <div className="text-center mb-6">
                        <h3 className="text-xl font-bold mb-2" style={brandingStyles.gradientText}>
                          Professional Plan
                        </h3>
                        <div className="flex items-baseline justify-center">
                          <span className="text-3xl font-bold text-gray-900">$29</span>
                          <span className="text-gray-600 ml-1">/month</span>
                        </div>
                      </div>

                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-4 h-4 rounded-full mr-2" style={brandingStyles.accent} />
                          Full access to all features
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <div className="w-4 h-4 rounded-full mr-2" style={brandingStyles.accent} />
                          24/7 customer support
                        </div>
                      </div>

                      <button
                        className="w-full py-3 rounded-lg font-semibold text-white transition-transform hover:scale-105"
                        style={brandingStyles.primaryButton}
                      >
                        Start Subscription
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}