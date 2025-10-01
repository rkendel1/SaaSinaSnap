import OpenAI from 'openai';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { Json, Tables } from '@/libs/supabase/types'; // Import Tables type
import { serializeForClient } from '@/utils/serialize-for-client';

import type { CreatorProfile } from '../types';

import { EmbedGenerationOptions,EnhancedEmbedType } from './enhanced-embed-generator';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    entities?: Record<string, any>;
    suggestions?: string[];
    designInsight?: string;
    configChanges?: string[];
  };
}

export interface AICustomizationSession {
  id: string;
  creatorId: string;
  embedType: EnhancedEmbedType;
  messages: ConversationMessage[];
  currentOptions: EmbedGenerationOptions;
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  updatedAt: Date;
}

export class AIEmbedCustomizerService {
  static async startSession(
    creatorId: string,
    embedType: EnhancedEmbedType,
    initialOptions: EmbedGenerationOptions
  ): Promise<AICustomizationSession> {
    const initialMessage: ConversationMessage = {
      id: `msg_${Date.now() + 1}`,
      role: 'assistant',
      content: this.generateWelcomeMessage(embedType, initialOptions.creator),
      timestamp: new Date(),
      metadata: {
        suggestions: [
          `Make this more premium for ${initialOptions.creator.business_name || 'my business'}`,
          "Optimize the colors to match my brand",
          "Improve the layout for better engagement"
        ],
        designInsight: "💡 Start with high-impact changes like color and layout to establish your brand foundation"
      }
    };

    const supabaseAdmin = await createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('ai_customization_sessions')
      .insert({
        creator_id: creatorId,
        embed_type: embedType,
        messages: serializeForClient([initialMessage]) as unknown as Json,
        current_options: serializeForClient(initialOptions) as unknown as Json,
        status: 'active',
      })
      .select()
      .single();

    if (error) {
      console.error('Error starting AI session in DB:', error);
      throw new Error('Failed to start AI session.');
    }

    const sessionData = data as Tables<'ai_customization_sessions'>; // Explicitly cast

    const session: AICustomizationSession = {
      id: sessionData.id,
      creatorId: sessionData.creator_id,
      embedType: sessionData.embed_type as EnhancedEmbedType,
      messages: sessionData.messages as unknown as ConversationMessage[],
      currentOptions: sessionData.current_options as unknown as EmbedGenerationOptions,
      status: sessionData.status as 'active' | 'completed' | 'paused',
      createdAt: new Date(sessionData.created_at),
      updatedAt: new Date(sessionData.updated_at)
    };

    return session;
  }

  static async processMessage(
    openaiClient: OpenAI,
    sessionId: string,
    userMessage: string
  ): Promise<{ 
    response: ConversationMessage; 
    updatedOptions: EmbedGenerationOptions;
    requiresRegeneration: boolean;
  }> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found');

    const userMsg: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    session.messages.push(userMsg);

    const systemPrompt = this.createSystemPrompt(session.currentOptions);
    
    try {
      const completion = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...session.messages.map(m => ({ role: m.role, content: m.content }))
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000
      });

      const aiResponseContent = completion.choices[0].message?.content;
      if (!aiResponseContent) throw new Error("AI returned an empty response.");

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiResponseContent);
      } catch (error) {
        console.error('Failed to parse AI response:', aiResponseContent);
        throw new Error("AI returned an invalid JSON response.");
      }

      const { updatedConfig, explanation, designInsight, nextSteps } = parsedResponse;
      
      if (!updatedConfig || !explanation) {
        throw new Error("AI response missing required fields (updatedConfig, explanation).");
      }

      const updatedOptions: EmbedGenerationOptions = {
        ...session.currentOptions,
        customization: {
          ...session.currentOptions.customization,
          ...updatedConfig
        }
      };
      session.currentOptions = updatedOptions;

      const response: ConversationMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: explanation,
        timestamp: new Date(),
        metadata: {
          designInsight,
          suggestions: nextSteps || [
            "Try a different color scheme", 
            "Adjust the layout spacing", 
            "Modify the text tone"
          ],
          intent: this.extractIntent(userMessage),
          configChanges: Object.keys(updatedConfig)
        }
      };
    } catch (error) {
      console.error('Error in AI message processing:', error);
      
      // Provide helpful error response
      const errorResponse: ConversationMessage = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: error instanceof Error && error.message.includes('AI service') 
          ? error.message + ' In the meantime, I can help you with manual customizations.'
          : 'I apologize, but I encountered a technical issue. Let me try to help you manually. What specific changes would you like to make?',
        timestamp: new Date(),
        metadata: {
          suggestions: [
            "Change the primary color",
            "Adjust the text size",
            "Modify the layout padding"
          ],
          intent: 'error_recovery'
        }
      };
      
      session.messages.push(errorResponse);
      
      // Still update the session in the database
      await this.updateSessionInDatabase(sessionId, session);
      
      return {
        response: errorResponse,
        updatedOptions: session.currentOptions,
        requiresRegeneration: false
      };
    }
    session.messages.push(response);

    // Update session in DB
    await this.updateSessionInDatabase(sessionId, session);

    return {
      response,
      updatedOptions,
      requiresRegeneration: true
    };
  }

  private static async updateSessionInDatabase(sessionId: string, session: AICustomizationSession): Promise<void> {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from('ai_customization_sessions')
      .update({
        messages: serializeForClient(session.messages) as unknown as Json,
        current_options: serializeForClient(session.currentOptions) as unknown as Json,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating AI session in DB:', error);
      throw new Error('Failed to update AI session.');
    }
  }

  private static createSystemPrompt(options: EmbedGenerationOptions): string {
    const { creator, embedType, product } = options;
    const brandingData = creator.extracted_branding_data;

    return `
You are a Master Brand Design Expert and UX Specialist with 15+ years of experience creating high-converting, brand-aligned digital experiences. You excel at translating brand identity into visual design and understanding user psychology. Your expertise includes:

- Advanced color theory and brand psychology
- Typography and visual hierarchy best practices  
- Conversion-optimized UI/UX design
- Brand consistency across touchpoints
- User behavior analysis and optimization

**CREATOR'S COMPLETE BRAND PROFILE:**

**Core Business Identity:**
- Business Name: ${creator.business_name || 'Not specified'}
- Industry/Niche: ${creator.business_description || 'Not provided'}  
- Target Audience: ${creator.business_description || 'General audience'}
- Business Focus: ${creator.business_description || 'Not specified'}
- Page Slug: ${creator.custom_domain}

**Visual Brand Foundation:**
- Primary Brand Color: ${creator.brand_color || '#3b82f6'}
- Brand Gradient: ${JSON.stringify(creator.brand_gradient) || 'Single color approach'}
- Brand Pattern: ${JSON.stringify(creator.brand_pattern) || 'Minimalist style'}

**Advanced Branding Intelligence (Extracted from Creator's Website):**
- Color Palette: Primary [${brandingData?.primaryColors?.join(', ') || 'Standard blue palette'}] | Secondary [${brandingData?.secondaryColors?.join(', ') || 'Neutral grays'}]
- Typography System: ${JSON.stringify(brandingData?.fonts) || 'System fonts'}
- Brand Voice & Tone: ${JSON.stringify(brandingData?.voiceAndTone) || '{ "tone": "professional", "voice": "friendly" }'}
- Design Language: ${JSON.stringify(brandingData?.designTokens) || '{ "borderRadius": "8px", "shadows": "subtle" }'}
- Layout Preferences: ${JSON.stringify(brandingData?.layoutPatterns) || '{ "style": "clean", "spacing": "generous" }'}

${product ? `**Product Context:**
- Product Name: ${product.name}
- Description: ${product.description || 'Premium offering'}
- Price: ${product.price ? `$${product.price}` : 'Custom pricing'}
- Type: ${product.product_type || 'Digital product'}` : ''}

**CURRENT CONFIGURATION STATE:**
${JSON.stringify(options.customization, null, 2)}

**CONVERSATION CONTEXT:** 
You have access to the complete conversation history. Use it to understand the user's evolving vision and maintain design consistency across all interactions.

Remember: You're not just making requested changes - you're applying your expertise to elevate their brand and optimize for success. Every suggestion should demonstrate professional design thinking and strategic brand building.

Now, analyze the user's latest message and provide your expert response.`;
  }

  private static generateWelcomeMessage(embedType: EnhancedEmbedType, creator: CreatorProfile): string {
    const embedName = embedType.replace(/_/g, ' ');
    const businessName = creator.business_name || 'your business';
    
    return `👋 Hello! I'm your personal Brand Design Expert, specializing in creating high-converting, brand-aligned digital experiences.

I'm here to help you craft the perfect ${embedName} for ${businessName}. With 15+ years of design expertise, I'll ensure every element reflects your brand identity and optimizes for user engagement.

**What I can help you with:**
🎨 Brand-aligned color schemes and visual design
📝 Compelling copy that converts
🎯 Layout optimization for better user experience  
💡 Strategic design insights and best practices

**Quick start suggestions:**
• "Make this more premium and sophisticated"
• "Optimize the colors for my ${creator.business_description || 'business'}"  
• "Improve the layout for better conversion"
• "Match the tone to my brand voice"

What aspect would you like to enhance first? I'll apply my design expertise to elevate your brand! ✨`;
  }

  private static extractIntent(userMessage: string): string {
    const message = userMessage.toLowerCase();
    if (message.includes('color') || message.includes('colour')) return 'color_adjustment';
    if (message.includes('layout') || message.includes('spacing') || message.includes('size')) return 'layout_modification';
    if (message.includes('text') || message.includes('copy') || message.includes('content')) return 'content_update';
    if (message.includes('font') || message.includes('typography')) return 'typography_change';
    if (message.includes('tone') || message.includes('voice') || message.includes('style')) return 'tone_adjustment';
    if (message.includes('professional') || message.includes('business')) return 'professionalization';
    if (message.includes('modern') || message.includes('contemporary')) return 'modernization';
    if (message.includes('premium') || message.includes('luxury')) return 'premium_styling';
    return 'general_customization';
  }

  static async getSession(sessionId: string): Promise<AICustomizationSession | null> {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('ai_customization_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      console.error('Error fetching AI session from DB:', error);
      throw new Error('Failed to retrieve AI session.');
    }

    if (!data) return null;

    const sessionData = data as Tables<'ai_customization_sessions'>; // Explicitly cast

    return {
      id: sessionData.id,
      creatorId: sessionData.creator_id,
      embedType: sessionData.embed_type as EnhancedEmbedType,
      messages: sessionData.messages as unknown as ConversationMessage[],
      currentOptions: sessionData.current_options as unknown as EmbedGenerationOptions,
      status: sessionData.status as 'active' | 'completed' | 'paused',
      createdAt: new Date(sessionData.created_at),
      updatedAt: new Date(sessionData.updated_at)
    };
  }

  // New function to get session by creator ID and embed type
  static async getSessionByCreatorAndType(creatorId: string, embedType: EnhancedEmbedType): Promise<AICustomizationSession | null> {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('ai_customization_sessions')
      .select('*')
      .eq('creator_id', creatorId)
      .eq('embed_type', embedType)
      .eq('status', 'active') // Only consider active sessions
      .order('updated_at', { ascending: false }) // Get the most recent active session
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      console.error('Error fetching AI session by creator and type from DB:', error);
      throw new Error('Failed to retrieve AI session.');
    }

    if (!data) return null;

    const sessionData = data as Tables<'ai_customization_sessions'>;

    return {
      id: sessionData.id,
      creatorId: sessionData.creator_id,
      embedType: sessionData.embed_type as EnhancedEmbedType,
      messages: sessionData.messages as unknown as ConversationMessage[],
      currentOptions: sessionData.current_options as unknown as EmbedGenerationOptions,
      status: sessionData.status as 'active' | 'completed' | 'paused',
      createdAt: new Date(sessionData.created_at),
      updatedAt: new Date(sessionData.updated_at)
    };
  }

  static async getCreatorSessions(creatorId: string): Promise<AICustomizationSession[]> {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('ai_customization_sessions')
      .select('*')
      .eq('creator_id', creatorId)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching creator AI sessions from DB:', error);
      throw new Error('Failed to retrieve creator AI sessions.');
    }

    return (data || []).map(d => {
      const sessionData = d as Tables<'ai_customization_sessions'>; // Explicitly cast
      return {
        id: sessionData.id,
        creatorId: sessionData.creator_id,
        embedType: sessionData.embed_type as EnhancedEmbedType,
        messages: sessionData.messages as unknown as ConversationMessage[],
        currentOptions: sessionData.current_options as unknown as EmbedGenerationOptions,
        status: sessionData.status as 'active' | 'completed' | 'paused',
        createdAt: new Date(sessionData.created_at),
        updatedAt: new Date(sessionData.updated_at)
      };
    });
  }

  static async completeSession(sessionId: string): Promise<void> {
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from('ai_customization_sessions')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', sessionId);

    if (error) {
      console.error('Error completing AI session in DB:', error);
      throw new Error('Failed to complete AI session.');
    }
  }
}