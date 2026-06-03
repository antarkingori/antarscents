'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/auth';
import { ordersApi, favouritesApi, authApi } from '@/lib/api';
import { formatKES, timeAgo } from '@/lib/utils';
import { User, Package, Heart, Clock, Settings, LogOut, Loader2, MailWarning, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'orders', label: 'My Orders', icon: Package },
  { id: 'favourites', label: 'Favourites', icon: Heart },
  { id: 'profile', label: 'Profile', icon: Settings },
];

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, setUser } = useAuthStore();
  const [tab, setTab] = useState('overview');
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [favourites, setFavourites] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileForm, setProfileForm] = useState({ full_name: user?.full_name || '', phone: user?.phone || '' });
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);
  const [resending, setResending] = useState(false);
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('');

  useEffect(() => {
    if (user) setProfileForm({ full_name: user.full_name || '', phone: user.phone || '' });
  }, [user]);

  const handleResendVerification = async () => {
    setResending(true);
    try {
      await authApi.resendVerification();
      toast.success('Verification email sent! Check your inbox.');
    } catch {
      toast.error('Could not send email. Try again shortly.');
    } finally {
      setResending(false);
    }
  };

  useEffect(() => {
    if (!user) { router.push('/account/login'); return; }
    Promise.all([
      ordersApi.getAll({ limit: 100 }),
      favouritesApi.getAll(),
    ]).then(([o, f]) => {
      setOrders(o.data.data || []);
      setFavourites(f.data.data || []);
    }).finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const totalSpent = orders
    .filter(o => (o as Record<string, string>).payment_status === 'paid')
    .reduce((s, o) => s + parseFloat((o as Record<string, string>).total || '0'), 0);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const o = order as Record<string, unknown>;
      const numStr = String(o.order_number || '').padStart(5, '0');
      const matchesSearch = !orderSearch || numStr.includes(orderSearch.replace('#', '')) ||
        String(o.customer_name || '').toLowerCase().includes(orderSearch.toLowerCase());
      const matchesStatus = !orderStatusFilter || o.order_status === orderStatusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, orderSearch, orderStatusFilter]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.changePassword(pwForm.current_password, pwForm.new_password);
      toast.success('Password updated!');
      setPwForm({ current_password: '', new_password: '' });
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await authApi.updateProfile(profileForm);
      setUser(data.data);
      toast.success('Profile updated!');
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {!user.email_verified && (
          <div className="mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-5 py-4">
            <MailWarning size={20} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-amber-300 text-sm font-medium">Please verify your email address</p>
              <p className="text-amber-400/70 text-xs mt-0.5">Check your inbox for a verification link. Didn&apos;t get it?{' '}
                <button onClick={handleResendVerification} disabled={resending} className="underline hover:text-amber-300 transition-colors">
                  {resending ? 'Sending...' : 'Resend email'}
                </button>
              </p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-playfair text-2xl font-bold">My Account</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome back, {user.full_name?.split(' ')[0]}</p>
          </div>
          <button onClick={() => { logout(); router.push('/'); toast.success('Logged out'); }} className="flex items-center gap-2 text-gray-400 hover:text-red-400 text-sm transition-colors">
            <LogOut size={16} /> Logout
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-48 flex-shrink-0">
            <nav className="bg-[#111] rounded-xl border border-[#1A1A1A] overflow-hidden">
              {TABS.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)} className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium transition-colors text-left ${tab === t.id ? 'bg-gold/10 text-gold border-l-2 border-gold' : 'text-gray-400 hover:text-white hover:bg-[#1A1A1A]'}`}>
                  <t.icon size={16} /> {t.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-20"><Loader2 size={32} className="animate-spin text-gold" /></div>
            ) : (
              <>
                {tab === 'overview' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {[
                        { label: 'Total Orders', value: orders.length },
                        { label: 'Total Spent', value: formatKES(totalSpent) },
                        { label: 'Favourites', value: favourites.length },
                      ].map(s => (
                        <div key={s.label} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-4 text-center">
                          <p className="text-2xl font-bold text-gold">{s.value}</p>
                          <p className="text-gray-400 text-xs mt-1">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    {orders.length > 0 && (
                      <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-semibold">Latest Order</h3>
                          <button onClick={() => setTab('orders')} className="text-gold text-xs hover:underline">View all</button>
                        </div>
                        {(() => {
                          const o = orders[0] as Record<string, unknown>;
                          return (
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between"><span className="text-gray-400">Order #</span><span className="font-bold text-gold">#{String(o.order_number).padStart(5, '0')}</span></div>
                              <div className="flex justify-between"><span className="text-gray-400">Date</span><span>{timeAgo(o.created_at as string)}</span></div>
                              <div className="flex justify-between"><span className="text-gray-400">Total</span><span>{formatKES(parseFloat(o.total as string))}</span></div>
                              <div className="flex justify-between items-center"><span className="text-gray-400">Status</span><OrderStatusBadge label={o.order_status as string} /></div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    {orders.length === 0 && (
                      <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-8 text-center text-gray-400">
                        <Package size={40} className="mx-auto mb-3 opacity-30" />
                        <p className="text-sm">No orders yet</p>
                        <Link href="/shop" className="text-gold hover:underline text-sm mt-2 inline-block">Start Shopping</Link>
                      </div>
                    )}
                  </div>
                )}

                {tab === 'orders' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <h2 className="font-playfair text-xl font-bold">My Orders</h2>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <div className="relative flex-1 sm:w-48">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type="text"
                            value={orderSearch}
                            onChange={e => setOrderSearch(e.target.value)}
                            placeholder="Search order #..."
                            className="input-dark pl-8 text-sm w-full"
                          />
                          {orderSearch && <button onClick={() => setOrderSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"><X size={14} /></button>}
                        </div>
                        <select value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)} className="input-dark text-sm">
                          <option value="">All statuses</option>
                          {['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {filteredOrders.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <Package size={48} className="mx-auto mb-3 opacity-30" />
                        <p>{orders.length === 0 ? 'No orders yet' : 'No orders match your search'}</p>
                        {orders.length === 0 && <Link href="/shop" className="text-gold hover:underline text-sm mt-2 inline-block">Start Shopping</Link>}
                      </div>
                    ) : filteredOrders.map(order => {
                      const o = order as Record<string, unknown>;
                      const items = (o.items as Record<string, unknown>[]) || [];
                      return (
                        <div key={o.id as string} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gold">#{String(o.order_number).padStart(5, '0')}</span>
                            <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} />{timeAgo(o.created_at as string)}</span>
                          </div>
                          {items.length > 0 && (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {items.slice(0, 4).map((item, i) => (
                                <div key={i} className="flex-shrink-0 text-xs text-gray-300 bg-[#0D0D0D] rounded-lg px-2 py-1">
                                  {String(item.title || '').slice(0, 20)}{(item.title as string)?.length > 20 ? '…' : ''} ×{item.quantity as number}
                                </div>
                              ))}
                              {items.length > 4 && <div className="flex-shrink-0 text-xs text-gray-500 bg-[#0D0D0D] rounded-lg px-2 py-1">+{items.length - 4} more</div>}
                            </div>
                          )}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div><span className="text-gray-400 text-xs">Items</span><p>{items.length} item{items.length !== 1 ? 's' : ''}</p></div>
                            <div><span className="text-gray-400 text-xs">Total</span><p className="font-semibold">{formatKES(parseFloat(o.total as string))}</p></div>
                            <div><span className="text-gray-400 text-xs">Payment</span><PaymentStatusBadge label={o.payment_status as string} /></div>
                            <div><span className="text-gray-400 text-xs">Status</span><OrderStatusBadge label={o.order_status as string} /></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {tab === 'favourites' && (
                  <div>
                    <h2 className="font-playfair text-xl font-bold mb-4">My Favourites</h2>
                    {favourites.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <Heart size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No favourites yet</p>
                        <Link href="/shop" className="text-gold hover:underline text-sm mt-2 inline-block">Browse Products</Link>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                        {favourites.map(fav => {
                          const f = fav as Record<string, unknown>;
                          const product = f.products as Record<string, unknown>;
                          if (!product) return null;
                          const images = product.images as { src: string }[] | undefined;
                          const imgSrc = images?.[0]?.src || '/placeholder-perfume.jpg';
                          return (
                            <Link key={f.id as string} href={`/product/${product.handle}`} className="bg-[#111] border border-[#1A1A1A] rounded-xl overflow-hidden hover:border-gold/30 transition-colors group">
                              <div className="relative aspect-square bg-[#0D0D0D]">
                                <Image src={imgSrc} alt={product.title as string} fill className="object-cover group-hover:scale-105 transition-transform duration-300" sizes="(max-width: 640px) 50vw, 33vw" />
                              </div>
                              <div className="p-3">
                                <p className="text-sm font-medium group-hover:text-gold transition-colors line-clamp-2">{product.title as string}</p>
                                <p className="text-gold text-sm font-semibold mt-1">{formatKES(parseFloat(product.selling_price as string))}</p>
                              </div>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'profile' && (
                  <div className="space-y-6">
                    <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6">
                      <h3 className="font-semibold mb-4">Edit Profile</h3>
                      <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">Full Name</label>
                          <input type="text" value={profileForm.full_name} onChange={e => setProfileForm(p => ({ ...p, full_name: e.target.value }))} required minLength={2} className="input-dark" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number</label>
                          <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} className="input-dark" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">Email Address</label>
                          <input type="email" value={user.email} disabled className="input-dark opacity-50 cursor-not-allowed" />
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        </div>
                        <button type="submit" disabled={saving} className="btn-gold px-6 py-2.5 text-sm font-semibold flex items-center gap-2">
                          {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
                        </button>
                      </form>
                    </div>

                    <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
                      <h3 className="font-semibold">Change Password</h3>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">Current Password</label>
                          <input type="password" value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} required className="input-dark" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                          <input type="password" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} required minLength={6} className="input-dark" />
                        </div>
                        <button type="submit" disabled={saving} className="btn-gold px-6 py-2.5 text-sm font-semibold">
                          {saving ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>

                    <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6">
                      <h3 className="font-semibold mb-3">Account Info</h3>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex gap-3"><span className="text-gray-500 w-28">Member since</span><span>{new Date(user.created_at).toLocaleDateString('en-KE', { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                        <div className="flex gap-3"><span className="text-gray-500 w-28">Email verified</span><span className={user.email_verified ? 'text-green-400' : 'text-amber-400'}>{user.email_verified ? '✓ Verified' : '✗ Not verified'}</span></div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
