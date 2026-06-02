'use client';
import { Toaster } from 'react-hot-toast';
import WhatsAppButton from '@/components/WhatsAppButton';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <WhatsAppButton />
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1A1A1A', color: '#fff', border: '1px solid #C9A84C', fontSize: '14px' },
          success: { iconTheme: { primary: '#C9A84C', secondary: '#000' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          duration: 4000,
        }}
      />
    </>
  );
}
