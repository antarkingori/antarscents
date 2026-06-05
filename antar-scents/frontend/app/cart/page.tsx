'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import { useCartStore } from '@/store/cart';
import { settingsApi } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

const DELIVERY_OPTIONS = [
  { label: 'Nairobi CBD', defaultFee: 200, key: 'delivery_fee_cbd' },
  { label: 'Within Nairobi', defaultFee: 300, key: 'delivery_fee_nairobi' },
  { label: 'Outside Nairobi (up to 100km)', defaultFee: 500, key: 'delivery_fee_outside' },
  { label: 'Far Upcountry / International', defaultFee: 1000, key: 'delivery_fee_far' },
];

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCartStore();
  const [deliveryZone, setDeliveryZone] = useState(0);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const DELIVERY_THRESHOLD = 5000;

  useEffect(() => {
    settingsApi.getAll().then(r => setSettings(r.data.data || {})).catch(() => {});
  }, []);

  const zone = DELIVERY_OPTIONS[deliveryZone];
  const deliveryFee = zone ? (parseInt(settings[zone.key] || '') || zone.defaultFee) : 200;
  const estimatedTotal = subtotal + deliveryFee;

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="font-playfair text-3xl font-bold mb-8">Shopping Cart</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 space-y-4">
            <ShoppingBag size={80} className="opacity-20" />
            <h2 className="text-2xl font-playfair">Your cart is empty</h2>
            <p className="text-sm">Add some fragrances to get started</p>
            <Link href="/shop" className="btn-gold px-8 py-3 mt-4">Browse Fragrances</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {items.map(item => (
                <div key={`${item.product_id}-${item.variant}`} className="flex gap-4 bg-[#111] rounded-xl p-4 border border-[#1A1A1A] hover:border-gold/20 transition-colors">
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-[#0D0D0D] flex-shrink-0">
                    <Image src={item.image || '/placeholder-perfume.jpg'} alt={item.title} fill className="object-cover" sizes="96px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link href={`/product/${item.handle}`} className="font-medium hover:text-gold transition-colors line-clamp-2">{item.title}</Link>
                        {item.variant && <p className="text-xs text-gray-400 mt-0.5">{item.variant}</p>}
                        <p className="text-xs text-gray-500 mt-0.5">{formatKES(item.unit_price)} per unit</p>
                      </div>
                      <button onClick={() => removeItem(item.product_id, item.variant)} className="text-gray-500 hover:text-red-400 transition-colors flex-shrink-0 mt-0.5">
                        <Trash2 size={16} />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-lg px-3 py-2">
                        <button onClick={() => updateQuantity(item.product_id, item.variant, item.quantity - 1)} className="text-gray-400 hover:text-gold"><Minus size={14} /></button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.variant, item.quantity + 1)} className="text-gray-400 hover:text-gold"><Plus size={14} /></button>
                      </div>
                      <span className="text-gold font-semibold">{formatKES(item.unit_price * item.quantity)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2">
                <Link href="/shop" className="text-gray-400 hover:text-gold text-sm transition-colors">← Continue Shopping</Link>
                <button onClick={clearCart} className="text-gray-500 hover:text-red-400 text-sm transition-colors">Clear Cart</button>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-[#111] rounded-xl border border-[#1A1A1A] p-6 space-y-4">
                <h2 className="font-playfair text-xl font-semibold">Order Summary</h2>
                {subtotal < DELIVERY_THRESHOLD && (
                  <div className="bg-gold/10 border border-gold/20 rounded-lg p-3">
                    <p className="text-xs text-gold">Add <strong>{formatKES(DELIVERY_THRESHOLD - subtotal)}</strong> more for free delivery!</p>
                    <div className="mt-2 bg-[#1A1A1A] rounded-full h-1.5 overflow-hidden">
                      <div className="bg-gold h-full rounded-full transition-all" style={{ width: `${Math.min(100, (subtotal / DELIVERY_THRESHOLD) * 100)}%` }} />
                    </div>
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>Total Units</span>
                    <span className="font-medium">{items.reduce((s, i) => s + i.quantity, 0)}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal</span>
                    <span>{formatKES(subtotal)}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Estimate Delivery Zone</label>
                  <select value={deliveryZone} onChange={e => setDeliveryZone(parseInt(e.target.value))} className="input-dark text-sm">
                    {DELIVERY_OPTIONS.map((o, i) => (
                      <option key={i} value={i}>{o.label} — {formatKES(parseInt(settings[o.key] || '') || o.defaultFee)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5 text-sm border-t border-[#1A1A1A] pt-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Shipping ({zone?.label})</span>
                    <span>{subtotal >= DELIVERY_THRESHOLD ? <span className="text-green-400">Free</span> : formatKES(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base pt-1 border-t border-[#1A1A1A] mt-1">
                    <span>Estimated Total</span>
                    <span className="text-gold">{formatKES(subtotal >= DELIVERY_THRESHOLD ? subtotal : estimatedTotal)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500">Exact shipping confirmed at checkout based on your delivery zone.</p>
                <Link href="/checkout" className="btn-gold w-full py-3.5 text-center font-semibold flex items-center justify-center gap-2">
                  Checkout <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}
