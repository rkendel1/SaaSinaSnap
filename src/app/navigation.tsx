"use client";

import Link from 'next/link';
import { IoMenu } from 'react-icons/io5';

import { AccountMenu } from '@/components/account-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import type { Session } from '@supabase/supabase-js'; // Import Session type

import { signOut } from './(auth)/auth-actions';

interface NavigationProps {
  session: Session | null; // Define session prop type
}

export function Navigation({ session }: NavigationProps) { // Accept session as prop
  return (
    <div className='relative flex items-center gap-6'>
      {session ? (
        <AccountMenu signOut={signOut} />
      ) : (
        <>
          <Button variant='sexy' className='hidden flex-shrink-0 lg:flex' asChild>
            <Link href='/signup'><span>Get started for free</span></Link>
          </Button>
          <Sheet>
            <SheetTrigger className='block lg:hidden'>
              <IoMenu size={28} />
            </SheetTrigger>
            <SheetContent className='w-full bg-white'> {/* Changed bg-black to bg-white */}
              <SheetHeader>
                <Logo />
                {/* Added SheetTitle for accessibility */}
                <SheetTitle className="sr-only">Main Menu</SheetTitle> 
              </SheetHeader>
              {/* Explicitly provide an empty span as a child to satisfy React.Children.only */}
              <SheetDescription className="sr-only"><span /></SheetDescription> 
              <div className='py-8'>
                <Button variant='sexy' className='flex-shrink-0' asChild>
                  <Link href='/signup'><span>Get started for free</span></Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}