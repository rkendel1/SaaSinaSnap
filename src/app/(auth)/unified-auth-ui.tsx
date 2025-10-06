"use client";

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoArrowBack,IoLogoGithub, IoLogoGoogle, IoMail } from 'react-icons/io5';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { toast } from '@/components/ui/use-toast';
import { ActionResponse } from '@/types/action-response';
import { validateEmail, validatePassword } from '@/utils/validation';

type AuthStep = 'initial' | 'email-entry' | 'sign-in' | 'sign-up';

export function UnifiedAuthUI({
  signInWithOAuth,
  signInWithEmail,
  signInWithEmailAndPassword,
  signUpWithEmailAndPassword,
  checkEmailExists,
}: {
  signInWithOAuth: (provider: 'github' | 'google') => Promise<ActionResponse>;
  signInWithEmail: (email: string) => Promise<ActionResponse>;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<ActionResponse>;
  signUpWithEmailAndPassword: (email: string, password: string) => Promise<ActionResponse>;
  checkEmailExists: (email: string) => Promise<ActionResponse<{ exists: boolean; hasPassword: boolean }>>;
}) {
  const [step, setStep] = useState<AuthStep>('initial');
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [authMethod, setAuthMethod] = useState<'password' | 'magiclink'>('password');

  async function handleOAuthClick(provider: 'google' | 'github') {
    setPending(true);
    setSubmitError(null);
    
    const response = await signInWithOAuth(provider);

    if (response?.error) {
      const errorMessage = typeof response.error === 'string' ? response.error : response.error.message || 'An error occurred while authenticating. Please try again.';
      setSubmitError(errorMessage);
      toast({
        variant: 'destructive',
        description: errorMessage,
      });
      setPending(false);
    }
  }

  async function handleEmailContinue(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSubmitError(null);

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setSubmitError(emailValidation.error || 'Please enter a valid email address.');
      setPending(false);
      return;
    }

    // Check if email exists
    const response = await checkEmailExists(email);
    
    if (response?.error) {
      setSubmitError(typeof response.error === 'string' ? response.error : 'Failed to verify email. Please try again.');
      setPending(false);
      return;
    }

    if (response?.data?.exists) {
      setStep('sign-in');
    } else {
      setStep('sign-up');
    }
    
    setPending(false);
  }

  async function handleSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSubmitError(null);

    let response: ActionResponse | undefined;

    if (authMethod === 'password') {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setSubmitError(passwordValidation.error || 'Please enter your password.');
        setPending(false);
        return;
      }
      response = await signInWithEmailAndPassword(email, password);
    } else {
      response = await signInWithEmail(email);
    }

    if (response?.error) {
      const errorMessage = typeof response.error === 'string' ? response.error : response.error.message || 'An error occurred. Please try again.';
      setSubmitError(errorMessage);
      toast({
        variant: 'destructive',
        description: errorMessage,
      });
      setPending(false);
    } else if (authMethod === 'magiclink') {
      toast({
        description: `Check your email! We sent a login link to ${email}`,
      });
      resetForm();
    }
  }

  async function handleSignUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setSubmitError(null);

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setSubmitError(passwordValidation.error || 'Please enter a valid password.');
      setPending(false);
      return;
    }

    if (password !== confirmPassword) {
      setSubmitError('Passwords do not match.');
      setPending(false);
      return;
    }

    const response = await signUpWithEmailAndPassword(email, password);

    if (response?.error) {
      const errorMessage = typeof response.error === 'string' ? response.error : response.error.message || 'An error occurred. Please try again.';
      setSubmitError(errorMessage);
      toast({
        variant: 'destructive',
        description: errorMessage,
      });
      setPending(false);
    }
  }

  function resetForm() {
    setStep('initial');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSubmitError(null);
    setAuthMethod('password');
  }

  function goBack() {
    if (step === 'email-entry') {
      setStep('initial');
      setEmail('');
    } else if (step === 'sign-in' || step === 'sign-up') {
      setStep('email-entry');
      setPassword('');
      setConfirmPassword('');
    }
    setSubmitError(null);
  }

  return (
    <section className='w-full max-w-md mx-auto'>
      <div className='bg-white rounded-2xl shadow-xl border border-gray-100 p-8'>
        {/* Header */}
        <div className='text-center mb-8'>
          <div className='mb-6'>
            <Image src='/sss_logo.png' width={64} height={64} alt='SaaSinaSnap Logo' className='mx-auto' />
          </div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            {step === 'sign-in' ? 'Welcome back!' : step === 'sign-up' ? 'Create your account' : 'Welcome to SaaSinaSnap'}
          </h1>
          <p className='text-gray-600'>
            {step === 'sign-in' 
              ? `Sign in to continue as ${email}` 
              : step === 'sign-up' 
              ? 'Launch your SaaS in a snap—no credit card required'
              : 'Sign in or create an account to get started'}
          </p>
        </div>

        {/* Error Message */}
        {submitError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{submitError}</p>
          </div>
        )}

        {/* Initial Step - OAuth + Email Button */}
        {step === 'initial' && (
          <>
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

            <div className='relative mb-6'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-200'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-4 bg-white text-gray-500'>or</span>
              </div>
            </div>

            <button
              className='w-full flex items-center justify-center gap-3 px-4 py-3 bg-gradient-to-r from-blue-600 to-orange-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-orange-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              onClick={() => setStep('email-entry')}
              disabled={pending}
            >
              <IoMail size={20} />
              Continue with Email
            </button>
          </>
        )}

        {/* Email Entry Step */}
        {step === 'email-entry' && (
          <form onSubmit={handleEmailContinue} className='space-y-4'>
            <button
              type="button"
              onClick={goBack}
              className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'
            >
              <IoArrowBack size={20} />
              <span className='text-sm'>Back</span>
            </button>

            <InputWithValidation
              type='email'
              name='email'
              placeholder='Enter your email address'
              aria-label='Enter your email'
              autoFocus
              className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 bg-white'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              validator={validateEmail}
              onValidationChange={setIsEmailValid}
            />

            <Button 
              type='submit' 
              className='w-full bg-blue-600 hover:bg-blue-700 text-white py-3'
              disabled={pending || !isEmailValid}
            >
              {pending ? 'Checking...' : 'Continue'}
            </Button>
          </form>
        )}

        {/* Sign In Step */}
        {step === 'sign-in' && (
          <form onSubmit={handleSignIn} className='space-y-4'>
            <button
              type="button"
              onClick={goBack}
              className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'
            >
              <IoArrowBack size={20} />
              <span className='text-sm'>Back</span>
            </button>

            <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg mb-4'>
              <p className='text-sm text-blue-700'>Signing in as <strong>{email}</strong></p>
            </div>

            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={authMethod === 'password' ? 'default' : 'outline'}
                onClick={() => setAuthMethod('password')}
                className="flex-1"
              >
                Password
              </Button>
              <Button
                type="button"
                variant={authMethod === 'magiclink' ? 'default' : 'outline'}
                onClick={() => setAuthMethod('magiclink')}
                className="flex-1"
              >
                Magic Link
              </Button>
            </div>

            {authMethod === 'password' && (
              <InputWithValidation
                type='password'
                name='password'
                placeholder='Enter your password'
                aria-label='Enter your password'
                autoFocus
                className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 bg-white'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                validator={validatePassword}
                onValidationChange={setIsPasswordValid}
              />
            )}

            {authMethod === 'magiclink' && (
              <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg'>
                <p className='text-sm text-gray-600'>We'll send a magic link to your email. Click it to sign in instantly.</p>
              </div>
            )}

            <Button 
              type='submit' 
              className='w-full bg-blue-600 hover:bg-blue-700 text-white py-3'
              disabled={pending || (authMethod === 'password' && !isPasswordValid)}
            >
              {pending ? 'Signing in...' : authMethod === 'password' ? 'Sign In' : 'Send Magic Link'}
            </Button>
          </form>
        )}

        {/* Sign Up Step */}
        {step === 'sign-up' && (
          <form onSubmit={handleSignUp} className='space-y-4'>
            <button
              type="button"
              onClick={goBack}
              className='flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4'
            >
              <IoArrowBack size={20} />
              <span className='text-sm'>Back</span>
            </button>

            <div className='p-3 bg-green-50 border border-green-200 rounded-lg mb-4'>
              <p className='text-sm text-green-700'>Creating account for <strong>{email}</strong></p>
            </div>

            <InputWithValidation
              type='password'
              name='password'
              placeholder='Create a password'
              aria-label='Create a password'
              autoFocus
              className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 bg-white'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              validator={validatePassword}
              onValidationChange={setIsPasswordValid}
            />

            <InputWithValidation
              type='password'
              name='confirmPassword'
              placeholder='Confirm your password'
              aria-label='Confirm your password'
              className='w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-0 bg-white'
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              validator={(value) => ({ isValid: value === password, error: value === password ? undefined : 'Passwords do not match.' })}
              onValidationChange={setIsConfirmPasswordValid}
            />

            <Button 
              type='submit' 
              className='w-full bg-blue-600 hover:bg-blue-700 text-white py-3'
              disabled={pending || !isPasswordValid || !isConfirmPasswordValid || password !== confirmPassword}
            >
              {pending ? 'Creating account...' : 'Create Account'}
            </Button>

            <p className='text-center text-sm text-gray-500 leading-relaxed'>
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
          </form>
        )}
      </div>

      {/* Features callout */}
      {step === 'initial' && (
        <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-orange-50 rounded-xl border border-blue-100'>
          <div className='flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-700'>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              <span className='font-medium'>Free plan available</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
              <span className='font-medium'>No credit card required</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-orange-500 rounded-full'></div>
              <span className='font-medium'>Launch in minutes</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}