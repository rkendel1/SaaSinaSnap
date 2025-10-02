import { redirect } from 'next/navigation';

// Redirect to unified Design Studio Manage page
export default async function PlatformEmbedsAndScriptsPage() {
  redirect('/dashboard/design-studio/manage');
}