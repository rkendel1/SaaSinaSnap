'use client';

import { useState } from 'react';
import { ArrowRight, Check, Eye, Palette, Shield, Sparkles, Star, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { InputWithValidation } from '@/components/ui/input-with-validation';
import { SuccessAnimation, useSuccessAnimation } from '@/components/ui/success-animation';
import { validateBusinessName, validateEmail } from '@/utils/validation';

import { AuthUIEnhanced } from '../(auth)/auth-ui-enhanced';

export function OnboardingDemoComponent() {
  const [currentDemo, setCurrentDemo] = useState<'signup' | 'validation' | 'features'>('signup');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const { isSuccess, triggerSuccess } = useSuccessAnimation();

  // Mock functions for demo
  const mockSignInWithOAuth = async (provider: 'github' | 'google') => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    triggerSuccess();
    return { data: null, error: null };
  };

  const mockSignInWithEmail = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    triggerSuccess();
    return { data: null, error: null };
  };

  return (
    /* Adjusted for light theme */
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          {/* Adjusted for light theme */}
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Enhanced Signup Experience
          </h1>
          {/* Adjusted text color */}
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the improved SaaS creator signup flow with real-time validation, 
            engaging animations, and modern UI design.
          </p>
        </div>

        {/* Demo Navigation */}
        <div className="flex justify-center mb-12">
          {/* Adjusted for light theme */}
          <div className="bg-white rounded-2xl p-2 border border-gray-200">
            <div className="flex space-x-2">
              {[
                { id: 'signup', label: 'Enhanced Signup', icon: Users },
                { id: 'validation', label: 'Smart Validation', icon: Shield },
                { id: 'features', label: 'Key Features', icon: Star }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentDemo(id as any)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                    currentDemo === id
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100' /* Adjusted for light theme */
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Demo for enhanced signup */}
        {currentDemo === 'signup' && (
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Adjusted text color */}
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Enhanced Signup Experience</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    {/* Adjusted text color */}
                    <h3 className="font-semibold text-gray-900 mb-2">Beautiful Visual Design</h3>
                    {/* Adjusted text color */}
                    <p className="text-gray-600 text-sm leading-relaxed">
                      Glassmorphism effects, gradients, and modern UI components create an engaging first impression.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              {/* Adjusted for light theme */}
              <div className="relative bg-white rounded-3xl p-8 border border-gray-200">
                <AuthUIEnhanced
                  mode="signup"
                  signInWithOAuth={mockSignInWithOAuth}
                  signInWithEmail={mockSignInWithEmail}
                />
              </div>
            </div>
          </div>
        )}

        {/* Demo content for validation */}
        {currentDemo === 'validation' && (
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Adjusted for light theme */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              {/* Adjusted text color */}
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Try the validation</h3>
              <div className="space-y-6">
                {/* Adjusted for light theme */}
                <InputWithValidation
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  validator={validateEmail}
                  label="Email Address"
                  successMessage="Great! This email looks valid."
                  className="bg-white border-gray-300 focus:border-primary text-gray-900 placeholder:text-gray-500"
                />
                
                {/* Adjusted for light theme */}
                <InputWithValidation
                  placeholder="Your business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  validator={validateBusinessName}
                  label="Business Name"
                  successMessage="Perfect business name!"
                  className="bg-white border-gray-300 focus:border-primary text-gray-900 placeholder:text-gray-500"
                />

                <Button 
                  onClick={triggerSuccess}
                  className="w-full"
                  disabled={!validateEmail(email).isValid || !validateBusinessName(businessName).isValid}
                >
                  Test Success Animation
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Demo for features */}
        {currentDemo === 'features' && (
          <div className="text-center space-y-8">
            {/* Adjusted text color */}
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Key Improvements</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Adjusted for light theme */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200">
                {/* Adjusted text color */}
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Real-time Validation</h3>
                {/* Adjusted text color */}
                <p className="text-gray-600 mb-4">Form fields validate as users type with visual feedback</p>
                <ul className="space-y-2">
                  {/* Adjusted text color */}
                  <li className="flex items-center gap-2 text-sm text-gray-700">
                    {/* Adjusted text color */}
                    <Check className="w-4 h-4 text-green-600" />
                    Email format validation
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Success Animation */}
      <SuccessAnimation
        isVisible={isSuccess}
        message="Action completed successfully!"
        duration={2000}
      />
    </div>
  );
}