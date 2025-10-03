import { redirect } from 'next/navigation';

// Redirect to the unified tabbed Design Studio page (A/B Testing tab)
export default function PlatformTestingPage() {
  redirect('/dashboard/design-studio?tab=testing');
}
