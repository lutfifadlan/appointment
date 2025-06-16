'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { motion } from "framer-motion";
import Image from 'next/image';
import Link from 'next/link';
import { AnimatedGridPattern } from '@/components/magicui/animated-grid-pattern';
import { Particles } from '@/components/magicui/particles';
import { cn } from '@/lib/utils';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff } from 'lucide-react';
import { Common } from '@/constants';

const SignUp: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    consent: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const logoSrc = Common.logo;

  const validatePassword = (password: string): boolean => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { name, email, password, role, consent } = formData;

    if (!consent) {
      toast("Consent Required");
      return;
    }

    if (!validatePassword(password)) {
      toast("Invalid Password");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (res.ok) {
        toast("Registered successfully!");
        router.push('/auth/signin');
      } else {
        const data = await res.json();
        toast(data.message);
      }
    } catch (err) {
      console.error(err);
      toast("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row">
      {/* Left: Quote and background */}
      <div className="relative flex-1 flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-300 to-gray-400 text-gray-900 p-8 overflow-hidden">
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
            “The best way to get better at programming is to write more code”
          </blockquote>
          <span className="block text-lg font-medium opacity-90">- John Carmack</span>
        </div>
      </div>
      {/* Right: Sign Up Frame */}
      <div className="flex-1 flex items-center justify-center bg-background dark:bg-gray-950 relative">
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
            <Image src={logoSrc} alt="logo" width={40} height={40} priority />
            <div className="text-3xl font-bold text-center">
              {Common.title}
            </div>
          </Link>
        </div>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  className="w-full pr-10"
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
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <div className="flex flex-row items-center space-x-2">
                <Checkbox
                  id="consent"
                  name="consent"
                  checked={formData.consent}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, consent: checked as boolean }))}
                  className="cursor-pointer"
                />
                <span className="text-sm">Accept terms and conditions</span>
              </div>
              <Label
                htmlFor="consent"
                className="text-xs leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                <div className="text-xs">
                  You agree to our{' '}
                  <Link href="/terms-of-service" className="text-primary underline cursor-pointer">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy-policy" className="text-primary underline cursor-pointer">
                    Privacy Policy
                  </Link>
                </div>
              </Label>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary text-primary-foreground font-bold py-2 px-4 transition duration-300 ease-in-out cursor-pointer" 
              disabled={isLoading}
            >
              {isLoading ? "Registering..." : "Register"}
            </Button>
          </form>
          <Separator className="my-4" />
        </CardContent>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/signin" className="text-primary hover:underline font-semibold">
            Sign in
          </Link>
        </p>
      </motion.div>
      </div>
    </div>
  );
};

export default SignUp;