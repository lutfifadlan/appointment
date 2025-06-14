"use client"

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const ContactUsForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();
        
        if (typeof window !== 'undefined') {
          const urlParams = new URLSearchParams(window.location.search);
          const prefillEmailParam = urlParams.get('email');
          setEmail(prefillEmailParam || (data.valid ? data.user?.email : '') || '');
        }
      } catch (error) {
        console.error('Error fetching session:', error);
      }
    };
    
    fetchSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, message }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error);

      toast.success("Thank you for your message. We will review it and get back to you");

      setEmail('');
      setMessage('');
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      toast.error("There was a problem sending your message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 flex-grow flex flex-col">
      <div>
        <label htmlFor="email" className="block mb-3">Email</label>
        <Input
          id="email"
          type="email"
          placeholder="Your email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-3 border rounded-md"
        />
      </div>
      <div className="flex-grow flex flex-col">
        <label htmlFor="message" className="block mb-3">Message</label>
        <Textarea
          id="message"
          placeholder="Your message"
          required
          className="flex-grow p-3 border rounded-md"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      <Button type="submit" className="w-full py-3 rounded-md hover:bg-primary-dark cursor-pointer" disabled={isSubmitting}>
        {isSubmitting ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
};

export default ContactUsForm;