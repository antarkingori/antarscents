import Link from 'next/link';

export const metadata = { title: 'Terms of Service — Antar Scents' };

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold text-xs tracking-widest uppercase mb-3">Legal</p>
          <h1 className="font-playfair text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-400">Please read these terms carefully before using our website or placing an order.</p>
          <p className="text-gray-500 text-xs mt-2">Last updated: June 2025</p>
        </div>

        <div className="space-y-8 text-sm text-gray-400 leading-relaxed">

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">1. Agreement to Terms</h2>
            <p>By accessing or using the Antar Scents website (antarscents.shop) or placing an order, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree, please do not use our website. Antar Scents is a fragrance retailer registered and operating in Nairobi, Kenya.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">2. Products &amp; Pricing</h2>
            <p className="mb-3">We make every effort to display our products and prices accurately. However:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Prices are displayed in Kenyan Shillings (KSh) and are subject to change without notice</li>
              <li>Product images are for illustration; actual product appearance may vary slightly</li>
              <li>We reserve the right to correct pricing errors. If a pricing error affects your order, we will contact you before processing</li>
              <li>Promotional prices apply only for the duration stated and cannot be applied retroactively</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">3. Placing an Order</h2>
            <p className="mb-3">When you place an order on our website:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>You confirm that the information you provide is accurate and complete</li>
              <li>You confirm that you are at least 18 years of age</li>
              <li>Your order constitutes an offer to purchase; it is not confirmed until we send an order confirmation</li>
              <li>We reserve the right to refuse or cancel any order, including in cases of suspected fraud, pricing errors, or stock unavailability</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">4. Payment</h2>
            <p className="mb-3">Payment is required in full before dispatch, except for Cash on Delivery orders within Nairobi. We accept M-Pesa, Visa, Mastercard, and bank transfers. By providing payment details, you confirm you are authorised to use the payment method.</p>
            <p>Card payments are processed securely by Paystack. We do not store card details on our systems.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">5. Delivery</h2>
            <p>Delivery timelines are estimates and not guaranteed. We are not liable for delays caused by courier partners, weather, public holidays, or circumstances beyond our reasonable control. Risk of loss and title for products pass to you upon delivery. Please refer to our <Link href="/shipping" className="text-gold hover:underline">Shipping Policy</Link> for full details.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">6. Returns &amp; Refunds</h2>
            <p>Returns and refunds are governed by our <Link href="/returns" className="text-gold hover:underline">Returns &amp; Exchanges Policy</Link>. By placing an order, you agree to these terms. We reserve the right to refuse returns that do not meet our return conditions.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">7. User Accounts</h2>
            <p className="mb-3">If you create an account:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>You are responsible for maintaining the security of your password</li>
              <li>You agree to notify us immediately of any unauthorised access to your account</li>
              <li>We reserve the right to suspend or terminate accounts that violate these terms</li>
              <li>One account per person. Creating multiple accounts to abuse promotions is prohibited</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">8. Intellectual Property</h2>
            <p>All content on this website — including the Antar Scents logo, product images, text, and design — is the property of Antar Scents or its licensors and is protected by copyright. You may not reproduce, distribute, or use our content without prior written permission.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">9. Prohibited Uses</h2>
            <p className="mb-2">You agree not to:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Use the website for any unlawful purpose</li>
              <li>Attempt to gain unauthorised access to any part of the website or our systems</li>
              <li>Transmit malicious code, spam, or harmful content</li>
              <li>Resell our products commercially without prior written agreement</li>
              <li>Post false reviews or engage in any fraudulent activity</li>
            </ul>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">10. Limitation of Liability</h2>
            <p>To the maximum extent permitted by Kenyan law, Antar Scents shall not be liable for any indirect, incidental, or consequential damages arising from your use of our website or products. Our total liability to you for any claim shall not exceed the amount you paid for the relevant order.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">11. Governing Law</h2>
            <p>These Terms of Service are governed by and construed in accordance with the laws of Kenya. Any disputes shall be subject to the exclusive jurisdiction of the courts of Nairobi, Kenya.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">12. Changes to These Terms</h2>
            <p>We reserve the right to update these terms at any time. The &quot;Last updated&quot; date reflects the most recent revision. Continued use of our website after changes constitutes your acceptance of the updated terms.</p>
          </section>

          <section>
            <h2 className="font-playfair text-xl font-semibold text-white mb-3">13. Contact</h2>
            <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-5 space-y-1">
              <p><strong className="text-white">Antar Scents</strong></p>
              <p>Nairobi, Kenya</p>
              <p>Email: <a href="mailto:info@antarscents.shop" className="text-gold hover:underline">info@antarscents.shop</a></p>
              <p>Phone: <a href="tel:+254792274842" className="text-gold hover:underline">+254 792 274 842</a></p>
            </div>
          </section>
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/privacy" className="text-gold hover:underline text-sm">Privacy Policy →</Link>
          <Link href="/returns" className="text-gold hover:underline text-sm">Returns Policy →</Link>
        </div>
      </div>
    </div>
  );
}
