import Link from 'next/link';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  return (
    <div className='flex flex-col gap-16 py-8'>
      <HeroSection />
      <CoreFeaturesSection />
      <BenefitsSection />
      <HowItWorksSection />
      <AnalyticsSection />
      <EcosystemDiscoverySection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className='relative overflow-hidden'>
      <Container className='relative rounded-lg bg-gradient-to-br from-blue-50 via-white to-orange-50 py-24 text-center lg:py-32'>
        <div className='relative z-10 flex flex-col items-center'>
          <h1 className='mb-6 max-w-4xl text-4xl font-bold text-gray-900 lg:text-6xl'>
            Launch & Monetize Your SaaS Instantly—No Dev Work Required
          </h1>
          <p className='mb-8 max-w-3xl text-xl leading-relaxed text-gray-600'>
            Abstract Stripe, automate subscriptions, track usage, deploy native-looking white-label pages, and embed anywhere—all with real-time analytics, rapid updates, and automatic Stripe sync. Join a network of SaaS creators for discovery and growth.
          </p>
          <div className='flex flex-col gap-4 sm:flex-row'>
            <Button asChild variant='sexy' size='lg' className='px-8 py-3 text-lg'>
              <Link href='/signup'>
                <span>Start Free</span>
              </Link>
            </Button>
            <Button asChild variant='outline' size='lg' className='border-2 px-8 py-3 text-lg hover:bg-gray-50'>
              <Link href='#how-it-works'>
                <span>See How It Works</span>
              </Link>
            </Button>
          </div>
        </div>
        {/* Visual Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
          <div className="text-center text-gray-400">
            <p className="text-lg font-semibold">Mockups of dashboards showing analytics</p>
            <p className="text-sm">Embed scripts in action, dynamically updated without redeploy</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function CoreFeaturesSection() {
  return (
    <section className='py-16 lg:py-24'>
      <Container>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 lg:text-4xl'>Core Features</h2>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            Everything you need to launch, manage, and grow your SaaS.
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-2'>
          <FeatureCard
            title='Centralized Product & Tier Management'
            description='Define products, tiers, features, and usage limits. Pricing changes automatically sync with Stripe. Full Stripe integration handled for you.'
          />
          <FeatureCard
            title='Automated Usage & Billing'
            description='Real-time tracking of API calls, storage, messages, etc. Soft/hard limits with automated overage billing. Analytics & insights powered by PostHog.'
          />
          <FeatureCard
            title='Embeddable Widgets & Scripts'
            description='Checkout buttons, signup forms, and product widgets. Rapid updates and A/B testing without redeploys. Fully customizable to match your brand.'
          />
          <FeatureCard
            title='White-Label SaaS Sites'
            description='Branded subscription and pricing pages that look native to your site. Automatic account management for customers. Part of a SaaS creator ecosystem—SEO-optimized pages drive discovery and cross-pollination. Updates automatically sync from product/tier configuration and embed changes.'
          />
        </div>
      </Container>
    </section>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className='rounded-xl bg-white p-6 shadow-lg transition-shadow duration-300 hover:shadow-xl'>
      <h3 className='mb-2 text-xl font-semibold text-gray-900'>{title}</h3>
      <p className='text-gray-600'>{description}</p>
    </div>
  );
}

function BenefitsSection() {
  return (
    <section className='rounded-lg bg-gradient-to-r from-blue-600 via-white to-orange-600 p-8 text-center text-gray-900 lg:p-16'>
      <Container>
        <div className='mx-auto max-w-4xl space-y-6'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 lg:text-4xl'>
            Spend Less Time on Billing, More Time Growing & Optimizing
          </h2>
          <ul className='grid gap-4 text-left text-lg md:grid-cols-2'>
            <li className='flex items-start gap-3'>
              <CheckIcon />
              <span>Launch fast — no custom dev work needed.</span>
            </li>
            <li className='flex items-start gap-3'>
              <CheckIcon />
              <span>Reduce churn — tier enforcement and usage alerts prevent surprises.</span>
            </li>
            <li className='flex items-start gap-3'>
              <CheckIcon />
              <span>Maximize revenue — overages billed automatically.</span>
            </li>
            <li className='flex items-start gap-3'>
              <CheckIcon />
              <span>Rapidly test and iterate — embeds and pages can change instantly without redeployment.</span>
            </li>
            <li className='flex items-start gap-3'>
              <CheckIcon />
              <span>Automatic Stripe sync — pricing updates propagate automatically.</span>
            </li>
            <li className='flex items-start gap-3'>
              <CheckIcon />
              <span>Boost discoverability — creator ecosystem + SEO-optimized pages drive traffic and cross-pollination.</span>
            </li>
            <li className='flex items-start gap-3'>
              <CheckIcon />
              <span>Get actionable insights — real-time analytics and dashboards powered by PostHog.</span>
            </li>
          </ul>
        </div>
      </Container>
    </section>
  );
}

function CheckIcon() {
  return (
    <svg className='mt-1 h-5 w-5 flex-shrink-0 text-green-500' fill='currentColor' viewBox='0 0 20 20'>
      <path
        fillRule='evenodd'
        d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
        clipRule='evenodd'
      />
    </svg>
  );
}

function HowItWorksSection() {
  return (
    <section id='how-it-works' className='py-16 lg:py-24'>
      <Container>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 lg:text-4xl'>How It Works</h2>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            Launch your SaaS platform in a snap with these simple steps.
          </p>
        </div>

        <div className='grid gap-8 md:grid-cols-2 lg:grid-cols-3'>
          <StepCard
            step='1'
            title='Connect Stripe and import products.'
            description='Seamlessly link your Stripe account and bring in your existing products, or create new ones directly.'
          />
          <StepCard
            step='2'
            title='Define tiers, features, and usage limits.'
            description='Set up flexible subscription tiers with custom features, usage caps, and overage pricing.'
          />
          <StepCard
            step='3'
            title='Deploy embeds anywhere and run A/B tests or rapid changes instantly.'
            description='Generate customizable embeddable widgets and deploy them on any website. Update and test them in real-time without redeploying your site.'
          />
          <StepCard
            step='4'
            title='Launch white-label SaaS sites that look native and integrate with your product/tier configuration.'
            description='Deploy fully branded landing, pricing, and account management pages that automatically reflect your product and tier settings.'
          />
          <StepCard
            step='5'
            title='Track real-time usage, revenue, and overages with PostHog dashboards.'
            description='Monitor your platform’s performance with comprehensive analytics, including live usage, revenue, and churn data.'
          />
          <StepCard
            step='6'
            title='Enjoy automatic Stripe syncing for pricing and subscription updates.'
            description='Any changes to your products or tiers automatically sync with Stripe, ensuring your billing is always up-to-date.'
          />
        </div>
      </Container>
    </section>
  );
}

function StepCard({ step, title, description }: { step: string; title: string; description: string }) {
  return (
    <div className='rounded-xl bg-white p-6 shadow-lg transition-shadow duration-300 hover:shadow-xl'>
      <div className='mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-600'>
        {step}
      </div>
      <h3 className='mb-2 text-xl font-semibold text-gray-900'>{title}</h3>
      <p className='text-gray-600'>{description}</p>
    </div>
  );
}

function AnalyticsSection() {
  return (
    <section className='py-16 lg:py-24'>
      <Container>
        <div className='mb-16 text-center'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 lg:text-4xl'>Real-Time Insights at Your Fingertips</h2>
          <p className='mx-auto max-w-2xl text-xl text-gray-600'>
            Gain deep understanding of your platform&apos;s performance and customer behavior.
          </p>
        </div>
        <div className='grid gap-8 md:grid-cols-2'>
          <div className='space-y-6'>
            <p className='text-lg text-gray-700'>
              Monitor usage, tier adoption, and overages with live dashboards. Track embed performance and A/B tests without writing code. Understand customer behavior and optimize tiers with PostHog analytics. Visualize revenue, churn, and usage trends across your products and tiers.
            </p>
            <Button asChild variant='sexy' size='lg'>
              <Link href='/creator/dashboard/analytics'>
                <span>View Live Analytics</span>
              </Link>
            </Button>
          </div>
          {/* Visual Placeholder */}
          <div className='flex items-center justify-center rounded-lg bg-gray-100 p-8 shadow-inner'>
            <div className='text-center text-gray-400'>
              <p className='text-lg font-semibold'>Dashboard screenshots showing charts, usage meters, overage alerts, and embed conversion stats.</p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function EcosystemDiscoverySection() {
  return (
    <section className='rounded-lg bg-gradient-to-br from-purple-50 via-white to-pink-50 p-8 text-center lg:p-16'>
      <Container>
        <div className='mx-auto max-w-4xl space-y-6'>
          <h2 className='mb-4 text-3xl font-bold text-gray-900 lg:text-4xl'>Grow Faster in a Connected Creator Network</h2>
          <div className='grid gap-8 md:grid-cols-2'>
            <div className='space-y-6 text-left'>
              <p className='text-lg text-gray-700'>
                All white-label sites are SEO-optimized and discoverable. Drive cross-pollination among SaaS creators for organic traffic. Embed scripts, pages, and pricing changes propagate across the ecosystem, helping your products gain visibility instantly.
              </p>
              <Button asChild variant='outline' size='lg'>
                <Link href='/c'>
                  <span>Explore Creator Network</span>
                </Link>
              </Button>
            </div>
            {/* Visual Placeholder */}
            <div className='flex items-center justify-center rounded-lg bg-gray-100 p-8 shadow-inner'>
              <div className='text-center text-gray-400'>
                <p className='text-lg font-semibold'>Graph showing multiple creators connected via SEO-optimized pages and embedded widgets.</p>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}