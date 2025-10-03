import { redirect } from 'next/navigation';

// Redirect to the unified tabbed Creators page (Feedback tab)
export default function CreatorFeedbackPage() {
  redirect('/dashboard/creators?tab=feedback');
}
