'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, User, Search, Menu, X } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import CartDrawer from '@/components/ui/CartDrawer';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();
  const { count, toggleCart } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/shop?search=${encodeURIComponent(search.trim())}`);
  };

  return (
    <>
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? 'bg-black/95 shadow-lg shadow-gold/5 backdrop-blur-md' : 'bg-black'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 h-16">
            <Link href="/" className="flex-shrink-0">
              <span className="font-playfair text-xl font-bold gold-text tracking-widest">ANTAR SCENTS</span>
            </Link>

            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-xl mx-auto">
              <div className="relative w-full">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search fragrances, brands, scents..."
                  className="w-full bg-[#1A1A1A] border border-[#333] rounded-md py-2.5 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gold transition-colors"
                />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gold transition-colors">
                  <Search size={18} />
                </button>
              </div>
            </form>

            <div className="flex items-center gap-1 ml-auto">
              <Link href={user ? '/account' : '/account/login'} className="p-2 hover:text-gold transition-colors" title="Account">
                <User size={22} />
              </Link>
              <Link href="/account" className="p-2 hover:text-gold transition-colors hidden md:block" title="Favourites">
                <Heart size={22} />
              </Link>
              <button onClick={toggleCart} className="p-2 hover:text-gold transition-colors relative" title="Cart">
                <ShoppingBag size={22} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-gold text-black text-xs font-bold rounded-full flex items-center justify-center">{count > 99 ? '99+' : count}</span>
                )}
              </button>
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-2 md:hidden hover:text-gold transition-colors">
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 pb-3 text-sm">
            {[['/', 'Home'], ['/shop', 'Shop All'], ['/shop?category=men', 'Men'], ['/shop?category=women', 'Women'], ['/shop?category=unisex', 'Unisex'], ['/shop?category=gift-sets', 'Gift Sets'], ['/shop?category=luxury', 'Luxury']].map(([href, label]) => (
              <Link key={href} href={href} className="text-gray-300 hover:text-gold transition-colors">{label}</Link>
            ))}
          </nav>
        </div>

        {menuOpen && (
          <div className="md:hidden bg-black border-t border-[#222] px-4 py-4 space-y-3">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search fragrances..." className="w-full input-dark text-sm" />
                <button type="submit" className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"><Search size={16} /></button>
              </div>
            </form>
            {[['/', 'Home'], ['/shop', 'Shop All'], ['/shop?category=men', "Men's Fragrances"], ['/shop?category=women', "Women's Fragrances"], ['/shop?category=unisex', 'Unisex'], ['/shop?category=gift-sets', 'Gift Sets'], ['/track', 'Track Order']].map(([href, label]) => (
              <Link key={href} href={href} onClick={() => setMenuOpen(false)} className="block text-gray-300 hover:text-gold py-2 border-b border-[#1a1a1a] transition-colors">{label}</Link>
            ))}
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  );
}
