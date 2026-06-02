'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';

const FAQS = [
  {
    category: 'Orders & Delivery',
    items: [
      {
        q: 'How long does delivery take?',
        a: 'Same-day delivery is available within Nairobi for orders placed before 2 PM. Kenya-wide delivery takes 1–3 business days. International orders are delivered in 7–14 business days depending on destination.',
      },
      {
        q: 'How much does delivery cost?',
        a: 'Nairobi delivery starts from KSh 200 depending on your location. Kenya-wide delivery is KSh 400–700. International shipping rates are calculated at checkout based on your country and order weight.',
      },
      {
        q: 'Can I track my order?',
        a: 'Yes! Once your order is dispatched you will receive an SMS with your order number. You can track your order at any time on our Track Order page using that number.',
      },
      {
        q: 'Do you deliver on weekends?',
        a: 'Yes, we deliver Monday through Saturday, 8 AM to 8 PM. Sunday deliveries are available in Nairobi for an additional fee — contact us on WhatsApp to arrange.',
      },
      {
        q: 'What happens if I am not home when delivery arrives?',
        a: 'Our rider will call you when they are nearby. If you are unavailable, we can hold the order and reattempt delivery the next business day at no extra charge.',
      },
    ],
  },
  {
    category: 'Products & Authenticity',
    items: [
      {
        q: 'Are all your fragrances genuine and authentic?',
        a: 'Absolutely. Every fragrance sold by Antar Scents is 100% genuine and sourced directly from authorised distributors. We do not stock imitations or "inspired-by" products.',
      },
      {
        q: 'Do you sell decants or full bottles?',
        a: 'We sell both. Full bottles in their original packaging, plus travel decants that are perfect for sampling before committing to a full size. Decant sizes and pricing are listed clearly on each product page.',
      },
      {
        q: 'How do I know which fragrance suits me?',
        a: 'Each product page includes detailed scent notes, occasion guidance, and a longevity rating. If you need personalised advice, message us on WhatsApp — our team is happy to recommend fragrances based on your preferences.',
      },
      {
        q: 'Do your products come with original packaging?',
        a: 'Full bottles include their complete original packaging. Decants are supplied in high-quality glass atomisers with sealed caps and labelled with the fragrance name and size.',
      },
    ],
  },
  {
    category: 'Payments',
    items: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept M-Pesa (Lipa Na M-Pesa), Visa, Mastercard, and bank transfers. Payment details are shown at checkout.',
      },
      {
        q: 'Is my payment secure?',
        a: 'Yes. All card payments are processed through Paystack, which is PCI-DSS compliant. We never store your card details on our servers.',
      },
      {
        q: 'Can I pay on delivery (cash on delivery)?',
        a: 'Cash on delivery is available for Nairobi orders only. Select "Pay on Delivery" at checkout. Please have the exact amount ready as riders may not carry change.',
      },
    ],
  },
  {
    category: 'Returns & Exchanges',
    items: [
      {
        q: 'Can I return a fragrance I don\'t like?',
        a: 'We accept returns within 7 days of delivery for items that are unopened and in their original, sealed packaging. Fragrances that have been opened or used cannot be returned for hygiene reasons.',
      },
      {
        q: 'What if I receive the wrong or damaged item?',
        a: 'We sincerely apologise for any error. Please photograph the item and contact us within 48 hours of delivery via WhatsApp or email. We will arrange a free replacement or full refund immediately.',
      },
      {
        q: 'How long does a refund take?',
        a: 'M-Pesa refunds are processed within 24 hours. Card refunds take 3–7 business days to reflect, depending on your bank.',
      },
    ],
  },
  {
    category: 'Account & Orders',
    items: [
      {
        q: 'Do I need an account to place an order?',
        a: 'No. You can check out as a guest. However, creating a free account lets you track orders, view order history, save favourites, and enjoy a faster checkout experience.',
      },
      {
        q: 'How do I cancel or modify my order?',
        a: 'Contact us within 1 hour of placing your order via WhatsApp or email and we will do our best to accommodate changes. Once an order is dispatched, it cannot be cancelled.',
      },
      {
        q: 'I forgot my password. How do I reset it?',
        a: 'Click "Forgot Password" on the sign-in page, enter your email address, and we will send you a reset link valid for 1 hour. Check your spam folder if it doesn\'t arrive.',
      },
    ],
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-[#1A1A1A] last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-4 text-left gap-4 group"
      >
        <span className="text-white text-sm font-medium group-hover:text-gold transition-colors">{q}</span>
        <ChevronDown size={18} className={`text-gray-500 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-gold' : ''}`} />
      </button>
      {open && (
        <p className="text-gray-400 text-sm leading-relaxed pb-4">{a}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-gold text-xs tracking-widest uppercase mb-3">Support</p>
          <h1 className="font-playfair text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-400">Everything you need to know about shopping with Antar Scents.</p>
        </div>

        <div className="space-y-10">
          {FAQS.map(section => (
            <div key={section.category}>
              <h2 className="font-playfair text-xl font-semibold text-gold mb-2 pb-2 border-b border-[#2a2000]">{section.category}</h2>
              <div className="bg-[#111] border border-[#1A1A1A] rounded-xl px-6">
                {section.items.map(item => (
                  <FAQItem key={item.q} q={item.q} a={item.a} />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 bg-[#111] border border-[#1A1A1A] rounded-2xl p-8 text-center">
          <h3 className="font-playfair text-xl font-semibold mb-2">Still have questions?</h3>
          <p className="text-gray-400 text-sm mb-6">Our team is available Monday–Saturday, 8 AM–8 PM (EAT).</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href="https://wa.me/254792274842?text=Hi%20Antar%20Scents!%20I%20have%20a%20question%20about%20my%20order." target="_blank" rel="noopener noreferrer" className="btn-gold px-6 py-3 text-sm font-semibold">
              WhatsApp Us
            </a>
            <a href="mailto:info@antarscents.shop" className="border border-[#333] hover:border-gold text-gray-300 hover:text-gold px-6 py-3 rounded text-sm font-semibold transition-colors">
              Email Us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
