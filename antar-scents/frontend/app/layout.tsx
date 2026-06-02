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
  description: 'Premium fragrances delivered across Kenya. Genuine products, countrywide delivery, secure payments via M-Pesa and card.',
  keywords: ['perfume', 'fragrance', 'Kenya', 'Nairobi', 'cologne', 'scent', 'antar scents'],
  openGraph: {
    title: 'Antar Scents — Premium Fragrances in Kenya',
    description: 'Discover your signature scent. Genuine perfumes delivered countrywide.',
    type: 'website',
    locale: 'en_KE',
    siteName: 'Antar Scents',
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
