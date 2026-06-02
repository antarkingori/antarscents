import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-black text-white antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
