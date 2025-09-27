import OpenAI from 'openai';

import { getEnvVar } from '@/utils/get-env-var';

// Enhanced OpenAI client with improved configuration
export const openaiServerClient = new OpenAI({
  apiKey: getEnvVar(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY'),
  maxRetries: 3, // Retry failed requests up to 3 times
  defaultHeaders: {
    'User-Agent': 'Staryer-Platform/1.0'
  }
});

// Helper function for making robust OpenAI calls with better error handling
export async function createChatCompletion(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    responseFormat?: { type: 'json_object' | 'text' };
  } = {}
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  try {
    const completion = await openaiServerClient.chat.completions.create({
      model: options.model || "gpt-4o-mini",
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      response_format: options.responseFormat,
    });

    return completion;
  } catch (error) {
    console.error('OpenAI API Error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof OpenAI.APIError) {
      if (error.status === 429) {
        throw new Error('AI service is currently busy. Please try again in a moment.');
      } else if (error.status === 401) {
        throw new Error('AI service authentication failed. Please contact support.');
      } else if (error.status >= 500) {
        throw new Error('AI service is temporarily unavailable. Please try again later.');
      }
    }
    
    throw new Error('AI service encountered an error. Please try again.');
  }
}