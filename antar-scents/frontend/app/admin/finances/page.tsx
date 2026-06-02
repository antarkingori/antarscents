'use client';
import { useState, useEffect } from 'react';
import { adminApi } from '@/lib/api';
import { formatKES } from '@/lib/utils';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Loader2, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';

export default function AdminFinancesPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(() => { const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10); });
  const [to, setTo] = useState(() => new Date().toISOString().slice(0, 10));

  const fetchData = async () => {
    setLoading(true);
    adminApi.getFinances(from, to).then(r => setData(r.data.data)).finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const summary = data?.summary as Record<string, number> || {};

  const exportCSV = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/finances/export?from=${from}&to=${to}`, { headers: { Authorization: `Bearer ${localStorage.getItem('antar_token')}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'finances.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div><h1 className="font-playfair text-2xl font-bold">Financial Reports</h1><p className="text-gray-400 text-sm mt-1">Revenue, costs, and profit analysis</p></div>
        <div className="flex items-center gap-2 flex-wrap">
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input-dark text-sm" />
          <span className="text-gray-400 text-sm">to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input-dark text-sm" />
          <button onClick={fetchData} className="btn-gold px-4 py-2 text-sm">Apply</button>
          <button onClick={exportCSV} className="btn-outline-gold px-4 py-2 text-sm flex items-center gap-1.5"><Download size={15} /> Export</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 size={32} className="animate-spin text-gold" /></div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {[
              { label: 'Gross Revenue', value: formatKES(summary.total_revenue || 0), icon: DollarSign, color: 'text-green-400' },
              { label: 'Total Cost (COGS)', value: formatKES(summary.total_cost || 0), icon: TrendingDown, color: 'text-red-400' },
              { label: 'Net Profit', value: formatKES(summary.net_profit || 0), icon: TrendingUp, color: 'text-gold' },
              { label: 'Profit Margin', value: `${summary.profit_margin || 0}%`, icon: TrendingUp, color: summary.profit_margin > 0 ? 'text-green-400' : 'text-red-400' },
              { label: 'Total Orders', value: summary.total_orders || 0, icon: ShoppingCart, color: 'text-blue-400' },
              { label: 'Avg Order Value', value: formatKES(summary.avg_order_value || 0), icon: DollarSign, color: 'text-purple-400' },
            ].map(k => (
              <div key={k.label} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-400 text-xs">{k.label}</p>
                  <k.icon size={15} className={k.color} />
                </div>
                <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
              </div>
            ))}
          </div>

          {(data?.chart_data as unknown[])?.length > 0 && (
            <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6">
              <h2 className="font-semibold mb-6">Revenue vs Profit</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.chart_data as unknown[]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
                  <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fill: '#666', fontSize: 10 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8 }} formatter={(v: number) => formatKES(v)} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill="#C9A84C" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="profit" name="Profit" fill="#4ade80" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="cost" name="Cost" fill="#f87171" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="bg-[#111] border border-[#1A1A1A] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#1A1A1A]"><h2 className="font-semibold">Orders Breakdown</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-[#1A1A1A] text-gray-500 text-xs">
                  {['Order #', 'Date', 'Customer', 'Items', 'Revenue', 'Cost', 'Profit', 'Margin'].map(h => <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
                </tr></thead>
                <tbody>
                  {(data?.orders_breakdown as Record<string, unknown>[])?.slice(0, 50).map(o => {
                    const margin = o.revenue ? (((o.profit as number) / (o.revenue as number)) * 100).toFixed(1) : '0';
                    return (
                      <tr key={o.order_number as string} className="border-b border-[#0D0D0D] hover:bg-[#0D0D0D]">
                        <td className="px-4 py-3 text-gold">#{String(o.order_number).padStart(5, '0')}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{(o.date as string)?.slice(0, 10)}</td>
                        <td className="px-4 py-3 max-w-[120px]"><p className="truncate">{o.customer as string}</p></td>
                        <td className="px-4 py-3 text-center">{o.items as number}</td>
                        <td className="px-4 py-3 text-green-400">{formatKES(o.revenue as number)}</td>
                        <td className="px-4 py-3 text-red-400">{formatKES(o.cost as number)}</td>
                        <td className="px-4 py-3 text-gold font-semibold">{formatKES(o.profit as number)}</td>
                        <td className="px-4 py-3 text-xs">{margin}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
