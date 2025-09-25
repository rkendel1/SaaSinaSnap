import OpenAI from 'openai';

import type { EmbedGenerationOptions, EnhancedEmbedType } from './enhanced-embed-generator';
import type { CreatorProfile } from '../types';

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
  private static sessions: Map<string, AICustomizationSession> = new Map();
  private static openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  static startSession(
    creatorId: string,
    embedType: EnhancedEmbedType,
    initialOptions: EmbedGenerationOptions
  ): AICustomizationSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const session: AICustomizationSession = {
      id: sessionId,
      creatorId,
      embedType,
      messages: [
        {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: this.generateWelcomeMessage(embedType, initialOptions.creator),
          timestamp: new Date(),
          metadata: {
            suggestions: ["Make the corners more rounded", "Use my brand's primary color", "Change the title text"]
          }
        }
      ],
      currentOptions: initialOptions,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  static async processMessage(
    sessionId: string,
    userMessage: string
  ): Promise<{ 
    response: ConversationMessage; 
    updatedOptions: EmbedGenerationOptions;
    requiresRegeneration: boolean;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const userMsg: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    session.messages.push(userMsg);

    const systemPrompt = this.createSystemPrompt(session.currentOptions);
    
    const completion = await this.openai.chat.completions.create({
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

    session.updatedAt = new Date();
    this.sessions.set(sessionId, session);

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
    // Use specific keys for content, styling, and layout.
    // Example for a page:
    // "content": { "heroTitle": "New Welcome Title", "heroSubtitle": "Updated description" },
    // "styling": { "primaryColor": "#ff0000", "borderRadius": "10px" },
    // "layout": { "width": "800px", "padding": "40px" },
    // "voiceAndTone": { "tone": "professional", "voice": "formal" }
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

  static getSession(sessionId: string): AICustomizationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  static getCreatorSessions(creatorId: string): AICustomizationSession[] {
    return Array.from(this.sessions.values()).filter(session => session.creatorId === creatorId);
  }

  static completeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      this.sessions.set(sessionId, session);
    }
  }
}