import posthog from 'posthog-js';

import { getEnvVar } from '@/utils/get-env-var';

const POSTHOG_HOST = getEnvVar(process.env.NEXT_PUBLIC_POSTHOG_HOST, 'NEXT_PUBLIC_POSTHOG_HOST');
const POSTHOG_KEY = getEnvVar(process.env.NEXT_PUBLIC_POSTHOG_KEY, 'NEXT_PUBLIC_POSTHOG_KEY');

if (typeof window !== 'undefined') {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    ui_host: POSTHOG_HOST, // For PostHog toolbar
    loaded: (posthog) => {
      if (process.env.NODE_ENV === 'development') posthog.debug();
    },
  });
}

export default posthog;