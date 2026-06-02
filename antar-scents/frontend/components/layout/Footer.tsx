import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black border-t border-[#1A1A1A] mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="font-playfair text-2xl font-bold gold-text mb-3">ANTAR SCENTS</h3>
            <p className="text-gray-400 text-sm mb-4">Premium fragrances curated for every personality. Genuine products delivered across Kenya.</p>
            <div className="flex gap-3">
              {[
                { href: 'https://instagram.com', icon: 'instagram', label: 'Instagram' },
                { href: 'https://facebook.com', icon: 'facebook', label: 'Facebook' },
                { href: 'https://tiktok.com', icon: 'tiktok', label: 'TikTok' },
                { href: 'https://twitter.com', icon: 'twitter', label: 'Twitter' },
              ].map(s => (
                <a key={s.icon} href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                  className="w-9 h-9 rounded-full border border-[#333] flex items-center justify-center text-gray-400 hover:border-gold hover:text-gold transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    {s.icon === 'instagram' && <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />}
                    {s.icon === 'facebook' && <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />}
                    {s.icon === 'tiktok' && <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />}
                    {s.icon === 'twitter' && <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide text-sm uppercase">Quick Links</h4>
            <ul className="space-y-2.5">
              {[['/', 'Home'], ['/shop', 'Shop All'], ['/shop?sort=newest', 'New Arrivals'], ['/shop?sort=best_selling', 'Best Sellers'], ['/shop?category=gift-sets', 'Gift Sets'], ['/about', 'About Us'], ['/contact', 'Contact Us']].map(([href, label]) => (
                <li key={href}><Link href={href} className="text-gray-400 hover:text-gold text-sm transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide text-sm uppercase">Customer Service</h4>
            <ul className="space-y-2.5">
              {[['/track', 'Track My Order'], ['/faq', 'FAQ'], ['/shipping', 'Shipping Policy'], ['/returns', 'Returns & Exchanges'], ['/privacy', 'Privacy Policy'], ['/terms', 'Terms of Service']].map(([href, label]) => (
                <li key={href}><Link href={href} className="text-gray-400 hover:text-gold text-sm transition-colors">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 tracking-wide text-sm uppercase">Contact Us</h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li><a href="mailto:info@antarscents.shop" className="hover:text-gold transition-colors">📧 info@antarscents.shop</a></li>
              <li><a href="tel:+254792274842" className="hover:text-gold transition-colors">📞 +254 792 274 842</a></li>
              <li><a href="https://wa.me/254792274842?text=Hi%20Antar%20Scents!%20I%27d%20like%20to%20inquire%20about%20your%20fragrances%20%F0%9F%8C%9F" target="_blank" rel="noopener noreferrer" className="hover:text-gold transition-colors">💬 WhatsApp Us</a></li>
              <li><span>📍 Nairobi, Kenya</span></li>
              <li><span>⏰ Mon–Sat, 8AM–8PM</span></li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-[#1A1A1A] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-gray-500 text-xs">© 2025 Antar Scents. All rights reserved.</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="bg-[#1A1A1A] px-3 py-1.5 rounded border border-[#333] font-bold text-green-400">M-PESA</span>
            <span className="bg-[#1A1A1A] px-3 py-1.5 rounded border border-[#333] text-blue-400 font-bold">VISA</span>
            <span className="bg-[#1A1A1A] px-3 py-1.5 rounded border border-[#333] text-red-400 font-bold">MC</span>
            <span className="bg-[#1A1A1A] px-3 py-1.5 rounded border border-[#333] text-blue-600 font-bold">Paystack</span>
          </div>
          <div className="flex gap-4 text-xs text-gray-500">
            <Link href="/privacy" className="hover:text-gold">Privacy</Link>
            <Link href="/terms" className="hover:text-gold">Terms</Link>
            <Link href="/returns" className="hover:text-gold">Returns</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
