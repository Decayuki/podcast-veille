import type { Metadata, Viewport } from 'next';
import './globals.css';
import ServiceWorker from '@/components/ServiceWorker';

export const metadata: Metadata = {
  title: 'Veille de Marc',
  description: 'La veille tech/IA/dev de Marc, en podcast',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Veille',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0d0d0d',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="bg-[#0d0d0d] text-[#e8e8e8] antialiased">
        <ServiceWorker />
        {children}
      </body>
    </html>
  );
}
