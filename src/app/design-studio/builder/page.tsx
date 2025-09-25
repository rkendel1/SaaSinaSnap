'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Wand2, BarChart3, Copy, Send, Loader2, MessageSquare, Settings, Layers, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { createEmbedAssetAction } from '@/features/creator/actions/embed-asset-actions';
import { AIEmbedCustomizerService, type AICustomizationSession, type ConversationMessage } from '@/features/creator/services/ai-embed-customizer';
import { EnhancedEmbedGeneratorService, type EmbedGenerationOptions, type GeneratedEmbed } from '@/features/creator/services/enhanced-embed-generator';
import type { CreatorProduct, CreatorProfile } from '@/features/creator/types';
import { CreateEmbedAssetRequest, EmbedAssetConfig, EmbedAssetType } from '@/features/creator/types/embed-assets';

// Mock data for demonstration
const mockProducts: CreatorProduct[] = [
  {
    id: '1',
    creator_id: 'creator-1',
    name: 'Premium Course',
    description: 'Advanced web development course',
    price: 99.99,
    currency: 'USD',
    product_type: 'one_time',
    stripe_product_id: 'prod_123',
    stripe_price_id: 'price_123',
    active: true,
    featured: true,
    metadata: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    image_url: null
  },
  {
    id: '2',
    creator_id: 'creator-1',
    name: 'Monthly Subscription',
    description: 'Access to all content',
    price: 29.99,
    currency: 'USD',
    product_type: 'subscription',
    stripe_product_id: 'prod_456',
    stripe_price_id: 'price_456',
    active: true,
    featured: false,
    metadata: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    image_url: null
  }
];

const mockCreatorProfile: CreatorProfile = {
  id: 'creator-1',
  business_name: 'Demo Creator',
  brand_color: '#3b82f6',
  business_description: 'A demo business for testing embeds',
  business_website: 'https://example.com',
  business_logo_url: null,
  stripe_account_id: 'acct_123',
  stripe_account_enabled: true,
  onboarding_completed: true,
  onboarding_step: 7,
  custom_domain: 'demo',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  stripe_access_token: 'sk_test_123',
  stripe_refresh_token: 'rk_test_123',
  branding_extracted_at: null,
  branding_extraction_error: null,
  branding_extraction_status: null,
  extracted_branding_data: null,
  billing_email: 'billing@example.com',
  billing_phone: '+15551234567',
  billing_address: {
    line1: '123 Demo Street',
    city: 'Demoville',
    state: 'CA',
    postal_code: '90210',
    country: 'US',
  },
};

const embedTypes: { value: EmbedAssetType; label: string; description: string }[] = [
  { value: 'product_card', label: 'Product Card', description: 'Full product showcase with image and features' },
  { value: 'checkout_button', label: 'Checkout Button', description: 'Simple purchase button' },
  { value: 'pricing_table', label: 'Pricing Table', description: 'Compare multiple products or plans' },
  { value: 'header', label: 'Header', description: 'Navigation header with branding' },
  { value: 'hero_section', label: 'Hero Section', description: 'Large hero banner with CTA' },
  { value: 'product_description', label: 'Product Description', description: 'Detailed product information' },
  { value: 'testimonial_section', label: 'Testimonials', description: 'Customer reviews and ratings' },
  { value: 'footer', label: 'Footer', description: 'Footer with links and branding' },
  { value: 'custom', label: 'Custom', description: 'Build your own embed' }
];

export default function EmbedBuilderPage() {
  const [embedName, setEmbedName] = useState('');
  const [embedDescription, setEmbedDescription] = useState('');
  const [selectedEmbedType, setSelectedEmbedType] = useState<EmbedAssetType>('product_card');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [embedConfig, setEmbedConfig] = useState<EmbedAssetConfig>({});
  
  const [aiSession, setAiSession] = useState<AICustomizationSession | null>(null);
  const [conversationInput, setConversationInput] = useState('');
  const [generatedEmbed, setGeneratedEmbed] = useState<GeneratedEmbed | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleConfigChange = (key: keyof EmbedAssetConfig, value: any) => {
    setEmbedConfig(prev => ({ ...prev, [key]: value }));
  };

  const generateEmbed = async (options: EmbedGenerationOptions) => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/enhanced-embeds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });
      if (!response.ok) throw new Error('Failed to generate embed');
      const { embed } = await response.json();
      setGeneratedEmbed(embed);
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to generate preview.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const startAISession = async () => {
    const initialOptions: EmbedGenerationOptions = {
      embedType: selectedEmbedType,
      creator: mockCreatorProfile,
      product: mockProducts.find(p => p.id === selectedProductId),
      customization: { 
        content: embedConfig.content, 
        layout: {
            width: embedConfig.width,
            height: embedConfig.height,
            padding: embedConfig.padding,
            borderRadius: embedConfig.borderRadius
        } 
    }
    };

    try {
      const response = await fetch('/api/ai-embed-customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'start_session', ...initialOptions }),
      });
      if (!response.ok) throw new Error('Failed to start AI session');
      const { session } = await response.json();
      setAiSession(session);
      await generateEmbed(session.currentOptions);
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to start AI session.' });
    }
  };

  const sendAIMessage = async () => {
    if (!conversationInput.trim() || !aiSession) return;
    const tempUserMessage: ConversationMessage = { id: `user-${Date.now()}`, role: 'user', content: conversationInput, timestamp: new Date() };
    setAiSession(prev => prev ? { ...prev, messages: [...prev.messages, tempUserMessage] } : null);
    const currentInput = conversationInput;
    setConversationInput('');
    setIsGenerating(true);

    try {
      const response = await fetch('/api/ai-embed-customization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_message', sessionId: aiSession.id, message: currentInput }),
      });
      if (!response.ok) throw new Error('Failed to process message');
      const { result } = await response.json();
      
      setAiSession(prev => {
        if (!prev) return null;
        const updatedMessages = [...prev.messages];
        updatedMessages[updatedMessages.length - 1] = result.response; // Replace temp message
        return { ...prev, messages: updatedMessages, currentOptions: result.updatedOptions };
      });

      if (result.requiresRegeneration) {
        await generateEmbed(result.updatedOptions);
      }
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to get AI response.' });
    } finally {
      setIsGenerating(false);
    }
  };

  const saveEmbed = async () => {
    if (!embedName.trim()) {
      toast({ variant: 'destructive', description: 'Please provide a name for your embed.' });
      return;
    }
    setIsGenerating(true);
    try {
      const assetToCreate: CreateEmbedAssetRequest = {
        name: embedName,
        description: embedDescription,
        asset_type: selectedEmbedType,
        embed_config: {
          ...embedConfig,
          generatedHtml: generatedEmbed?.html,
          generatedCss: generatedEmbed?.css,
          embedCode: generatedEmbed?.embedCode,
        },
        tags: [],
      };
      await createEmbedAssetAction(assetToCreate);
      toast({ description: 'Embed asset saved successfully!' });
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to save embed asset.' });
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiSession?.messages]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/design-studio">
                <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back to Studio</Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Embed Builder</h1>
                <p className="text-sm text-gray-600">Create and customize your embed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => generateEmbed({ 
                  embedType: selectedEmbedType, 
                  creator: mockCreatorProfile, 
                  product: mockProducts.find(p => p.id === selectedProductId), 
                  customization: { 
                    content: embedConfig.content, 
                    layout: {
                        width: embedConfig.width,
                        height: embedConfig.height,
                        padding: embedConfig.padding,
                        borderRadius: embedConfig.borderRadius
                    } 
                  } 
                })}>
                <Eye className="w-4 h-4 mr-2" />Preview
              </Button>
              <Button onClick={saveEmbed} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Embed
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="embed-name">Embed Name</Label>
                  <Input id="embed-name" value={embedName} onChange={(e) => setEmbedName(e.target.value)} placeholder="My awesome embed" />
                </div>
                <div>
                  <Label htmlFor="embed-description">Description</Label>
                  <Textarea id="embed-description" value={embedDescription} onChange={(e) => setEmbedDescription(e.target.value)} placeholder="Describe your embed..." rows={3} />
                </div>
                <div>
                  <Label>Embed Type</Label>
                  <Select value={selectedEmbedType} onValueChange={(v) => setSelectedEmbedType(v as EmbedAssetType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{embedTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                {(selectedEmbedType === 'product_card' || selectedEmbedType === 'checkout_button') && (
                  <div>
                    <Label>Product</Label>
                    <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                      <SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger>
                      <SelectContent>{mockProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5" />AI Assistant</CardTitle></CardHeader>
              <CardContent>
                {!aiSession ? (
                  <Button className="w-full" variant="outline" onClick={startAISession}><Sparkles className="w-4 h-4 mr-2" />Start AI Session</Button>
                ) : (
                  <div className="space-y-3">
                    <div className="h-48 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-md border">
                      {aiSession.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>{msg.content}</div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="flex gap-2">
                      <Input value={conversationInput} onChange={e => setConversationInput(e.target.value)} placeholder="e.g., 'Make it more professional'" onKeyPress={e => e.key === 'Enter' && sendAIMessage()} />
                      <Button onClick={sendAIMessage} disabled={isGenerating}><Send className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Tabs defaultValue="preview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="code">Get Code</TabsTrigger>
              </TabsList>
              <TabsContent value="preview">
                <Card>
                  <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center bg-white">
                      {isGenerating ? <Loader2 className="w-8 h-8 animate-spin text-gray-400" /> :
                       generatedEmbed ? <iframe srcDoc={`<html><head><style>${generatedEmbed.css}</style></head><body style="margin:0;padding:0;">${generatedEmbed.html}</body></html>`} title="Embed Preview" className="w-full h-full border-0" /> :
                       <div className="text-gray-500">Your preview will appear here</div>}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="code">
                <Card>
                  <CardHeader><CardTitle>Embed Code</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Embed Script</Label>
                      <div className="relative">
                        <Textarea value={generatedEmbed?.embedCode || ''} readOnly rows={4} className="font-mono text-xs" />
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => { navigator.clipboard.writeText(generatedEmbed?.embedCode || ''); toast({ description: 'Code copied!' }); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>HTML</Label>
                      <div className="relative">
                        <Textarea value={generatedEmbed?.html || ''} readOnly rows={6} className="font-mono text-xs" />
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => { navigator.clipboard.writeText(generatedEmbed?.html || ''); toast({ description: 'HTML copied!' }); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <Label>CSS</Label>
                      <div className="relative">
                        <Textarea value={generatedEmbed?.css || ''} readOnly rows={6} className="font-mono text-xs" />
                        <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => { navigator.clipboard.writeText(generatedEmbed?.css || ''); toast({ description: 'CSS copied!' }); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}