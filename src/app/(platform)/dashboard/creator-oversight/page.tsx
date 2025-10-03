import { redirect } from 'next/navigation';

// Redirect to the unified tabbed Creators page (Oversight tab)
export default function CreatorOversightPage() {
  redirect('/dashboard/creators?tab=oversight');
}