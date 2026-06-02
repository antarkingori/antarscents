import Link from 'next/link';
import { RefreshCw, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export const metadata = { title: 'Returns & Exchanges — Antar Scents' };

export default function ReturnsPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold text-xs tracking-widest uppercase mb-3">Policy</p>
          <h1 className="font-playfair text-4xl font-bold mb-4">Returns &amp; Exchanges</h1>
          <p className="text-gray-400">Your satisfaction is our priority. Here is how we handle returns and exchanges.</p>
          <p className="text-gray-500 text-xs mt-2">Last updated: June 2025</p>
        </div>

        {/* 7-day badge */}
        <div className="bg-gradient-to-r from-[#1a1400] to-[#0a0a0a] border border-[#2a2000] rounded-2xl p-6 mb-10 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
            <RefreshCw size={26} className="text-gold" />
          </div>
          <div>
            <h2 className="font-playfair text-xl font-semibold text-white mb-1">7-Day Return Window</h2>
            <p className="text-gray-400 text-sm">You have 7 days from the date of delivery to request a return or exchange on eligible items.</p>
          </div>
        </div>

        <div className="space-y-8 text-sm text-gray-400 leading-relaxed">

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-4">Eligible Items</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={18} className="text-green-400" />
                  <span className="font-semibold text-white">Accepted for Return</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    'Unopened, sealed products in original packaging',
                    'Items received in a damaged or defective condition',
                    'Incorrect item delivered (wrong product or size)',
                    'Items that do not match their description',
                  ].map(i => <li key={i} className="flex gap-2"><span className="text-green-400 mt-0.5">✓</span>{i}</li>)}
                </ul>
              </div>
              <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle size={18} className="text-red-400" />
                  <span className="font-semibold text-white">Not Eligible for Return</span>
                </div>
                <ul className="space-y-2 text-sm">
                  {[
                    'Opened or used fragrances (for hygiene reasons)',
                    'Items without original packaging or seals broken',
                    'Items returned after 7 days of delivery',
                    'Change of mind on opened products',
                  ].map(i => <li key={i} className="flex gap-2"><span className="text-red-400 mt-0.5">✗</span>{i}</li>)}
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">How to Initiate a Return</h2>
            <ol className="space-y-4">
              {[
                { step: '01', title: 'Contact Us', desc: 'Message us on WhatsApp or email info@antarscents.shop within 7 days of delivery. Include your order number and the reason for the return.' },
                { step: '02', title: 'Send Photos', desc: 'For damaged or incorrect items, attach clear photos of the product and packaging. This helps us resolve your case quickly.' },
                { step: '03', title: 'Await Approval', desc: 'Our team will review your request within 24 hours and confirm whether your return qualifies.' },
                { step: '04', title: 'Return the Item', desc: 'For approved returns, we will arrange a collection from your address (Nairobi) or provide a return shipping address. Items must be in their original condition.' },
                { step: '05', title: 'Receive Your Refund or Exchange', desc: 'Once we receive and inspect the returned item, we will process your refund or dispatch the exchange within 1–2 business days.' },
              ].map(s => (
                <li key={s.step} className="flex gap-4">
                  <span className="font-playfair text-2xl font-bold text-gold/30 flex-shrink-0 w-10">{s.step}</span>
                  <div>
                    <p className="font-semibold text-white mb-0.5">{s.title}</p>
                    <p>{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">Refund Methods &amp; Timelines</h2>
            <div className="bg-[#111] border border-[#1A1A1A] rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#1A1A1A]">
                    <th className="text-left px-5 py-3 text-gray-300 font-semibold">Payment Method</th>
                    <th className="text-left px-5 py-3 text-gray-300 font-semibold">Refund Timeline</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['M-Pesa', 'Within 24 hours'],
                    ['Visa / Mastercard', '3–7 business days'],
                    ['Bank Transfer', '2–5 business days'],
                    ['Cash on Delivery', 'Immediate (on collection)'],
                  ].map(([method, timeline]) => (
                    <tr key={method} className="border-b border-[#1A1A1A] last:border-0">
                      <td className="px-5 py-3 text-white">{method}</td>
                      <td className="px-5 py-3 text-gray-400">{timeline}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-3 text-xs text-gray-500">Original shipping fees are non-refundable unless the return is due to our error. Return shipping costs are covered by Antar Scents for damaged, defective, or incorrect items.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">Exchanges</h2>
            <p>If you would like to exchange an unopened product for a different size or fragrance, we are happy to arrange this within your 7-day window, subject to stock availability. Any price difference will be charged or refunded accordingly.</p>
          </section>

          <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6 flex gap-4">
            <AlertCircle size={20} className="text-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white font-semibold mb-1">Wrong or damaged item?</p>
              <p>We will make it right immediately. Contact us within 48 hours of delivery with your order number and photos via <a href="https://wa.me/254792274842" className="text-gold hover:underline">WhatsApp</a> or <a href="mailto:info@antarscents.shop" className="text-gold hover:underline">email</a>.</p>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/shipping" className="text-gold hover:underline text-sm">Shipping Policy →</Link>
          <Link href="/faq" className="text-gold hover:underline text-sm">FAQ →</Link>
          <Link href="/contact" className="text-gold hover:underline text-sm">Contact Us →</Link>
        </div>
      </div>
    </div>
  );
}
