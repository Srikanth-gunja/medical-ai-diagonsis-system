import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/index.css';
import { Providers } from './providers';
import { ClientLayout } from '@/components/layout/ClientLayout';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'MediCare - Your Trusted Healthcare Platform',
  description: 'Connect with verified doctors, book appointments, manage prescriptions, and track your health journey all in one place.',
  icons: {
    icon: [{ url: '/favicon.ico', type: 'image/x-icon' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <ClientLayout>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  );
}
