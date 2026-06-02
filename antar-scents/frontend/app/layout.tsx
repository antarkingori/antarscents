import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import WhatsAppButton from '@/components/WhatsAppButton';

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
      </head>
      <body className="bg-black text-white font-inter antialiased">
        {children}
        <WhatsAppButton />
        <Toaster
          position="top-right"
          toastOptions={{
            style: { background: '#1A1A1A', color: '#fff', border: '1px solid #C9A84C' },
            success: { iconTheme: { primary: '#C9A84C', secondary: '#000' } },
          }}
        />
      </body>
    </html>
  );
}
