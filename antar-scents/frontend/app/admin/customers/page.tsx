'use client';
import { useState, useEffect, useCallback } from 'react';
import { adminApi } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { Search, Loader2 } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      const { data } = await adminApi.getCustomers(params);
      setCustomers(data.data || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl font-bold">Customers</h1>
        <p className="text-gray-400 text-sm mt-1">{total} registered customers</p>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search customers..." className="input-dark pl-9 text-sm w-full" />
      </div>

      <div className="bg-[#111] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1A1A1A] text-gray-500 text-xs">
              {['Name', 'Email', 'Phone', 'Total Orders', 'Total Spent', 'Joined', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-16"><Loader2 size={24} className="animate-spin text-gold mx-auto" /></td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-500">No customers found</td></tr>
              ) : customers.map(c => (
                <tr key={c.id as string} className="border-b border-[#0D0D0D] hover:bg-[#0D0D0D] transition-colors">
                  <td className="px-4 py-3 font-medium">{c.full_name as string || '—'}</td>
                  <td className="px-4 py-3 text-gray-400">{c.email as string}</td>
                  <td className="px-4 py-3 text-gray-400">{c.phone as string || '—'}</td>
                  <td className="px-4 py-3 text-center">{c.order_count as number}</td>
                  <td className="px-4 py-3 text-gold font-medium">{formatKES(c.total_spent as number)}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{new Date(c.created_at as string).toLocaleDateString('en-KE')}</td>
                  <td className="px-4 py-3"><button className="text-gold hover:underline text-xs">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex justify-center gap-2 p-4 border-t border-[#1A1A1A]">
            {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn-outline-gold px-4 py-1.5 text-sm">Previous</button>}
            {customers.length === 20 && <button onClick={() => setPage(p => p + 1)} className="btn-gold px-4 py-1.5 text-sm">Next</button>}
          </div>
        )}
      </div>
    </div>
  );
}
