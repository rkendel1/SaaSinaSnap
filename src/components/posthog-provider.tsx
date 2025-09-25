'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

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

export function PostHogPageview(): JSX.Element {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname;
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`;
      }

      const properties: Record<string, any> = {
        '$current_url': url,
      };

      // Extract creatorSlug from pathname if it's a creator's page
      const creatorPageMatch = pathname.match(/^\/c\/([^/]+)/);
      if (creatorPageMatch && creatorPageMatch[1]) {
        properties.creator_slug = creatorPageMatch[1];
      }

      posthog.capture('$pageview', properties);
    }
  }, [pathname, searchParams]);
  return <></>;
}

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  return <PHProvider client={posthog}>{children}</PHProvider>;
}