import Link from 'next/link';
import { Truck, Globe, Clock, MapPin, AlertCircle, CheckCircle } from 'lucide-react';

export const metadata = { title: 'Shipping Policy — Antar Scents' };

const ZONES = [
  {
    icon: <MapPin size={22} className="text-gold" />,
    title: 'Nairobi — Same-Day Delivery',
    time: 'Same day (orders before 2 PM)',
    cost: 'KSh 200–350',
    notes: 'CBD, Westlands, Karen, Kilimani, Kasarani, Embakasi & more. Orders placed after 2 PM are delivered the following morning.',
  },
  {
    icon: <Truck size={22} className="text-gold" />,
    title: 'Kenya-Wide Delivery',
    time: '1–3 business days',
    cost: 'KSh 400–700',
    notes: 'Mombasa, Kisumu, Nakuru, Eldoret, Thika, and all major towns via our courier partners. Remote areas may take an additional day.',
  },
  {
    icon: <Globe size={22} className="text-gold" />,
    title: 'International Delivery',
    time: '7–14 business days',
    cost: 'Calculated at checkout',
    notes: 'We ship worldwide via DHL and EMS. Rates depend on destination country and total order weight. Import duties and taxes are the responsibility of the recipient.',
  },
];

export default function ShippingPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold text-xs tracking-widest uppercase mb-3">Information</p>
          <h1 className="font-playfair text-4xl font-bold mb-4">Shipping Policy</h1>
          <p className="text-gray-400">We deliver across Nairobi, throughout Kenya, and worldwide.</p>
          <p className="text-gray-500 text-xs mt-2">Last updated: June 2025</p>
        </div>

        {/* Delivery zones */}
        <div className="space-y-4 mb-12">
          {ZONES.map(zone => (
            <div key={zone.title} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6 flex gap-5">
              <div className="mt-1 flex-shrink-0">{zone.icon}</div>
              <div>
                <h3 className="font-semibold text-white mb-1">{zone.title}</h3>
                <div className="flex flex-wrap gap-4 mb-2">
                  <span className="text-xs text-gray-400"><Clock size={12} className="inline mr-1" />{zone.time}</span>
                  <span className="text-xs text-gold font-semibold">{zone.cost}</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{zone.notes}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">Order Processing</h2>
            <p className="mb-3">All orders are processed within <strong className="text-white">2–4 hours</strong> of payment confirmation during business hours (Monday–Saturday, 8 AM–8 PM EAT).</p>
            <p>Orders placed over the weekend or on public holidays are processed on the next business day. You will receive an SMS and email confirmation once your order is dispatched, including a tracking reference where applicable.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">Nairobi Same-Day Delivery</h2>
            <p className="mb-3">Same-day delivery is available across Nairobi for orders placed before <strong className="text-white">2:00 PM</strong>. Our riders operate from 9 AM to 8 PM. You will receive a call from the rider approximately 30 minutes before arrival.</p>
            <div className="bg-[#0f1800] border border-[#2a4000] rounded-lg p-4 mt-3">
              <p className="text-green-400 text-xs font-semibold mb-1">Covered areas include:</p>
              <p className="text-gray-400 text-xs">CBD, Westlands, Kilimani, Kileleshwa, Karen, Lavington, Lang'ata, South C, South B, Parklands, Gigiri, Runda, Muthaiga, Kasarani, Ruaka, Thika Road, Mombasa Road, Ngong Road, Embakasi, Donholm, Umoja, and more.</p>
            </div>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">Packaging</h2>
            <p>All fragrances are carefully wrapped in protective bubble wrap and sealed in a discreet, sturdy box. Gift orders include premium tissue paper and a complimentary gift card. We take great care to ensure your fragrance arrives in perfect condition.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">International Orders & Customs</h2>
            <p className="mb-3">International shipments may be subject to customs duties, import taxes, and handling fees levied by the destination country. These charges are entirely the responsibility of the recipient and are not included in our prices.</p>
            <p>We declare all items at their full purchase value as required by international shipping regulations. We do not mark packages as "gift" to avoid customs fees.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">Failed Deliveries</h2>
            <p>If a delivery attempt fails because you are unavailable, our rider will contact you to reschedule. A second delivery attempt will be made at no extra charge. If a third attempt is required, an additional delivery fee may apply.</p>
          </section>

          <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6 flex gap-4">
            <AlertCircle size={20} className="text-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold mb-1">Delivery issue?</p>
              <p className="text-sm">If your order has not arrived within the expected timeframe, please contact us immediately via <a href="https://wa.me/254792274842" className="text-gold hover:underline">WhatsApp</a> or email <a href="mailto:info@antarscents.shop" className="text-gold hover:underline">info@antarscents.shop</a> with your order number and we will investigate right away.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/returns" className="text-gold hover:underline text-sm">Returns & Exchanges →</Link>
          <Link href="/faq" className="text-gold hover:underline text-sm">View FAQ →</Link>
          <Link href="/track" className="text-gold hover:underline text-sm">Track My Order →</Link>
        </div>
      </div>
    </div>
  );
}
