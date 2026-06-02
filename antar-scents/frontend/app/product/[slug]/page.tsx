'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import ProductCard, { Product } from '@/components/ui/ProductCard';
import { productsApi, recommendationsApi } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { formatKES, getSessionId } from '@/lib/utils';
import { ShoppingCart, Heart, ChevronRight, Star, Truck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/lib/api';

interface FullProduct extends Product {
  body_html?: string;
  product_type?: string;
}

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const [product, setProduct] = useState<FullProduct | null>(null);
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [activeVariant, setActiveVariant] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (!slug) return;
    productsApi.getBySlug(slug as string).then(res => {
      setProduct(res.data.data);
      const p = res.data.data;
      const sessionId = getSessionId();
      api.post('/api/browsing', { product_id: p.id, user_id: user?.id, session_id: sessionId }).catch(() => {});
      if (p.id) {
        recommendationsApi.get(p.id, user?.id, sessionId).then(r => setRecommendations(r.data.data || [])).catch(() => {});
      }
    }).catch(() => {}).finally(() => setLoading(false));
  }, [slug, user]);

  if (loading) return (
    <div className="min-h-screen bg-black">
      <Header />
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="skeleton aspect-square rounded-xl" />
        <div className="space-y-4">
          {[3, 4, 2, 3, 4, 3].map((w, i) => <div key={i} className={`skeleton h-5 w-${w}/4 rounded`} />)}
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <Header />
      <div className="text-center"><h1 className="text-2xl font-playfair mb-4">Product not found</h1><Link href="/shop" className="btn-gold px-6 py-3">Browse Shop</Link></div>
    </div>
  );

  const images = product.images?.length ? product.images : [{ src: '/placeholder-perfume.jpg' }];
  const variant = product.variants?.[activeVariant];
  const price = variant?.price || product.selling_price;

  const handleAddToCart = () => {
    addItem({ product_id: product.id, title: product.title, handle: product.handle, unit_price: price, quantity: qty, image: images[0]?.src, variant: (variant as Record<string, string>)?.option_value });
    toast.success(`Added ${qty} × ${product.title} to cart`);
    openCart();
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/" className="hover:text-gold">Home</Link><ChevronRight size={14} />
          <Link href="/shop" className="hover:text-gold">Shop</Link><ChevronRight size={14} />
          <span className="text-gray-300 truncate">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="relative aspect-square rounded-xl overflow-hidden bg-[#0D0D0D] mb-4">
              <Image src={images[activeImage]?.src} alt={product.title} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority />
            </div>
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto">
                {images.map((img, i) => (
                  <button key={i} onClick={() => setActiveImage(i)} className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${activeImage === i ? 'border-gold' : 'border-[#333] hover:border-gold/50'}`}>
                    <Image src={img.src} alt={`${product.title} ${i + 1}`} fill className="object-cover" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-5">
            {product.vendor && <p className="text-gray-400 text-sm font-medium uppercase tracking-wider">{product.vendor}</p>}
            <h1 className="font-playfair text-3xl lg:text-4xl font-bold">{product.title}</h1>
            <div className="flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={16} className="fill-gold text-gold" />)}
              <span className="text-gray-400 text-sm">(Reviews)</span>
            </div>
            <div>
              <span className="text-gold text-3xl font-bold">{formatKES(price)}</span>
            </div>

            {product.variants && product.variants.length > 1 && (
              <div>
                <p className="text-sm font-medium text-gray-300 mb-2">Size</p>
                <div className="flex gap-2 flex-wrap">
                  {product.variants.map((v, i) => (
                    <button key={i} onClick={() => setActiveVariant(i)} className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${activeVariant === i ? 'border-gold text-gold bg-gold/10' : 'border-[#333] text-gray-300 hover:border-gold/50'}`}>
                      {(v as Record<string, string>).option_value || `Option ${i + 1}`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-medium text-gray-300 mb-2">Quantity</p>
              <div className="flex items-center gap-3 bg-[#1A1A1A] rounded-lg w-fit px-4 py-2.5">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-gray-400 hover:text-gold text-lg font-semibold w-5">−</button>
                <span className="w-8 text-center font-semibold">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="text-gray-400 hover:text-gold text-lg font-semibold w-5">+</button>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={handleAddToCart} className="btn-gold w-full py-4 text-base font-semibold flex items-center justify-center gap-2">
                <ShoppingCart size={20} /> Add to Cart
              </button>
              <Link href="/checkout" className="btn-outline-gold w-full py-4 text-base font-semibold flex items-center justify-center">
                Buy Now
              </Link>
            </div>

            <div className="flex items-start gap-3 bg-[#111] border border-[#1A1A1A] rounded-xl p-4">
              <Truck size={20} className="text-gold flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium">Delivered to your matatu stage</p>
                <p className="text-xs text-gray-400 mt-0.5">KES 200–1,000 delivery fee. Countrywide delivery available.</p>
              </div>
            </div>

            <a href="https://wa.me/254922748842" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-green-400 hover:text-green-300 text-sm transition-colors">
              <span>💬</span> Ask about this product on WhatsApp
            </a>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-16">
          <div className="flex gap-6 border-b border-[#1A1A1A] mb-6">
            {['description', 'scent-notes'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} className={`pb-3 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-gold text-gold' : 'border-transparent text-gray-400 hover:text-white'}`}>
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
          {activeTab === 'description' && (
            <div className="text-gray-300 text-sm leading-relaxed max-w-3xl"
              dangerouslySetInnerHTML={{ __html: product.body_html || '<p>No description available.</p>' }} />
          )}
          {activeTab === 'scent-notes' && (
            <div className="space-y-3 max-w-xl text-sm text-gray-300">
              <div className="flex gap-4"><span className="text-gold font-medium w-20">Top Notes</span><span>Bergamot, Citrus, Fresh Spices</span></div>
              <div className="flex gap-4"><span className="text-gold font-medium w-20">Middle Notes</span><span>Rose, Jasmine, Woody Accord</span></div>
              <div className="flex gap-4"><span className="text-gold font-medium w-20">Base Notes</span><span>Sandalwood, Musk, Amber</span></div>
            </div>
          )}
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mt-20">
            <h2 className="font-playfair text-2xl font-bold mb-6">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommendations.slice(0, 4).map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
