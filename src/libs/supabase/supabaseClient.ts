// Client-side Supabase client for browser usage
import { getEnvVar } from '@/utils/get-env-var';
import { createClient } from '@supabase/supabase-js';

import type { Database } from './types';

const supabaseUrl = getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
const supabaseAnonKey = getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});