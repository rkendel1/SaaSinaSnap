import type { EmbedGenerationOptions, EnhancedEmbedType } from './enhanced-embed-generator';
import type { CreatorProfile, CreatorProduct } from '../types';

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

export interface AIAnalysisResult {
  intent: 'color_change' | 'layout_adjustment' | 'content_modification' | 'tone_adjustment' | 'feature_request' | 'general_inquiry';
  confidence: number;
  entities: {
    colors?: string[];
    dimensions?: { width?: string; height?: string; padding?: string };
    tone?: string;
    voice?: string;
    content?: { title?: string; description?: string; features?: string[] };
    embedType?: EnhancedEmbedType;
  };
  suggestions: string[];
  requiresRegeneration: boolean;
}

/**
 * AI-powered conversational embed customizer
 * Provides natural language interface for embed customization
 */
export class AIEmbedCustomizerService {
  private static sessions: Map<string, AICustomizationSession> = new Map();

  /**
   * Start a new AI customization session
   */
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
          id: `msg_${Date.now()}`,
          role: 'system',
          content: `Starting ${embedType} customization session. I'll help you customize your embed to match your brand and requirements.`,
          timestamp: new Date()
        },
        {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: this.generateWelcomeMessage(embedType, initialOptions.creator),
          timestamp: new Date(),
          metadata: {
            suggestions: [
              "Change the colors to match my brand",
              "Make it more professional",
              "Add custom content",
              "Adjust the size",
              "Make it more playful"
            ]
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

  /**
   * Process user message and update customization options
   */
  static async processMessage(
    sessionId: string,
    userMessage: string
  ): Promise<{ 
    response: ConversationMessage; 
    updatedOptions: EmbedGenerationOptions;
    requiresRegeneration: boolean;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Add user message to session
    const userMsg: ConversationMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    session.messages.push(userMsg);

    // Analyze user message
    const analysis = await this.analyzeUserMessage(userMessage, session.currentOptions);

    // Update options based on analysis
    const updatedOptions = this.applyAnalysisToOptions(session.currentOptions, analysis);
    session.currentOptions = updatedOptions;

    // Generate AI response
    const response = this.generateAIResponse(analysis, updatedOptions);
    session.messages.push(response);

    session.updatedAt = new Date();
    this.sessions.set(sessionId, session);

    return {
      response,
      updatedOptions,
      requiresRegeneration: analysis.requiresRegeneration
    };
  }

  /**
   * Get session by ID
   */
  static getSession(sessionId: string): AICustomizationSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get all sessions for a creator
   */
  static getCreatorSessions(creatorId: string): AICustomizationSession[] {
    return Array.from(this.sessions.values())
      .filter(session => session.creatorId === creatorId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  /**
   * Complete a session
   */
  static completeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.status = 'completed';
      session.updatedAt = new Date();
      this.sessions.set(sessionId, session);
    }
  }

  /**
   * Analyze user message to understand intent and extract entities
   */
  private static async analyzeUserMessage(
    message: string, 
    currentOptions: EmbedGenerationOptions
  ): Promise<AIAnalysisResult> {
    const messageLower = message.toLowerCase();
    
    // Color analysis
    const colorMatches = this.extractColors(message);
    const colorKeywords = ['color', 'blue', 'red', 'green', 'purple', 'orange', 'yellow', 'pink', 'black', 'white', 'gray'];
    const hasColorIntent = colorKeywords.some(keyword => messageLower.includes(keyword)) || colorMatches.length > 0;

    // Layout analysis
    const layoutKeywords = ['size', 'width', 'height', 'bigger', 'smaller', 'compact', 'large', 'wide', 'narrow', 'padding', 'margin'];
    const hasLayoutIntent = layoutKeywords.some(keyword => messageLower.includes(keyword));

    // Tone analysis
    const toneKeywords = {
      professional: ['professional', 'business', 'corporate', 'formal', 'serious'],
      casual: ['casual', 'relaxed', 'informal', 'laid-back'],
      playful: ['playful', 'fun', 'exciting', 'energetic', 'vibrant'],
      friendly: ['friendly', 'warm', 'welcoming', 'approachable'],
      authoritative: ['authoritative', 'confident', 'expert', 'trustworthy']
    };
    
    let detectedTone: string | undefined;
    let toneConfidence = 0;
    
    Object.entries(toneKeywords).forEach(([tone, keywords]) => {
      const matches = keywords.filter(keyword => messageLower.includes(keyword)).length;
      if (matches > toneConfidence) {
        detectedTone = tone;
        toneConfidence = matches;
      }
    });

    // Content analysis
    const contentKeywords = ['text', 'title', 'description', 'content', 'wording', 'copy'];
    const hasContentIntent = contentKeywords.some(keyword => messageLower.includes(keyword));

    // Feature requests
    const featureKeywords = ['add', 'include', 'show', 'display', 'feature'];
    const hasFeatureIntent = featureKeywords.some(keyword => messageLower.includes(keyword));

    // Determine primary intent
    let intent: AIAnalysisResult['intent'] = 'general_inquiry';
    let confidence = 0.3;

    if (hasColorIntent) {
      intent = 'color_change';
      confidence = 0.8;
    } else if (hasLayoutIntent) {
      intent = 'layout_adjustment';
      confidence = 0.7;
    } else if (detectedTone) {
      intent = 'tone_adjustment';
      confidence = 0.6;
    } else if (hasContentIntent) {
      intent = 'content_modification';
      confidence = 0.7;
    } else if (hasFeatureIntent) {
      intent = 'feature_request';
      confidence = 0.6;
    }

    // Extract dimensions
    const dimensions = this.extractDimensions(message);

    // Generate suggestions based on intent
    const suggestions = this.generateSuggestions(intent, currentOptions);

    return {
      intent,
      confidence,
      entities: {
        colors: colorMatches,
        dimensions,
        tone: detectedTone,
        voice: this.extractVoice(message),
        content: this.extractContent(message),
      },
      suggestions,
      requiresRegeneration: intent !== 'general_inquiry' && confidence > 0.5
    };
  }

  /**
   * Apply analysis results to customization options
   */
  private static applyAnalysisToOptions(
    currentOptions: EmbedGenerationOptions,
    analysis: AIAnalysisResult
  ): EmbedGenerationOptions {
    const updatedOptions = { ...currentOptions };
    updatedOptions.customization = { ...currentOptions.customization };

    // Apply color changes
    if (analysis.entities.colors && analysis.entities.colors.length > 0) {
      updatedOptions.customization.colors = analysis.entities.colors;
    }

    // Apply layout changes
    if (analysis.entities.dimensions) {
      updatedOptions.customization.layout = {
        ...updatedOptions.customization.layout,
        ...analysis.entities.dimensions
      };
    }

    // Apply tone changes
    if (analysis.entities.tone || analysis.entities.voice) {
      updatedOptions.customization.voiceAndTone = {
        tone: analysis.entities.tone || updatedOptions.customization.voiceAndTone?.tone || 'friendly',
        voice: analysis.entities.voice || updatedOptions.customization.voiceAndTone?.voice || 'conversational'
      };
    }

    // Apply content changes
    if (analysis.entities.content) {
      updatedOptions.customization.content = {
        ...updatedOptions.customization.content,
        ...analysis.entities.content
      };
    }

    return updatedOptions;
  }

  /**
   * Generate AI response based on analysis
   */
  private static generateAIResponse(
    analysis: AIAnalysisResult,
    updatedOptions: EmbedGenerationOptions
  ): ConversationMessage {
    let content = '';
    const suggestions: string[] = [];

    switch (analysis.intent) {
      case 'color_change':
        if (analysis.entities.colors && analysis.entities.colors.length > 0) {
          content = `Great! I've updated your embed to use ${analysis.entities.colors.join(', ')} as the primary color${analysis.entities.colors.length > 1 ? 's' : ''}. This will give your embed a fresh new look that better matches your brand.`;
          suggestions.push("Show me a preview", "Try a different shade", "What other colors would work?");
        } else {
          content = "I'd be happy to help you change the colors! What specific colors did you have in mind? You can mention color names like 'blue' or 'forest green', or provide hex codes like '#3b82f6'.";
          suggestions.push("Use my brand colors", "Try blue tones", "Make it more vibrant", "Use neutral colors");
        }
        break;

      case 'layout_adjustment':
        if (analysis.entities.dimensions) {
          const changes = Object.keys(analysis.entities.dimensions);
          content = `Perfect! I've adjusted the ${changes.join(' and ')} of your embed. The new layout should look much better and fit your needs.`;
          suggestions.push("Make it even bigger", "Try a compact version", "Adjust the padding", "Center align everything");
        } else {
          content = "I can help you adjust the size and layout! Would you like to make it bigger, smaller, more compact, or change specific dimensions like width or height?";
          suggestions.push("Make it wider", "Reduce the height", "More compact design", "Add more padding");
        }
        break;

      case 'tone_adjustment':
        if (analysis.entities.tone) {
          content = `Excellent! I've updated your embed to have a more ${analysis.entities.tone} tone. The text and styling will now better reflect this personality.`;
          suggestions.push("Preview the changes", "Try a different tone", "Add more personality", "Make it more engaging");
        } else {
          content = "I can help adjust the tone and personality of your embed! Would you like it to be more professional, casual, playful, or something else?";
          suggestions.push("More professional", "Casual and friendly", "Playful and fun", "Authoritative and confident");
        }
        break;

      case 'content_modification':
        content = "I can help you customize the text and content in your embed. What specific changes would you like to make to the title, description, or other text elements?";
        suggestions.push("Update the title", "Change the description", "Add more features", "Customize the call-to-action");
        break;

      case 'feature_request':
        content = "I'd love to help you add new features to your embed! What specific functionality or elements would you like to include?";
        suggestions.push("Add testimonials", "Include pricing", "Show product images", "Add social proof");
        break;

      default:
        content = "I'm here to help you customize your embed! You can ask me to change colors, adjust the layout, modify the tone, update content, or add new features. What would you like to work on?";
        suggestions.push(...analysis.suggestions);
    }

    return {
      id: `msg_${Date.now()}`,
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata: {
        intent: analysis.intent,
        suggestions
      }
    };
  }

  /**
   * Generate welcome message for new session
   */
  private static generateWelcomeMessage(embedType: EnhancedEmbedType, creator: CreatorProfile): string {
    const embedTypeNames: Record<EnhancedEmbedType, string> = {
      product_card: 'product card',
      checkout_button: 'checkout button',
      pricing_table: 'pricing table',
      header: 'header',
      hero_section: 'hero section',
      product_description: 'product description',
      testimonial_section: 'testimonial section',
      footer: 'footer',
      trial_embed: 'trial embed',
      custom: 'custom embed'
    };

    const embedName = embedTypeNames[embedType] || embedType;
    const businessName = creator.business_name || 'your business';

    return `Hi! I'm here to help you create the perfect ${embedName} for ${businessName}. I can help you:

• Change colors to match your brand
• Adjust the size and layout
• Modify the tone and personality
• Update text and content
• Add or remove features

What would you like to customize first?`;
  }

  /**
   * Helper methods for entity extraction
   */
  private static extractColors(text: string): string[] {
    const colors: string[] = [];
    
    // Extract hex colors
    const hexMatches = text.match(/#[0-9a-fA-F]{3,6}/g);
    if (hexMatches) {
      colors.push(...hexMatches);
    }

    // Extract named colors
    const namedColors = [
      'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'brown',
      'black', 'white', 'gray', 'grey', 'navy', 'teal', 'cyan', 'magenta',
      'lime', 'indigo', 'violet', 'crimson', 'azure', 'beige', 'coral'
    ];
    
    const textLower = text.toLowerCase();
    namedColors.forEach(color => {
      if (textLower.includes(color)) {
        colors.push(color);
      }
    });

    return [...new Set(colors)]; // Remove duplicates
  }

  private static extractDimensions(text: string): { width?: string; height?: string; padding?: string } | undefined {
    const dimensions: { width?: string; height?: string; padding?: string } = {};
    
    // Extract pixel values
    const pxMatches = text.match(/(\d+)px/g);
    if (pxMatches) {
      if (text.includes('width')) dimensions.width = pxMatches[0];
      if (text.includes('height')) dimensions.height = pxMatches[0];
      if (text.includes('padding')) dimensions.padding = pxMatches[0];
    }

    // Extract percentage values
    const percentMatches = text.match(/(\d+)%/g);
    if (percentMatches) {
      if (text.includes('width')) dimensions.width = percentMatches[0];
    }

    // Interpret relative size words
    const textLower = text.toLowerCase();
    if (textLower.includes('bigger') || textLower.includes('larger') || textLower.includes('wide')) {
      dimensions.width = '600px';
    } else if (textLower.includes('smaller') || textLower.includes('compact') || textLower.includes('narrow')) {
      dimensions.width = '300px';
    }

    return Object.keys(dimensions).length > 0 ? dimensions : undefined;
  }

  private static extractVoice(text: string): string | undefined {
    const voiceKeywords = {
      formal: ['formal', 'official', 'proper'],
      informal: ['informal', 'casual', 'relaxed'],
      conversational: ['conversational', 'natural', 'human'],
      technical: ['technical', 'detailed', 'precise'],
      creative: ['creative', 'artistic', 'expressive']
    };

    const textLower = text.toLowerCase();
    for (const [voice, keywords] of Object.entries(voiceKeywords)) {
      if (keywords.some(keyword => textLower.includes(keyword))) {
        return voice;
      }
    }

    return undefined;
  }

  private static extractContent(text: string): { title?: string; description?: string; features?: string[] } | undefined {
    const content: { title?: string; description?: string; features?: string[] } = {};
    
    // Extract quoted text as potential content
    const quotedText = text.match(/"([^"]+)"/g);
    if (quotedText) {
      if (text.includes('title')) content.title = quotedText[0].replace(/"/g, '');
      if (text.includes('description')) content.description = quotedText[0].replace(/"/g, '');
    }

    return Object.keys(content).length > 0 ? content : undefined;
  }

  private static generateSuggestions(intent: AIAnalysisResult['intent'], options: EmbedGenerationOptions): string[] {
    const baseSuggestions = [
      "Change the colors",
      "Adjust the size",
      "Make it more professional",
      "Add custom content",
      "Preview the result"
    ];

    switch (intent) {
      case 'color_change':
        return ["Try blue tones", "Use brand colors", "Make it more vibrant", "Try neutral colors"];
      case 'layout_adjustment':
        return ["Make it wider", "Reduce height", "More compact", "Add padding"];
      case 'tone_adjustment':
        return ["More professional", "Casual tone", "Playful style", "Authoritative voice"];
      case 'content_modification':
        return ["Update title", "Change description", "Add features", "Customize CTA"];
      case 'feature_request':
        return ["Add testimonials", "Include pricing", "Show images", "Add social proof"];
      default:
        return baseSuggestions;
    }
  }
}