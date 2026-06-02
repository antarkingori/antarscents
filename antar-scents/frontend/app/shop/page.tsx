import { Suspense } from 'react';
import ShopContent from './ShopContent';

export const metadata = {
  title: 'Shop All Fragrances',
  description: 'Browse our full collection of premium fragrances. Filter by category, price, and brand.',
};

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black" />}>
      <ShopContent />
    </Suspense>
  );
}
