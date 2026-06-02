'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingCart, Eye } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { favouritesApi } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface Product {
  id: string;
  title: string;
  handle: string;
  vendor?: string;
  images?: { src: string }[];
  selling_price: number;
  variants?: { price?: number; option_value?: string }[];
  tags?: string[];
}

interface ProductCardProps {
  product: Product;
  onQuickView?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickView }: ProductCardProps) {
  const [faved, setFaved] = useState(false);
  const [hovering, setHovering] = useState(false);
  const { addItem, openCart } = useCartStore();
  const { user } = useAuthStore();

  const image = product.images?.[0]?.src || '/placeholder-perfume.jpg';
  const price = product.variants?.[0]?.price || product.selling_price;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem({
      product_id: product.id,
      title: product.title,
      handle: product.handle,
      unit_price: price,
      quantity: 1,
      image,
    });
    toast.success('Added to cart');
    openCart();
  };

  const handleFavourite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) { toast.error('Please login to save favourites'); return; }
    try {
      if (faved) {
        await favouritesApi.remove(product.id);
        setFaved(false);
        toast.success('Removed from favourites');
      } else {
        await favouritesApi.add(product.id);
        setFaved(true);
        toast.success('Added to favourites');
      }
    } catch { toast.error('Something went wrong'); }
  };

  return (
    <div
      className="group relative bg-[#111] rounded-lg overflow-hidden card-hover border border-[#1A1A1A] hover:border-gold/30 transition-all duration-300"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      <Link href={`/product/${product.handle}`}>
        <div className="relative aspect-square overflow-hidden bg-[#0D0D0D]">
          <Image
            src={image}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
          <button
            onClick={handleFavourite}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 flex items-center justify-center hover:bg-black transition-colors z-10"
          >
            <Heart size={16} className={faved ? 'fill-gold text-gold' : 'text-white'} />
          </button>
          {hovering && onQuickView && (
            <button
              onClick={(e) => { e.preventDefault(); onQuickView(product); }}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/80 text-white text-xs px-4 py-2 rounded-full border border-white/20 hover:border-gold hover:text-gold transition-all whitespace-nowrap"
            >
              <Eye size={14} /> Quick View
            </button>
          )}
        </div>
      </Link>

      <div className="p-3">
        {product.vendor && <p className="text-gray-500 text-xs mb-1 truncate">{product.vendor}</p>}
        <Link href={`/product/${product.handle}`}>
          <h3 className="text-white text-sm font-medium mb-2 line-clamp-2 hover:text-gold transition-colors leading-snug">{product.title}</h3>
        </Link>
        <div className="flex items-center justify-between">
          <span className="text-gold font-semibold text-sm">{formatKES(price)}</span>
        </div>
        <button
          onClick={handleAddToCart}
          className="mt-3 w-full btn-gold py-2 text-xs font-semibold flex items-center justify-center gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all"
        >
          <ShoppingCart size={14} /> Add to Cart
        </button>
      </div>
    </div>
  );
}
