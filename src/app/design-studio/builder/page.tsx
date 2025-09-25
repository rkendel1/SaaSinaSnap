'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Wand2, Copy, Send, Loader2, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { createEmbedAssetAction, updateEmbedAssetAction } from '@/features/creator/actions/embed-asset-actions';
import { AIEmbedCustomizerService, type AICustomizationSession, type ConversationMessage } from '@/features/creator/services/ai-embed-customizer';
import { EnhancedEmbedGeneratorService, type EmbedGenerationOptions, type GeneratedEmbed } from '@/features/creator/services/enhanced-embed-generator';
import type { CreatorProduct, CreatorProfile } from '@/features/creator/types';
import { CreateEmbedAssetRequest, EmbedAssetConfig, EmbedAssetType } from '@/features/creator/types/embed-assets';

// Mock data for demonstration
const mockProducts: CreatorProduct[] = [
  { id: '1', name: 'Premium Course', price: 99.99, currency: 'USD', product_type: 'one_time' } as CreatorProduct,
  { id: '2', name: 'Monthly Subscription', price: 29.99, currency: 'USD', product_type: 'subscription' } as CreatorProduct,
];

const mockCreatorProfile: CreatorProfile = {
  id: 'creator-1',
  business_name: 'Demo Creator',
  brand_color: '#3b82f6',
} as CreatorProfile;

const embedTypes: { value: EmbedAssetType; label: string }[] = [
  { value: 'product_card', label: 'Product Card' },
  { value: 'checkout_button', label: 'Checkout Button' },
  { value: 'pricing_table', label: 'Pricing Table' },
  { value: 'header', label: 'Header' },
  { value: 'hero_section', label: 'Hero Section' },
  { value: 'testimonial_section', label: 'Testimonials' },
];

export default function EmbedBuilderPage() {
  const [embedName, setEmbedName] = useState('');
  const [embedDescription, setEmbedDescription] = useState('');
  const [selectedEmbedType, setSelectedEmbedType] = useState<EmbedAssetType>('product_card');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  const [aiSession, setAiSession] = useState<AICustomizationSession | null>(null);
  const [conversationInput, setConversationInput] = useState('');
  const [generatedEmbed, setGeneratedEmbed] = useState<GeneratedEmbed | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const generateEmbed = async (options: EmbedGenerationOptions) => {
    setIsGenerating(true);
    try {
      const embed = await EnhancedEmbedGeneratorService.generateEmbed(options);
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
    };
    const session = AIEmbedCustomizerService.startSession(mockCreatorProfile.id, selectedEmbedType, initialOptions);
    setAiSession(session);
    await generateEmbed(session.currentOptions);
  };

  const sendAIMessage = async () => {
    if (!conversationInput.trim() || !aiSession) return;
    const currentInput = conversationInput;
    setConversationInput('');
    setIsGenerating(true);

    try {
      const result = await AIEmbedCustomizerService.processMessage(aiSession.id, currentInput);
      setAiSession(AIEmbedCustomizerService.getSession(aiSession.id));
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
    if (!embedName.trim() || !generatedEmbed) {
      toast({ variant: 'destructive', description: 'Please provide a name and generate an embed before saving.' });
      return;
    }
    setIsGenerating(true);
    try {
      const assetToCreate: CreateEmbedAssetRequest = {
        name: embedName,
        description: embedDescription,
        asset_type: selectedEmbedType,
        embed_config: aiSession?.currentOptions.customization || {},
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
              <Link href="/design-studio"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Embed Builder</h1>
                <p className="text-sm text-gray-600">Create and customize your embed with AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={saveEmbed} disabled={isGenerating || !generatedEmbed}>
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
                <Input id="embed-name" value={embedName} onChange={(e) => setEmbedName(e.target.value)} placeholder="Embed Name" />
                <Select value={selectedEmbedType} onValueChange={(v) => setSelectedEmbedType(v as EmbedAssetType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{embedTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
                {(selectedEmbedType === 'product_card' || selectedEmbedType === 'checkout_button') && (
                  <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                    <SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger>
                    <SelectContent>{mockProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
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