'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatKES } from '@/lib/utils';

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm" onClick={closeCart} />}
      <div className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0D0D0D] z-50 transform transition-transform duration-300 ease-in-out border-l border-[#1A1A1A] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#1A1A1A]">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} className="text-gold" />
            <h2 className="font-semibold text-lg">Your Cart ({items.length})</h2>
          </div>
          <button onClick={closeCart} className="p-1 hover:text-gold transition-colors"><X size={22} /></button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-gray-400 px-6">
            <ShoppingBag size={64} className="opacity-20" />
            <p className="text-lg font-medium">Your cart is empty</p>
            <p className="text-sm text-center">Add some fragrances to get started</p>
            <Link href="/shop" onClick={closeCart} className="btn-gold px-6 py-3 text-sm">Browse Fragrances</Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {items.map(item => (
                <div key={`${item.product_id}-${item.variant}`} className="flex gap-4 bg-[#111] rounded-lg p-3 border border-[#1A1A1A]">
                  <div className="relative w-20 h-20 rounded-md overflow-hidden bg-[#0D0D0D] flex-shrink-0">
                    <Image src={item.image || '/placeholder-perfume.jpg'} alt={item.title} fill className="object-cover" sizes="80px" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link href={`/product/${item.handle}`} onClick={closeCart} className="text-sm font-medium line-clamp-2 hover:text-gold transition-colors">{item.title}</Link>
                    {item.variant && <p className="text-xs text-gray-500 mt-0.5">{item.variant}</p>}
                    <p className="text-gold text-sm font-semibold mt-1">{formatKES(item.unit_price)}</p>
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 bg-[#1A1A1A] rounded-md px-2 py-1">
                        <button onClick={() => updateQuantity(item.product_id, item.variant, item.quantity - 1)} className="text-gray-400 hover:text-gold"><Minus size={14} /></button>
                        <span className="text-sm w-6 text-center font-medium">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.product_id, item.variant, item.quantity + 1)} className="text-gray-400 hover:text-gold"><Plus size={14} /></button>
                      </div>
                      <button onClick={() => removeItem(item.product_id, item.variant)} className="text-gray-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-6 py-5 border-t border-[#1A1A1A] space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Subtotal</span>
                <span className="font-semibold text-white">{formatKES(subtotal)}</span>
              </div>
              <p className="text-xs text-gray-500">Delivery fee calculated at checkout</p>
              <Link href="/checkout" onClick={closeCart} className="btn-gold w-full py-3.5 text-center font-semibold block text-sm">Proceed to Checkout</Link>
              <button onClick={closeCart} className="w-full text-center text-gray-400 hover:text-white text-sm py-2 transition-colors">Continue Shopping</button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
