'use client';

import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href='/' className='flex w-fit items-center gap-2'>
      <Image
        src='/sss_logo.png'
        width={40}
        height={40}
        priority
        quality={100}
        alt='PayLift logo mark'
      />
      <span className='font-alt text-xl text-gray-900'>PayLift</span>
    </Link>
  );
}