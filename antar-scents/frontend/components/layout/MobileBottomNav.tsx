'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ShoppingCart, User } from 'lucide-react';
import { useCartStore } from '@/store/cart';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { count, toggleCart } = useCartStore();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-black/95 backdrop-blur border-t border-[#222] safe-area-pb">
      <div className="flex items-center">
        <Link href="/" className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${isActive('/') ? 'text-gold' : 'text-gray-400'}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link href="/shop" className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${pathname.startsWith('/shop') ? 'text-gold' : 'text-gray-400'}`}>
          <ShoppingBag size={20} />
          <span>Shop</span>
        </Link>
        <button onClick={toggleCart} className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors relative text-gray-400 hover:text-gold`}>
          <div className="relative">
            <ShoppingCart size={20} />
            {count > 0 && <span className="absolute -top-2 -right-2 w-4 h-4 bg-gold text-black text-[10px] font-bold rounded-full flex items-center justify-center">{count}</span>}
          </div>
          <span>Cart</span>
        </button>
        <Link href="/account" className={`flex-1 flex flex-col items-center py-3 text-xs gap-1 transition-colors ${pathname.startsWith('/account') ? 'text-gold' : 'text-gray-400'}`}>
          <User size={20} />
          <span>Account</span>
        </Link>
      </div>
    </nav>
  );
}
