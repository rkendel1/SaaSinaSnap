import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { NextRequest } from 'next/server';

import { getSession } from '@/features/account/controllers/get-session';

export default async function EmbedPreviewRedirect() {
  // Create a NextRequest object with the current headers
  const request = new NextRequest('http://127.0.0.1', {
    headers: headers()
  });
  
  const session = await getSession(request);

  // If no session, redirect to login
  if (!session?.user) {
    redirect('/login');
  }

  // Get user role from session
  const userRole = session.user.role;

  // Redirect based on role
  if (userRole === 'platform_owner') {
    redirect('/dashboard/embed-preview');
  } else if (userRole === 'creator') {
    redirect('/creator/embed-preview');
  } else {
    // Fallback to login if role is not recognized
    redirect('/login');
  }
}