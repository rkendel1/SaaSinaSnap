'use client';

import { Grid3X3 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  PATTERN_PRESETS,
  type PatternConfig, 
  patternToCss} from '@/utils/gradient-utils';

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
      <label className="text-sm font-medium flex items-center gap-2 text-gray-300">
        <Grid3X3 className="h-4 w-4" />
        Background Pattern
      </label>

      {/* Preview */}
      <div 
        className="w-full h-20 rounded-lg border border-zinc-700"
        style={getPatternPreview(value)}
      />

      {/* Pattern Type */}
      <div className="flex gap-2">
        <Button 
          type="button"
          variant={value.type === 'none' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleTypeChange('none')}
          className={value.type === 'none' ? '' : 'border-zinc-700 text-gray-200 hover:bg-zinc-800'}
        >
          None
        </Button>
        <Button 
          type="button"
          variant={value.type === 'stripes' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleTypeChange('stripes')}
          className={value.type === 'stripes' ? '' : 'border-zinc-700 text-gray-200 hover:bg-zinc-800'}
        >
          Stripes
        </Button>
        <Button 
          type="button"
          variant={value.type === 'dots' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => handleTypeChange('dots')}
          className={value.type === 'dots' ? '' : 'border-zinc-700 text-gray-200 hover:bg-zinc-800'}
        >
          Dots
        </Button>
      </div>

      {/* Presets */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-gray-400">Quick Presets</label>
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
              className={
                preset.type === value.type && 
                preset.intensity === value.intensity && 
                preset.angle === value.angle 
                  ? 'h-8 p-1' 
                  : 'h-8 p-1 border-zinc-700 text-gray-200 hover:bg-zinc-800'
              }
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
            <label className="text-xs font-medium text-gray-400">Intensity</label>
            <Input
              type="range"
              min="0"
              max="0.3"
              step="0.05"
              value={value.intensity || 0.1}
              onChange={(e) => handleIntensityChange(parseFloat(e.target.value))}
              className="w-full border-zinc-700 bg-zinc-900"
            />
            <div className="text-xs text-gray-400 text-center">
              {Math.round((value.intensity || 0.1) * 100)}%
            </div>
          </div>

          {value.type === 'stripes' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400">Angle</label>
              <Input
                type="range"
                min="0"
                max="360"
                step="15"
                value={value.angle || 0}
                onChange={(e) => handleAngleChange(parseInt(e.target.value))}
                className="w-full border-zinc-700 bg-zinc-900"
              />
              <div className="text-xs text-gray-400 text-center">
                {value.angle || 0}°
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}