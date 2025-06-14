import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from 'next/link';
import { Common, Email, Launch } from '@/constants';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="container mx-auto py-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Privacy Policy</CardTitle>
          <p className="text-sm text-gray-500 dark:text-gray-400">Last updated: {Launch.Date}</p>
        </CardHeader>
        <CardContent className="prose dark:prose-invert">            
          <h2 className="text-xl font-semibold mt-6 mb-3">1. Introduction</h2>
          <p>
            Welcome to {Common.title}, a collaborative appointment management platform. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our appointment scheduling and editing services.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">2. Information We Collect</h2>
          <p>We collect the following types of information:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Account information such as your name, email, role, and login credentials</li>
            <li>Appointment data including titles, descriptions, dates, times, participants, and locations</li>
            <li>Collaboration data such as edit sessions, lock status, and real-time cursor positions</li>
            <li>Usage data including how you interact with appointments, editing sessions, and platform features</li>
            <li>Technical data such as browser type, IP address, device information, and WebSocket connection details</li>
            <li>Communication data from notifications and system messages</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">3. How We Use Your Information</h2>
          <p>We use your information to:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Enable user authentication and account management</li>
            <li>Facilitate appointment creation, editing, and scheduling</li>
            <li>Implement collaborative editing features including locking mechanisms and conflict resolution</li>
            <li>Provide real-time synchronization of appointment changes across users</li>
            <li>Display user presence information and collaborative cursors during editing sessions</li>
            <li>Send appointment notifications, reminders, and system alerts</li>
            <li>Analyze platform usage to improve performance and user experience</li>
            <li>Maintain audit trails for administrative and security purposes</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">4. Real-Time Data Processing</h2>
          <p>
            SyncPoint uses WebSocket connections and real-time data processing to enable collaborative features. This includes:
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li>Broadcasting appointment lock status and editor information</li>
            <li>Synchronizing cursor positions and user presence indicators</li>
            <li>Transmitting appointment changes in real-time to prevent conflicts</li>
            <li>Managing session timeouts and automatic lock releases</li>
          </ul>
          <p>
            Real-time data is processed temporarily and is not permanently stored unless it relates to appointment content or audit requirements.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">5. Sharing Your Information</h2>
          <p>
            We share information in the following circumstances:
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li>With other authorized users within your organization for appointment collaboration</li>
            <li>With trusted third-party service providers that help us operate our platform (e.g., cloud hosting, authentication services)</li>
            <li>When required by law or to protect our rights and the safety of our users</li>
          </ul>
          <p>
            We do not sell your personal data to third parties. Appointment data is only visible to users with appropriate permissions within your organization.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">6. Data Security</h2>
          <p>
            We implement comprehensive security measures including:
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li>Encrypted data transmission and storage</li>
            <li>Secure WebSocket connections for real-time features</li>
            <li>Role-based access controls and permission validation</li>
            <li>Regular security audits and monitoring</li>
            <li>Automatic session timeouts and lock expiration</li>
          </ul>
          <p>
            However, please be aware that no method of electronic transmission or storage is 100% secure.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">7. Data Retention</h2>
          <p>
            We retain your information as follows:
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li>Account data: Until you delete your account or as required by law</li>
            <li>Appointment data: As long as your account is active or as needed for business purposes</li>
            <li>Real-time collaboration data: Temporarily during active sessions only</li>
            <li>Audit logs: For security and compliance purposes, typically 1-3 years</li>
          </ul>

          <h2 className="text-xl font-semibold mt-6 mb-3">8. Your Rights</h2>
          <p>You may have the right to:</p>
          <ul className="list-disc pl-5 mb-4">
            <li>Access the personal data we hold about you</li>
            <li>Update or correct your account information</li>
            <li>Request deletion of your account and associated appointment data</li>
            <li>Export your appointment data in a portable format</li>
            <li>Object to or restrict how we process your data</li>
            <li>Control your visibility status and presence information</li>
          </ul>
          <p>
            To exercise your rights, please contact us using the email address provided below. Note that deleting your account may affect shared appointments with other users.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">9. Cookies and Tracking</h2>
          <p>
            We use cookies and similar technologies to:
          </p>
          <ul className="list-disc pl-5 mb-4">
            <li>Maintain your login session and preferences</li>
            <li>Enable real-time collaboration features</li>
            <li>Analyze platform usage and performance</li>
            <li>Remember your interface settings and customizations</li>
          </ul>
          <p>
            You can control cookie settings through your browser, but disabling certain cookies may limit platform functionality.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">10. Third-Party Integrations</h2>
          <p>
            SyncPoint may integrate with third-party calendar services, notification systems, and authentication providers. We are not responsible for the privacy practices of these external services. Please review their privacy policies before connecting your accounts.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">11. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. Significant changes will be communicated through the platform, email notifications, or posted prominently on this page.
          </p>

          <h2 className="text-xl font-semibold mt-6 mb-3">12. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, data processing practices, or wish to exercise your privacy rights, please contact us at: {' '}
            <Link href={`mailto:${Email.supportEmail}`} className="text-primary hover:underline">
              {Email.supportEmail}
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;