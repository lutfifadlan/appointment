'use client'
import React, { useState, useEffect, Suspense } from "react";

import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from "next/image";
import { AnimatedGridPattern } from "@/components/magicui/animated-grid-pattern";
import { cn } from "@/lib/utils";
import { Common } from "@/constants";
import { Particles } from "@/components/magicui/particles";
import Loading from "@/components/loading";
import { Eye, EyeOff } from 'lucide-react';

const SearchParamsHandler = ({ onParamsReady }: { onParamsReady: (callbackUrl: string, verified: string | null) => void }) => {
  const searchParams = useSearchParams();
  useEffect(() => {
    const callbackUrl = searchParams.get("callbackUrl") || "/";
    const verified = searchParams.get("verified");
    onParamsReady(callbackUrl, verified);
  }, [searchParams, onParamsReady]);
  return null;
};

const SignIn: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [verified, setVerified] = useState<string | null>(null);
  const [sessionLoading, setSessionLoading] = useState<boolean>(true); // NEW: loading state for session check
  const router = useRouter();

  const logoSrc = Common.logo;

  const handleParamsReady = (url: string, isVerified: string | null) => {
    setVerified(isVerified);
  };

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    const savedPassword = localStorage.getItem("rememberedPassword");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
    if (savedPassword) {
      setPassword(savedPassword);
    }
    if (verified) {
      toast.success("Email verified successfully! You can now sign in.");
    }
    // Check session status via API
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session");
        const data = await res.json();
        if (data && data.email) {
          router.replace("/dashboard");
        } else {
          setSessionLoading(false); // Session invalid, show sign-in form
        }
      } catch {
        setSessionLoading(false); // On error, allow sign-in form
      }
    };
    checkSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verified]); // router.replace is safe to omit from deps


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", email);
        localStorage.setItem("rememberedPassword", password);
      } else {
        localStorage.removeItem("rememberedEmail");
        localStorage.removeItem("rememberedPassword");
      }

      const response = await fetch("/api/auth/signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || data.message || "Invalid credentials.");
      } else {
        toast.success("Signed in successfully!");
        // After login, verify session and redirect
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        if (sessionData && sessionData.email) {
          await router.replace("/dashboard");
        } else {
          toast.error("Session validation failed. Please try again.");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google sign-in removed. If you want to support Google login, implement a custom OAuth flow or remove the button below.

  if (sessionLoading) {
    return <Loading fullscreen />;
  }

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
            &quot;The key to becoming a great programmer is to write a lot of code and read a lot of code.&quot;
          </blockquote>
          <span className="block text-lg font-medium opacity-90">– Peter Norvig</span>
        </div>
      </div>
      {/* Right: Sign In Frame */}
      <div className="flex-1 h-full flex items-center justify-center bg-background dark:bg-gray-950 relative">
        <div className="absolute inset-0 z-0">
          <Particles className="h-full w-full" size={0.7} quantity={100} color="#000000"/>
        </div>
        <Suspense fallback={null}>
          <SearchParamsHandler onParamsReady={handleParamsReady} />
        </Suspense>
        <motion.div
          className="z-10 bg-background p-8 rounded-xl w-full max-w-md border border-gray-300 dark:border-gray-700"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Link href="/" className="flex items-center space-x-2">
              <Image src={logoSrc} alt="Logo" width={40} height={40} priority />
              <div className="text-3xl font-bold text-center">
                {Common.title}
              </div>
            </Link>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg max-w-md w-full dark:bg-gray-950">
            <div>
              <Label htmlFor="email" className="pb-1">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <Label htmlFor="password" className="pb-1">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                  required
                  className="w-full"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-500" /> : <Eye className="h-4 w-4 text-gray-500" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked: boolean) => setRememberMe(checked)}
                  className="cursor-pointer"
                />
                <Label htmlFor="rememberMe">Remember me</Label>
              </div>
              <Link href="/auth/forget-password" className="text-sm text-primary hover:underline">
                Forget password?
              </Link>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 transition duration-300 ease-in-out cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Signing In..." : "Sign In"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{' '}
            <Link href="/auth/signup" className="text-primary hover:underline font-semibold">
              Sign up
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default SignIn;
