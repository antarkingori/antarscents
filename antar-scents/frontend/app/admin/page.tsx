'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { formatKES, timeAgo } from '@/lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Package, ShoppingCart, AlertCircle, DollarSign, BarChart2, Loader2 } from 'lucide-react';

export default function AdminDashboardPage() {
  const [data, setData] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getDashboard().then(r => setData(r.data.data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><Loader2 size={32} className="animate-spin text-gold" /></div>;
  if (!data) return null;

  const kpis = [
    { label: "Today's Sales", value: formatKES(data.today_sales as number), icon: DollarSign, color: 'text-green-400' },
    { label: 'Month Revenue', value: formatKES(data.this_month_revenue as number), icon: TrendingUp, color: 'text-blue-400' },
    { label: 'Total Orders', value: data.total_orders as number, icon: ShoppingCart, color: 'text-purple-400' },
    { label: 'Pending Orders', value: data.pending_orders_count as number, icon: AlertCircle, color: (data.pending_orders_count as number) > 0 ? 'text-red-400' : 'text-gray-400' },
    { label: 'Active Products', value: data.total_products as number, icon: Package, color: 'text-gold' },
    { label: 'Revenue (30d)', value: formatKES((data.revenue_chart as {revenue: number}[] || []).reduce((s, d) => s + d.revenue, 0)), icon: BarChart2, color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-[#111] border border-[#1A1A1A] rounded-xl p-4 hover:border-gold/20 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <p className="text-gray-400 text-xs">{k.label}</p>
              <k.icon size={16} className={k.color} />
            </div>
            <p className={`text-xl font-bold ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {(data.revenue_chart as unknown[])?.length > 0 && (
        <div className="bg-[#111] border border-[#1A1A1A] rounded-xl p-6">
          <h2 className="font-semibold mb-6">Revenue — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data.revenue_chart as unknown[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" />
              <XAxis dataKey="date" tick={{ fill: '#666', fontSize: 11 }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fill: '#666', fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [formatKES(v), 'Revenue']} />
              <Line type="monotone" dataKey="revenue" stroke="#C9A84C" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="bg-[#111] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
          <h2 className="font-semibold">Recent Orders</h2>
          <Link href="/admin/orders" className="text-gold hover:text-gold/80 text-sm">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1A1A1A] text-gray-500 text-xs">
              {['Order #', 'Customer', 'Total', 'Payment', 'Status', 'Date', 'Action'].map(h => <th key={h} className="text-left px-4 py-3 font-medium">{h}</th>)}
            </tr></thead>
            <tbody>
              {(data.recent_orders as Record<string, unknown>[])?.map(o => (
                <tr key={o.id as string} className="border-b border-[#0D0D0D] hover:bg-[#0D0D0D] transition-colors">
                  <td className="px-4 py-3 text-gold font-medium">#{String(o.order_number).padStart(5, '0')}</td>
                  <td className="px-4 py-3">{o.customer_name as string}</td>
                  <td className="px-4 py-3 font-semibold">{formatKES(parseFloat(o.total as string))}</td>
                  <td className="px-4 py-3 capitalize text-xs">{(o.payment_method as string)?.replace('_', ' ')}</td>
                  <td className="px-4 py-3"><OrderStatusBadge label={o.order_status as string} /></td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{timeAgo(o.created_at as string)}</td>
                  <td className="px-4 py-3"><Link href={`/admin/orders`} className="text-gold hover:underline text-xs">View</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
