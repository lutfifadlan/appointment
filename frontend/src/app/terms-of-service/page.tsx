import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { Mail } from 'lucide-react';
import { Email, Launch } from '@/constants';
import CommonLayout from '@/components/common-layout';

const TermsOfService: React.FC = () => {
  const terms = [
    {
      title: "1. Acceptance of Terms",
      content: "By using SyncPoint, our collaborative appointment management platform, you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the service."
    },
    {
      title: "2. Description of Service",
      content: "SyncPoint is a collaborative appointment scheduling and management platform that enables multiple users to create, edit, and manage appointments in real-time. Our service includes features such as appointment locking mechanisms, real-time collaboration, user presence indicators, and administrative controls for conflict resolution."
    },
    {
      title: "3. User Accounts and Responsibilities",
      content: "To use SyncPoint, you must create an account with valid credentials. You are responsible for maintaining the confidentiality of your login information and for all activities under your account. You agree not to share accounts, impersonate others, or provide false information. You must notify us immediately of any unauthorized use of your account."
    },
    {
      title: "4. Appointment Management and Collaboration",
      content: "When using SyncPoint's collaborative features, you agree to use the locking mechanism responsibly. Do not hold locks unnecessarily or attempt to circumvent the system. Respect other users' editing sessions and follow your organization's protocols for appointment management. You are responsible for the accuracy of appointment information you create or modify."
    },
    {
      title: "5. Real-Time Features and Data Usage",
      content: "SyncPoint uses real-time technologies including WebSocket connections to provide collaborative features. By using the service, you consent to the transmission of your cursor position, presence status, and editing activities to other authorized users during active sessions. This data is processed temporarily to enable collaboration and is not permanently stored."
    },
    {
      title: "6. Administrative Controls and Takeover Rights",
      content: "Users with administrative privileges may force-release appointment locks and take control of editing sessions when necessary. Administrators must use these powers responsibly and in accordance with organizational policies. All administrative actions are logged for audit purposes."
    },
    {
      title: "7. Intellectual Property and Content",
      content: "All appointment data, notes, and content you create through SyncPoint remains your organization's property. However, by using the service, you grant us a limited license to process, store, and display this content as necessary to operate the platform and provide collaborative features to authorized users."
    },
    {
      title: "8. Prohibited Activities",
      content: "You may not use SyncPoint for any unlawful activities or in ways that could harm the service or other users. Prohibited activities include: attempting to disrupt real-time connections, creating false appointments, data scraping, circumventing security measures, harassing other users, or violating any applicable laws."
    },
    {
      title: "9. Service Modifications and Availability",
      content: "We reserve the right to modify, suspend, or discontinue SyncPoint or any of its features at any time. We will provide reasonable notice for planned maintenance that may affect service availability. Real-time features depend on network connectivity and may be temporarily unavailable due to technical issues."
    },
    {
      title: "10. Data Security and Backup",
      content: "While we implement industry-standard security measures to protect your data, you acknowledge that no system is completely secure. We recommend maintaining your own backups of critical appointment information. We are not liable for data loss due to technical failures, security breaches, or user error."
    },
    {
      title: "11. Limitation of Liability",
      content: "SyncPoint is provided 'as is' without warranties. We are not liable for any damages arising from service interruptions, data loss, missed appointments due to system failures, or conflicts arising from collaborative editing sessions. Our liability is limited to the amount paid for the service, if any."
    },
    {
      title: "12. Privacy and Data Protection",
      content: (
        <>
          Your use of SyncPoint is governed by our {' '}
          <Link href='/privacy-policy' className="hover:underline text-primary">Privacy Policy</Link>, 
          which explains how we collect, use, and protect your personal information and appointment data during collaborative sessions.
        </>
      )
    },
    {
      title: "13. Account Termination",
      content: "We may suspend or terminate your account if you violate these terms, engage in prohibited activities, or pose a security risk to the platform. You may also request account deletion at any time, though this may affect shared appointments and collaborative sessions with other users in your organization."
    },
    {
      title: "14. Dispute Resolution",
      content: "Any disputes arising from your use of SyncPoint will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association. This includes disputes related to appointment conflicts, data access, or administrative actions taken within the platform."
    },
    {
      title: "15. Changes to Terms",
      content: "We may update these terms periodically to reflect changes in our service or legal requirements. We will notify users of significant changes through the platform, email, or other appropriate means. Continued use of SyncPoint after changes constitutes acceptance of the revised terms."
    }
  ];

  return (
    <CommonLayout>
      <div className="container mx-auto py-8">
      <Card className="max-w-5xl mx-auto border-none shadow-none dark:bg-background">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">Terms of Service</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {Launch.Date}</p>
        </CardHeader>
        <CardContent>
          {terms.map((term, index) => (
            <div key={index} className="mb-6">
              <h2 className="text-xl font-semibold mb-2">{term.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">{term.content}</p>
            </div>
          ))}
          <div className="mt-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Contact Us</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              If you have any questions about these Terms of Service or need support with SyncPoint features, please contact us:
            </p>
            <Button variant="outline">
              <Mail className="mr-2 h-4 w-4" />
              <Link href={`mailto:${Email.supportEmail}`}>
                {Email.supportEmail}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </CommonLayout>
  );
};

export default TermsOfService;