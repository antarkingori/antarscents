import type { Metadata } from 'next';
import { Playfair_Display, Inter } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-playfair',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { default: 'Antar Scents — Discover Your Signature Scent', template: '%s | Antar Scents' },
  description: 'Premium fragrances delivered worldwide. Same-day delivery in Nairobi, fast delivery across Kenya and internationally. Genuine products, secure payments via M-Pesa and card.',
  keywords: ['perfume', 'fragrance', 'Kenya', 'Nairobi', 'cologne', 'scent', 'antar scents', 'worldwide delivery'],
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  openGraph: {
    title: 'Antar Scents — Premium Fragrances Worldwide',
    description: 'Discover your signature scent. Genuine perfumes. Same-day Nairobi, Kenya-wide & worldwide delivery.',
    type: 'website',
    locale: 'en_KE',
    siteName: 'Antar Scents',
    images: [{ url: '/logo.svg', width: 320, height: 80, alt: 'Antar Scents' }],
  },
  robots: { index: true, follow: true },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://antarscents.shop'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="bg-black text-white antialiased font-inter">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
