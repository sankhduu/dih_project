import type { Metadata } from 'next';
import './globals.css';
import { MetrologyStoreProvider } from '@/lib/store';

export const metadata: Metadata = {
  title: 'e-Māpan | National Online Verification System for Weighing & Measuring Instruments',
  description: 'Department of Consumer Affairs (DoCA), Ministry of Consumer Affairs, Food & Public Distribution — Legal Metrology Compliance Platform',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-slate-100/70 text-slate-900 min-h-screen">
        <MetrologyStoreProvider>{children}</MetrologyStoreProvider>
      </body>
    </html>
  );
}
