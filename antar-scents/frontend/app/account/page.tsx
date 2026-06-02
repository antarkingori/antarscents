'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { useAuthStore } from '@/store/auth';
import { ordersApi, favouritesApi, authApi } from '@/lib/api';
import { formatKES, timeAgo } from '@/lib/utils';
import { User, Package, Heart, Clock, Settings, LogOut, Loader2 } from 'lucide-react';
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

  useEffect(() => {
    if (!user) { router.push('/account/login'); return; }
    Promise.all([
      ordersApi.getAll({ limit: 50 }),
      favouritesApi.getAll(),
    ]).then(([o, f]) => {
      setOrders(o.data.data || []);
      setFavourites(f.data.data || []);
    }).finally(() => setLoading(false));
  }, [user, router]);

  if (!user) return null;

  const totalSpent = orders.filter(o => (o as Record<string, string>).payment_status === 'paid').reduce((s, o) => s + parseFloat((o as Record<string, string>).total || '0'), 0);

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

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
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
                        <h3 className="font-semibold mb-4">Latest Order</h3>
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
                  </div>
                )}

                {tab === 'orders' && (
                  <div className="space-y-3">
                    <h2 className="font-playfair text-xl font-bold">My Orders</h2>
                    {orders.length === 0 ? (
                      <div className="text-center py-16 text-gray-400">
                        <Package size={48} className="mx-auto mb-3 opacity-30" />
                        <p>No orders yet</p>
                        <Link href="/shop" className="text-gold hover:underline text-sm mt-2 inline-block">Start Shopping</Link>
                      </div>
                    ) : orders.map(order => {
                      const o = order as Record<string, unknown>;
                      return (
                        <div key={o.id as string} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="font-bold text-gold">#{String(o.order_number).padStart(5, '0')}</span>
                            <span className="text-xs text-gray-400">{timeAgo(o.created_at as string)}</span>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div><span className="text-gray-400 text-xs">Items</span><p>{(o.items as unknown[])?.length || 0} items</p></div>
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
                          return product ? (
                            <div key={f.id as string} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-3 text-sm">
                              <Link href={`/product/${product.handle}`} className="text-gold hover:underline">{product.title as string}</Link>
                              <p className="text-gray-400 mt-1 text-xs">{formatKES(parseFloat(product.selling_price as string))}</p>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>
                )}

                {tab === 'profile' && (
                  <div className="space-y-8">
                    <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
                      <h3 className="font-semibold">Change Password</h3>
                      <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">Current Password</label>
                          <input type="password" value={pwForm.current_password} onChange={e => setPwForm(p => ({ ...p, current_password: e.target.value }))} required className="input-dark" />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1.5">New Password</label>
                          <input type="password" value={pwForm.new_password} onChange={e => setPwForm(p => ({ ...p, new_password: e.target.value }))} required className="input-dark" />
                        </div>
                        <button type="submit" disabled={saving} className="btn-gold px-6 py-2.5 text-sm font-semibold">
                          {saving ? 'Updating...' : 'Update Password'}
                        </button>
                      </form>
                    </div>
                    <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6">
                      <h3 className="font-semibold mb-2">Account Details</h3>
                      <div className="space-y-2 text-sm text-gray-300">
                        <div className="flex gap-3"><span className="text-gray-500 w-24">Name</span><span>{user.full_name}</span></div>
                        <div className="flex gap-3"><span className="text-gray-500 w-24">Email</span><span>{user.email}</span></div>
                        <div className="flex gap-3"><span className="text-gray-500 w-24">Phone</span><span>{user.phone}</span></div>
                        <div className="flex gap-3"><span className="text-gray-500 w-24">Member since</span><span>{new Date(user.created_at).toLocaleDateString('en-KE')}</span></div>
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
