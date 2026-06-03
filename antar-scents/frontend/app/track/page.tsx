'use client';
import { useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { ordersApi } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { Loader2, Check, Truck, Package, MapPin, Clock, Search } from 'lucide-react';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = {
  pending: 'Order Placed',
  confirmed: 'Order Confirmed',
  processing: 'Being Prepared',
  shipped: 'Out for Delivery',
  delivered: 'Delivered',
};
const STATUS_ICONS = [Clock, Check, Package, Truck, MapPin];

export default function TrackPage() {
  const [phone, setPhone] = useState('');
  const [orderNum, setOrderNum] = useState('');
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const { data } = await ordersApi.track(orderNum.replace('#', '').trim(), phone.trim());
      setOrder(data.data);
    } catch {
      setError('Order not found. Please check your order number and the phone number you used when placing the order.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.order_status as string) : -1;
  const isCancelled = order?.order_status === 'cancelled';

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/30 flex items-center justify-center mx-auto mb-4">
            <Search size={24} className="text-gold" />
          </div>
          <h1 className="font-playfair text-3xl font-bold mb-2">Track Your Order</h1>
          <p className="text-gray-400">Enter your order details below to check the latest status</p>
        </div>

        <form onSubmit={handleTrack} className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8 space-y-5 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Order Number</label>
            <input
              type="text"
              value={orderNum}
              onChange={e => setOrderNum(e.target.value)}
              required
              placeholder="e.g. 00001"
              className="input-dark"
              autoFocus
            />
            <p className="text-xs text-gray-500 mt-1">Find this in your order confirmation SMS or email</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number Used When Ordering</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              required
              placeholder="07XXXXXXXX or +254XXXXXXXXX"
              className="input-dark"
            />
          </div>
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Searching...</> : <><Search size={18} /> Track Order</>}
          </button>
        </form>

        {order && (
          <div className="space-y-5 animate-fade-in">
            {/* Status summary */}
            <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Order Number</p>
                  <p className="font-bold text-gold text-2xl">#{String(order.order_number).padStart(5, '0')}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Placed on</p>
                  <p className="text-sm">{new Date(order.created_at as string).toLocaleDateString('en-KE', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                </div>
              </div>

              {isCancelled ? (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
                  <p className="text-red-400 font-semibold">Order Cancelled</p>
                  <p className="text-gray-400 text-sm mt-1">This order was cancelled. Contact us on WhatsApp if you need help.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {STATUS_STEPS.map((status, i) => {
                    const Icon = STATUS_ICONS[i];
                    const done = i <= currentStep;
                    const active = i === currentStep;
                    return (
                      <div key={status} className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${active ? 'bg-gold border-gold text-black' : done ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-[#333] text-gray-600'}`}>
                          <Icon size={17} />
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div className="absolute" />
                        )}
                        <div className={`flex-1 ${!done ? 'opacity-40' : ''}`}>
                          <p className={`text-sm font-medium ${active ? 'text-gold' : done ? 'text-white' : 'text-gray-500'}`}>
                            {STATUS_LABELS[status]}
                          </p>
                          {active && <p className="text-xs text-gold/70 mt-0.5">Current status</p>}
                          {done && !active && <p className="text-xs text-green-400/70 mt-0.5">Completed</p>}
                        </div>
                        {done && !active && <Check size={16} className="text-green-400 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Order details */}
            <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-6 space-y-3 text-sm">
              <h3 className="font-semibold text-white mb-4">Order Details</h3>
              <div className="flex gap-3"><span className="text-gray-500 w-36">Customer</span><span>{order.customer_name as string}</span></div>
              <div className="flex gap-3"><span className="text-gray-500 w-36">Pickup Location</span><span>{(order.delivery_matatu_route as string) || 'Not specified'}</span></div>
              <div className="flex gap-3"><span className="text-gray-500 w-36">Payment Method</span><span className="capitalize">{String(order.payment_method || '').replace(/_/g, ' ')}</span></div>
              <div className="flex gap-3"><span className="text-gray-500 w-36">Payment Status</span>
                <span className={`capitalize font-medium ${order.payment_status === 'paid' ? 'text-green-400' : 'text-yellow-400'}`}>
                  {order.payment_status as string}
                </span>
              </div>
              {(order.items as unknown[])?.length > 0 && (
                <div className="pt-3 mt-3 border-t border-[#1A1A1A] space-y-2">
                  <p className="text-gray-400 text-xs uppercase tracking-wider">Items Ordered</p>
                  {(order.items as Record<string, unknown>[]).map((item, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-gray-300">{item.title as string}{item.variant ? ` (${item.variant})` : ''} × {item.quantity as number}</span>
                      <span className="text-gold font-medium">{formatKES((item.unit_price as number) * (item.quantity as number))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <a
              href="https://wa.me/254792274842"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-green-400 hover:text-green-300 text-sm py-4 bg-green-500/10 border border-green-500/20 rounded-2xl transition-colors"
            >
              💬 Need help with your order? Chat with us on WhatsApp
            </a>

            <div className="text-center">
              <Link href="/shop" className="text-gold hover:underline text-sm">← Continue Shopping</Link>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
