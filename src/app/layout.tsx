import type { Metadata } from 'next';
import './globals.css';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'KAIRO — Precision Link Infrastructure & Advanced Click Analytics',
  description:
    'Commercial URL Shortener & Clickstream Intelligence. Create intelligent short links, track real-time audience engagement, and analyze traffic with privacy-conscious telemetry.',
  keywords: ['URL shortener', 'click analytics', 'link tracking', 'privacy analytics', 'custom alias', 'QR code', 'Kairo'],
  authors: [{ name: 'Kairo Technologies' }],
  openGraph: {
    title: 'KAIRO — Precision Link Infrastructure',
    description: 'Shorten links. Understand every click. Master audience intelligence.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen font-sans bg-[#090909] text-[#F5F5F5] antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
