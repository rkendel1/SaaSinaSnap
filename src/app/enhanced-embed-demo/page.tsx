'use client';

import React, { useState } from 'react';
import { Code, Eye, Layout, MessageSquare, Palette, Sparkles, Type } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface ExtractionResult {
  primaryColors: string[];
  secondaryColors: string[];
  fonts: {
    primary?: string;
    secondary?: string;
    headings?: string;
  };
  voiceAndTone?: {
    tone: string;
    voice: string;
    confidence: number;
    keyPhrases: string[];
  };
  layoutPatterns: {
    gridSystems: string[];
    spacingPatterns: string[];
    componentPatterns: string[];
  };
  interactionPatterns: {
    hoverEffects: string[];
    transitions: string[];
    animations: string[];
  };
  metadata: {
    confidence: number;
    elementsFound: string[];
  };
}

export default function EnhancedEmbedDemoPage() {
  const [url, setUrl] = useState('');
  const [extractionResult, setExtractionResult] = useState<ExtractionResult | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState('');

  const handleExtraction = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    setIsExtracting(true);
    setError('');
    setExtractionResult(null);

    try {
      const response = await fetch('/api/enhanced-extraction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Extraction failed');
      }

      setExtractionResult(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsExtracting(false);
    }
  };

  const renderColorPalette = (colors: string[], title: string) => (
    <div className="space-y-2">
      <h4 className="font-medium text-sm">{title}</h4>
      <div className="flex flex-wrap gap-2">
        {colors.map((color, index) => (
          <div key={index} className="flex items-center space-x-2">
            <div
              className="w-6 h-6 rounded border border-gray-300"
              style={{ backgroundColor: color }}
              title={color}
            />
            <span className="text-xs font-mono">{color}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBadges = (items: string[], className = "bg-blue-100 text-blue-800") => (
    <div className="flex flex-wrap gap-1">
      {items.map((item, index) => (
        <Badge key={index} variant="secondary" className={className}>
          {item}
        </Badge>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Enhanced URL Extraction & Embed Generation Demo
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">
          Experience our advanced AI-powered system that extracts design tokens, analyzes voice & tone, 
          and generates perfectly branded embeds from any website URL.
        </p>
      </div>

      {/* URL Input Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-blue-500" />
            Enter Website URL
          </CardTitle>
          <CardDescription>
            Enter any website URL to extract design tokens, branding information, and content analysis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4">
            <div className="flex-1">
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="mt-2"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={handleExtraction}
                disabled={isExtracting}
                className="mb-0"
              >
                {isExtracting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-2" />
                    Analyze Website
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      {extractionResult && (
        <div className="space-y-6">
          {/* Overview Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(extractionResult.metadata.confidence * 100)}%
                  </div>
                  <div className="text-sm text-gray-600">Confidence Score</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {extractionResult.primaryColors.length + extractionResult.secondaryColors.length}
                  </div>
                  <div className="text-sm text-gray-600">Colors Found</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {extractionResult.layoutPatterns.gridSystems.length + 
                     extractionResult.layoutPatterns.componentPatterns.length}
                  </div>
                  <div className="text-sm text-gray-600">Layout Patterns</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {extractionResult.voiceAndTone ? Math.round(extractionResult.voiceAndTone.confidence * 100) : 0}%
                  </div>
                  <div className="text-sm text-gray-600">Voice Analysis</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Results */}
          <Tabs defaultValue="design-tokens" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="design-tokens">
                <Palette className="h-4 w-4 mr-2" />
                Design Tokens
              </TabsTrigger>
              <TabsTrigger value="voice-tone">
                <MessageSquare className="h-4 w-4 mr-2" />
                Voice & Tone
              </TabsTrigger>
              <TabsTrigger value="layout-patterns">
                <Layout className="h-4 w-4 mr-2" />
                Layout Patterns
              </TabsTrigger>
              <TabsTrigger value="typography">
                <Type className="h-4 w-4 mr-2" />
                Typography
              </TabsTrigger>
            </TabsList>

            <TabsContent value="design-tokens">
              <Card>
                <CardHeader>
                  <CardTitle>Design Tokens</CardTitle>
                  <CardDescription>
                    Extracted colors and visual elements that define the brand identity.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {renderColorPalette(extractionResult.primaryColors, "Primary Colors")}
                  {extractionResult.secondaryColors.length > 0 && 
                    renderColorPalette(extractionResult.secondaryColors, "Secondary Colors")}
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Elements Analyzed</h4>
                    {renderBadges(extractionResult.metadata.elementsFound, "bg-gray-100 text-gray-800")}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="voice-tone">
              <Card>
                <CardHeader>
                  <CardTitle>Voice & Tone Analysis</CardTitle>
                  <CardDescription>
                    AI-powered analysis of the website's communication style and personality.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {extractionResult.voiceAndTone ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-blue-50 rounded-lg">
                          <h4 className="font-medium mb-2">Tone</h4>
                          <Badge className="bg-blue-100 text-blue-800 text-lg px-3 py-1">
                            {extractionResult.voiceAndTone.tone}
                          </Badge>
                        </div>
                        <div className="p-4 bg-green-50 rounded-lg">
                          <h4 className="font-medium mb-2">Voice</h4>
                          <Badge className="bg-green-100 text-green-800 text-lg px-3 py-1">
                            {extractionResult.voiceAndTone.voice}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Key Phrases</h4>
                        {renderBadges(extractionResult.voiceAndTone.keyPhrases.slice(0, 10), "bg-purple-100 text-purple-800")}
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500">No voice and tone data could be extracted from this URL.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout-patterns">
              <Card>
                <CardHeader>
                  <CardTitle>Layout Patterns</CardTitle>
                  <CardDescription>
                    Detected layout systems and design patterns used on the website.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Grid Systems</h4>
                    {extractionResult.layoutPatterns.gridSystems.length > 0 ? (
                      renderBadges(extractionResult.layoutPatterns.gridSystems, "bg-indigo-100 text-indigo-800")
                    ) : (
                      <p className="text-gray-500 text-sm">No specific grid systems detected</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Component Patterns</h4>
                    {extractionResult.layoutPatterns.componentPatterns.length > 0 ? (
                      renderBadges(extractionResult.layoutPatterns.componentPatterns, "bg-pink-100 text-pink-800")
                    ) : (
                      <p className="text-gray-500 text-sm">No specific component patterns detected</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Interaction Patterns</h4>
                    {extractionResult.interactionPatterns.hoverEffects.length > 0 ? (
                      renderBadges(extractionResult.interactionPatterns.hoverEffects, "bg-teal-100 text-teal-800")
                    ) : (
                      <p className="text-gray-500 text-sm">No interaction patterns detected</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography">
              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>
                    Font families and typography patterns detected on the website.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(extractionResult.fonts).map(([type, font]) => (
                      font && (
                        <div key={type} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm capitalize">{type} Font</span>
                            <Badge variant="outline">{font}</Badge>
                          </div>
                        </div>
                      )
                    ))}
                    
                    {Object.values(extractionResult.fonts).every(font => !font) && (
                      <p className="text-gray-500">No specific fonts could be extracted from this URL.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Next Steps CTA */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold mb-2">Ready to Generate Enhanced Embeds?</h3>
                <p className="text-gray-600 mb-4">
                  Use this extracted branding data to create perfectly aligned embeds for your website.
                </p>
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                  <Code className="h-4 w-4 mr-2" />
                  Generate Embeds
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}