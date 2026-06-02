'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { ordersApi } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { Loader2, Check, Truck, Package, MapPin, Clock } from 'lucide-react';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_LABELS: Record<string, string> = { pending: 'Order Placed', confirmed: 'Order Confirmed', processing: 'Processing', shipped: 'Shipped', delivered: 'Delivered' };
const STATUS_ICONS = [Clock, Check, Package, Truck, MapPin];

export default function TrackPage() {
  const { order_number } = useParams<{ order_number: string }>();
  const [phone, setPhone] = useState('');
  const [orderNum, setOrderNum] = useState(order_number || '');
  const [order, setOrder] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await ordersApi.track(orderNum, phone);
      setOrder(data.data);
    } catch {
      setError('Order not found. Please check your order number and phone.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? STATUS_STEPS.indexOf(order.order_status as string) : -1;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="font-playfair text-3xl font-bold text-center mb-2">Track Your Order</h1>
        <p className="text-gray-400 text-center mb-10">Enter your order details to check the status</p>

        <form onSubmit={handleTrack} className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8 space-y-5 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Order Number</label>
            <input type="text" value={orderNum} onChange={e => setOrderNum(e.target.value)} required placeholder="e.g. 00001" className="input-dark" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Phone Number Used When Ordering</label>
            <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="07XXXXXXXX" className="input-dark" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2">
            {loading ? <><Loader2 size={18} className="animate-spin" /> Searching...</> : 'Track Order'}
          </button>
        </form>

        {order && (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <p className="text-gray-400 text-sm">Order Number</p>
                  <p className="font-bold text-gold text-xl">#{String(order.order_number).padStart(5, '0')}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-400 text-sm">Placed on</p>
                  <p className="text-sm">{new Date(order.created_at as string).toLocaleDateString('en-KE')}</p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4">
                {STATUS_STEPS.map((status, i) => {
                  const Icon = STATUS_ICONS[i];
                  const done = i <= currentStep;
                  const active = i === currentStep;
                  return (
                    <div key={status} className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border-2 transition-colors ${active ? 'bg-gold border-gold text-black' : done ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-[#333] text-gray-600'}`}>
                        <Icon size={18} />
                      </div>
                      <div className={`flex-1 ${!done ? 'opacity-40' : ''}`}>
                        <p className={`text-sm font-medium ${active ? 'text-gold' : done ? 'text-green-400' : 'text-gray-500'}`}>{STATUS_LABELS[status]}</p>
                        {active && <p className="text-xs text-gray-400 mt-0.5">Current status</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-6 space-y-3 text-sm">
              <h3 className="font-semibold text-gray-300">Delivery Information</h3>
              <div className="flex gap-3"><span className="text-gray-500 w-32">Customer</span><span>{order.customer_name as string}</span></div>
              <div className="flex gap-3"><span className="text-gray-500 w-32">Matatu Route</span><span>{(order.delivery_matatu_route as string) || 'Not specified'}</span></div>
              <div className="flex gap-3"><span className="text-gray-500 w-32">Payment</span><span className="capitalize">{(order.payment_method as string)?.replace('_', ' ')}</span></div>
              <div className="flex gap-3"><span className="text-gray-500 w-32">Est. Delivery</span><span>2–5 business days</span></div>
            </div>

            <a href="https://wa.me/254922748842" target="_blank" rel="noopener noreferrer" className="block text-center text-green-400 hover:text-green-300 text-sm py-3 bg-green-500/10 border border-green-500/20 rounded-xl transition-colors">
              💬 Need help? Chat with us on WhatsApp
            </a>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
