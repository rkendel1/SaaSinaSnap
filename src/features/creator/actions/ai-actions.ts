"use server";

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { type AICustomizationSession,AIEmbedCustomizerService } from '@/features/creator/services/ai-embed-customizer';
import { type EmbedGenerationOptions, EnhancedEmbedGeneratorService, type GeneratedEmbed } from '@/features/creator/services/enhanced-embed-generator';
import { openaiServerClient } from '@/libs/openai/openai-server-client'; // Import the server-only OpenAI client
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getEnvVar } from '@/utils/get-env-var';

import { EmbedAssetType } from '../types';

// Helper to check if OpenAI API key is configured
function checkOpenAIKey(): void {
  try {
    getEnvVar(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY');
  } catch (error) {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env.local file.');
  }
}

export async function startAISessionAction(
  creatorId: string,
  embedType: EmbedAssetType,
  initialOptions: EmbedGenerationOptions
): Promise<AICustomizationSession> {
  checkOpenAIKey(); // Ensure API key is present

  const user = await getAuthenticatedUser();
  if (!user?.id || user.id !== creatorId) {
    throw new Error('Not authenticated or unauthorized to start AI session for this creator.');
  }
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
  checkOpenAIKey(); // Ensure API key is present

  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated.');
  }
  const session = await AIEmbedCustomizerService.getSession(sessionId); // Await the async call
  if (!session || session.creatorId !== user.id) {
    throw new Error('Unauthorized: Session not found or access denied.');
  }
  // Pass the server-only OpenAI client to the service method
  return AIEmbedCustomizerService.processMessage(openaiServerClient, sessionId, userMessage);
}

export async function getAISessionAction(sessionId: string): Promise<AICustomizationSession | null> {
  checkOpenAIKey(); // Ensure API key is present

  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated.');
  }
  const session = await AIEmbedCustomizerService.getSession(sessionId); // Await the async call
  if (!session || session.creatorId !== user.id) {
    return null; // Return null if session not found or unauthorized
  }
  return session;
}

export async function generateEmbedAction(options: EmbedGenerationOptions): Promise<GeneratedEmbed> {
  checkOpenAIKey(); // Ensure API key is present

  const user = await getAuthenticatedUser();
  if (!user?.id || user.id !== options.creator.id) {
    throw new Error('Not authenticated or unauthorized to generate embed for this creator.');
  }
  return EnhancedEmbedGeneratorService.generateEmbed(options);
}