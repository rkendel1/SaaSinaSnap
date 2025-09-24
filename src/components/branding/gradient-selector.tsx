'use client';

import { useState } from 'react';
import { Palette } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  generateAutoGradient, 
  generateComplementaryColors,
  GRADIENT_PRESETS,
  type GradientConfig, 
  gradientToCss} from '@/utils/gradient-utils';

interface GradientSelectorProps {
  value: GradientConfig;
  onChange: (gradient: GradientConfig) => void;
  primaryColor: string;
}

export function GradientSelector({ value, onChange, primaryColor }: GradientSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handlePresetSelect = (presetName: string) => {
    const preset = GRADIENT_PRESETS[presetName];
    const colors = generateComplementaryColors(primaryColor, 2);
    onChange({
      ...preset,
      colors,
    });
  };

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

  const handleDirectionChange = (direction: number) => {
    onChange({
      ...value,
      direction,
    });
  };

  const handleColorChange = (index: number, color: string) => {
    const newColors = [...value.colors];
    newColors[index] = color;
    onChange({
      ...value,
      colors: newColors,
    });
  };

  const addColor = () => {
    const newColors = [...value.colors, primaryColor];
    onChange({
      ...value,
      colors: newColors,
    });
  };

  const removeColor = (index: number) => {
    if (value.colors.length > 2) {
      const newColors = value.colors.filter((_, i) => i !== index);
      onChange({
        ...value,
        colors: newColors,
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        {/* Adjusted text color */}
        <label className="text-sm font-medium flex items-center gap-2 text-gray-700">
          <Palette className="h-4 w-4" />
          Brand Gradient
        </label>
        {/* Adjusted for light theme */}
        <Button
          type="button"
          variant="outline" 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          {isExpanded ? 'Simple' : 'Advanced'}
        </Button>
      </div>

      {/* Preview */}
      {/* Adjusted border color */}
      <div 
        className="w-full h-20 rounded-lg border border-gray-300"
        style={{ background: gradientToCss(value) }}
      />

      {!isExpanded ? (
        /* Simple Mode */
        <div className="space-y-3">
          <div className="flex gap-2">
            {/* Adjusted for light theme */}
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              onClick={handleAutoGenerate}
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Auto Generate
            </Button>
            {/* Adjusted for light theme */}
            <Button 
              type="button"
              variant={value.type === 'linear' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleTypeChange('linear')}
              className={value.type === 'linear' ? '' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
            >
              Linear
            </Button>
            {/* Adjusted for light theme */}
            <Button 
              type="button"
              variant={value.type === 'radial' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleTypeChange('radial')}
              className={value.type === 'radial' ? '' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
            >
              Radial
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(GRADIENT_PRESETS).map(([name]) => (
              /* Adjusted for light theme */
              <Button
                key={name}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handlePresetSelect(name)}
                className="capitalize border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                {name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        /* Advanced Mode */
        <div className="space-y-4">
          <div className="flex gap-2">
            {/* Adjusted for light theme */}
            <Button 
              type="button"
              variant={value.type === 'linear' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleTypeChange('linear')}
              className={value.type === 'linear' ? '' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
            >
              Linear
            </Button>
            {/* Adjusted for light theme */}
            <Button 
              type="button"
              variant={value.type === 'radial' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => handleTypeChange('radial')}
              className={value.type === 'radial' ? '' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}
            >
              Radial
            </Button>
          </div>

          {value.type === 'linear' && (
            <div className="space-y-2">
              {/* Adjusted text color */}
              <label className="text-xs font-medium text-gray-700">Direction (degrees)</label>
              {/* Adjusted for light theme */}
              <Input
                type="range"
                min="0"
                max="360"
                step="15"
                value={value.direction || 45}
                onChange={(e) => handleDirectionChange(parseInt(e.target.value))}
                className="w-full border-gray-300 bg-white"
              />
              {/* Adjusted text color */}
              <div className="text-xs text-gray-600 text-center">
                {value.direction || 45}°
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              {/* Adjusted text color */}
              <label className="text-xs font-medium text-gray-700">Colors</label>
              {/* Adjusted for light theme */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addColor}
                disabled={value.colors.length >= 5}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Add Color
              </Button>
            </div>
            
            <div className="space-y-2">
              {value.colors.map((color, index) => (
                <div key={index} className="flex gap-2 items-center">
                  {/* Adjusted for light theme */}
                  <Input
                    type="color"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="w-12 h-8 border-gray-300 bg-white"
                  />
                  {/* Adjusted for light theme */}
                  <Input
                    type="text"
                    value={color}
                    onChange={(e) => handleColorChange(index, e.target.value)}
                    className="flex-1 border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
                    placeholder="#000000"
                  />
                  {value.colors.length > 2 && (
                    /* Adjusted for light theme */
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeColor(index)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100"
                    >
                      ×
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}