'use client';
import { useState, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import axios from 'axios';
import { Loader2, Eye, EyeOff, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  if (!token) {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-red-400 text-sm">Invalid or missing reset token.</p>
        <Link href="/account/forgot-password" className="btn-gold inline-flex px-6 py-3 text-sm font-semibold">
          Request New Link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error('Passwords do not match'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/reset-password`, { token, password });
      setDone(true);
      setTimeout(() => router.push('/account/login'), 3000);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Reset failed. Link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle size={36} className="text-green-400" />
        </div>
        <h2 className="font-playfair text-xl font-semibold">Password Reset!</h2>
        <p className="text-gray-400 text-sm">Your password has been updated. Redirecting you to sign in...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {(['New Password', 'Confirm Password'] as const).map((label, i) => (
        <div key={label}>
          <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={i === 0 ? password : confirm}
              onChange={e => i === 0 ? setPassword(e.target.value) : setConfirm(e.target.value)}
              required
              className="input-dark pr-10"
              placeholder="••••••••"
            />
            {i === 0 && (
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold">
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            )}
          </div>
        </div>
      ))}
      <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2">
        {loading ? <><Loader2 size={18} className="animate-spin" /> Resetting...</> : 'Reset Password'}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.svg" alt="Antar Scents" width={220} height={55} className="mx-auto" priority />
          </Link>
          <h1 className="font-playfair text-3xl font-bold mt-6 mb-2">Reset Password</h1>
          <p className="text-gray-400 text-sm">Enter your new password below</p>
        </div>
        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8 shadow-2xl">
          <Suspense fallback={<div className="text-center text-gray-400 py-8">Loading...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
