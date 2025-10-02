import Link from 'next/link';
import { Code, CreditCard, Globe, Shield,TrendingUp, Zap } from 'lucide-react';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  return (
    <div className='flex flex-col gap-16 py-8'>
      <HeroSection />
      <BenefitsSection />
      <CoreFeaturesSection />
      <HowItWorksSection />
      <PricingPreviewSection />
      <TestimonialsSection />
      <FooterCTA />
    </div>
  );
}

function HeroSection() {
  return (
    <section className='relative overflow-hidden'>
      <Container className='relative rounded-lg bg-gradient-to-br from-blue-50 via-white to-orange-50 py-24 text-center lg:py-32'>
        <div className='relative z-10 flex flex-col items-center'>
          {/* Badge */}
          <div className='mb-6 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-md border border-blue-100'>
            <Zap className='h-4 w-4 text-blue-600' />
            <span className='text-sm font-semibold text-gray-900'>Your One-Stop SaaS Solution</span>
          </div>
          
          <h1 className='mb-6 max-w-4xl text-4xl font-bold text-gray-900 lg:text-6xl'>
            Launch Your SaaS in a Snap—
            <span className='bg-gradient-to-r from-blue-600 to-orange-600 bg-clip-text text-transparent'> Just Bring Your Service</span>
          </h1>
          
          <p className='mb-8 max-w-3xl text-xl leading-relaxed text-gray-600'>
            For creators who want to focus on their craft, not billing infrastructure. Connect your Stripe account, and we handle subscriptions, usage tracking, white-label pages, and embeds—all in one platform.
          </p>
          
          <div className='flex flex-col gap-4 sm:flex-row mb-8'>
            <Button asChild variant='sexy' size='lg' className='px-8 py-3 text-lg'>
              <Link href='/signup'>
                <span>Start Free—No Credit Card</span>
              </Link>
            </Button>
            <Button asChild variant='outline' size='lg' className='border-2 px-8 py-3 text-lg hover:bg-gray-50'>
              <Link href='#how-it-works'>
                <span>See How It Works</span>
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className='flex flex-wrap justify-center gap-6 text-sm text-gray-600'>
            <div className='flex items-center gap-2'>
              <Shield className='h-4 w-4 text-green-600' />
              <span>Free plan available</span>
            </div>
            <div className='flex items-center gap-2'>
              <CreditCard className='h-4 w-4 text-blue-600' />
              <span>No credit card required</span>
            </div>
            <div className='flex items-center gap-2'>
              <Zap className='h-4 w-4 text-orange-600' />
              <span>Launch in minutes</span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function BenefitsSection() {
  return (
    <section className='py-16 lg:py-24'>
      <Container>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 lg:text-4xl'>
            Everything You Need, Nothing You Don&apos;t
          </h2>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            Focus on creating amazing services. We handle the boring infrastructure.
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          <BenefitCard
            icon={<Zap className='h-8 w-8 text-blue-600' />}
            title='Launch in Minutes'
            description='Connect your Stripe account and start accepting subscriptions immediately. No complex setup, no developer needed.'
          />
          <BenefitCard
            icon={<CreditCard className='h-8 w-8 text-green-600' />}
            title='Stripe Integration Built-In'
            description='Full Stripe abstraction. Just bring your Stripe account—we handle subscriptions, invoicing, and customer portals.'
          />
          <BenefitCard
            icon={<Code className='h-8 w-8 text-orange-600' />}
            title='Embeddable Anywhere'
            description='Drop our widgets into any website. Update pricing and features without touching code or redeploying.'
          />
          <BenefitCard
            icon={<Globe className='h-8 w-8 text-purple-600' />}
            title='White-Label Pages'
            description='Beautiful, branded landing and pricing pages hosted for you. SEO-optimized and mobile-responsive.'
          />
          <BenefitCard
            icon={<TrendingUp className='h-8 w-8 text-indigo-600' />}
            title='Usage Tracking'
            description='Monitor API calls, storage, and custom metrics. Automated overage billing keeps revenue flowing.'
          />
          <BenefitCard
            icon={<Shield className='h-8 w-8 text-teal-600' />}
            title='Creator-First Pricing'
            description='Start free, scale as you grow. Generous limits on all plans—we succeed when you succeed.'
          />
        </div>
      </Container>
    </section>
  );
}

function BenefitCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className='rounded-xl bg-white p-6 shadow-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1'>
      <div className='mb-4'>{icon}</div>
      <h3 className='mb-2 text-xl font-semibold text-gray-900'>{title}</h3>
      <p className='text-gray-600'>{description}</p>
    </div>
  );
}

function CoreFeaturesSection() {
  return (
    <section className='py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white'>
      <Container>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 lg:text-4xl'>Built for Creators, By Creators</h2>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            All the tools you need to monetize your service in one powerful platform.
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-2'>
          <FeatureCard
            title='Automated Subscriptions & Billing'
            description='Connect your Stripe account and we handle everything: recurring billing, upgrades, downgrades, cancellations, and invoicing. Your customers get a seamless experience.'
          />
          <FeatureCard
            title='Usage Tracking & Limits'
            description='Track API calls, storage, messages, or any custom metric. Set soft and hard limits per tier. Automated overage billing ensures you never leave money on the table.'
          />
          <FeatureCard
            title='Embeddable Widgets'
            description='Drop pricing tables, signup forms, and product cards into any website. Update them anytime without touching code. Perfect for A/B testing and rapid iteration.'
          />
          <FeatureCard
            title='White-Label Pages'
            description='Get beautiful, SEO-optimized landing, pricing, and account pages. Fully branded with your colors and logo. Updates sync automatically from your product configuration.'
          />
        </div>
      </Container>
    </section>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className='rounded-xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-xl border border-gray-100'>
      <h3 className='mb-3 text-2xl font-semibold text-gray-900'>{title}</h3>
      <p className='text-gray-600 text-lg leading-relaxed'>{description}</p>
    </div>
  );
}

function HowItWorksSection() {
  return (
    <section id='how-it-works' className='py-16 lg:py-24'>
      <Container>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 lg:text-4xl'>How It Works</h2>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            Three simple steps to monetize your service
          </p>
        </div>

        <div className='grid gap-12 md:grid-cols-3'>
          <StepCard
            step='1'
            title='Connect Your Stripe Account'
            description='Link your existing Stripe account or create a new one. We handle all the complex integration and billing logic for you.'
          />
          <StepCard
            step='2'
            title='Configure Your Products & Tiers'
            description='Set up your subscription plans, usage limits, and pricing. Define what each tier includes and let us handle the enforcement.'
          />
          <StepCard
            step='3'
            title='Launch Your SaaS'
            description='Get instant access to embeddable widgets, white-label pages, and usage tracking. Start accepting subscribers immediately.'
          />
        </div>

        <div className='mt-16 text-center'>
          <div className='rounded-2xl bg-gradient-to-r from-blue-600 to-orange-600 p-8 text-white'>
            <h3 className='mb-4 text-2xl font-bold'>Ready to Launch Your SaaS?</h3>
            <p className='mb-6 text-lg opacity-90'>Join hundreds of creators who trust SaaSinaSnap to handle their subscriptions</p>
            <Button asChild size='lg' variant='outline' className='bg-white text-gray-900 hover:bg-gray-100 border-0'>
              <Link href='/signup'>
                <span>Start Free Today</span>
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className='text-center'>
      <div className='mb-6 mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-orange-600 text-2xl font-bold text-white shadow-lg'>
        {step}
      </div>
      <h3 className='mb-3 text-xl font-semibold text-gray-900'>{title}</h3>
      <p className='text-gray-600 leading-relaxed'>{description}</p>
    </div>
  );
}

function PricingPreviewSection() {
  return (
    <section className='py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-white'>
      <Container>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 lg:text-4xl'>Simple, Transparent Pricing</h2>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            Start free and scale as you grow. All plans include core features.
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-3 max-w-5xl mx-auto'>
          {/* Free Plan */}
          <div className='rounded-2xl bg-white p-8 shadow-lg border-2 border-gray-200'>
            <div className='mb-6'>
              <h3 className='text-2xl font-bold text-gray-900 mb-2'>Free</h3>
              <p className='text-gray-600'>Perfect for testing</p>
            </div>
            <div className='mb-6'>
              <span className='text-4xl font-bold text-gray-900'>$0</span>
              <span className='text-gray-600'>/month</span>
            </div>
            <Button asChild variant='outline' className='w-full mb-6'>
              <Link href='/signup'>Get Started</Link>
            </Button>
            <ul className='space-y-3 text-sm'>
              <li className='flex items-start gap-2'>
                <span className='text-green-600 mt-0.5'>✓</span>
                <span>Up to 100 subscribers</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-green-600 mt-0.5'>✓</span>
                <span>Basic usage tracking</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-green-600 mt-0.5'>✓</span>
                <span>Embeddable widgets</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-green-600 mt-0.5'>✓</span>
                <span>White-label pages</span>
              </li>
            </ul>
          </div>

          {/* Starter Plan - Popular */}
          <div className='rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-8 shadow-xl relative border-2 border-blue-500 transform scale-105'>
            <div className='absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg'>
              POPULAR
            </div>
            <div className='mb-6'>
              <h3 className='text-2xl font-bold text-white mb-2'>Starter</h3>
              <p className='text-blue-100'>For growing creators</p>
            </div>
            <div className='mb-6'>
              <span className='text-4xl font-bold text-white'>$29</span>
              <span className='text-blue-100'>/month</span>
            </div>
            <Button asChild variant='outline' className='w-full mb-6 bg-white text-blue-600 hover:bg-gray-100'>
              <Link href='/signup'>Get Started</Link>
            </Button>
            <ul className='space-y-3 text-sm text-white'>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>✓</span>
                <span>Up to 1,000 subscribers</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>✓</span>
                <span>Advanced usage tracking</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>✓</span>
                <span>All Free features</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>✓</span>
                <span>Priority support</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='mt-0.5'>✓</span>
                <span>Custom branding</span>
              </li>
            </ul>
          </div>

          {/* Pro Plan */}
          <div className='rounded-2xl bg-white p-8 shadow-lg border-2 border-gray-200'>
            <div className='mb-6'>
              <h3 className='text-2xl font-bold text-gray-900 mb-2'>Pro</h3>
              <p className='text-gray-600'>For serious businesses</p>
            </div>
            <div className='mb-6'>
              <span className='text-4xl font-bold text-gray-900'>$99</span>
              <span className='text-gray-600'>/month</span>
            </div>
            <Button asChild variant='outline' className='w-full mb-6'>
              <Link href='/signup'>Get Started</Link>
            </Button>
            <ul className='space-y-3 text-sm'>
              <li className='flex items-start gap-2'>
                <span className='text-green-600 mt-0.5'>✓</span>
                <span>Unlimited subscribers</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-green-600 mt-0.5'>✓</span>
                <span>All Starter features</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-green-600 mt-0.5'>✓</span>
                <span>Advanced analytics</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-green-600 mt-0.5'>✓</span>
                <span>White-glove onboarding</span>
              </li>
              <li className='flex items-start gap-2'>
                <span className='text-green-600 mt-0.5'>✓</span>
                <span>Dedicated support</span>
              </li>
            </ul>
          </div>
        </div>

        <div className='mt-12 text-center'>
          <Link href='/pricing' className='text-blue-600 hover:text-blue-700 font-semibold'>
            View detailed pricing comparison →
          </Link>
        </div>
      </Container>
    </section>
  );
}

function TestimonialsSection() {
  return (
    <section className='py-16 lg:py-24'>
      <Container>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 lg:text-4xl'>Loved by Creators</h2>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            See what creators are saying about SaaSinaSnap
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-3'>
          <div className='rounded-xl bg-white p-6 shadow-lg border border-gray-100'>
            <div className='mb-4 text-blue-600'>
              <span className='text-2xl'>⭐⭐⭐⭐⭐</span>
            </div>
            <p className='text-gray-700 mb-4 italic'>
              &quot;SaaSinaSnap let me focus on building my product instead of wrestling with Stripe APIs. Launch in a snap is not just marketing—it&apos;s real.&quot;
            </p>
            <div className='font-semibold text-gray-900'>Sarah M.</div>
            <div className='text-sm text-gray-600'>API Service Creator</div>
          </div>

          <div className='rounded-xl bg-white p-6 shadow-lg border border-gray-100'>
            <div className='mb-4 text-blue-600'>
              <span className='text-2xl'>⭐⭐⭐⭐⭐</span>
            </div>
            <p className='text-gray-700 mb-4 italic'>
              &quot;The embeddable widgets are a game-changer. I can A/B test pricing without redeploying my site. Absolute magic!&quot;
            </p>
            <div className='font-semibold text-gray-900'>James L.</div>
            <div className='text-sm text-gray-600'>SaaS Founder</div>
          </div>

          <div className='rounded-xl bg-white p-6 shadow-lg border border-gray-100'>
            <div className='mb-4 text-blue-600'>
              <span className='text-2xl'>⭐⭐⭐⭐⭐</span>
            </div>
            <p className='text-gray-700 mb-4 italic'>
              &quot;Usage tracking and automated billing saved me weeks of development. The free plan is incredibly generous!&quot;
            </p>
            <div className='font-semibold text-gray-900'>Maria G.</div>
            <div className='text-sm text-gray-600'>Developer Tools Creator</div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function FooterCTA() {
  return (
    <section className='py-16 lg:py-24'>
      <Container>
        <div className='rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-orange-600 p-12 text-center text-white shadow-2xl'>
          <h2 className='mb-4 text-3xl font-bold lg:text-5xl'>Ready to Launch Your SaaS?</h2>
          <p className='mb-8 text-xl opacity-90 max-w-2xl mx-auto'>
            Join the platform that handles billing, so you can focus on what you do best: creating amazing services.
          </p>
          <div className='flex flex-col gap-4 sm:flex-row justify-center'>
            <Button asChild size='lg' variant='outline' className='bg-white text-blue-600 hover:bg-gray-100 border-0 px-8 py-3 text-lg'>
              <Link href='/signup'>
                <span>Start Free—No Credit Card</span>
              </Link>
            </Button>
            <Button asChild size='lg' variant='outline' className='border-2 border-white text-white hover:bg-white/10 px-8 py-3 text-lg'>
              <Link href='/pricing'>
                <span>View Pricing</span>
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
