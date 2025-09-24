'use client';

import { useState } from 'react';
import { Palette, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getBrandingStyles } from '@/utils/branding-utils';
import type { ColorPalette } from '@/utils/color-palette-utils';

interface ColorPaletteSelectorProps {
  palettes: ColorPalette[];
  onApplyPalette: (palette: ColorPalette) => Promise<void>;
  currentBrandColor?: string;
  isLoading?: boolean;
}

export function ColorPaletteSelector({ 
  palettes, 
  onApplyPalette, 
  currentBrandColor,
  isLoading = false 
}: ColorPaletteSelectorProps) {
  const [applyingPalette, setApplyingPalette] = useState<string | null>(null);
  const [previewPalette, setPreviewPalette] = useState<ColorPalette | null>(null);

  const handleApplyPalette = async (palette: ColorPalette) => {
    setApplyingPalette(palette.name);
    try {
      await onApplyPalette(palette);
    } catch (error) {
      console.error('Failed to apply palette:', error);
    } finally {
      setApplyingPalette(null);
    }
  };

  const PaletteCard = ({ palette }: { palette: ColorPalette }) => {
    const isApplying = applyingPalette === palette.name;
    const isCurrentColor = currentBrandColor === palette.primary;
    const brandingStyles = getBrandingStyles({
      brandColor: palette.primary,
      brandGradient: palette.gradient,
      brandPattern: palette.pattern,
    });

    return (
      <div 
        className={`relative rounded-lg border-2 transition-all duration-200 overflow-hidden ${
          isCurrentColor 
            ? 'border-blue-500 ring-2 ring-blue-200' 
            : 'border-zinc-700 hover:border-zinc-600'
        } ${previewPalette?.name === palette.name ? 'scale-102 shadow-lg' : ''}`}
        onMouseEnter={() => setPreviewPalette(palette)}
        onMouseLeave={() => setPreviewPalette(null)}
      >
        {/* Color preview header */}
        <div 
          className="h-20 relative"
          style={brandingStyles.gradientBackground}
        >
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-2 right-2">
            {isCurrentColor && (
              <div className="bg-white/90 text-xs px-2 py-1 rounded-full font-medium text-gray-700">
                Current
              </div>
            )}
          </div>
        </div>

        {/* Palette info */}
        <div className="p-4 bg-zinc-900">
          <div className="flex items-center gap-2 mb-2">
            <Palette className="h-4 w-4 text-gray-400" />
            <h3 className="font-medium text-sm text-gray-200">{palette.name}</h3>
          </div>
          
          <p className="text-xs text-gray-400 mb-3 line-clamp-2">
            {palette.description}
          </p>

          {/* Color swatches */}
          <div className="flex gap-2 mb-3">
            <div 
              className="w-6 h-6 rounded-md border border-white shadow-sm"
              style={{ backgroundColor: palette.primary }}
              title={`Primary: ${palette.primary}`}
            />
            <div 
              className="w-6 h-6 rounded-md border border-white shadow-sm"
              style={{ backgroundColor: palette.secondary }}
              title={`Secondary: ${palette.secondary}`}
            />
            <div 
              className="w-6 h-6 rounded-md border border-white shadow-sm"
              style={{ backgroundColor: palette.accent }}
              title={`Accent: ${palette.accent}`}
            />
          </div>

          {/* Apply button */}
          <Button
            size="sm"
            variant={isCurrentColor ? "outline" : "default"}
            className="w-full text-xs border-zinc-700 text-gray-200 hover:bg-zinc-800"
            onClick={() => handleApplyPalette(palette)}
            disabled={isLoading || isApplying || isCurrentColor}
          >
            {isApplying ? (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Applying...
              </div>
            ) : isCurrentColor ? (
              'Applied'
            ) : (
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3" />
                One-Click Apply
              </div>
            )}
          </Button>
        </div>
      </div>
    );
  };

  if (palettes.length === 0) {
    return (
      <div className="text-center py-8">
        <Palette className="h-8 w-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm text-gray-400">No color palettes available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {palettes.map((palette) => (
          <PaletteCard key={palette.name} palette={palette} />
        ))}
      </div>

      {/* Live Preview */}
      {previewPalette && (
        <div className="mt-6 p-4 border border-zinc-700 rounded-lg bg-zinc-800">
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-gray-200">
            <Sparkles className="h-4 w-4" />
            Live Preview: {previewPalette.name}
          </h4>
          
          <div className="bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700">
            {/* Preview header */}
            <div 
              className="p-4 text-white"
              style={getBrandingStyles({
                brandColor: previewPalette.primary,
                brandGradient: previewPalette.gradient,
                brandPattern: previewPalette.pattern,
              }).gradientBackground}
            >
              <h5 className="font-semibold">Your Brand Header</h5>
              <p className="text-sm opacity-90">How your branding will look</p>
            </div>
            
            {/* Preview content */}
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: previewPalette.primary }}
                />
                <span className="text-sm font-medium text-gray-200">Primary Color</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: previewPalette.secondary }}
                />
                <span className="text-sm text-gray-300">Secondary Color</span>
              </div>
              
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: previewPalette.accent }}
                />
                <span className="text-sm text-gray-300">Accent Color</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}