'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth';
import axios from 'axios';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

type Status = 'loading' | 'success' | 'error';

function CallbackHandler() {
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const handle = async () => {
      try {
        // Supabase puts the session in the URL fragment; getSession picks it up automatically
        const { data: { session }, error } = await supabase.auth.getSession();

        const type = searchParams.get('type') || (window.location.hash.includes('type=recovery') ? 'recovery' : null);

        if (error || !session) {
          setStatus('error');
          setMessage('Authentication failed. The link may have expired.');
          return;
        }

        if (type === 'recovery') {
          // Redirect to reset-password — Supabase session is set, but we use our own flow
          // Extract token from Supabase session and redirect
          router.replace('/account/reset-password?supabase=1');
          return;
        }

        // Google OAuth: exchange Supabase access_token for our backend JWT
        const { data } = await axios.post(`${API_URL}/api/auth/google`, {
          access_token: session.access_token,
        });

        setUser(data.data.user, data.data.token);
        setStatus('success');
        setMessage('Signed in successfully! Redirecting...');
        setTimeout(() => router.replace('/account'), 1500);
      } catch {
        setStatus('error');
        setMessage('Sign-in failed. Please try again.');
      }
    };

    handle();
  }, [router, searchParams, setUser]);

  return (
    <div className="text-center space-y-4 py-4">
      {status === 'loading' && (
        <>
          <Loader2 size={40} className="animate-spin text-gold mx-auto" />
          <p className="text-gray-400">Completing sign-in...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle size={36} className="text-green-400" />
          </div>
          <p className="text-gray-300">{message}</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <XCircle size={36} className="text-red-400" />
          </div>
          <p className="text-gray-300">{message}</p>
          <Link href="/account/login" className="btn-gold inline-flex px-6 py-3 text-sm font-semibold mt-2">
            Back to Sign In
          </Link>
        </>
      )}
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.svg" alt="Antar Scents" width={220} height={55} className="mx-auto" priority />
          </Link>
        </div>
        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8 shadow-2xl">
          <Suspense fallback={
            <div className="text-center py-8">
              <Loader2 size={40} className="animate-spin text-gold mx-auto" />
            </div>
          }>
            <CallbackHandler />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
