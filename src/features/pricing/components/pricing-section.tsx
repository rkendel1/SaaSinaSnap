import Image from 'next/image';

import { PricingCard } from '@/features/pricing/components/price-card';
import { getProducts } from '@/features/pricing/controllers/get-products';

import { createCheckoutAction } from '../actions/create-checkout-action';
import { ProductWithPrices } from '../types'; // Import ProductWithPrices type

export async function PricingSection({ isPricingPage }: { isPricingPage?: boolean }) {
  // Only show approved products on public pricing pages
  const products = await getProducts({ approvedOnly: true });

  const HeadingLevel = isPricingPage ? 'h1' : 'h2';

  return (
    <section className='relative rounded-lg bg-white py-8'> {/* Changed bg-black to bg-white */}
      <div className='relative z-10 m-auto flex max-w-[1200px] flex-col items-center gap-8 px-4 pt-8 lg:pt-[140px]'>
        <HeadingLevel className='max-w-4xl bg-gradient-to-br from-gray-900 to-gray-700 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-6xl'> {/* Adjusted for light theme */}
          Predictable pricing for every use case.
        </HeadingLevel>
        <p className='text-center text-xl text-gray-600'> {/* Adjusted text color */}
          Find a plan that fits you. Upgrade at any time to enable additional features.
        </p>
        <div className='flex w-full flex-col items-center justify-center gap-2 lg:flex-row lg:gap-8'>
          {products.map((product) => {
            return <PricingCard key={(product as ProductWithPrices).id} product={product as ProductWithPrices} createCheckoutAction={createCheckoutAction} />;
          })}
        </div>
      </div>
      <Image
        src='/section-bg.png'
        width={1440}
        height={462}
        alt=''
        className='absolute left-0 top-0 rounded-t-lg'
        priority={isPricingPage}
        quality={100}
      />
    </section>
  );
}