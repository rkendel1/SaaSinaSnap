import { redirect } from 'next/navigation';

// Redirect to the unified tabbed Design Studio page (Website Builder tab)
export default function PlatformWebsiteBuilderPage() {
  redirect('/dashboard/design-studio?tab=website');
}
