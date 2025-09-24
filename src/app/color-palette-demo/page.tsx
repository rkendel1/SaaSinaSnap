'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';

import { ColorPaletteSelector } from '@/features/creator-onboarding/components/ColorPaletteSelector';
import { getBrandingStyles } from '@/utils/branding-utils';
import { COLOR_PALETTE_PRESETS, type ColorPalette,generatePaletteFromColor } from '@/utils/color-palette-utils';

export default function ColorPaletteDemoPage() {
  const [currentPalette, setCurrentPalette] = useState<ColorPalette>(COLOR_PALETTE_PRESETS[0]);
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyPalette = async (palette: ColorPalette) => {
    setIsApplying(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setCurrentPalette(palette);
    setIsApplying(false);
  };

  // Demo suggested colors (simulating website extraction)
  const extractedColors = ['#2563eb', '#059669', '#dc2626', '#7c3aed'];
  const suggestedPalettes = [
    generatePaletteFromColor(extractedColors[0], 'Website Color 1'),
    generatePaletteFromColor(extractedColors[1], 'Website Color 2'),
    generatePaletteFromColor(extractedColors[2], 'Website Color 3'),
    ...COLOR_PALETTE_PRESETS,
  ];

  const brandingStyles = getBrandingStyles({
    brandColor: currentPalette.primary,
    brandGradient: currentPalette.gradient,
    brandPattern: currentPalette.pattern,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div 
        className="p-8 text-white relative"
        style={brandingStyles.gradientBackground}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Palette className="h-8 w-8" />
            <h1 className="text-3xl font-bold">One-Click Color Palette Demo</h1>
          </div>
          <p className="text-lg opacity-90">
            Experience the new One-Click Apply feature for instant branding transformations
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8">
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Palette Selector */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Choose Your Brand Palette</h2>
              <p className="text-gray-600">
                Select from suggested palettes based on your website colors or choose from our professionally designed presets.
              </p>
            </div>

            <ColorPaletteSelector
              palettes={suggestedPalettes}
              onApplyPalette={handleApplyPalette}
              currentBrandColor={currentPalette.primary}
              isLoading={isApplying}
            />
          </div>

          {/* Live Brand Preview */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Live Brand Preview</h2>
              <p className="text-gray-600">
                See how your selected palette looks across different elements of your brand.
              </p>
            </div>

            <div className="space-y-4">
              {/* Current Palette Info */}
              <div className="bg-white rounded-lg p-4 border">
                <h3 className="font-medium mb-3">Current Palette: {currentPalette.name}</h3>
                <div className="flex gap-3">
                  <div className="text-center">
                    <div 
                      className="w-12 h-12 rounded-lg border border-gray-200 mb-2"
                      style={{ backgroundColor: currentPalette.primary }}
                    />
                    <div className="text-xs text-gray-600">Primary</div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-12 h-12 rounded-lg border border-gray-200 mb-2"
                      style={{ backgroundColor: currentPalette.secondary }}
                    />
                    <div className="text-xs text-gray-600">Secondary</div>
                  </div>
                  <div className="text-center">
                    <div 
                      className="w-12 h-12 rounded-lg border border-gray-200 mb-2"
                      style={{ backgroundColor: currentPalette.accent }}
                    />
                    <div className="text-xs text-gray-600">Accent</div>
                  </div>
                </div>
              </div>

              {/* Mock Branded Components */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div 
                  className="p-4 text-white"
                  style={brandingStyles.gradientBackground}
                >
                  <h4 className="font-semibold">Your SaaS Dashboard</h4>
                  <p className="text-sm opacity-90">Welcome back, Creator!</p>
                </div>
                
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Recent Activity</span>
                    <button 
                      className="px-3 py-1 rounded text-white text-sm"
                      style={brandingStyles.primaryButton}
                    >
                      View All
                    </button>
                  </div>
                  
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 p-2 rounded-lg border">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: currentPalette.accent }}
                        />
                        <span className="text-sm">Activity item {i}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Mock Landing Page Preview */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div 
                  className="p-6"
                  style={brandingStyles.subtleGradientBackground}
                >
                  <h4 
                    className="text-xl font-bold mb-2"
                    style={brandingStyles.gradientText}
                  >
                    Your Product Landing Page
                  </h4>
                  <p className="text-gray-600 mb-4">
                    This is how your landing page will look with the applied branding.
                  </p>
                  <div className="flex gap-2">
                    <button 
                      className="px-4 py-2 rounded text-white font-medium"
                      style={brandingStyles.primaryButton}
                    >
                      Get Started
                    </button>
                    <button 
                      className="px-4 py-2 rounded border-2 font-medium"
                      style={brandingStyles.brandBorder}
                    >
                      Learn More
                    </button>
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