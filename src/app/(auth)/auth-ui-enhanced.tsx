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
  login: 'Welcome back to Staryer',
  signup: 'Start your SaaS journey with Staryer',
} as const;

const subtitleMap = {
  login: 'Sign in to your account to continue',
  signup: 'Join thousands of creators building amazing SaaS products',
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
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-8 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-4">
            <Image src="/logo.png" width={40} height={40} alt="Staryer" className="rounded-lg" />
          </div>
          <h1 className="text-2xl font-bold mb-2 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
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
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-black px-4 text-muted-foreground">Or continue with email</span>
          </div>
        </div>

        {/* Email Form */}
        <Collapsible open={emailFormOpen} onOpenChange={setEmailFormOpen}>
          <CollapsibleTrigger asChild>
            <button
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 py-3.5 font-medium text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:transform-none"
              disabled={pending}
            >
              Continue with Email
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-4 p-6 rounded-xl bg-white/5 border border-white/10">
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <InputWithValidation
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  validator={validateEmail}
                  label="Email Address"
                  successMessage="Looks good!"
                  required
                  className="bg-white/5 border-white/10 focus:border-primary text-white placeholder:text-gray-400"
                />
                <div className="flex gap-3 pt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setEmailFormOpen(false)}
                    className="flex-1 bg-transparent border-white/20 hover:bg-white/5 text-white"
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
          <div className="mt-8 pt-6 border-t border-white/10">
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
        <div className="mt-6 pt-6 border-t border-white/10 text-center">
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