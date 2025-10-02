import { redirect } from 'next/navigation';

// Redirect to unified Design Studio Manage page
export default async function EmbedsAndScriptsPage() {
  redirect('/creator/design-studio/manage');
}