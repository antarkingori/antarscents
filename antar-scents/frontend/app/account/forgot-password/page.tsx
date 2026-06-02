'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import axios from 'axios';
import { Loader2, CheckCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSent(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.svg" alt="Antar Scents" width={220} height={55} className="mx-auto" priority />
          </Link>
          <h1 className="font-playfair text-3xl font-bold mt-6 mb-2">Forgot Password</h1>
          <p className="text-gray-400 text-sm">Enter your email and we&apos;ll send a reset link</p>
        </div>

        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8 shadow-2xl">
          {sent ? (
            <div className="text-center space-y-4 py-4">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={36} className="text-green-400" />
              </div>
              <h2 className="font-playfair text-xl font-semibold">Check Your Email</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                If an account exists for <strong className="text-white">{email}</strong>, you will receive a password reset link shortly.
              </p>
              <p className="text-gray-500 text-xs">Check your spam folder if you don&apos;t see it.</p>
              <Link href="/account/login" className="btn-gold inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold mt-2">
                <ArrowLeft size={16} /> Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="input-dark"
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Sending...</> : 'Send Reset Link'}
              </button>
              <Link href="/account/login" className="flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm transition-colors py-1">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
