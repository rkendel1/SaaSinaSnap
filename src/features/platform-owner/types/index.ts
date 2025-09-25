import { Tables } from '@/libs/supabase/types';

export type PlatformUser = Tables<'users'> & {
  email?: string;
  created_at: string;
  last_sign_in_at?: string | null;
};