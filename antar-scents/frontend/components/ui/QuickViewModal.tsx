'use client';
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { X, ShoppingCart, Heart } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { formatKES } from '@/lib/utils';
import { Product } from './ProductCard';
import toast from 'react-hot-toast';

interface QuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function QuickViewModal({ product, onClose }: QuickViewModalProps) {
  const [qty, setQty] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const { addItem, openCart } = useCartStore();

  if (!product) return null;

  const image = product.images?.[0]?.src || '/placeholder-perfume.jpg';
  const variant = product.variants?.[selectedVariant];
  const price = variant?.price || product.selling_price;

  const handleAddToCart = () => {
    addItem({ product_id: product.id, title: product.title, handle: product.handle, unit_price: price, quantity: qty, image, variant: variant?.option_value });
    toast.success('Added to cart');
    onClose();
    openCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-[#111] border border-[#222] rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-slide-up">
        <button onClick={onClose} className="absolute top-4 right-4 p-1.5 bg-[#1A1A1A] rounded-full hover:text-gold transition-colors z-10"><X size={18} /></button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
          <div className="relative aspect-square bg-[#0D0D0D] rounded-t-xl sm:rounded-l-xl sm:rounded-tr-none overflow-hidden">
            <Image src={image} alt={product.title} fill className="object-cover" sizes="400px" />
          </div>
          <div className="p-6 flex flex-col gap-4">
            {product.vendor && <p className="text-gray-500 text-sm">{product.vendor}</p>}
            <h2 className="font-playfair text-xl font-semibold">{product.title}</h2>
            <p className="text-gold text-2xl font-bold">{formatKES(price)}</p>
            {product.variants && product.variants.length > 1 && (
              <div>
                <p className="text-sm text-gray-400 mb-2">Size</p>
                <div className="flex gap-2 flex-wrap">
                  {product.variants.map((v, i) => (
                    <button key={i} onClick={() => setSelectedVariant(i)} className={`px-3 py-1.5 rounded border text-sm transition-colors ${selectedVariant === i ? 'border-gold text-gold' : 'border-[#333] text-gray-400 hover:border-gold/50'}`}>{v.option_value}</button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-sm text-gray-400 mb-2">Quantity</p>
              <div className="flex items-center gap-3 bg-[#1A1A1A] rounded-md w-fit px-3 py-2">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="text-gray-400 hover:text-gold">-</button>
                <span className="w-6 text-center font-medium">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="text-gray-400 hover:text-gold">+</button>
              </div>
            </div>
            <button onClick={handleAddToCart} className="btn-gold py-3 font-semibold flex items-center justify-center gap-2">
              <ShoppingCart size={18} /> Add to Cart
            </button>
            <Link href={`/product/${product.handle}`} onClick={onClose} className="btn-outline-gold py-2.5 text-center text-sm font-medium">View Full Details</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
