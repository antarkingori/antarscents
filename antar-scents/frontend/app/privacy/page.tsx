import Link from 'next/link';

export const metadata = { title: 'Privacy Policy — Antar Scents' };

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold text-xs tracking-widest uppercase mb-3">Legal</p>
          <h1 className="font-playfair text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-400">How we collect, use, and protect your personal information.</p>
          <p className="text-gray-500 text-xs mt-2">Last updated: June 2025</p>
        </div>

        <div className="space-y-8 text-sm text-gray-400 leading-relaxed">

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">1. About This Policy</h2>
            <p>This Privacy Policy explains how Antar Scents (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), a fragrance retailer based in Nairobi, Kenya, collects, uses, and safeguards your personal information when you use our website (antarscents.shop) or purchase from us. By using our website or placing an order, you agree to the practices described in this policy.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">2. Information We Collect</h2>
            <p className="mb-3">We collect information you provide directly to us, including:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-white">Account information:</strong> Full name, email address, phone number, and password (stored encrypted)</li>
              <li><strong className="text-white">Order information:</strong> Delivery address, nearest pickup location, and order history</li>
              <li><strong className="text-white">Payment information:</strong> Payment method type; card details are processed by Paystack and never stored by us</li>
              <li><strong className="text-white">Communications:</strong> Messages you send us via email, WhatsApp, or our contact form</li>
            </ul>
            <p className="mt-3">We also collect certain information automatically when you visit our site, including your IP address, browser type, device information, pages visited, and browsing behaviour on our platform.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use your personal information to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Process and fulfil your orders and send delivery updates</li>
              <li>Create and manage your account</li>
              <li>Send transactional emails (order confirmations, receipts, shipping updates)</li>
              <li>Respond to your enquiries and provide customer support</li>
              <li>Send promotional emails about new products and offers <em>(only with your consent; you may opt out at any time)</em></li>
              <li>Improve our website, products, and services</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">4. How We Share Your Information</h2>
            <p className="mb-3">We do not sell or rent your personal information to third parties. We may share your information with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><strong className="text-white">Delivery partners:</strong> Your name, phone number, and delivery address are shared with our courier partners solely to fulfil your order</li>
              <li><strong className="text-white">Payment processors:</strong> Paystack processes card payments; M-Pesa payments are handled by Safaricom</li>
              <li><strong className="text-white">Technology providers:</strong> We use Supabase (database), Vercel (hosting), and Render (backend) — all reputable services with strong data protection practices</li>
              <li><strong className="text-white">Legal requirements:</strong> We may disclose information if required by Kenyan law or lawful legal process</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">5. Cookies</h2>
            <p>We use cookies and similar technologies to keep you signed in, remember your cart, and understand how visitors use our site. You can disable cookies in your browser settings, though some features of the site may not function correctly without them. We do not use advertising tracking cookies.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">6. Data Security</h2>
            <p>We implement industry-standard security measures including HTTPS encryption, hashed passwords, and access controls to protect your data. While we take all reasonable steps to secure your information, no method of transmission over the internet is 100% secure.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">7. Data Retention</h2>
            <p>We retain your account information for as long as your account is active. Order records are retained for 7 years to comply with Kenyan tax regulations. You may request deletion of your account and associated data at any time (subject to legal retention requirements).</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">8. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate or incomplete data</li>
              <li>Request deletion of your data (subject to legal obligations)</li>
              <li>Opt out of marketing communications at any time</li>
              <li>Lodge a complaint with the relevant data protection authority</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:info@antarscents.shop" className="text-gold hover:underline">info@antarscents.shop</a>.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">9. Children</h2>
            <p>Our website is not directed at children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will promptly delete it.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top reflects the most recent revision. Continued use of our website after any changes constitutes acceptance of the updated policy.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">11. Contact Us</h2>
            <p>For any privacy-related questions or requests:</p>
            <div className="mt-3 bg-[#111] border border-[#1A1A1A] rounded-xl p-5 space-y-1">
              <p><strong className="text-white">Antar Scents</strong></p>
              <p>Nairobi, Kenya</p>
              <p>Email: <a href="mailto:info@antarscents.shop" className="text-gold hover:underline">info@antarscents.shop</a></p>
              <p>Phone: <a href="tel:+254792274842" className="text-gold hover:underline">+254 792 274 842</a></p>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/terms" className="text-gold hover:underline text-sm">Terms of Service →</Link>
          <Link href="/contact" className="text-gold hover:underline text-sm">Contact Us →</Link>
        </div>
      </div>
    </div>
  );
}
