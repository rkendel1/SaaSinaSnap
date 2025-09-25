import { PropsWithChildren } from 'react';
import type { Metadata } from 'next';
// import { Montserrat, Montserrat_Alternates } from 'next/font/google';
import Link from 'next/link';
import { IoLogoFacebook, IoLogoInstagram, IoLogoTwitter } from 'react-icons/io5';

import { AppBar } from '@/components/app-bar'; // Import the new AppBar client component
import { Container } from '@/components/container';
import { Logo } from '@/components/logo';
import { PostHogPageview, PostHogProvider } from '@/components/posthog-provider';
import { Toaster } from '@/components/ui/toaster';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getUser } from '@/features/account/controllers/get-user';
import { Analytics } from '@vercel/analytics/react';

import '@/styles/globals.css';

export const dynamic = 'force-dynamic';

// const montserrat = Montserrat({
//   variable: '--font-montserrat',
//   subsets: ['latin'],
// });

// const montserratAlternates = Montserrat_Alternates({
//   variable: '--font-montserrat-alternates',
//   weight: ['500', '600', '700'],
//   subsets: ['latin'],
// });

export const metadata: Metadata = {
  title: 'SaaS in a Snap - Lifts creators instantly into monetization',
  description: 'SaaS in a Snap lifts creators instantly into monetization. Build and launch your SaaS platform in minutes.',
};

export default async function RootLayout({ children }: PropsWithChildren) {
  const authenticatedUser = await getAuthenticatedUser(); // Use getAuthenticatedUser
  const user = authenticatedUser ? await getUser() : null; // Fetch user profile if authenticated

  return (
    <html lang='en'>
      <body>
        <div className='m-auto flex h-full max-w-[1440px] flex-col px-4'>
          <AppBar session={authenticatedUser ? { user: authenticatedUser } : null} user={user} /> {/* Pass a session-like object */}
          <main className='relative flex-1'>
            <PostHogProvider>
              <PostHogPageview />
              <div className='relative h-full'>{children}</div>
              <Toaster />
              <Analytics />
            </PostHogProvider>
          </main>
          <Footer />
        </div>
      </body>
    </html>
  );
}

function Footer() {
  return (
    <footer className='mt-16 pt-12 pb-8 border-t border-gray-200'>
      <Container>
        <div className='flex flex-col lg:flex-row justify-between items-center gap-8'>
          <div className='flex items-center gap-8'>
            <Logo />
            <div className='hidden sm:flex items-center gap-6 text-sm text-gray-600'>
              <Link href='/pricing' className='hover:text-gray-900 transition-colors'>Pricing</Link>
              <Link href='/about-us' className='hover:text-gray-900 transition-colors'>About</Link>
              <Link href='/privacy' className='hover:text-gray-900 transition-colors'>Privacy</Link>
              <Link href='/support' className='hover:text-gray-900 transition-colors'>Support</Link>
            </div>
          </div>
          
          <div className='flex items-center gap-6'>
            <div className='flex items-center gap-4'>
              <Link href='#' className='text-gray-400 hover:text-gray-600 transition-colors'>
                <IoLogoTwitter size={20} />
              </Link>
              <Link href='#' className='text-gray-400 hover:text-gray-600 transition-colors'>
                <IoLogoFacebook size={20} />
              </Link>
              <Link href='#' className='text-gray-400 hover:text-gray-600 transition-colors'>
                <IoLogoInstagram size={20} />
              </Link>
            </div>
            <div className='text-sm text-gray-500'>
              © {new Date().getFullYear()} SaaSinaSnap
            </div>
          </div>
        </div>
        
        {/* Mobile menu for smaller screens */}
        <div className='sm:hidden flex justify-center items-center gap-6 mt-6 pt-6 border-t border-gray-100 text-sm text-gray-600'>
          <Link href='/pricing' className='hover:text-gray-900 transition-colors'>Pricing</Link>
          <Link href='/about-us' className='hover:text-gray-900 transition-colors'>About</Link>
          <Link href='/privacy' className='hover:text-gray-900 transition-colors'>Privacy</Link>
          <Link href='/support' className='hover:text-gray-900 transition-colors'>Support</Link>
        </div>
      </Container>
    </footer>
  );
}