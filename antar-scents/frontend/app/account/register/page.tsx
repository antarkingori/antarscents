'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setUser } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm_password) { toast.error('Passwords do not match'); return; }
    if (form.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setLoading(true);
    try {
      const { data } = await authApi.register({ full_name: form.full_name, email: form.email, phone: form.phone, password: form.password });
      setUser(data.data.user, data.data.token);
      toast.success('Account created successfully!');
      router.push('/account');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-playfair text-2xl font-bold gold-text tracking-widest">ANTAR SCENTS</Link>
          <h1 className="font-playfair text-3xl font-bold mt-6 mb-2">Create Account</h1>
          <p className="text-gray-400 text-sm">Join Antar Scents today</p>
        </div>
        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { label: 'Full Name', key: 'full_name', type: 'text', placeholder: 'John Doe' },
              { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com' },
              { label: 'Phone Number', key: 'phone', type: 'tel', placeholder: '07XXXXXXXX' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
                <input type={f.type} value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required className="input-dark" placeholder={f.placeholder} />
              </div>
            ))}
            {[
              { label: 'Password', key: 'password' },
              { label: 'Confirm Password', key: 'confirm_password' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={(form as Record<string, string>)[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} required className="input-dark pr-10" placeholder="••••••••" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold">
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            ))}
            <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2 mt-2">
              {loading ? <><Loader2 size={18} className="animate-spin" /> Creating Account...</> : 'Create Account'}
            </button>
          </form>
          <p className="mt-6 text-center text-gray-400 text-sm">Already have an account? <Link href="/account/login" className="text-gold hover:underline">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
}
