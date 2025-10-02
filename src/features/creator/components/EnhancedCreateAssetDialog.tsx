'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Code, Copy, Eye, Loader2, MessageSquare, Plus, Send, Sparkles, X } from 'lucide-react';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { serializeForClient } from '@/utils/serialize-for-client';

import { processAIMessageAction } from '../actions/ai-actions';
import { type AICustomizationSession,AIEmbedCustomizerService } from '../services/ai-embed-customizer';
import { type EmbedGenerationOptions, EnhancedEmbedGeneratorService, type GeneratedEmbed } from '../services/enhanced-embed-generator';
import type { CreatorProduct, CreatorProfile } from '../types';
import type { CreateEmbedAssetRequest, EmbedAsset, EmbedAssetType } from '../types/embed-assets';

interface EnhancedCreateAssetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAsset: (asset: CreateEmbedAssetRequest, assetId?: string) => Promise<void>; // Modified to handle update
  isLoading: boolean;
  creatorProfile: CreatorProfile;
  products: CreatorProduct[];
  initialAsset?: EmbedAsset | null; // New prop for editing
}

export function EnhancedCreateAssetDialog({
  isOpen,
  onOpenChange,
  onCreateAsset,
  isLoading,
  creatorProfile,
  products,
  initialAsset = null // Default to null
}: EnhancedCreateAssetDialogProps) {
  // Form state
  const [formData, setFormData] = useState<CreateEmbedAssetRequest>(() => 
    initialAsset ? {
      name: initialAsset.name,
      description: initialAsset.description || '',
      asset_type: initialAsset.asset_type,
      embed_config: initialAsset.embed_config,
      tags: initialAsset.tags || [],
      is_public: initialAsset.is_public || false,
      featured: initialAsset.featured || false
    } : {
      name: '',
      description: '',
      asset_type: 'product_card',
      embed_config: {
        accentColor: creatorProfile.brand_color || '#ea580c', // Default to creator's brand color
      },
      tags: [],
      is_public: false,
      featured: false
    }
  );

  // AI conversation state
  const [aiSession, setAiSession] = useState<AICustomizationSession | null>(null);
  const [conversationInput, setConversationInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedEmbed, setGeneratedEmbed] = useState<GeneratedEmbed | null>(null);

  // UI state
  const [activeTab, setActiveTab] = useState<'basic' | 'ai' | 'preview'>('basic');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const resetForm = () => {
    setFormData(initialAsset ? {
      name: initialAsset.name,
      description: initialAsset.description || '',
      asset_type: initialAsset.asset_type,
      embed_config: initialAsset.embed_config,
      tags: initialAsset.tags || [],
      is_public: initialAsset.is_public || false,
      featured: initialAsset.featured || false
    } : {
      name: '',
      description: '',
      asset_type: 'product_card',
      embed_config: {
        accentColor: creatorProfile.brand_color || '#ea580c',
      },
      tags: [],
      is_public: false,
      featured: false
    });
    setAiSession(null);
    setGeneratedEmbed(null);
    setConversationInput('');
    setActiveTab('basic');
  };

  // Effect to reset form when dialog opens or initialAsset changes
  useEffect(() => {
    if (isOpen) {
      resetForm();
      // If editing an existing asset, try to generate its preview immediately
      if (initialAsset) {
        const initialOptions: EmbedGenerationOptions = {
          embedType: initialAsset.asset_type,
          creator: creatorProfile,
          product: products.find(p => p.id === initialAsset.embed_config.productId),
          customization: initialAsset.embed_config,
        };
        generateEmbed(initialOptions);
      }
    }
  }, [isOpen, initialAsset, creatorProfile, products]); // eslint-disable-line react-hooks/exhaustive-deps

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
      creator: serializeForClient(creatorProfile), // Serialize creatorProfile
      product: serializeForClient(products.find(p => p.id === formData.embed_config.productId)), // Serialize product
      customization: serializeForClient(formData.embed_config), // Serialize embed_config
    };

    setIsGenerating(true);
    try {
      const session = await AIEmbedCustomizerService.startSession(
        creatorProfile.id,
        formData.asset_type as any,
        initialOptions
      );
      setAiSession(session);
      setActiveTab('ai');
      await generateEmbed(session.currentOptions);
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to start AI session.' });
      console.error('Error starting AI session:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const sendAIMessage = async () => {
    if (!conversationInput.trim() || !aiSession) return;

    const currentInput = conversationInput;
    setConversationInput('');
    setIsGenerating(true);

    // Add user message to chat
    setChatMessages(prev => ({
      ...prev,
      [aiSession.id]: [
        ...(prev[aiSession.id] || []),
        { role: 'user', content: currentInput }
      ]
    }));

    try {
      // Call the server action to process the AI message
      const result = await processAIMessageAction(
        aiSession.id,
        currentInput
      );

      const updatedSession = await AIEmbedCustomizerService.getSession(aiSession.id);
      setAiSession(updatedSession);
      
      if (result.requiresRegeneration) {
        await generateEmbed(result.updatedOptions);
      }
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to get AI response.' });
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
          generatedHtml: embed.html, // Store generated HTML
          generatedCss: embed.css,   // Store generated CSS
          embedCode: embed.embedCode, // Store generated embed code
          brandAlignment: embed.metadata.brandAlignment,
          aiSession: aiSession ? {
            sessionId: aiSession.id,
            customizations: embed.metadata.customizations
          } : undefined
        }
      }));
    } catch (error) {
      console.error('Error generating embed:', error);
      toast({ variant: 'destructive', description: 'Failed to generate embed preview.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({ variant: 'destructive', description: 'Asset Name is required.' });
      return;
    }
    // Allow saving without AI generation for basic embeds
    // AI is optional - users can use manual configuration

    try {
      // Ensure embed_config has generated HTML/CSS/Code if AI was used
      const finalEmbedConfig = {
        ...formData.embed_config,
        generatedHtml: generatedEmbed?.html || formData.embed_config.generatedHtml,
        generatedCss: generatedEmbed?.css || formData.embed_config.generatedCss,
        embedCode: generatedEmbed?.embedCode || formData.embed_config.embedCode,
      };
      
      await onCreateAsset({
        ...formData,
        embed_config: finalEmbedConfig
      }, initialAsset?.id); // Pass assetId for update

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating/updating asset:', error);
      toast({ variant: 'destructive', description: `Failed to ${initialAsset ? 'update' : 'create'} asset. Please try again.` });
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
    { value: 'trial_embed', label: '⏳ Trial Embed', description: 'Embed for free trial offers' },
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
              placeholder="Describe what this asset is for..."
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assetType">Embed Type *</Label>
            <Select
              value={formData.asset_type}
              onValueChange={(value) => handleBasicFieldChange('asset_type', value as EmbedAssetType)}
              disabled={!!initialAsset} // Disable changing type when editing
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
              <h4 className="font-medium text-gray-900">✨ Optional: AI-powered customization</h4>
              <p className="text-sm text-gray-600 mt-1">
                Let AI help you create the perfect embed using your site's design tokens, colors, fonts, and tone.
              </p>
            </div>
            <Button onClick={startAISession} variant="outline" size="sm" disabled={isGenerating}>
              {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
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
          <Button onClick={startAISession} className="mt-4" disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
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
                
                {/* Design Insight */}
                {message.metadata?.designInsight && message.role === 'assistant' && (
                  <div className="mt-3 p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                    <div className="text-sm text-purple-800 font-medium">
                      {message.metadata.designInsight}
                    </div>
                  </div>
                )}
                
                {/* Suggestions */}
                {message.metadata?.suggestions && message.role === 'assistant' && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.metadata.suggestions.slice(0, 3).map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setConversationInput(suggestion)}
                        className="text-xs px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-all duration-200 border border-blue-200 hover:border-blue-300"
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
    const embedHtml = generatedEmbed?.html || initialAsset?.embed_config.generatedHtml;
    const embedCss = generatedEmbed?.css || initialAsset?.embed_config.generatedCss;
    const embedCode = generatedEmbed?.embedCode || initialAsset?.embed_config.embedCode;
    const brandAlignment = generatedEmbed?.metadata.brandAlignment || initialAsset?.embed_config.brandAlignment || 0;
    const customizations = generatedEmbed?.metadata.customizations || initialAsset?.embed_config.aiSession?.customizations || [];

    if (!embedHtml) {
      return (
        <div className="text-center py-8">
          <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">Generate an embed to see the preview</p>
          <Button onClick={() => setActiveTab('ai')} className="mt-4" disabled={isGenerating}>
            <Sparkles className="h-4 w-4 mr-2" />
            Start AI Customization
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Preview */}
        <div className="border rounded-lg p-4 bg-white">
          <div
            dangerouslySetInnerHTML={{ __html: embedHtml }}
            className="embed-preview"
          />
          <style dangerouslySetInnerHTML={{ __html: embedCss || '' }} /> {/* Ensure embedCss is a string */}
        </div>

        {/* Embed Code */}
        {embedCode && (
          <div className="space-y-2">
            <Label>Embed Code</Label>
            <div className="relative">
              <Textarea
                value={embedCode}
                readOnly
                rows={3}
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2"
                onClick={() => navigator.clipboard.writeText(embedCode)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="bg-gray-50 p-3 rounded-lg text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Brand Alignment:</span>
              <div className="flex items-center mt-1">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${(brandAlignment || 0) * 100}%` }}
                  />
                </div>
                <span className="ml-2">{Math.round((brandAlignment || 0) * 100)}%</span>
              </div>
            </div>
            <div>
              <span className="font-medium">Customizations:</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {customizations.map((custom, idx) => (
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialAsset ? 'Edit Embed Asset' : 'Create New Embed Asset'}</DialogTitle>
          <DialogDescription>
            {initialAsset ? 'Modify the details and configuration of your embed asset.' : 'Create powerful, AI-customized embeds that perfectly match your brand and convert visitors into customers.'}
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
              disabled={isLoading}
            >
              Cancel
            </Button>
            
            <div className="flex space-x-2">
              {activeTab !== 'preview' && (generatedEmbed || initialAsset) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setActiveTab('preview')}
                  disabled={isGenerating}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
              )}
              
              <Button
                type="submit"
                disabled={!formData.name.trim() || isLoading || isGenerating}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  initialAsset ? 'Save Changes' : 'Create Asset'
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}