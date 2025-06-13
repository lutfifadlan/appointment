'use client'
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from 'next/image';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import { cn } from '@/lib/utils';
import { Common } from '@/constants';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Eye, EyeOff } from 'lucide-react';
import { Particles } from '@/components/magicui/particles';

const passwordSchema = z.object({
  password: z.string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/^(?=.*[a-z])/, "Password must include at least one lowercase letter")
    .regex(/^(?=.*[A-Z])/, "Password must include at least one uppercase letter")
    .regex(/^(?=.*\d)/, "Password must include at least one number")
    .regex(/^(?=.*[@$!%*?&])/, "Password must include at least one special character"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const ResetPassword: React.FC = () => {
  const [token, setToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();
  const logoSrc = Common.logo;

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const token = searchParams.get('token');
      if (token) {
        setToken(token);
      }
    }
  }, []);

  const onSubmit = async (data: PasswordFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password: data.password }),
      });
      const responseData = await response.json();
      if (response.ok) {
        setIsSuccess(true);
        toast(
          "Your password has been reset successfully",
        );
      } else {
        throw new Error(responseData.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error(error);
      toast(
        error instanceof Error ? error.message : "An unexpected error occurred",
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
          className="z-10 bg-background p-8 rounded-xl w-full max-w-md border border-gray-300 dark:border-gray-700 shadow-[6px_6px_0px_#000] dark:shadow-[6px_6px_0px_#e9ecef]"
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
          <h2 className="text-2xl font-bold text-center mb-6">Reset Your Password</h2>
          {!isSuccess ? (
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter new password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute inset-y-0 right-0 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Confirm new password"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute inset-y-0 right-0 flex items-center"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 transition duration-300 ease-in-out cursor-pointer"
                disabled={isLoading}
              >
                {isLoading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          </Form>
        ) : (
          <div className="text-center">
            <p className="mb-4">Your password has been reset successfully.</p>
            <Button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 transition duration-300 ease-in-out cursor-pointer"
            >
              Go to Sign In
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

export default ResetPassword;