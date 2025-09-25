'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Send, Sparkles, Eye, Code, MessageSquare, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import type { EmbedAsset, EmbedAssetType, CreateEmbedAssetRequest } from '../types/embed-assets';
import type { CreatorProfile, CreatorProduct } from '../types';
import { EnhancedEmbedGeneratorService, type EmbedGenerationOptions, type GeneratedEmbed } from '../services/enhanced-embed-generator';
import { AIEmbedCustomizerService, type ConversationMessage, type AICustomizationSession } from '../services/ai-embed-customizer';

interface EnhancedCreateAssetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAsset: (asset: CreateEmbedAssetRequest) => Promise<void>;
  isLoading: boolean;
  creatorProfile: CreatorProfile;
  products: CreatorProduct[];
}

export function EnhancedCreateAssetDialog({
  isOpen,
  onOpenChange,
  onCreateAsset,
  isLoading,
  creatorProfile,
  products
}: EnhancedCreateAssetDialogProps) {
  // Form state
  const [formData, setFormData] = useState<CreateEmbedAssetRequest>({
    name: '',
    description: '',
    asset_type: 'product_card',
    embed_config: {},
    tags: [],
    is_public: false,
    featured: false
  });

  // AI conversation state
  const [aiSession, setAiSession] = useState<AICustomizationSession | null>(null);
  const [conversationInput, setConversationInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmbed, setGeneratedEmbed] = useState<GeneratedEmbed | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // UI state
  const [activeTab, setActiveTab] = useState<'basic' | 'ai' | 'preview'>('basic');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      asset_type: 'product_card',
      embed_config: {},
      tags: [],
      is_public: false,
      featured: false
    });
    setAiSession(null);
    setGeneratedEmbed(null);
    setConversationInput('');
    setActiveTab('basic');
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [aiSession?.messages]);

  const handleBasicFieldChange = (field: keyof CreateEmbedAssetRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleEmbedConfigChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      embed_config: { ...prev.embed_config, [field]: value }
    }));
  };

  const startAISession = async () => {
    // Flatten customization object to match EmbedAssetConfig
    const initialOptions: EmbedGenerationOptions = {
      embedType: formData.asset_type as any,
      creator: creatorProfile,
      product: products.find(p => p.id === formData.embed_config.productId),
      customization: {
        // Directly pass properties from formData.embed_config
        colors: formData.embed_config.colors,
        voiceAndTone: formData.embed_config.voiceAndTone,
        title: formData.embed_config.title,
        description: formData.embed_config.description,
        ctaText: formData.embed_config.ctaText,
        width: formData.embed_config.width,
        height: formData.embed_config.height,
        padding: formData.embed_config.padding,
        borderRadius: formData.embed_config.borderRadius,
        // Add other relevant properties from embed_config here
        backgroundColor: formData.embed_config.backgroundColor,
        textColor: formData.embed_config.textColor,
        accentColor: formData.embed_config.accentColor,
        fontFamily: formData.embed_config.fontFamily,
        buttonText: formData.embed_config.buttonText,
        buttonStyle: formData.embed_config.buttonStyle,
        showImage: formData.embed_config.showImage,
        showDescription: formData.embed_config.showDescription,
        showPrice: formData.embed_config.showPrice,
        imageUrl: formData.embed_config.imageUrl,
        features: formData.embed_config.features,
        highlighted: formData.embed_config.highlighted,
        customHtml: formData.embed_config.customHtml,
        customCss: formData.embed_config.customCss,
        customJs: formData.embed_config.customJs,
      }
    };

    const session = AIEmbedCustomizerService.startSession(
      creatorProfile.id,
      formData.asset_type as any,
      initialOptions
    );

    setAiSession(session);
    setActiveTab('ai');

    // Generate initial embed
    await generateEmbed(session.currentOptions);
  };

  const sendAIMessage = async () => {
    if (!conversationInput.trim() || !aiSession) return;

    setIsGenerating(true);
    try {
      const result = await AIEmbedCustomizerService.processMessage(
        aiSession.id,
        conversationInput
      );

      setAiSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, result.response]
      } : null);

      setConversationInput('');

      if (result.requiresRegeneration) {
        await generateEmbed(result.updatedOptions);
      }
    } catch (error) {
      console.error('Error processing AI message:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateEmbed = async (options: EmbedGenerationOptions) => {
    setIsGenerating(true);
    try {
      const embed = await EnhancedEmbedGeneratorService.generateEmbed(options);
      setGeneratedEmbed(embed);
      
      // Update form data with generated config
      setFormData(prev => ({
        ...prev,
        embed_config: {
          ...prev.embed_config,
          ...options.customization, // Spread the flattened customization
          brandAlignment: embed.metadata.brandAlignment,
          aiSession: aiSession ? {
            sessionId: aiSession.id,
            customizations: embed.metadata.customizations
          } : undefined
        }
      }));
    } catch (error) {
      console.error('Error generating embed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    try {
      // Include generated HTML/CSS if available
      if (generatedEmbed) {
        const updatedConfig = {
          ...formData.embed_config,
          generatedHtml: generatedEmbed.html,
          generatedCss: generatedEmbed.css,
          embedCode: generatedEmbed.embedCode
        };
        
        await onCreateAsset({
          ...formData,
          embed_config: updatedConfig
        });
      } else {
        await onCreateAsset(formData);
      }
      
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  const getEmbedTypeOptions = () => [
    { value: 'product_card', label: '🎴 Product Card', description: 'Showcase a single product with pricing and features' },
    { value: 'checkout_button', label: '🛒 Checkout Button', description: 'Simple buy now button' },
    { value: 'pricing_table', label: '💰 Pricing Table', description: 'Compare multiple pricing tiers' },
    { value: 'header', label: '🏠 Header', description: 'Navigation header with branding' },
    { value: 'hero_section', label: '🌟 Hero Section', description: 'Eye-catching intro section' },
    { value: 'product_description', label: '📝 Product Description', description: 'Detailed product information' },
    { value: 'testimonial_section', label: '💬 Testimonials', description: 'Customer reviews and social proof' },
    { value: 'footer', label: '📧 Footer', description: 'Contact info and links' },
    { value: 'custom', label: '⚡ Custom', description: 'Custom HTML/CSS embed' }
  ];

  const renderBasicConfiguration = () => {
    const embedTypeOption = getEmbedTypeOptions().find(opt => opt.value === formData.asset_type);
    
    return (
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleBasicFieldChange('name', e.target.value)}
              placeholder="My Awesome Embed"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleBasicFieldChange('description', e.target.value)}
              placeholder="Describe what this embed is for..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="embedType">Embed Type *</Label>
            <Select
              value={formData.asset_type}
              onValueChange={(value) => handleBasicFieldChange('asset_type', value as EmbedAssetType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select embed type" />
              </SelectTrigger>
              <SelectContent>
                {getEmbedTypeOptions().map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span>{option.label}</span>
                      <span className="text-xs text-gray-500">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Product Selection for relevant types */}
        {(['product_card', 'checkout_button', 'product_description'].includes(formData.asset_type)) && (
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select
              value={formData.embed_config.productId || ''}
              onValueChange={(value) => handleEmbedConfigChange('productId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name} - {product.price ? `$${product.price}` : 'Free'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Quick Customization */}
        <div className="space-y-4">
          <h3 className="text-sm font-medium">Quick Customization</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">Width</Label>
              <Input
                id="width"
                value={formData.embed_config.width || ''}
                onChange={(e) => handleEmbedConfigChange('width', e.target.value)}
                placeholder="400px or 100%"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="borderRadius">Border Radius</Label>
              <Input
                id="borderRadius"
                value={formData.embed_config.borderRadius || ''}
                onChange={(e) => handleEmbedConfigChange('borderRadius', e.target.value)}
                placeholder="8px"
              />
            </div>
          </div>
        </div>

        {/* AI Enhancement CTA */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">✨ Want AI-powered customization?</h4>
              <p className="text-sm text-gray-600 mt-1">
                Let our AI help you create the perfect embed by chatting about your needs.
              </p>
            </div>
            <Button onClick={startAISession} variant="outline" size="sm">
              <Sparkles className="h-4 w-4 mr-2" />
              Use AI
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const renderAIConversation = () => {
    if (!aiSession) {
      return (
        <div className="text-center py-8">
          <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Start an AI session to begin customizing your embed</p>
          <Button onClick={startAISession} className="mt-4">
            <Sparkles className="h-4 w-4 mr-2" />
            Start AI Session
          </Button>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-96">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
          {aiSession.messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : message.role === 'assistant'
                    ? 'bg-white text-gray-900 shadow-sm border'
                    : 'bg-gray-100 text-gray-600 text-sm'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                
                {/* Suggestions */}
                {message.metadata?.suggestions && message.role === 'assistant' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.metadata.suggestions.slice(0, 3).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setConversationInput(suggestion)}
                        className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 shadow-sm border rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm">Generating...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex space-x-2 mt-4">
          <Input
            value={conversationInput}
            onChange={(e) => setConversationInput(e.target.value)}
            placeholder="Tell me what you'd like to customize..."
            onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendAIMessage()}
            disabled={isGenerating}
          />
          <Button onClick={sendAIMessage} disabled={!conversationInput.trim() || isGenerating}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  const renderPreview = () => {
    if (!generatedEmbed) {
      return (
        <div className="text-center py-8">
          <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Generate an embed to see the preview</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Preview */}
        <div className="border rounded-lg p-4 bg-white">
          <div
            dangerouslySetInnerHTML={{ __html: generatedEmbed.html }}
            className="embed-preview"
          />
          <style dangerouslySetInnerHTML={{ __html: generatedEmbed.css }} />
        </div>

        {/* Embed Code */}
        <div className="space-y-2">
          <Label>Embed Code</Label>
          <div className="relative">
            <Textarea
              value={generatedEmbed.embedCode}
              readOnly
              rows={3}
              className="font-mono text-sm"
            />
            <Button
              size="sm"
              variant="outline"
              className="absolute top-2 right-2"
              onClick={() => navigator.clipboard.writeText(generatedEmbed.embedCode)}
            >
              <Code className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Metadata */}
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Brand Alignment:</span>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(generatedEmbed.metadata.brandAlignment || 0) * 100}%` }}
                  />
                </div>
                <span className="ml-2">{Math.round((generatedEmbed.metadata.brandAlignment || 0) * 100)}%</span>
              </div>
            </div>
            <div>
              <span className="font-medium">Customizations:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {generatedEmbed.metadata.customizations.map((custom, idx) => (
                  <span key={idx} className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                    {custom}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Enhanced Embed
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Enhanced Embed Asset</DialogTitle>
          <DialogDescription>
            Create powerful, AI-customized embeds that perfectly match your brand and convert visitors into customers.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">
                <MessageSquare className="h-4 w-4 mr-2" />
                Basic Setup
              </TabsTrigger>
              <TabsTrigger value="ai">
                <Sparkles className="h-4 w-4 mr-2" />
                AI Customization
              </TabsTrigger>
              <TabsTrigger value="preview">
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              {renderBasicConfiguration()}
            </TabsContent>

            <TabsContent value="ai">
              {renderAIConversation()}
            </TabsContent>

            <TabsContent value="preview">
              {renderPreview()}
            </TabsContent>
          </Tabs>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            
            <div className="flex space-x-2">
              {activeTab !== 'preview' && generatedEmbed && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('preview')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={!formData.name.trim() || isLoading}
              >
                {isLoading ? 'Creating...' : 'Create Asset'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}