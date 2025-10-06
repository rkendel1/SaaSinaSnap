'use client';

import React, { useEffect, useRef,useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Code,Copy, Eye, Loader2, Save, Send, Sparkles, Wand2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import {
  generateEmbedAction,
  getAISessionAction,
  processAIMessageAction,
  startAISessionAction,
} from '@/features/creator/actions/ai-actions';
import { createEmbedAssetAction } from '@/features/creator/actions/embed-asset-actions';
import { EnhancedCreateAssetDialog } from '@/features/creator/components/EnhancedCreateAssetDialog';
import { type AICustomizationSession } from '@/features/creator/services/ai-embed-customizer';
import { type EmbedGenerationOptions, type GeneratedEmbed } from '@/features/creator/services/enhanced-embed-generator';
import type { CreatorProduct, CreatorProfile } from '@/features/creator/types';
import { CreateEmbedAssetRequest, EmbedAssetType } from '@/features/creator/types/embed-assets';
import { serializeForClient } from '@/utils/serialize-for-client';

interface EmbedBuilderClientProps {
  creatorProfile: CreatorProfile;
  products: CreatorProduct[];
}

const embedTypes: { value: EmbedAssetType; label: string }[] = [
  { value: 'product_card', label: 'Product Card' },
  { value: 'checkout_button', label: 'Checkout Button' },
  { value: 'pricing_table', label: 'Pricing Table' },
  { value: 'header', label: 'Header' },
  { value: 'hero_section', label: 'Hero Section' },
  { value: 'testimonial_section', label: 'Testimonials' },
];

export function EmbedBuilderClient({ creatorProfile, products }: EmbedBuilderClientProps) {
  const [embedName, setEmbedName] = useState('');
  const [embedDescription, setEmbedDescription] = useState('');
  const [selectedEmbedType, setSelectedEmbedType] = useState<EmbedAssetType>('product_card');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  
  const [aiSession, setAiSession] = useState<AICustomizationSession | null>(null);
  const [conversationInput, setConversationInput] = useState('');
  const [generatedEmbed, setGeneratedEmbed] = useState<GeneratedEmbed | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);

  const generateEmbedPreview = async (options: EmbedGenerationOptions) => {
    setIsGenerating(true);
    try {
      const embed = await generateEmbedAction(options);
      setGeneratedEmbed(embed);
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to generate preview.' });
      console.error('Error generating embed preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const startAISession = async () => {
    // Validate that we have a product selected if the embed type requires it
    const requiresProduct = ['product_card', 'checkout_button', 'pricing_table'].includes(selectedEmbedType);
    if (requiresProduct && !selectedProductId) {
      toast({ 
        variant: 'destructive', 
        description: 'Please select a product for this embed type.' 
      });
      return;
    }

    const selectedProduct = products.find(p => p.id === selectedProductId);
    
    const initialOptions: EmbedGenerationOptions = {
      embedType: selectedEmbedType,
      creator: serializeForClient(creatorProfile), // Serialize creatorProfile
      product: selectedProduct ? serializeForClient(selectedProduct) : undefined, // Serialize product only if exists
      customization: {
        accentColor: creatorProfile.brand_color || '#ea580c',
      }
    };
    setIsGenerating(true);
    try {
      const session = await startAISessionAction(creatorProfile.id, selectedEmbedType, initialOptions);
      setAiSession(session);
      await generateEmbedPreview(session.currentOptions);
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

    try {
      const result = await processAIMessageAction(aiSession.id, currentInput);
      const updatedSession = await getAISessionAction(aiSession.id);
      setAiSession(updatedSession);
      if (result.requiresRegeneration) {
        await generateEmbedPreview(result.updatedOptions);
      }
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to get AI response.' });
      console.error('Error processing AI message:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAsset = async (assetData: CreateEmbedAssetRequest, assetId?: string) => {
    setIsSavingAsset(true);
    try {
      await createEmbedAssetAction(assetData);
      toast({ description: 'Embed asset saved successfully!' });
      setIsCreateEditDialogOpen(false);
      // Reset builder state after successful save
      setEmbedName('');
      setEmbedDescription('');
      setSelectedEmbedType('product_card');
      setSelectedProductId('');
      setAiSession(null);
      setGeneratedEmbed(null);
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to save embed asset.' });
      console.error('Error saving embed asset:', error);
    } finally {
      setIsSavingAsset(false);
    }
  };

  const openSaveDialog = () => {
    if (!generatedEmbed) {
      toast({ variant: 'destructive', description: 'Please generate an embed before saving.' });
      return;
    }
    setIsCreateEditDialogOpen(true);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiSession?.messages]);

  // Set default product if available
  useEffect(() => {
    if (products.length > 0 && !selectedProductId) {
      setSelectedProductId(products[0].id);
    }
  }, [products, selectedProductId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/creator/design-studio"><Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4 mr-2" />Back</Button></Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Embed Builder</h1>
                <p className="text-sm text-gray-600">Create and customize your embed with AI</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={openSaveDialog} disabled={isGenerating || !generatedEmbed || isSavingAsset}>
                {isSavingAsset ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
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
                <Textarea id="embed-description" value={embedDescription} onChange={(e) => setEmbedDescription(e.target.value)} placeholder="Embed Description (optional)" rows={2} />
                <Select value={selectedEmbedType} onValueChange={(v) => setSelectedEmbedType(v as EmbedAssetType)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{embedTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
                {(selectedEmbedType === 'product_card' || selectedEmbedType === 'checkout_button') && (
                  <>
                    {products.length === 0 ? (
                      <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm text-yellow-800">
                        No products available. Please create a product first.
                      </div>
                    ) : (
                      <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                        <SelectTrigger><SelectValue placeholder="Choose a product" /></SelectTrigger>
                        <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Wand2 className="w-5 h-5" />AI Assistant</CardTitle></CardHeader>
              <CardContent>
                {!aiSession ? (
                  <Button className="w-full" variant="outline" onClick={startAISession} disabled={isGenerating || !embedName.trim()}><Sparkles className="w-4 h-4 mr-2" />Start AI Session</Button>
                ) : (
                  <div className="space-y-3">
                    <div className="h-48 overflow-y-auto space-y-3 p-2 bg-gray-50 rounded-md border">
                      {aiSession.messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white border'}`}>
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            
                            {/* Design Insight */}
                            {msg.metadata?.designInsight && msg.role === 'assistant' && (
                              <div className="mt-2 p-2 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded text-xs text-purple-800">
                                {msg.metadata.designInsight}
                              </div>
                            )}
                            
                            {/* Suggestions */}
                            {msg.metadata?.suggestions && msg.role === 'assistant' && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {msg.metadata.suggestions.slice(0, 3).map((suggestion, idx) => (
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
                      <div ref={messagesEndRef} />
                    </div>
                    <div className="flex gap-2">
                      <Input value={conversationInput} onChange={e => setConversationInput(e.target.value)} placeholder="e.g., 'Make it more premium'" onKeyPress={e => e.key === 'Enter' && sendAIMessage()} disabled={isGenerating} />
                      <Button onClick={sendAIMessage} disabled={!conversationInput.trim() || isGenerating}><Send className="w-4 h-4" /></Button>
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
                    {generatedEmbed?.embedCode ? (
                      <div>
                        <Label>Embed Script</Label>
                        <div className="relative">
                          <Textarea value={generatedEmbed.embedCode} readOnly rows={4} className="font-mono text-xs" />
                          <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => { navigator.clipboard.writeText(generatedEmbed.embedCode); toast({ description: 'Code copied!' }); }}>
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={() => { 
                              navigator.clipboard.writeText(generatedEmbed.embedCode); 
                              toast({ description: 'Code copied to clipboard!' }); 
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            <Copy className="w-4 h-4 mr-2" />
                            Copy Code
                          </Button>
                          <Button 
                            onClick={() => { 
                              // Use role-specific preview path based on creator profile
                              const isPlatformOwner = creatorProfile.stripe_account_id?.startsWith('platform_') ||
                                creatorProfile.custom_domain === 'platform';
                              const previewPath = isPlatformOwner
                                ? '/dashboard/embed-preview'
                                : '/creator/embed-preview';
                              window.open(`${previewPath}?code=${encodeURIComponent(generatedEmbed.embedCode)}`, '_blank'); 
                            }}
                            variant="default"
                            className="flex-1"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View in Preview Studio
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Code className="h-12 w-12 mx-auto mb-4 opacity-30" />
                        <p className="text-lg font-medium mb-2">No embed code generated yet</p>
                        <p className="text-sm">Generate an embed in the AI Customization tab first.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* EnhancedCreateAssetDialog for saving */}
      <EnhancedCreateAssetDialog
        isOpen={isCreateEditDialogOpen}
        onOpenChange={setIsCreateEditDialogOpen}
        onCreateAsset={handleSaveAsset}
        isLoading={isSavingAsset}
        creatorProfile={creatorProfile}
        products={products}
        initialAsset={generatedEmbed ? {
          id: '', // Will be generated by DB
          creator_id: creatorProfile.id,
          name: embedName,
          description: embedDescription,
          asset_type: selectedEmbedType,
          embed_config: aiSession?.currentOptions.customization || {},
          preview_url: null,
          active: true,
          is_public: false,
          featured: false,
          share_token: null,
          share_enabled: false,
          view_count: 0,
          usage_count: 0,
          tags: [],
          metadata: {
            generatedHtml: generatedEmbed.html,
            generatedCss: generatedEmbed.css,
            embedCode: generatedEmbed.embedCode,
            brandAlignment: generatedEmbed.metadata.brandAlignment,
            aiSession: aiSession ? {
              sessionId: aiSession.id,
              customizations: generatedEmbed.metadata.customizations
            } : undefined
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } : null}
      />
    </div>
  );
}