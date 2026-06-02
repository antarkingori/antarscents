import Link from 'next/link';
import { Shield, Star, Truck, Heart } from 'lucide-react';

export const metadata = { title: 'About Us — Antar Scents' };

const VALUES = [
  {
    icon: <Shield size={24} className="text-gold" />,
    title: 'Authenticity Guaranteed',
    desc: 'Every fragrance is 100% genuine, sourced directly from authorised distributors. No imitations, no compromises.',
  },
  {
    icon: <Star size={24} className="text-gold" />,
    title: 'Curated Selection',
    desc: 'We handpick every fragrance in our collection — from timeless classics to rare niche finds — so you only see the best.',
  },
  {
    icon: <Truck size={24} className="text-gold" />,
    title: 'Fast & Reliable Delivery',
    desc: 'Same-day delivery across Nairobi, 1–3 days Kenya-wide, and worldwide shipping. Your fragrance, on your schedule.',
  },
  {
    icon: <Heart size={24} className="text-gold" />,
    title: 'Personal Service',
    desc: 'Our team loves fragrances as much as you do. We offer personalised recommendations and are always a WhatsApp message away.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white">

      {/* Hero */}
      <div className="relative py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1400]/40 to-black pointer-events-none" />
        <div className="relative max-w-2xl mx-auto">
          <p className="text-gold text-xs tracking-widest uppercase mb-4">Our Story</p>
          <h1 className="font-playfair text-5xl font-bold mb-6 leading-tight">We Believe Everyone Deserves a Signature Scent</h1>
          <p className="text-gray-400 text-lg leading-relaxed">Antar Scents was born in Nairobi from a simple frustration: genuine, world-class fragrances were either unavailable or unaffordable. We changed that.</p>
        </div>
      </div>

      {/* Story */}
      <div className="max-w-3xl mx-auto px-4 pb-16">
        <div className="grid sm:grid-cols-2 gap-8 mb-16">
          <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8">
            <h2 className="font-playfair text-2xl font-bold text-gold mb-4">The Beginning</h2>
            <p className="text-gray-400 text-sm leading-relaxed">Antar Scents started with a small collection of carefully sourced fragrances and a belief that every person — regardless of budget — deserves access to authentic, high-quality perfumes. What began as a passion project quickly grew into one of Nairobi&apos;s most trusted fragrance destinations.</p>
          </div>
          <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8">
            <h2 className="font-playfair text-2xl font-bold text-gold mb-4">Today</h2>
            <p className="text-gray-400 text-sm leading-relaxed">We now stock hundreds of fragrances from the world&apos;s most prestigious houses — from iconic designer labels to exclusive niche perfumeries. We serve customers across Kenya and ship internationally, staying true to our founding promise: genuine products, real service, and fast delivery.</p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="font-playfair text-3xl font-bold text-center mb-10">What We Stand For</h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {VALUES.map(v => (
              <div key={v.title} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6 flex gap-4">
                <div className="mt-1 flex-shrink-0">{v.icon}</div>
                <div>
                  <h3 className="font-semibold text-white mb-1">{v.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-r from-[#1a1400] to-[#0a0a0a] border border-[#2a2000] rounded-2xl p-8 mb-16">
          <div className="grid grid-cols-3 gap-6 text-center">
            {[
              { stat: '500+', label: 'Fragrances' },
              { stat: '5,000+', label: 'Happy Customers' },
              { stat: '47+', label: 'Countries Served' },
            ].map(s => (
              <div key={s.stat}>
                <p className="font-playfair text-4xl font-bold text-gold mb-1">{s.stat}</p>
                <p className="text-gray-400 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Mission */}
        <div className="text-center mb-16">
          <h2 className="font-playfair text-3xl font-bold mb-4">Our Mission</h2>
          <p className="text-gray-400 text-lg leading-relaxed max-w-xl mx-auto">&ldquo;To make the world&apos;s finest fragrances accessible to every Kenyan and fragrance lover globally, with the service and speed they deserve.&rdquo;</p>
        </div>

        {/* CTA */}
        <div className="bg-[#111] border border-[#1A1A1A] rounded-2xl p-8 text-center">
          <h3 className="font-playfair text-2xl font-bold mb-2">Discover Your Signature Scent</h3>
          <p className="text-gray-400 text-sm mb-6">Explore our full collection and find the fragrance that tells your story.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shop" className="btn-gold px-8 py-3 font-semibold">Shop Now</Link>
            <Link href="/contact" className="border border-[#333] hover:border-gold text-gray-300 hover:text-gold px-8 py-3 rounded font-semibold transition-colors text-sm">Get in Touch</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
