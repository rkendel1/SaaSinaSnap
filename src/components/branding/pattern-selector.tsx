'use client';

import { Grid3X3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  patternToCss,
  PATTERN_PRESETS,
  type PatternConfig 
} from '@/utils/gradient-utils';

interface PatternSelectorProps {
  value: PatternConfig;
  onChange: (pattern: PatternConfig) => void;
  primaryColor: string;
  gradientCss: string;
}

export function PatternSelector({ value, onChange, primaryColor, gradientCss }: PatternSelectorProps) {
  const handlePresetSelect = (preset: PatternConfig) => {
    onChange(preset);
  };

  const handleTypeChange = (type: PatternConfig['type']) => {
    onChange({
      ...value,
      type,
    });
  };

  const handleIntensityChange = (intensity: number) => {
    onChange({
      ...value,
      intensity,
    });
  };

  const handleAngleChange = (angle: number) => {
    onChange({
      ...value,
      angle,
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
      <label className="text-sm font-medium flex items-center gap-2">
        <Grid3X3 className="h-4 w-4" />
        Background Pattern
      </label>

      {/* Preview */}
      <div 
        className="w-full h-20 rounded-lg border"
        style={getPatternPreview(value)}
      />

      {/* Pattern Type */}
      <div className="flex gap-2">
        <Button 
          type="button"
          variant={value.type === 'none' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleTypeChange('none')}
        >
          None
        </Button>
        <Button 
          type="button"
          variant={value.type === 'stripes' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleTypeChange('stripes')}
        >
          Stripes
        </Button>
        <Button 
          type="button"
          variant={value.type === 'dots' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleTypeChange('dots')}
        >
          Dots
        </Button>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <label className="text-xs font-medium">Quick Presets</label>
        <div className="grid grid-cols-3 gap-2">
          {PATTERN_PRESETS.map((preset, index) => (
            <Button
              key={index}
              type="button"
              variant={
                preset.type === value.type && 
                preset.intensity === value.intensity && 
                preset.angle === value.angle 
                  ? 'default' 
                  : 'outline'
              }
              size="sm"
              onClick={() => handlePresetSelect(preset)}
              className="h-8 p-1"
            >
              <div 
                className="w-full h-full rounded"
                style={getPatternPreview(preset)}
              />
            </Button>
          ))}
        </div>
      </div>

      {/* Advanced Controls */}
      {value.type !== 'none' && (
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-xs font-medium">Intensity</label>
            <Input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={value.intensity || 0.1}
              onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round((value.intensity || 0.1) * 100)}%
            </div>
          </div>

          {value.type === 'stripes' && (
            <div className="space-y-2">
              <label className="text-xs font-medium">Angle</label>
              <Input
                type="range"
                min="0"
                max="360"
                step="15"
                value={value.angle || 0}
                onChange={(e) => handleAngleChange(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground text-center">
                {value.angle || 0}°
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}