'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { ShimmerButton } from '@/components/magicui/shimmer-button'

const GetStartedButton = () => {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleClick = useCallback(async () => {
    setLoading(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
    router.push('/auth/signin');
  }, [router]);

  return (
    <ShimmerButton
      className="shadow-2xl h-12 dark:bg-white/10 relative"
      onClick={handleClick}
      disabled={loading}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
          </svg>
          Loading...
        </span>
      ) : (
        <span className="whitespace-pre-wrap text-center text-sm leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
          Get Started Now
        </span>
      )}
    </ShimmerButton>
  );
}

export default GetStartedButton