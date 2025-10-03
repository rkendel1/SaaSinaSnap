import { redirect } from 'next/navigation';

// Redirect to the unified tabbed Design Studio page
export default function PlatformEmbedBuilderPage() {
  redirect('/dashboard/design-studio');
}