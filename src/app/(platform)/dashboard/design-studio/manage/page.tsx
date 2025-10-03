import { redirect } from 'next/navigation';

// Redirect to the unified tabbed Design Studio page (Asset Library tab)
export default function PlatformEmbedsManagePage() {
  redirect('/dashboard/design-studio?tab=assets');
}