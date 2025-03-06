import type { Metadata } from 'next';
import { Merriweather, Open_Sans } from 'next/font/google';
import 'regenerator-runtime/runtime';
import { ClientLayout } from './client-layout';
import './globals.css';

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
  preload: true,
});

const openSans = Open_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-open-sans',
  display: 'swap',
  preload: true,
});

export const metadata: Metadata = {
  title: 'Advokit by Chayn - Image Takedown Support',
  description: 'AI-powered letter writing tool to support takedown requests for non-consensual images',
  metadataBase: new URL('https://advokit.chayn.co'),
  openGraph: {
    title: 'Advokit by Chayn - Image Takedown Support',
    description: 'AI-powered letter writing tool to support takedown requests for non-consensual images',
    images: [
      {
        url: '/meta_image.png',
        width: 1200,
        height: 630,
        alt: 'Advokit by Chayn'
      }
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Advokit by Chayn - Image Takedown Support',
    description: 'AI-powered letter writing tool to support takedown requests for non-consensual images',
    images: ['/meta_image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  themeColor: '#F0244D',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${merriweather.variable} ${openSans.variable}`}>
      <body className="font-open-sans bg-background min-h-screen flex flex-col">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}