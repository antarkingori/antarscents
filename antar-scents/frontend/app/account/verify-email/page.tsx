'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function VerifyHandler() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token found in link.');
      return;
    }
    axios.post(`${API_URL}/api/auth/verify-email`, { token })
      .then(() => {
        setStatus('success');
        setMessage('Your email address has been verified. You can now enjoy the full Antar Scents experience.');
      })
      .catch(err => {
        setStatus('error');
        setMessage((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Verification failed. The link may have expired.');
      });
  }, [token]);

  return (
    <div className="text-center space-y-5 py-4">
      {status === 'loading' && (
        <>
          <Loader2 size={40} className="animate-spin text-gold mx-auto" />
          <p className="text-gray-400">Verifying your email...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={36} className="text-green-400" />
          </div>
          <h2 className="font-playfair text-xl font-semibold">Email Verified!</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
          <Link href="/account" className="btn-gold inline-flex px-6 py-3 text-sm font-semibold">
            Go to My Account
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <XCircle size={36} className="text-red-400" />
          </div>
          <h2 className="font-playfair text-xl font-semibold">Verification Failed</h2>
          <p className="text-gray-400 text-sm leading-relaxed">{message}</p>
          <Link href="/account" className="btn-gold inline-flex px-6 py-3 text-sm font-semibold">
            Back to Account
          </Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.svg" alt="Antar Scents" width={220} height={55} className="mx-auto" priority />
          </Link>
          <h1 className="font-playfair text-3xl font-bold mt-6 mb-2">Email Verification</h1>
        </div>
        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8 shadow-2xl">
          <Suspense fallback={<div className="text-center py-8"><Loader2 size={40} className="animate-spin text-gold mx-auto" /></div>}>
            <VerifyHandler />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
