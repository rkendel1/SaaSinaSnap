'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoLogoGithub, IoLogoGoogle } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { toast } from '@/components/ui/use-toast';
import { ActionResponse } from '@/types/action-response';
import { validateEmail } from '@/utils/validation';

const titleMap = {
  login: 'Welcome back to SaaS in a Snap',
  signup: 'Start your SaaS journey with Saas in a Snap',
} as const;

const subtitleMap = {
  login: 'Sign in to your account to continue',
  signup: 'Lifts creators instantly into monetization',
} as const;

export function AuthUIEnhanced({
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
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);

  async function handleEmailSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    
    const validation = validateEmail(email);
    if (!validation.isValid) {
      toast({
        variant: 'destructive',
        description: validation.error || 'Please enter a valid email address.',
      });
      return;
    }

    setPending(true);
    const response = await signInWithEmail(email);

    if (response?.error) {
      toast({
        variant: 'destructive',
        description: 'An error occurred while authenticating. Please try again.',
      });
    } else {
      toast({
        description: `To continue, click the link in the email sent to: ${email}`,
        duration: 8000,
      });
      setEmailFormOpen(false);
    }

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
    <section className="w-full max-w-md mx-auto">
      {/* Adjusted for light theme */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-4">
            <Image src="/sss_logo.png" width={40} height={40} alt="SaaSinaSnap" className="rounded-lg" />
          </div>
          {/* Adjusted for light theme */}
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {titleMap[mode]}
          </h1>
          <p className="text-muted-foreground text-sm">{subtitleMap[mode]}</p>
        </div>

        {/* OAuth Buttons */}
        <div className="space-y-3 mb-6">
          <button
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 py-3.5 font-medium text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none shadow-lg hover:shadow-blue-500/25"
            onClick={() => handleOAuthClick('google')}
            disabled={pending}
          >
            <IoLogoGoogle size={20} />
            Continue with Google
          </button>
          
          <button
            className="w-full flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800 py-3.5 font-medium text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none shadow-lg hover:shadow-gray-500/25"
            onClick={() => handleOAuthClick('github')}
            disabled={pending}
          >
            <IoLogoGithub size={20} />
            Continue with GitHub
          </button>
        </div>

        {/* Divider */}
        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            {/* Adjusted for light theme */}
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            {/* Adjusted for light theme */}
            <span className="bg-white px-4 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {/* Email Form */}
        <Collapsible open={emailFormOpen} onOpenChange={setEmailFormOpen}>
          <CollapsibleTrigger asChild>
            {/* Adjusted for light theme */}
            <button
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 py-3.5 font-medium text-gray-700 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none"
              disabled={pending}
            >
              Continue with Email
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            {/* Adjusted for light theme */}
            <div className="mt-4 p-6 rounded-xl bg-gray-50 border border-gray-200">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                {/* Adjusted for light theme */}
                <InputWithValidation
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  validator={validateEmail}
                  label="Email Address"
                  successMessage="Looks good!"
                  required
                  className="bg-white border-gray-300 focus:border-primary text-gray-900 placeholder:text-gray-500"
                />
                <div className="flex gap-3 pt-2">
                  {/* Adjusted for light theme */}
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEmailFormOpen(false)}
                    className="flex-1 bg-transparent border-gray-300 hover:bg-gray-100 text-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={pending || !isEmailValid}
                    className="flex-1 bg-primary hover:bg-primary/90"
                  >
                    {pending ? 'Sending...' : 'Send Magic Link'}
                  </Button>
                </div>
              </form>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Terms and Privacy */}
        {mode === 'signup' && (
          /* Adjusted for light theme */
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-muted-foreground text-center">
              By continuing, you agree to our{' '}
              <Link href="/terms" className="text-primary hover:text-primary/80 underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-primary hover:text-primary/80 underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        )}

        {/* Switch Mode */}
        {/* Adjusted for light theme */}
        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-muted-foreground">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <Link 
              href={mode === 'login' ? '/signup' : '/login'} 
              className="text-primary hover:text-primary/80 font-medium underline"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}