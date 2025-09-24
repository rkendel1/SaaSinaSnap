import Image from 'next/image';
import Link from 'next/link';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';
import { PricingSection } from '@/features/pricing/components/pricing-section';

export default async function HomePage() {
  return (
    <div className='flex flex-col gap-8 lg:gap-32'>
      <HeroSection />
      <ExamplesSection />
      <PricingSection />
      <CreatorSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className='relative overflow-hidden lg:overflow-visible'>
      <Container className='relative rounded-lg bg-black py-20 lg:py-[140px]'>
        <div className='relative z-10 flex flex-col gap-5 lg:max-w-xl lg:pl-8'>
          <div className='w-fit rounded-full bg-gradient-to-r from-[#616571] via-[#7782A9] to-[#826674] px-4 py-1 '>
            <span className='font-alt text-sm font-semibold text-black mix-blend-soft-light'>
              Generate banners with DALL·E
            </span>
          </div>
          <h1>Instantly craft stunning Twitter banners.</h1>
          <Button asChild variant='sexy'>
            <Link href='/signup'><span>Get started for free</span></Link>
          </Button>
        </div>
      </Container>
      <Image
        src='/hero-shape.png'
        width={867}
        height={790}
        alt=''
        className='absolute right-0 top-0 rounded-tr-lg'
        priority
        quality={100}
      />
    </section>
  );
}

function ExamplesSection() {
  return (
    <section className='flex flex-col gap-4 overflow-hidden rounded-lg bg-black py-8'>
      <div className='flex justify-center gap-4'>
        <Image
          className='flex-shrink-0'
          src='/example1.png'
          width={600}
          height={200}
          alt='Example of a generated banner'
          quality={100}
        />
        <Image
          className='flex-shrink-0'
          src='/example2.png'
          width={600}
          height={200}
          alt='Example of a generated banner'
          quality={100}
        />
        <Image
          className='flex-shrink-0'
          src='/example3.png'
          width={600}
          height={200}
          alt='Example of a generated banner'
          quality={100}
        />
      </div>
      <div className='flex gap-4'>
        <Image
          className='flex-shrink-0'
          src='/example4.png'
          width={600}
          height={200}
          alt='Example of a generated banner'
          quality={100}
        />
        <Image
          className='flex-shrink-0'
          src='/example5.png'
          width={600}
          height={200}
          alt='Example of a generated banner'
          quality={100}
        />
        <Image
          className='flex-shrink-0'
          src='/example6.png'
          width={600}
          height={200}
          alt='Example of a generated banner'
          quality={100}
        />
      </div>
      <div className='flex justify-center gap-4'>
        <Image
          className='flex-shrink-0'
          src='/example7.png'
          width={600}
          height={200}
          alt='Example of a generated banner'
          quality={100}
        />
        <Image
          className='flex-shrink-0'
          src='/example8.png'
          width={600}
          height={200}
          alt='Example of a generated banner'
          quality={100}
        />
        <Image
          className='flex-shrink-0'
          src='/example9.png'
          width={600}
          height={200}
          alt='Example of a generated banner'
          quality={100}
        />
      </div>
    </section>
  );
}

function CreatorSection() {
  return (
    <section className='rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 p-8 lg:p-16 text-white text-center'>
      <Container>
        <div className='max-w-3xl mx-auto space-y-6'>
          <div className='space-y-4'>
            <h2 className='text-3xl lg:text-4xl font-bold'>
              Launch Your Own SaaS Platform
            </h2>
            <p className='text-xl text-blue-100'>
              Lifts creators instantly into monetization. Turn your expertise into a profitable SaaS business with everything you need to accept payments, manage customers, and grow your revenue.
            </p>
          </div>
          
          <div className='grid md:grid-cols-3 gap-6 text-left'>
            <div className='bg-white/10 rounded-lg p-6'>
              <div className='text-2xl mb-3'>💳</div>
              <h3 className='font-semibold mb-2'>Payment Processing</h3>
              <p className='text-sm text-blue-100'>
                Stripe Connect integration for secure payments and automatic payouts
              </p>
            </div>
            <div className='bg-white/10 rounded-lg p-6'>
              <div className='text-2xl mb-3'>🎨</div>
              <h3 className='font-semibold mb-2'>White-Label Pages</h3>
              <p className='text-sm text-blue-100'>
                Branded storefronts with your logo, colors, and custom domain
              </p>
            </div>
            <div className='bg-white/10 rounded-lg p-6'>
              <div className='text-2xl mb-3'>📊</div>
              <h3 className='font-semibold mb-2'>Analytics & Insights</h3>
              <p className='text-sm text-blue-100'>
                Track sales, customers, and growth with built-in analytics
              </p>
            </div>
          </div>

          <div className='space-y-4'>
            <Button asChild size='lg' className='bg-white text-blue-600 hover:bg-white/90'>
              <Link href='/creator/onboarding'><span>Start Building Your SaaS</span></Link>
            </Button>
            <p className='text-sm text-blue-200'>
              Set up in minutes. No coding required. 5% platform fee on sales.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}