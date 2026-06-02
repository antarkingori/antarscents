'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ordersApi, paymentsApi, settingsApi } from '@/lib/api';
import { formatKES, validateKenyanPhone } from '@/lib/utils';
import { Check, Copy, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const DELIVERY_OPTIONS = [
  { label: 'Nairobi CBD', defaultFee: 200, key: 'delivery_fee_cbd' },
  { label: 'Within Nairobi', defaultFee: 300, key: 'delivery_fee_nairobi' },
  { label: 'Outside Nairobi (up to 100km)', defaultFee: 500, key: 'delivery_fee_outside' },
  { label: 'Far Upcountry / International', defaultFee: 1000, key: 'delivery_fee_far' },
];

type PaymentMethod = 'mpesa_till' | 'mpesa_stk' | 'paystack_card' | 'paystack_mobile';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState(1);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<number | null>(null);
  // Server-verified totals — set after order is created
  const [orderTotal, setOrderTotal] = useState<number | null>(null);
  const [orderSubtotal, setOrderSubtotal] = useState<number | null>(null);
  const [paymentTab, setPaymentTab] = useState<PaymentMethod>('mpesa_till');
  const [mpesaCode, setMpesaCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [stkPolling, setStkPolling] = useState(false);
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

  // Auto-fill from logged-in user (Zustand may rehydrate after initial render)
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

  // Delivery fee: use admin-configured value from settings if set, else default
  const zone = DELIVERY_OPTIONS[deliveryZone];
  const deliveryFee = zone ? (parseInt(settings[zone.key] || '') || zone.defaultFee) : 200;

  // Client-side estimate (step 1 display). After order creation, use server-verified amounts.
  const estimatedTotal = subtotal + deliveryFee;
  const tillNumber = settings.mpesa_till_number || '000000';

  // The amount to charge — server-verified after order creation, estimate before
  const chargeTotal = orderTotal ?? estimatedTotal;

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
        payment_method: paymentTab,
      });
      setOrderId(data.data.id);
      setOrderNumber(data.data.order_number);
      // Use server-computed prices going forward
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
      toast.error('Please enter your M-Pesa confirmation code');
      return;
    }
    setLoading(true);
    try {
      await ordersApi.submitMpesaCode(orderId!, mpesaCode);
      clearCart();
      setStep(3);
      toast.success('Order confirmed!');
    } catch {
      toast.error('Failed to submit code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStkPush = async () => {
    setLoading(true);
    try {
      await paymentsApi.stkPush(form.customer_phone, chargeTotal, orderId!);
      toast.success('Payment request sent to your phone. Enter your M-Pesa PIN to confirm.');
      setStkPolling(true);
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        if (attempts > 30) { clearInterval(poll); setStkPolling(false); toast.error('Payment timed out. Try again.'); }
        try {
          const { data } = await ordersApi.getById(orderId!);
          if (data.data.payment_status === 'paid') { clearInterval(poll); setStkPolling(false); clearCart(); setStep(3); }
        } catch {}
      }, 3000);
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePaystack = async () => {
    setLoading(true);
    try {
      const { data } = await paymentsApi.initPaystack(form.customer_email || `order-${orderId}@antarscents.shop`, chargeTotal, orderId!);
      window.location.href = data.data.authorization_url;
    } catch {
      toast.error('Failed to initialize payment');
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
            <span className="text-gray-300 truncate">{item.title} × {item.quantity}</span>
            <span className="text-white font-medium flex-shrink-0">{formatKES(item.unit_price * item.quantity)}</span>
          </div>
        ))}
      </div>
      <hr className="border-[#1A1A1A]" />
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between text-gray-300">
          <span>Subtotal</span>
          <span>{formatKES(showVerified ? (orderSubtotal ?? subtotal) : subtotal)}</span>
        </div>
        <div className="flex justify-between text-gray-300">
          <span>Delivery ({zone?.label})</span>
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
                  {DELIVERY_OPTIONS.map((o, i) => (
                    <option key={i} value={i}>{o.label} — {formatKES(parseInt(settings[o.key] || '') || o.defaultFee)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Payment Method</label>
                <div className="flex gap-2 flex-wrap">
                  {([['mpesa_till', '💚 M-Pesa Till'], ['mpesa_stk', '📱 STK Push'], ['paystack_card', '💳 Card/Mobile']] as const).map(([val, label]) => (
                    <button key={val} type="button" onClick={() => setPaymentTab(val)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${paymentTab === val ? 'border-gold bg-gold/10 text-gold' : 'border-[#333] text-gray-400 hover:border-gold/30'}`}>{label}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Additional Notes</label>
                <textarea value={form.delivery_notes} onChange={e => setForm(prev => ({ ...prev, delivery_notes: e.target.value }))} className="input-dark min-h-[80px] resize-none" placeholder="Any special instructions?" />
              </div>
              <button type="submit" disabled={loading} className="btn-gold w-full py-4 font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <><Loader2 size={18} className="animate-spin" /> Processing...</> : `Continue to Payment — ${formatKES(estimatedTotal)}`}
              </button>
            </form>
            <div className="h-fit"><OrderSummaryPanel /></div>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <h2 className="font-playfair text-2xl font-bold">Payment</h2>
              <div className="flex gap-2 flex-wrap">
                {([['mpesa_till', '💚 M-Pesa Till'], ['mpesa_stk', '📱 STK Push'], ['paystack_card', '💳 Card/Mobile']] as const).map(([val, label]) => (
                  <button key={val} onClick={() => setPaymentTab(val)} className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${paymentTab === val ? 'border-gold bg-gold/10 text-gold' : 'border-[#333] text-gray-400 hover:border-gold/30'}`}>{label}</button>
                ))}
              </div>

              {paymentTab === 'mpesa_till' && (
                <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-green-400">Lipa na M-Pesa — Buy Goods</h3>
                  <ol className="space-y-2.5 text-sm text-gray-300">
                    <li>1. Open M-Pesa on your phone</li>
                    <li>2. Select <strong>Lipa na M-Pesa</strong></li>
                    <li>3. Select <strong>Buy Goods and Services</strong></li>
                    <li>4. Enter Till Number: <span className="text-white font-bold text-lg">{tillNumber}</span>
                      <button onClick={copyTill} className="ml-2 text-gold hover:text-gold/80 text-xs align-middle">{copied ? <Check size={14} className="inline" /> : <Copy size={14} className="inline" />}</button>
                    </li>
                    <li>5. Enter Amount: <span className="text-white font-bold text-lg">{formatKES(chargeTotal)}</span></li>
                    <li>6. Enter your M-Pesa PIN and confirm</li>
                    <li>7. You&apos;ll receive an SMS confirmation code (e.g. <em>RGH2K1XYZ</em>)</li>
                    <li>8. Enter that code below</li>
                  </ol>
                  <div>
                    <label className="block text-sm font-medium mb-2">M-Pesa Confirmation Code</label>
                    <input type="text" value={mpesaCode} onChange={e => setMpesaCode(e.target.value.toUpperCase())} maxLength={10} placeholder="e.g. RGH2K1XYZ" className="input-dark uppercase tracking-widest font-mono text-lg" />
                  </div>
                  <button onClick={handleMpesaTill} disabled={loading} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : 'Confirm My Order'}
                  </button>
                </div>
              )}

              {paymentTab === 'mpesa_stk' && (
                <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-green-400">M-Pesa STK Push</h3>
                  <p className="text-sm text-gray-300">We&apos;ll send a payment prompt directly to your phone.</p>
                  <div>
                    <label className="block text-sm font-medium mb-2">Phone Number</label>
                    <input type="tel" value={form.customer_phone} onChange={e => setForm(prev => ({ ...prev, customer_phone: e.target.value }))} className="input-dark" placeholder="07XXXXXXXX" />
                  </div>
                  <button onClick={handleStkPush} disabled={loading || stkPolling} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : stkPolling ? <><Loader2 size={18} className="animate-spin" /> Waiting for payment...</> : `Send Payment Request — ${formatKES(chargeTotal)}`}
                  </button>
                  {stkPolling && <p className="text-xs text-gray-400 text-center">Check your phone and enter your M-Pesa PIN to complete payment.</p>}
                </div>
              )}

              {paymentTab === 'paystack_card' && (
                <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6 space-y-4">
                  <h3 className="font-semibold text-blue-400">Secure Card / Mobile Money Payment</h3>
                  <p className="text-sm text-gray-300">Pay securely with Visa, Mastercard, or Airtel Money via Paystack.</p>
                  <div className="flex gap-3">
                    <span className="bg-[#1A1A1A] px-3 py-1.5 rounded text-xs font-bold text-blue-400 border border-[#333]">VISA</span>
                    <span className="bg-[#1A1A1A] px-3 py-1.5 rounded text-xs font-bold text-red-400 border border-[#333]">MASTERCARD</span>
                    <span className="bg-[#1A1A1A] px-3 py-1.5 rounded text-xs font-bold text-orange-400 border border-[#333]">AIRTEL MONEY</span>
                  </div>
                  <button onClick={handlePaystack} disabled={loading} className="btn-gold w-full py-3.5 font-semibold flex items-center justify-center gap-2">
                    {loading ? <Loader2 size={18} className="animate-spin" /> : `Pay ${formatKES(chargeTotal)} Securely`}
                  </button>
                </div>
              )}
            </div>
            <div className="h-fit"><OrderSummaryPanel showVerified /></div>
          </div>
        )}

        {step === 3 && (
          <div className="max-w-lg mx-auto text-center space-y-6 py-10">
            <div className="w-24 h-24 bg-green-500/20 border-2 border-green-500 rounded-full flex items-center justify-center mx-auto">
              <Check size={48} className="text-green-400" />
            </div>
            <h2 className="font-playfair text-3xl font-bold">Order Placed Successfully!</h2>
            <p className="text-gray-300">Your order has been received and is being processed.</p>
            {orderNumber && (
              <div className="bg-[#111] border border-gold/30 rounded-xl p-5 text-left space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-400">Order Number</span><span className="font-bold text-gold text-lg">#{String(orderNumber).padStart(5, '0')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Delivery to</span><span>{form.delivery_matatu_route || form.customer_name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Payment method</span><span className="capitalize">{paymentTab.replace('_', ' ')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Total charged</span><span className="font-semibold text-gold">{formatKES(chargeTotal)}</span></div>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href={`/track/${orderNumber}`} className="btn-outline-gold flex-1 py-3 text-sm font-semibold">Track My Order</Link>
              <Link href="/shop" className="btn-gold flex-1 py-3 text-sm font-semibold">Continue Shopping</Link>
            </div>
            <a
              href={`https://wa.me/254792274842?text=${encodeURIComponent(`Hi! I just placed order #${String(orderNumber).padStart(5, '0')}. Can you confirm?`)}`}
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
