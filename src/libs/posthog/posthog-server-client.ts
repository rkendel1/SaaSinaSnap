import { PostHog } from 'posthog-node';

import { getEnvVar } from '@/utils/get-env-var';

const POSTHOG_HOST = getEnvVar(process.env.NEXT_PUBLIC_POSTHOG_HOST, 'NEXT_PUBLIC_POSTHOG_HOST');
const POSTHOG_KEY = getEnvVar(process.env.NEXT_PUBLIC_POSTHOG_KEY, 'NEXT_PUBLIC_POSTHOG_KEY');

export const posthogServer = new PostHog(POSTHOG_KEY, {
  host: POSTHOG_HOST,
});