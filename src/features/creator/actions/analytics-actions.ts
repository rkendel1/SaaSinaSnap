'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { posthogServer } from '@/libs/posthog/posthog-server-client';

interface PostHogEvent {
  event: string;
  timestamp: string;
  properties: Record<string, any>;
}

// The getCreatorPostHogEvents action has been removed as posthog-node is for sending, not querying.
// Analytics data will now be fetched from the Supabase 'creator_analytics' table.