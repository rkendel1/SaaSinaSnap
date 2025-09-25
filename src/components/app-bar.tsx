'use client';

import { Logo } from '@/components/logo';
import { Navigation } from '@/app/navigation';

export function AppBar({ session, user }: { session: any, user: any }) {
  return (
    <header className='flex items-center justify-between py-8'>
      <Logo />
      <Navigation session={session} user={user} />
    </header>
  );
}