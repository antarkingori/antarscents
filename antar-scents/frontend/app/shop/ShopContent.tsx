'use client';
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileBottomNav from '@/components/layout/MobileBottomNav';
import ProductCard, { Product } from '@/components/ui/ProductCard';
import QuickViewModal from '@/components/ui/QuickViewModal';
import { ProductGridSkeleton } from '@/components/ui/LoadingSkeleton';
import { productsApi, categoriesApi } from '@/lib/api';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';

const SORT_OPTIONS = [
  { value: '', label: 'Featured' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest' },
];

export default function ShopContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filterOpen, setFilterOpen] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || '',
    min_price: '',
    max_price: '',
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.category = filters.category;
      if (filters.sort) params.sort = filters.sort;
      if (filters.min_price) params.min_price = filters.min_price;
      if (filters.max_price) params.max_price = filters.max_price;
      const { data } = await productsApi.getAll(params);
      setProducts(data.data || []);
      setTotal(data.total || 0);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    categoriesApi.getAll().then(({ data }) => setCategories(data.data || [])).catch(() => {});
  }, []);

  const updateFilter = (key: string, value: string) => {
    setFilters(f => ({ ...f, [key]: value }));
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ search: '', category: '', sort: '', min_price: '', max_price: '' });
    setPage(1);
    router.push('/shop');
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3 text-gray-300 uppercase tracking-wide">Category</h3>
        <div className="space-y-2">
          {categories.length === 0 && (
            <p className="text-gray-500 text-xs">Loading categories...</p>
          )}
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
              <input type="radio" name="category" value={cat.slug} checked={filters.category === cat.slug}
                onChange={() => updateFilter('category', cat.slug === filters.category ? '' : cat.slug)}
                className="accent-gold" />
              <span className="text-sm text-gray-400 group-hover:text-gold transition-colors">{cat.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3 text-gray-300 uppercase tracking-wide">Price Range (KES)</h3>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" placeholder="Min" value={filters.min_price}
            onChange={e => updateFilter('min_price', e.target.value)} className="input-dark text-sm" />
          <input type="number" placeholder="Max" value={filters.max_price}
            onChange={e => updateFilter('max_price', e.target.value)} className="input-dark text-sm" />
        </div>
      </div>
      {activeFiltersCount > 0 && (
        <button onClick={clearFilters} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors">
          <X size={14} /> Clear all filters
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="font-playfair text-3xl font-bold mb-1">Shop All Fragrances</h1>
          <p className="text-gray-400 text-sm">{total} products available</p>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          <aside className="hidden md:block w-56 flex-shrink-0">
            <div className="bg-[#111] rounded-xl border border-[#1A1A1A] p-5 sticky top-24">
              <h2 className="font-semibold mb-4">
                Filters {activeFiltersCount > 0 && (
                  <span className="bg-gold text-black text-xs px-2 py-0.5 rounded-full ml-1">{activeFiltersCount}</span>
                )}
              </h2>
              <FilterPanel />
            </div>
          </aside>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-6 flex-wrap">
              <button onClick={() => setFilterOpen(true)}
                className="md:hidden flex items-center gap-2 bg-[#111] border border-[#333] px-4 py-2 rounded-lg text-sm hover:border-gold transition-colors">
                <SlidersHorizontal size={16} /> Filters {activeFiltersCount > 0 && `(${activeFiltersCount})`}
              </button>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-gray-500 text-sm hidden sm:block">Sort by</span>
                <div className="relative">
                  <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}
                    className="bg-[#111] border border-[#333] text-sm px-4 py-2 rounded-lg text-white appearance-none pr-8 focus:outline-none focus:border-gold cursor-pointer">
                    {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <p className="text-gray-500 text-sm mb-4">Showing {products.length} of {total} products</p>

            {loading ? (
              <ProductGridSkeleton count={12} />
            ) : products.length === 0 ? (
              <div className="text-center py-24 text-gray-400">
                <p className="text-2xl mb-2">No products found</p>
                <p className="text-sm mb-6">Try adjusting your filters</p>
                <button onClick={clearFilters} className="btn-gold px-6 py-2.5 text-sm">Clear Filters</button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {products.map(p => <ProductCard key={p.id} product={p} onQuickView={setQuickViewProduct} />)}
              </div>
            )}

            {total > 20 && (
              <div className="flex justify-center gap-2 mt-10">
                {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn-outline-gold px-5 py-2 text-sm">Previous</button>}
                {products.length === 20 && <button onClick={() => setPage(p => p + 1)} className="btn-gold px-5 py-2 text-sm">Next</button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {filterOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setFilterOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-[#0D0D0D] border-l border-[#1A1A1A] p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold">Filters</h2>
              <button onClick={() => setFilterOpen(false)}><X size={20} /></button>
            </div>
            <FilterPanel />
          </div>
        </div>
      )}

      <Footer />
      <MobileBottomNav />
      {quickViewProduct && <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />}
    </div>
  );
}
