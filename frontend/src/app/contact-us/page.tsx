import React from 'react';
import ContactUsForm from '@/components/contact-us-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail } from 'lucide-react';
import { Email } from '@/constants';
import CommonLayout from '@/components/common-layout';

export default function ContactUsPage() {
  return (
    <CommonLayout>
      <Card className="mx-auto max-w-6xl border-none shadow-none dark:bg-black">
        <CardHeader className="p-6 sm:p-8">
          <CardTitle className="text-3xl sm:text-4xl font-bold">Contact Us</CardTitle>
          <p className="text-base mt-3">We&apos;re here to help. Reach out to us with any questions or concerns.</p>
        </CardHeader>
        <CardContent className="p-6 sm:p-8">
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-8 sm:gap-10">
            <section className="flex flex-col h-full">
              <h2 className="text-2xl sm:text-3xl font-bold mb-5">Send us a message</h2>
              <ContactUsForm />
            </section>

            <section className="flex flex-col h-full">
              <h2 className="text-2xl sm:text-3xl font-bold mb-5">Contact Information</h2>
              <div className="space-y-5 sm:space-y-7 flex-grow">
                <div className="flex items-center space-x-3">
                  <Mail className="text-primary flex-shrink-0" />
                  <span className="flex-shrink-0">Email: </span>
                  <a href={`mailto:${Email.supportEmail}`} className="text-primary hover:underline break-all">
                    {Email.supportEmail}
                  </a>
                </div>
              </div>
            </section>
          </div>
        </CardContent>
      </Card>
    </CommonLayout>
  );
}