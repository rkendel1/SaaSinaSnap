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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Enhanced Signup Experience
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Experience the improved SaaS creator signup flow with real-time validation, 
            engaging animations, and modern UI design.
          </p>
        </div>

        {/* Demo Navigation */}
        <div className="flex justify-center mb-12">
          <div className="bg-white/5 rounded-2xl p-2 backdrop-blur-sm border border-white/10">
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
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
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
            <div className="space-y-8">
              <h2 className="text-3xl font-bold text-white mb-6">Enhanced Signup Experience</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-2">Beautiful Visual Design</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Glassmorphism effects, gradients, and modern UI components create an engaging first impression.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
              <div className="relative bg-black/50 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
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
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
              <h3 className="text-xl font-semibold text-white mb-6">Try the validation</h3>
              <div className="space-y-6">
                <InputWithValidation
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  validator={validateEmail}
                  label="Email Address"
                  successMessage="Great! This email looks valid."
                  className="bg-white/5 border-white/10 focus:border-primary text-white placeholder:text-gray-400"
                />
                
                <InputWithValidation
                  placeholder="Your business name"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  validator={validateBusinessName}
                  label="Business Name"
                  successMessage="Perfect business name!"
                  className="bg-white/5 border-white/10 focus:border-primary text-white placeholder:text-gray-400"
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
            <h2 className="text-3xl font-bold text-white mb-6">Key Improvements</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                <h3 className="text-xl font-semibold text-white mb-3">Real-time Validation</h3>
                <p className="text-gray-400 mb-4">Form fields validate as users type with visual feedback</p>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2 text-sm text-gray-300">
                    <Check className="w-4 h-4 text-green-400" />
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