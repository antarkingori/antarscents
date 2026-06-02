'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import GoogleButton from '@/components/ui/GoogleButton';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const { login, loading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(email, password);
      toast.success('Welcome back!');
      router.push('/account');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/">
            <Image src="/logo.svg" alt="Antar Scents" width={220} height={55} className="mx-auto" priority />
          </Link>
          <h1 className="font-playfair text-3xl font-bold mt-6 mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-sm">Sign in to your account</p>
        </div>

        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8 shadow-2xl space-y-5">
          {/* Google Login */}
          <GoogleButton label="Continue with Google" />

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-[#333]" />
            <span className="text-gray-500 text-xs">or sign in with email</span>
            <div className="flex-1 h-px bg-[#333]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input-dark" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="input-dark pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="text-right">
              <Link href="/account/forgot-password" className="text-sm text-gold hover:text-gold/80 transition-colors">Forgot Password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
            </button>
          </form>

          <div className="text-center space-y-2 pt-2">
            <p className="text-gray-400 text-sm">Don&apos;t have an account? <Link href="/account/register" className="text-gold hover:underline">Create Account</Link></p>
            <Link href="/checkout" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">Continue as Guest →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
