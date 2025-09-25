import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Session } from '@supabase/supabase-js';

import { getAuthenticatedUser } from './get-authenticated-user'; // Import the updated getAuthenticatedUser

export async function getSession(): Promise<Session | null> {
  // Rely on getAuthenticatedUser to fetch the user and session safely for Server Components.
  const user = await getAuthenticatedUser();

  if (!user) {
    return null;
  }

  // If getAuthenticatedUser successfully returned a user, we can construct a minimal session object
  // or, if needed, fetch the full session without triggering cookie modification during render.
  // For simplicity and to avoid potential issues, we'll return a session derived from the user.
  // In a real scenario, if the full session object (e.g., with access_token) is strictly needed
  // in a Server Component, it should be passed from a Server Action or Route Handler.
  // However, for basic checks like user existence, the user object itself is sufficient.
  
  // For now, we'll return a mock session if a user exists, as the actual session object
  // might contain sensitive tokens that shouldn't be directly exposed or re-fetched this way.
  // If you need the actual session object, consider passing it from a Server Action or Route Handler.
  return {
    access_token: '', // Placeholder, actual token should not be exposed this way in Server Components
    refresh_token: '', // Placeholder
    expires_in: 0, // Placeholder
    expires_at: 0, // Placeholder
    token_type: 'Bearer', // Placeholder
    user: user,
  };
}