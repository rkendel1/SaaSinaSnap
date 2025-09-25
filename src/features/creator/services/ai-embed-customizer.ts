import type { CreatorProfile } from '../types';
import { EnhancedEmbedType, EmbedGenerationOptions } from './enhanced-embed-generator';
import OpenAI from 'openai';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { Json, Tables } from '@/libs/supabase/types'; // Import Tables type

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    intent?: string;
    entities?: Record<string, any>;
    suggestions?: string[];
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
        suggestions: ["Make the corners more rounded", "Use my brand's primary color", "Change the title text"]
      }
    };

    const supabaseAdmin = await createSupabaseAdminClient();
    const { data, error } = await supabaseAdmin
      .from('ai_customization_sessions')
      .insert({
        creator_id: creatorId,
        embed_type: embedType,
        messages: [initialMessage] as unknown as Json,
        current_options: initialOptions as unknown as Json,
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
    
    const completion = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        ...session.messages.map(m => ({ role: m.role, content: m.content }))
      ],
      response_format: { type: "json_object" },
    });

    const aiResponseContent = completion.choices[0].message?.content;
    if (!aiResponseContent) throw new Error("AI returned an empty response.");

    const parsedResponse = JSON.parse(aiResponseContent);
    const { updatedConfig, explanation } = parsedResponse;

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
        suggestions: ["Make it wider", "Change the font", "Undo that change"]
      }
    };
    session.messages.push(response);

    // Update session in DB
    const supabaseAdmin = await createSupabaseAdminClient();
    const { error } = await supabaseAdmin
      .from('ai_customization_sessions')
      .update({
        messages: session.messages as unknown as Json,
        current_options: session.currentOptions as unknown as Json,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) {
      console.error('Error updating AI session in DB:', error);
      throw new Error('Failed to update AI session.');
    }

    return {
      response,
      updatedOptions,
      requiresRegeneration: true
    };
  }

  private static createSystemPrompt(options: EmbedGenerationOptions): string {
    const { creator, embedType } = options;
    const brandingData = creator.extracted_branding_data;

    return `
You are an expert web designer specializing in creating beautiful, brand-aligned web pages and embeddable widgets. Your task is to act as a conversational assistant to help a user customize a web page or embed.

**Creator's Brand Identity (Primary Reference):**
- Business Name: ${creator.business_name || 'Not available'}
- Business Description: ${creator.business_description || 'Not available'}
- Primary Brand Color: ${creator.brand_color || '#3b82f6'}
- Brand Gradient: ${JSON.stringify(creator.brand_gradient) || 'Not available'}
- Brand Pattern: ${JSON.stringify(creator.brand_pattern) || 'Not available'}
- Page Slug: ${creator.page_slug}

**Extracted Website Branding Data (for deeper alignment):**
- Primary Colors: ${brandingData?.primaryColors?.join(', ') || 'Not available'}
- Secondary Colors: ${brandingData?.secondaryColors?.join(', ') || 'Not available'}
- Fonts: ${JSON.stringify(brandingData?.fonts) || 'Not available'}
- Voice & Tone: ${JSON.stringify(brandingData?.voiceAndTone) || 'Not available'}
- Design Tokens (e.g., borderRadius, shadows): ${JSON.stringify(brandingData?.designTokens) || 'Not available'}
- Layout Patterns: ${JSON.stringify(brandingData?.layoutPatterns) || 'Not available'}

**Your Task:**
1. Analyze the user's message in the context of the conversation history.
2. Determine the user's intent (e.g., change color, adjust layout, update text, change tone).
3. Generate a JSON object that reflects the *updated configuration properties* for the current page/embed.
4. Provide a brief, friendly explanation of the changes you made, referencing the brand identity where appropriate.
5. You MUST only respond with a valid JSON object with two keys: "updatedConfig" and "explanation".

**JSON Output Schema:**
\`\`\`json
{
  "updatedConfig": {
    // ONLY include the properties that you are changing based on the user's request.
    // These properties should directly match the EmbedAssetConfig interface.
    // Example for a page:
    // "title": "New Welcome Title",
    // "description": "Updated description",
    // "primaryColor": "#ff0000",
    // "borderRadius": "10px",
    // "width": "800px",
    // "padding": "40px",
    // "voiceAndTone": { "tone": "professional", "voice": "formal" },
    // "showLogo": true,
    // "navigationItems": [{ "label": "Home", "url": "/home" }]
  },
  "explanation": "A brief, friendly message explaining the changes you made."
}
\`\`\`

**Current Target:** ${embedType === 'custom' ? 'a custom embed' : `the ${embedType.replace(/_/g, ' ')} page/embed`}
**Current Configuration:**
${JSON.stringify(options.customization, null, 2)}

Now, analyze the latest user message and respond.
`;
  }

  private static generateWelcomeMessage(embedType: EnhancedEmbedType, creator: CreatorProfile): string {
    const embedName = embedType.replace(/_/g, ' ');
    return `Hi! I'm here to help you create the perfect ${embedName} for ${creator.business_name || 'your business'}. What would you like to customize first?`;
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