'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import ProductCard, { Product } from '@/components/ui/ProductCard';
import QuickViewModal from '@/components/ui/QuickViewModal';
import { ProductCardSkeleton } from '@/components/ui/LoadingSkeleton';
import { productsApi, settingsApi } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { ChevronRight, Star, ArrowRight } from 'lucide-react';

const CATEGORIES = [
  { label: 'Men', icon: '🔷', slug: 'men' },
  { label: 'Women', icon: '🌸', slug: 'women' },
  { label: 'Unisex', icon: '✨', slug: 'unisex' },
  { label: 'Gift Sets', icon: '🎁', slug: 'gift-sets' },
  { label: 'Luxury', icon: '👑', slug: 'luxury' },
  { label: 'Travel Size', icon: '✈️', slug: 'travel-size' },
];

const TESTIMONIALS = [
  { name: 'Jane M.', location: 'Mombasa', rating: 5, text: 'Absolutely love the fragrance! Delivered same day right to my pickup location. Genuine product, exactly as described.' },
  { name: 'David K.', location: 'Nakuru', rating: 5, text: 'Fast delivery and great packaging. The perfume smells amazing and has great longevity. Will definitely order again!' },
  { name: 'Amina S.', location: 'Nairobi', rating: 5, text: 'Best online perfume shop in Kenya! Easy M-Pesa payment, quick delivery. Antar Scents never disappoints.' },
];

export default function HomePage() {
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [email, setEmail] = useState('');

  useEffect(() => {
    Promise.all([
      productsApi.getAll({ limit: 8, sort: 'newest' }),
      productsApi.getAll({ limit: 4, sort: 'newest' }),
      settingsApi.getAll(),
    ]).then(([bs, na, st]) => {
      setBestSellers(bs.data.data || []);
      setNewArrivals(na.data.data || []);
      setSettings(st.data.data || {});
    }).finally(() => setLoading(false));
  }, []);

  const announcementBar = settings.announcement_bar || '🚚 Free delivery on orders above KES 5,000 | 📞 +254792274842';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Announcement Bar */}
      <div className="bg-gold text-black text-center text-xs sm:text-sm font-semibold py-2.5 px-4">
        {announcementBar}
      </div>

      <Header />

      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0D0D0D] to-[#1A1000]" />
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 right-20 w-96 h-96 rounded-full bg-gold blur-3xl" />
          <div className="absolute bottom-20 left-20 w-64 h-64 rounded-full bg-gold/50 blur-3xl" />
        </div>
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <p className="text-gold/80 text-sm tracking-[0.3em] uppercase mb-4 font-medium">Premium Fragrances</p>
          <h1 className="font-playfair text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Discover Your<br />
            <span className="gold-text italic">Signature Scent</span>
          </h1>
          <p className="text-gray-300 text-lg sm:text-xl mb-10 max-w-xl mx-auto leading-relaxed">
            Premium fragrances delivered worldwide. Same-day delivery in Nairobi, fast delivery across Kenya and internationally.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="btn-gold px-10 py-4 text-base font-semibold inline-flex items-center gap-2 justify-center">
              Shop Now <ArrowRight size={18} />
            </Link>
            <Link href="/shop?category=luxury" className="btn-outline-gold px-10 py-4 text-base font-semibold inline-flex items-center justify-center">
              View Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Category Strip */}
      <section className="py-10 px-4 border-y border-[#1A1A1A] bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-4 overflow-x-auto scrollbar-hide justify-start md:justify-center pb-2">
            {CATEGORIES.map(cat => (
              <Link key={cat.slug} href={`/shop?category=${cat.slug}`}
                className="flex-shrink-0 flex items-center gap-2 bg-[#1A1A1A] hover:bg-gold/10 border border-[#333] hover:border-gold/40 text-sm px-5 py-3 rounded-full transition-all hover:text-gold whitespace-nowrap">
                <span>{cat.icon}</span>
                <span className="font-medium">{cat.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Best Sellers */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-playfair text-3xl font-bold">Best Sellers</h2>
              <p className="text-gray-400 text-sm mt-1">Most loved fragrances</p>
            </div>
            <Link href="/shop" className="text-gold hover:text-gold/80 text-sm flex items-center gap-1 font-medium">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 md:grid md:grid-cols-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="flex-shrink-0 w-56 md:w-auto"><ProductCardSkeleton /></div>)
              : bestSellers.slice(0, 8).map(p => (
                <div key={p.id} className="flex-shrink-0 w-56 md:w-auto">
                  <ProductCard product={p} onQuickView={setQuickViewProduct} />
                </div>
              ))
            }
          </div>
        </div>
      </section>

      {/* New Arrivals */}
      <section className="py-16 px-4 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="font-playfair text-3xl font-bold">New Arrivals</h2>
              <p className="text-gray-400 text-sm mt-1">Fresh fragrances just added</p>
            </div>
            <Link href="/shop?sort=newest" className="text-gold hover:text-gold/80 text-sm flex items-center gap-1 font-medium">View All <ChevronRight size={16} /></Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
              : newArrivals.map(p => <ProductCard key={p.id} product={p} onQuickView={setQuickViewProduct} />)
            }
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="py-14 px-4 border-y border-[#1A1A1A]">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: '✅', title: 'Genuine Products', desc: 'Authentic fragrances, guaranteed' },
            { icon: '🚚', title: 'Worldwide Delivery', desc: 'Same-day Nairobi · Kenya-wide · International' },
            { icon: '💳', title: 'Secure Payments', desc: 'M-Pesa, Visa & Mastercard' },
            { icon: '💬', title: 'WhatsApp Support', desc: 'We respond instantly' },
          ].map(b => (
            <div key={b.title} className="text-center p-6 bg-[#111] rounded-xl border border-[#1A1A1A] hover:border-gold/20 transition-colors">
              <span className="text-3xl">{b.icon}</span>
              <h3 className="font-semibold text-sm mt-3 mb-1">{b.title}</h3>
              <p className="text-gray-500 text-xs">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: '🛍️', title: 'Browse Scents', desc: 'Explore hundreds of genuine fragrances' },
              { step: '02', icon: '🛒', title: 'Add to Cart', desc: 'Select your size and quantity' },
              { step: '03', icon: '💚', title: 'Pay via M-Pesa', desc: 'Quick and secure payment' },
              { step: '04', icon: '🚚', title: 'Delivered to You', desc: 'Same-day Nairobi, Kenya-wide & worldwide' },
            ].map(s => (
              <div key={s.step} className="text-center relative">
                <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">{s.icon}</div>
                <p className="text-gold text-xs font-bold tracking-widest mb-1">{s.step}</p>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-gray-500 text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-playfair text-3xl font-bold text-center mb-12">What Our Customers Say</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-[#111] border border-[#1A1A1A] hover:border-gold/20 rounded-xl p-6 transition-colors">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => <Star key={i} size={16} className="fill-gold text-gold" />)}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
                <div>
                  <p className="font-semibold text-sm">{t.name}</p>
                  <p className="text-gray-500 text-xs">{t.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-16 px-4 bg-gradient-to-br from-[#1A1000] to-[#0D0D0D] border-y border-gold/20">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="font-playfair text-3xl font-bold mb-3">Get 10% Off Your First Order</h2>
          <p className="text-gray-400 mb-8">Subscribe to receive exclusive offers, new arrivals, and fragrance tips.</p>
          <form onSubmit={e => { e.preventDefault(); setEmail(''); }} className="flex gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 input-dark"
              required
            />
            <button type="submit" className="btn-gold px-6 py-2.5 font-semibold whitespace-nowrap text-sm">Subscribe</button>
          </form>
        </div>
      </section>

      <Footer />
      <MobileBottomNav />

      {quickViewProduct && (
        <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
      )}
    </div>
  );
}
