import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/features/pricing/components/pricing-section';

export default async function HomePage() {
  return (
    <div className='flex flex-col gap-8 lg:gap-16'>
      <HeroSection />
      <HowItWorksSection />
      <ExamplesSection />
      <PricingSection />
      <CreatorSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className='relative overflow-hidden lg:overflow-visible'>
      <Container className='relative rounded-lg bg-gradient-to-br from-blue-50 via-white to-orange-50 py-24 lg:py-32'>
        <div className='relative z-10 flex flex-col items-center text-center lg:items-start lg:text-left lg:max-w-2xl lg:pl-8'>
          <div className='mb-6 w-fit rounded-full bg-gradient-to-r from-blue-600 via-white to-orange-600 px-6 py-2 shadow-lg'>
            <span className='font-alt text-sm font-semibold text-gray-800'>
              🚀 Stripe Abstraction Layer • SaaS Creator Platform
            </span>
          </div>
          <h1 className='mb-6 text-4xl lg:text-6xl font-bold bg-gradient-to-br from-gray-900 via-blue-800 to-orange-800 bg-clip-text text-transparent'>
            Launch Your SaaS in Minutes, Not Months
          </h1>
          <p className='mb-8 text-xl text-gray-600 max-w-2xl leading-relaxed'>
            A Stripe abstraction layer for SaaS creators — onboard and go live in minutes with fully integrated billing, branded pages, and customer portals. Includes embeddable pricing and product components that stay in sync.
          </p>
          <div className='flex flex-col sm:flex-row gap-4'>
            <Button asChild variant='sexy' size='lg' className='px-8 py-3 text-lg'>
              <Link href='/signup'>
                <span>Get started for free</span>
              </Link>
            </Button>
            <Button asChild variant='outline' size='lg' className='px-8 py-3 text-lg border-2 hover:bg-gray-50'>
              <Link href='#how-it-works'>
                <span>See how it works</span>
              </Link>
            </Button>
          </div>
          <div className='mt-8 flex items-center gap-6 text-sm text-gray-500'>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              <span>No credit card required</span>
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-blue-500 rounded-full'></div>
              <span>Start selling immediately</span>
            </div>
          </div>
        </div>
      </Container>
      <Image
        src='/hero-shape.png'
        width={867}
        height={790}
        alt=''
        className='absolute right-0 top-0 rounded-tr-lg opacity-80'
        priority
        quality={100}
      />
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section id="how-it-works" className='py-16 lg:py-24'>
      <Container>
        <div className='text-center mb-16'>
          <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
            How it works
          </h2>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            Launch your SaaS platform in three simple steps with our Stripe abstraction layer
          </p>
        </div>
        
        <div className='grid md:grid-cols-3 gap-8 lg:gap-12'>
          {/* Step 1 */}
          <div className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-blue-500 via-white to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
              <span className='text-2xl font-bold text-gray-800'>1</span>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-3'>
              Connect & Configure
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              Connect your Stripe account and set up your products. Our platform handles all the complex integrations automatically.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-purple-500 via-white to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
              <span className='text-2xl font-bold text-gray-800'>2</span>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-3'>
              Customize & Brand
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              Create branded pages and customer portals with your logo and colors. Embed pricing components anywhere.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-pink-500 via-white to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
              <span className='text-2xl font-bold text-gray-800'>3</span>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-3'>
              Launch & Scale
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              Go live instantly with synchronized billing. Update once on our platform, and changes flow automatically to Stripe and all embeds.
            </p>
          </div>
        </div>
        
        <div className='text-center mt-12'>
          <Button asChild variant='sexy' size='lg'>
            <Link href='/signup'>
              <span>Start building your SaaS</span>
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

function ExamplesSection() {
  return (
    <section className='py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-blue-50 rounded-3xl overflow-hidden'>
      <Container>
        <div className='text-center mb-12'>
          <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
            Platform features showcase
          </h2>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            See how our platform enables rapid response to market shifts from a single dashboard
          </p>
        </div>
        
        <div className='grid md:grid-cols-3 gap-8'>
          <div className='bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300'>
            <div className='text-3xl mb-4'>💳</div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Integrated Billing</h3>
            <p className='text-gray-600'>
              Fully integrated Stripe billing with automatic synchronization across all components and embeds.
            </p>
          </div>
          
          <div className='bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300'>
            <div className='text-3xl mb-4'>🎨</div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Branded Pages</h3>
            <p className='text-gray-600'>
              Create beautiful, branded customer portals and pricing pages that reflect your brand identity.
            </p>
          </div>
          
          <div className='bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300'>
            <div className='text-3xl mb-4'>🔗</div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Embeddable Components</h3>
            <p className='text-gray-600'>
              Pricing and product components that stay in sync automatically across all your platforms.
            </p>
          </div>
          
          <div className='bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300'>
            <div className='text-3xl mb-4'>⚡</div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Real-time Updates</h3>
            <p className='text-gray-600'>
              Update once on our platform, and changes flow automatically to Stripe and all embeds.
            </p>
          </div>
          
          <div className='bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300'>
            <div className='text-3xl mb-4'>👥</div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Customer Portals</h3>
            <p className='text-gray-600'>
              Self-service customer portals for subscription management and billing history.
            </p>
          </div>
          
          <div className='bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300'>
            <div className='text-3xl mb-4'>📊</div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>Single Dashboard</h3>
            <p className='text-gray-600'>
              Manage your entire SaaS business from one centralized dashboard with powerful analytics.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CreatorSection() {
  return (
    <section className='rounded-lg bg-gradient-to-r from-blue-600 via-white to-orange-600 p-8 lg:p-16 text-gray-900 text-center'>
      <Container>
        <div className='max-w-4xl mx-auto space-y-6'>
          <div className='space-y-4'>
            <h2 className='text-3xl lg:text-4xl font-bold text-gray-900'>
              A Stripe Abstraction Layer for SaaS Creators
            </h2>
            <p className='text-xl text-gray-700 max-w-3xl mx-auto leading-relaxed'>
              Onboard and go live in minutes with fully integrated billing, branded pages, and customer portals. Includes embeddable pricing and product components that stay in sync. Update once on our platform, and changes flow automatically to Stripe and all embeds, enabling rapid response to market shifts from a single dashboard.
            </p>
          </div>
          
          <div className='grid md:grid-cols-3 gap-6 text-left'>
            <div className='bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg'> 
              <div className='text-2xl mb-3'>💳</div>
              <h3 className='font-semibold mb-2 text-gray-900'>Stripe Integration</h3>
              <p className='text-sm text-gray-700'>
                Seamless Stripe Connect integration with automatic synchronization across all components
              </p>
            </div>
            <div className='bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg'> 
              <div className='text-2xl mb-3'>🎨</div>
              <h3 className='font-semibold mb-2 text-gray-900'>Branded Experiences</h3>
              <p className='text-sm text-gray-700'>
                Fully branded pages and customer portals with your logo, colors, and custom domain
              </p>
            </div>
            <div className='bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-lg'> 
              <div className='text-2xl mb-3'>📊</div>
              <h3 className='font-semibold mb-2 text-gray-900'>Unified Dashboard</h3>
              <p className='text-sm text-gray-700'>
                Single platform to manage billing, customers, and growth with real-time analytics
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <Button asChild size='lg' className='bg-blue-600 text-white hover:bg-blue-700 shadow-lg'>
              <Link href='/creator/onboarding'><span>Start Building Your SaaS</span></Link>
            </Button>
            <p className='text-sm text-gray-600'>
              Go live in minutes. Full Stripe integration. Rapid market response capability.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}