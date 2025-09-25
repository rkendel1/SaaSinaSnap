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
          <div className='mb-6 w-fit rounded-full bg-gradient-to-r from-blue-600 via-orange-600 to-yellow-600 px-6 py-2 shadow-lg'>
            <span className='font-alt text-sm font-semibold text-white'>
              ✨ Generate banners with AI • Powered by DALL·E
            </span>
          </div>
          <h1 className='mb-6 text-4xl lg:text-6xl font-bold bg-gradient-to-br from-gray-900 via-blue-800 to-orange-800 bg-clip-text text-transparent'>
            Instantly craft stunning Twitter banners that captivate
          </h1>
          <p className='mb-8 text-xl text-gray-600 max-w-2xl leading-relaxed'>
            Transform your social media presence with AI-powered banner generation. 
            Create professional, eye-catching designs in seconds, not hours.
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
              <span>5 free banners to start</span>
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
            Create professional Twitter banners in three simple steps
          </p>
        </div>
        
        <div className='grid md:grid-cols-3 gap-8 lg:gap-12'>
          {/* Step 1 */}
          <div className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
              <span className='text-2xl font-bold text-white'>1</span>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-3'>
              Describe your vision
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              Tell our AI what kind of banner you want. Be as creative or specific as you like - our AI understands natural language.
            </p>
          </div>
          
          {/* Step 2 */}
          <div className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
              <span className='text-2xl font-bold text-white'>2</span>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-3'>
              AI generates options
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              Our DALL·E integration creates multiple unique banner designs based on your description in just seconds.
            </p>
          </div>
          
          {/* Step 3 */}
          <div className='text-center'>
            <div className='w-16 h-16 bg-gradient-to-br from-pink-500 to-red-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg'>
              <span className='text-2xl font-bold text-white'>3</span>
            </div>
            <h3 className='text-xl font-semibold text-gray-900 mb-3'>
              Download & use
            </h3>
            <p className='text-gray-600 leading-relaxed'>
              Choose your favorite design and download it in the perfect size for Twitter. Ready to make your profile stand out!
            </p>
          </div>
        </div>
        
        <div className='text-center mt-12'>
          <Button asChild variant='sexy' size='lg'>
            <Link href='/signup'>
              <span>Try it now - it&apos;s free!</span>
            </Link>
          </Button>
        </div>
      </Container>
    </section>
  );
}

function ExamplesSection() {
  return (
    <section className='py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-blue-50 rounded-3xl overflow-hidden'>
      <Container>
        <div className='text-center mb-12'>
          <h2 className='text-3xl lg:text-4xl font-bold text-gray-900 mb-4'>
            Banner inspiration gallery
          </h2>
          <p className='text-xl text-gray-600 max-w-2xl mx-auto'>
            See the quality and variety of banners our AI creates
          </p>
        </div>
        
        <div className='space-y-6'>
          <div className='flex justify-center gap-4 overflow-hidden'>
            <Image
              className='flex-shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'
              src='/example1.png'
              width={600}
              height={200}
              alt='AI-generated Twitter banner example showing modern design'
              quality={100}
            />
            <Image
              className='flex-shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'
              src='/example2.png'
              width={600}
              height={200}
              alt='AI-generated Twitter banner example with creative graphics'
              quality={100}
            />
            <Image
              className='flex-shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'
              src='/example3.png'
              width={600}
              height={200}
              alt='AI-generated Twitter banner example with professional style'
              quality={100}
            />
          </div>
          <div className='flex gap-4 overflow-hidden'>
            <Image
              className='flex-shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'
              src='/example4.png'
              width={600}
              height={200}
              alt='AI-generated Twitter banner example with vibrant colors'
              quality={100}
            />
            <Image
              className='flex-shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'
              src='/example5.png'
              width={600}
              height={200}
              alt='AI-generated Twitter banner example with artistic elements'
              quality={100}
            />
            <Image
              className='flex-shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'
              src='/example6.png'
              width={600}
              height={200}
              alt='AI-generated Twitter banner example with modern typography'
              quality={100}
            />
          </div>
          <div className='flex justify-center gap-4 overflow-hidden'>
            <Image
              className='flex-shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'
              src='/example7.png'
              width={600}
              height={200}
              alt='AI-generated Twitter banner example with creative composition'
              quality={100}
            />
            <Image
              className='flex-shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'
              src='/example8.png'
              width={600}
              height={200}
              alt='AI-generated Twitter banner example with bold design'
              quality={100}
            />
            <Image
              className='flex-shrink-0 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300'
              src='/example9.png'
              width={600}
              height={200}
              alt='AI-generated Twitter banner example with elegant styling'
              quality={100}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}

function CreatorSection() {
  return (
    <section className='rounded-lg bg-gradient-to-r from-blue-600 to-orange-600 p-8 lg:p-16 text-white text-center'>
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
            <div className='bg-white/20 rounded-lg p-6'> {/* Adjusted opacity for light theme */}
              <div className='text-2xl mb-3'>💳</div>
              <h3 className='font-semibold mb-2'>Payment Processing</h3>
              <p className='text-sm text-blue-100'>
                Stripe Connect integration for secure payments and automatic payouts
              </p>
            </div>
            <div className='bg-white/20 rounded-lg p-6'> {/* Adjusted opacity for light theme */}
              <div className='text-2xl mb-3'>🎨</div>
              <h3 className='font-semibold mb-2'>White-Label Pages</h3>
              <p className='text-sm text-blue-100'>
                Branded storefronts with your logo, colors, and custom domain
              </p>
            </div>
            <div className='bg-white/20 rounded-lg p-6'> {/* Adjusted opacity for light theme */}
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