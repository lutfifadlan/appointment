'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from 'next/image';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import { cn } from '@/lib/utils';
import { Common } from '@/constants';
import { Particles } from '@/components/magicui/particles';

const ForgetPassword: React.FC = () => {
  const [email, setEmail] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const router = useRouter();
  const logoSrc = Common.logo;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setIsSubmitted(true);
        toast(
          "Success",
          data.message,
        );
      } else {
        throw new Error(data.message || 'An error occurred');
      }
    } catch (error) {
      console.error(error);
      toast(
        error instanceof Error ? error.message : "An unexpected error occurred. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col md:flex-row">
      {/* Left: Quote and background */}
      <div className="relative flex-1 h-full flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-300 to-gray-400 text-gray-900 p-8 overflow-hidden">
        <div className="absolute inset-0 opacity-30 z-0">
          {/* Optional: Background image or pattern */}
          <AnimatedGridPattern
            numSquares={30}
            maxOpacity={1}
            duration={3}
            className={cn("w-full h-full skew-y-12")}
          />
        </div>
        <div className="relative z-10 max-w-lg text-center flex flex-col items-center">
          <blockquote className="text-2xl md:text-3xl font-semibold leading-snug mb-6 drop-shadow-lg">
            I&apos;m not a great programmer; I&apos;m just a good programmer with great habits.
          </blockquote>
          <span className="block text-lg font-medium opacity-90">– Kent Back</span>
        </div>
      </div>
      {/* Right: Sign In Frame */}
      <div className="flex-1 h-full flex items-center justify-center bg-background dark:bg-gray-950 relative">
        <div className="absolute inset-0 z-0">
          <Particles className="h-full w-full" size={0.7} quantity={100} color="#000000"/>
        </div>
        <motion.div 
          className="z-10 bg-background p-8 rounded-xl w-full max-w-md border border-gray-300 dark:border-gray-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Link href="/" className="flex items-center space-x-2">
              <Image src={logoSrc} alt="Logo" width={40} height={40} priority/>
              <div className="text-3xl font-bold text-center">
                {Common.title}
              </div>
            </Link>
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Forget Password</h2>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email" className="pb-2">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                  required
                  className="w-full"
                  placeholder="Enter your email address"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 transition duration-300 ease-in-out cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Sending..." : "Send Reset Instructions"}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <p className="mb-4">Password reset instructions have been sent to your email if an account exists.</p>
              <Button
                onClick={() => router.push('/auth/signin')}
                className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 transition duration-300 ease-in-out cursor-pointer"
              >
                Return to Sign In
              </Button>
            </div>
          )}
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link href="/auth/signin" className="text-primary hover:underline font-semibold">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ForgetPassword;