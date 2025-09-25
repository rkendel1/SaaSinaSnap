'use server';

import { AIEmbedCustomizerService, type AICustomizationSession } from '@/features/creator/services/ai-embed-customizer';
import { EnhancedEmbedGeneratorService, type EmbedGenerationOptions, type GeneratedEmbed } from '@/features/creator/services/enhanced-embed-generator';
import { EmbedAssetType } from '../types';

export async function startAISessionAction(
  creatorId: string,
  embedType: EmbedAssetType,
  initialOptions: EmbedGenerationOptions
): Promise<AICustomizationSession> {
  return AIEmbedCustomizerService.startSession(creatorId, embedType, initialOptions);
}

export async function processAIMessageAction(
  sessionId: string,
  userMessage: string
): Promise<{ 
  response: any; 
  updatedOptions: EmbedGenerationOptions;
  requiresRegeneration: boolean;
}> {
  return AIEmbedCustomizerService.processMessage(sessionId, userMessage);
}

export async function getAISessionAction(sessionId: string): Promise<AICustomizationSession | null> {
  return AIEmbedCustomizerService.getSession(sessionId);
}

export async function generateEmbedAction(options: EmbedGenerationOptions): Promise<GeneratedEmbed> {
  return EnhancedEmbedGeneratorService.generateEmbed(options);
}