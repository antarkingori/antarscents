import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
      <div className="text-center space-y-6">
        <p className="text-gold text-8xl font-playfair font-bold">404</p>
        <h1 className="text-2xl font-playfair font-semibold">Page Not Found</h1>
        <p className="text-gray-400 text-sm max-w-xs mx-auto">The page you're looking for doesn't exist or has been moved.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/" className="btn-gold px-6 py-3 text-sm">Go Home</Link>
          <Link href="/shop" className="btn-outline-gold px-6 py-3 text-sm">Browse Shop</Link>
        </div>
      </div>
    </div>
  );
}
