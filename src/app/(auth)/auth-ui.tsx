'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoLogoGithub, IoLogoGoogle } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import { ActionResponse } from '@/types/action-response';

const titleMap = {
  login: 'Welcome back',
  signup: 'Start creating amazing banners',
} as const;

const subtitleMap = {
  login: 'Sign in to your PayLift account',
  signup: 'Join thousands of creators using PayLift',
} as const;

export function AuthUI({
  mode,
  signInWithOAuth,
  signInWithEmail,
}: {
  mode: 'login' | 'signup';
  signInWithOAuth: (provider: 'github' | 'google') => Promise<ActionResponse>;
  signInWithEmail: (email: string) => Promise<ActionResponse>;
}) {
  const [pending, setPending] = useState(false);
  const [emailFormOpen, setEmailFormOpen] = useState(false);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const form = event.target as HTMLFormElement;
    const email = form['email'].value;
    const response = await signInWithEmail(email);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while authenticating. Please try again.',
      });
    } else {
      toast({
        description: `To continue, click the link in the email sent to: ${email}`,
      });
    }

    form.reset();
    setPending(false);
  }

  async function handleOAuthClick(provider: 'google' | 'github') {
    setPending(true);
    const response = await signInWithOAuth(provider);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while authenticating. Please try again.',
      });
      setPending(false);
    }
  }

  return (
    <section className='w-full max-w-md mx-auto'>
      {/* Modern card design */}
      <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='mb-6'>
            <Image src='/logo.png' width={64} height={64} alt='PayLift Logo' className='mx-auto' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            {titleMap[mode]}
          </h1>
          <p className='text-gray-600'>
            {subtitleMap[mode]}
          </p>
        </div>

        {/* Social login buttons */}
        <div className='space-y-3 mb-6'>
          <button
            className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            onClick={() => handleOAuthClick('google')}
            disabled={pending}
          >
            <IoLogoGoogle size={20} className='text-red-500' />
            Continue with Google
          </button>
          
          <button
            className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            onClick={() => handleOAuthClick('github')}
            disabled={pending}
          >
            <IoLogoGithub size={20} className='text-gray-800' />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className='relative mb-6'>
          <div className='absolute inset-0 flex items-center'>
            <div className='w-full border-t border-gray-200'></div>
          </div>
          <div className='relative flex justify-center text-sm'>
            <span className='px-4 bg-white text-gray-500'>or</span>
          </div>
        </div>

        {/* Email option */}
        <Collapsible open={emailFormOpen} onOpenChange={setEmailFormOpen}>
          <CollapsibleTrigger asChild>
            <button
              className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              disabled={pending}
            >
              Continue with Email
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className='mt-4 p-4 bg-gray-50 rounded-xl'>
              <form onSubmit={handleEmailSubmit} className='space-y-4'>
                <Input
                  type='email'
                  name='email'
                  placeholder='Enter your email address'
                  aria-label='Enter your email'
                  autoFocus
                  className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 bg-white'
                />
                <div className='flex gap-3'>
                  <Button 
                    type='button' 
                    variant='outline' 
                    onClick={() => setEmailFormOpen(false)}
                    className='flex-1 border-2 hover:bg-gray-50'
                  >
                    Cancel
                  </Button>
                  <Button 
                    type='submit' 
                    className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'
                    disabled={pending}
                  >
                    {pending ? 'Sending...' : 'Send link'}
                  </Button>
                </div>
              </form>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Terms and privacy for signup */}
        {mode === 'signup' && (
          <p className='mt-6 text-center text-sm text-gray-500 leading-relaxed'>
            By continuing, you agree to our{' '}
            <Link href='/terms' className='text-blue-600 hover:text-blue-700 underline'>
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href='/privacy' className='text-blue-600 hover:text-blue-700 underline'>
              Privacy Policy
            </Link>
            .
          </p>
        )}

        {/* Switch between login/signup */}
        <div className='mt-8 text-center'>
          <p className='text-gray-600'>
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <Link 
              href={mode === 'login' ? '/signup' : '/login'}
              className='text-blue-600 hover:text-blue-700 font-medium underline'
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>

      {/* Additional features callout for signup */}
      {mode === 'signup' && (
        <div className='mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100'>
          <div className='flex items-center justify-center gap-8 text-sm text-blue-700'>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              <span>5 free banners</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
              <span>No credit card</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-purple-500 rounded-full'></div>
              <span>Ready in 30s</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}