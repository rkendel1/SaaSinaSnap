import OpenAI from 'openai';

import { getEnvVar } from '@/utils/get-env-var';

export const openaiServerClient = new OpenAI({
  apiKey: getEnvVar(process.env.OPENAI_API_KEY, 'OPENAI_API_KEY'),
});