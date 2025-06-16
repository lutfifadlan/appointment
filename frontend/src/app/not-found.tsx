import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import CustomBackground from '@/components/custom-ui/backgrounds/custom';

export default function NotFound() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-gray-100 dark:bg-gray-900">
      <CustomBackground type="animated-grid" />
      <div className="text-center z-10">
        <h1 className="text-6xl font-bold text-gray-800 dark:text-white">404</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
          The page you are looking for does not exist.
        </p>
        <Link href="/">
          <Button className="mt-6 cursor-pointer">Go Back Home</Button>
        </Link>
      </div>
    </div>
  );
}