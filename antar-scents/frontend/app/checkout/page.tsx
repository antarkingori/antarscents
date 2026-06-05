'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ordersApi, settingsApi } from '@/lib/api';
import { formatKES, validateKenyanPhone } from '@/lib/utils';
import { Check, Copy, Loader2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

const DELIVERY_OPTIONS = [
  { label: 'Nairobi CBD', defaultFee: 200, key: 'delivery_fee_cbd' },
  { label: 'Within Nairobi', defaultFee: 300, key: 'delivery_fee_nairobi' },
  { label: 'Outside Nairobi (up to 100km)', defaultFee: 500, key: 'delivery_fee_outside' },
  { label: 'Far Upcountry / International', defaultFee: 1000, key: 'delivery_fee_far' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [orderSubtotal, setOrderSubtotal] = useState<number | null>(null);
  const [mpesaCode, setMpesaCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [deliveryZone, setDeliveryZone] = useState(0);

  const [form, setForm] = useState({
    customer_name: user?.full_name || '',
    customer_email: user?.email || '',
    customer_phone: user?.phone || '',
    delivery_name: user?.full_name || '',
    delivery_phone: user?.phone || '',
    delivery_matatu_route: '',
    delivery_notes: '',
  });

  useEffect(() => {
    settingsApi.getAll().then(r => setSettings(r.data.data || {})).catch(() => {});
    if (items.length === 0 && step === 1) router.push('/cart');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        customer_name: prev.customer_name || user.full_name || '',
        customer_email: prev.customer_email || user.email || '',
        customer_phone: prev.customer_phone || user.phone || '',
        delivery_name: prev.delivery_name || user.full_name || '',
        delivery_phone: prev.delivery_phone || user.phone || '',
      }));
    }
  }, [user]);

  const DELIVERY_THRESHOLD = 5000;
  const zone = DELIVERY_OPTIONS[deliveryZone];
  const baseDeliveryFee = zone ? (parseInt(settings[zone.key] || '') || zone.defaultFee) : 200;
  const deliveryFee = subtotal >= DELIVERY_THRESHOLD ? 0 : baseDeliveryFee;
  const estimatedTotal = subtotal + deliveryFee;
  const tillNumber = settings.mpesa_till_number || '000000';
  const chargeTotal = orderTotal ?? estimatedTotal;
  const totalUnits = items.reduce((s, i) => s + i.quantity, 0);

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateKenyanPhone(form.customer_phone)) {
      toast.error('Please enter a valid Kenyan phone number (07XX or 01XX)');
      return;
    }
    setLoading(true);
    try {
      const { data } = await ordersApi.create({
        ...form,
        customer_email: form.customer_email || undefined,
        items: items.map(i => ({
          product_id: i.product_id,
          title: i.title,
          variant: i.variant,
          quantity: i.quantity,
          image: i.image,
        })),
        delivery_fee: deliveryFee,
        payment_method: 'mpesa_till',
      });
      setOrderId(data.data.id);
      setOrderNumber(data.data.order_number);
      setOrderTotal(data.data.total);
      setOrderSubtotal(data.data.subtotal);
      setStep(2);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleMpesaTill = async () => {
    if (!mpesaCode.trim() || mpesaCode.length < 8) {
      toast.error('Please enter your M-Pesa confirmation code (at least 8 characters)');
      return;
    }
    setLoading(true);
    try {
      await ordersApi.submitMpesaCode(orderId!, mpesaCode);
      clearCart();
      setStep(3);
      toast.success('Order confirmed! Your payment is being verified.');
    } catch {
      toast.error('Failed to submit code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyTill = () => {
    navigator.clipboard.writeText(tillNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const OrderSummaryPanel = ({ showVerified = false }: { showVerified?: boolean }) => (
    <div className="bg-[#111] rounded-xl border border-[#1A1A1A] p-5 space-y-4 sticky top-24">
      <h3 className="font-semibold">Order Summary</h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {items.map(item => (
          <div key={`${item.product_id}-${item.variant}`} className="flex justify-between text-sm gap-2">
            <div className="text-gray-300 truncate">
              <span>{item.title} × {item.quantity}</span>
              {item.variant && <span className="block text-xs text-gray-500">{item.variant}</span>}
            </div>
            <span className="text-white font-medium flex-shrink-0">{formatKES(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <hr className="border-[#1A1A1A]" />
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-400">
          <span>Total Units</span>
          <span className="font-medium text-white">{totalUnits}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Subtotal</span>
          <span>{formatKES(showVerified ? (orderSubtotal ?? subtotal) : subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Shipping ({zone?.label})</span>
          <span>{formatKES(deliveryFee)}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-1 border-t border-[#1A1A1A] mt-2">
          <span>Total</span>
          <span className="text-gold">{formatKES(showVerified ? chargeTotal : estimatedTotal)}</span>
        </div>
      </div>
    </div>
  );

  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-4 mb-10">
      {['Delivery', 'Payment', 'Confirmation'].map((s, i) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step > i + 1 ? 'bg-green-500 text-white' : step === i + 1 ? 'bg-gold text-black' : 'bg-[#1A1A1A] text-gray-500'}`}>
            {step > i + 1 ? <Check size={16} /> : i + 1}
          </div>
          <span className={`hidden sm:block text-sm font-medium ${step === i + 1 ? 'text-gold' : 'text-gray-500'}`}>{s}</span>
          {i < 2 && <div className={`w-12 h-px ${step > i + 1 ? 'bg-green-500' : 'bg-[#333]'}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <StepIndicator />

        {/* Step 1 — Delivery */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <form onSubmit={handleDeliverySubmit} className="lg:col-span-2 space-y-5">
              <h2 className="font-playfair text-2xl font-bold">Delivery Information</h2>
              {[
                { label: 'Full Name *', key: 'customer_name', type: 'text', required: true },
                { label: 'Email Address', key: 'customer_email', type: 'email', required: false },
                { label: 'Phone Number *', key: 'customer_phone', type: 'tel', required: true, placeholder: '07XXXXXXXX' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
                  <input type={f.type} value={(form as Record<string, string>)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} required={f.required} placeholder={f.placeholder} className="input-dark" />
                </div>
              ))}
              <hr className="border-[#1A1A1A]" />
              <h3 className="font-semibold text-gray-300">Delivery Details</h3>
              {[
                { label: 'Recipient Name', key: 'delivery_name', placeholder: 'Who should receive the package?' },
                { label: 'Recipient Phone', key: 'delivery_phone', placeholder: 'Recipient phone number' },
                { label: 'Nearest Pickup Location *', key: 'delivery_matatu_route', placeholder: "e.g. 'CBD', 'Westgate Mall', 'Nyeri Town'" },
              ].map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">{f.label}</label>
                  <input type="text" value={(form as Record<string, string>)[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))} placeholder={f.placeholder} className="input-dark" />
                </div>
              ))}
              <p className="text-xs text-gray-500">Enter your nearest pickup location. Same-day delivery in Nairobi, Kenya-wide and worldwide shipping available.</p>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Delivery Zone *</label>
                <select value={deliveryZone} onChange={e => setDeliveryZone(parseInt(e.target.value))} className="input-dark">
                  {DELIVERY_OPTIONS.map((o, i) => {
                    const fee = parseInt(settings[o.key] || '') || o.defaultFee;
                    return (
                      <option key={i} value={i}>
                        {o.label} — {subtotal >= DELIVERY_THRESHOLD ? 'Free' : formatKES(fee)}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Additional Notes</label>
                <textarea value={form.delivery_notes} onChange={e => setForm(prev => ({ ...prev, delivery_notes: e.target.value }))} className="input-dark min-h-[80px] resize-none" placeholder="Any special instructions?" />
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <ShieldCheck size={16} className="text-green-400 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-400">Payment via M-Pesa Till</span>
                </div>
                <p className="text-xs text-gray-400">You&apos;ll pay via M-Pesa Buy Goods and submit your confirmation code. Our team verifies your payment before processing your order.</p>
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : `Continue to Payment — ${formatKES(estimatedTotal)}`}
              </button>
            </form>
            <div className="h-fit"><OrderSummaryPanel /></div>
          </div>
        )}

        {/* Step 2 — M-Pesa Till Payment */}
        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-playfair text-2xl font-bold">Pay via M-Pesa</h2>

              <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6 space-y-5">
                <h3 className="font-semibold text-green-400 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-xs font-bold text-green-400">M</span>
                  Lipa na M-Pesa — Buy Goods
                </h3>
                <ol className="space-y-3 text-sm text-gray-300">
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0 mt-0.5">1</span>
                    Open <strong className="text-white">M-Pesa</strong> on your phone
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0 mt-0.5">2</span>
                    Select <strong className="text-white">Lipa na M-Pesa</strong>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0 mt-0.5">3</span>
                    Select <strong className="text-white">Buy Goods and Services</strong>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0 mt-0.5">4</span>
                    <span>
                      Enter Till Number:&nbsp;
                      <span className="text-white font-bold text-lg font-mono">{tillNumber}</span>
                      <button onClick={copyTill} className="ml-2 text-gold hover:text-gold/80 text-xs align-middle">
                        {copied ? <Check size={14} className="inline" /> : <Copy size={14} className="inline" />}
                      </button>
                    </span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0 mt-0.5">5</span>
                    Enter Amount: <span className="text-white font-bold text-lg ml-1">{formatKES(chargeTotal)}</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0 mt-0.5">6</span>
                    Enter your M-Pesa PIN and confirm
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-[#1A1A1A] flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0 mt-0.5">7</span>
                    You&apos;ll receive an SMS confirmation code (e.g. <em className="text-gray-200">RGH2K1XYZ</em>)
                  </li>
                  <li className="flex gap-3">
                    <span className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center text-[10px] font-bold text-gold flex-shrink-0 mt-0.5">8</span>
                    Enter that code below and submit
                  </li>
                </ol>

                <div>
                  <label className="block text-sm font-medium mb-2">M-Pesa Confirmation Code *</label>
                  <input
                    type="text"
                    value={mpesaCode}
                    onChange={e => setMpesaCode(e.target.value.toUpperCase())}
                    maxLength={12}
                    placeholder="e.g. RGH2K1XYZ"
                    className="input-dark uppercase tracking-widest font-mono text-lg"
                  />
                  <p className="text-xs text-gray-500 mt-1">The code from your M-Pesa SMS (usually 10 characters).</p>
                </div>

                <button onClick={handleMpesaTill} disabled={loading} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2">
                  {loading ? <Loader2 size={18} className="animate-spin" /> : 'Submit Payment Code'}
                </button>

                <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl p-4 flex items-start gap-3">
                  <ShieldCheck size={18} className="text-gold flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400">Your M-Pesa code will be verified by our team before your order is processed. You&apos;ll receive confirmation once verified. This usually takes a few minutes during business hours.</p>
                </div>
              </div>
            </div>
            <div className="h-fit"><OrderSummaryPanel showVerified /></div>
          </div>
        )}

        {/* Step 3 — Confirmation */}
        {step === 3 && (
          <div className="max-w-lg mx-auto text-center space-y-6 py-10">
            <div className="w-24 h-24 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto">
              <Check size={48} className="text-green-400" />
            </div>
            <h2 className="font-playfair text-3xl font-bold">Order Placed!</h2>
            <p className="text-gray-300">Your order has been received. Our team is verifying your M-Pesa payment.</p>

            {orderNumber && (
              <div className="bg-[#111] border border-gold/30 rounded-xl p-5 text-left space-y-2.5">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Order Number</span><span className="font-bold text-gold text-lg">#{String(orderNumber).padStart(5, '0')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Delivery to</span><span>{form.delivery_matatu_route || form.customer_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Payment method</span><span>M-Pesa Till</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Total charged</span><span className="font-semibold text-gold">{formatKES(chargeTotal)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">M-Pesa code</span><span className="font-mono text-green-400">{mpesaCode}</span></div>
              </div>
            )}

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-left">
              <p className="text-sm text-yellow-400 font-medium mb-1">Payment Pending Verification</p>
              <p className="text-xs text-gray-400">Our team will verify your M-Pesa code and confirm your order within a few minutes during business hours (Mon–Sat, 8AM–8PM).</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/track/${orderNumber}`} className="btn-outline-gold flex-1 py-3 text-sm font-semibold">Track My Order</Link>
              <Link href="/shop" className="btn-gold flex-1 py-3 text-sm font-semibold">Continue Shopping</Link>
            </div>
            <a
              href={`https://wa.me/254792274842?text=${encodeURIComponent(`Hi! I just placed order #${String(orderNumber).padStart(5, '0')} and submitted my M-Pesa code. Can you confirm?`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:text-green-300 text-sm transition-colors"
            >
              💬 Questions? Chat with us on WhatsApp
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
