'use client';
import { useState, useEffect, useCallback } from 'react';
import { ordersApi } from '@/lib/api';
import { formatKES, timeAgo } from '@/lib/utils';
import { OrderStatusBadge, PaymentStatusBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { Search, Filter, Download, Loader2, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';

const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Record<string, unknown> | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ search: '', order_status: '', payment_status: '', payment_method: '' });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });
      const { data } = await ordersApi.getAll(params);
      setOrders(data.data || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const openOrder = (o: Record<string, unknown>) => { setSelectedOrder(o); setNewStatus(o.order_status as string); setAdminNotes(o.admin_notes as string || ''); };

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setSaving(true);
    try {
      await ordersApi.updateStatus(selectedOrder.id as string, newStatus, adminNotes);
      toast.success('Order updated');
      setSelectedOrder(null);
      fetchOrders();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const handleMarkPaid = async () => {
    if (!selectedOrder) return;
    try {
      await ordersApi.markPaid(selectedOrder.id as string);
      toast.success('Order marked as paid');
      setSelectedOrder(null);
      fetchOrders();
    } catch { toast.error('Failed to mark as paid'); }
  };

  const exportCSV = () => {
    const rows = [['Order #', 'Date', 'Customer', 'Phone', 'Total', 'Payment Method', 'Payment Status', 'Order Status']];
    orders.forEach(o => rows.push([String(o.order_number), new Date(o.created_at as string).toLocaleDateString(), o.customer_name as string, o.customer_phone as string, String(o.total), o.payment_method as string, o.payment_status as string, o.order_status as string]));
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'orders.csv'; a.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="font-playfair text-2xl font-bold">Orders</h1><p className="text-gray-400 text-sm mt-1">{total} total orders</p></div>
        <button onClick={exportCSV} className="btn-outline-gold px-4 py-2 text-sm flex items-center gap-2"><Download size={16} /> Export CSV</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input type="text" value={filters.search} onChange={e => setFilters(p => ({ ...p, search: e.target.value }))} placeholder="Search orders..." className="input-dark pl-9 text-sm w-full" />
        </div>
        {[
          { key: 'order_status', options: ORDER_STATUSES, placeholder: 'All statuses' },
          { key: 'payment_status', options: ['pending', 'paid', 'failed'], placeholder: 'Payment status' },
          { key: 'payment_method', options: ['mpesa_till', 'mpesa_stk', 'paystack_card', 'paystack_mobile'], placeholder: 'Payment method' },
        ].map(f => (
          <div key={f.key} className="relative">
            <select value={(filters as Record<string, string>)[f.key]} onChange={e => setFilters(p => ({ ...p, [f.key]: e.target.value }))} className="input-dark text-sm w-full appearance-none pr-8">
              <option value="">{f.placeholder}</option>
              {f.options.map(o => <option key={o} value={o}>{o.replace('_', ' ')}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        ))}
      </div>

      <div className="bg-[#111] border border-[#1A1A1A] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-[#1A1A1A] text-gray-500 text-xs">
              {['Order #', 'Date', 'Customer', 'Phone', 'Items', 'Total', 'Payment', 'Status', 'Actions'].map(h => <th key={h} className="text-left px-4 py-3 font-medium whitespace-nowrap">{h}</th>)}
            </tr></thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="text-center py-16"><Loader2 size={24} className="animate-spin text-gold mx-auto" /></td></tr>
              ) : orders.map(o => (
                <tr key={o.id as string} className="border-b border-[#0D0D0D] hover:bg-[#0D0D0D] transition-colors">
                  <td className="px-4 py-3 text-gold font-medium whitespace-nowrap">#{String(o.order_number).padStart(5, '0')}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{timeAgo(o.created_at as string)}</td>
                  <td className="px-4 py-3 max-w-[140px]"><p className="truncate">{o.customer_name as string}</p></td>
                  <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{o.customer_phone as string}</td>
                  <td className="px-4 py-3 text-center">{(o.items as unknown[])?.length || 0}</td>
                  <td className="px-4 py-3 font-semibold whitespace-nowrap">{formatKES(parseFloat(o.total as string))}</td>
                  <td className="px-4 py-3"><PaymentStatusBadge label={o.payment_status as string} /></td>
                  <td className="px-4 py-3"><OrderStatusBadge label={o.order_status as string} /></td>
                  <td className="px-4 py-3">
                    <button onClick={() => openOrder(o)} className="text-gold hover:underline text-xs whitespace-nowrap">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {total > 20 && (
          <div className="flex justify-center gap-2 p-4 border-t border-[#1A1A1A]">
            {page > 1 && <button onClick={() => setPage(p => p - 1)} className="btn-outline-gold px-4 py-1.5 text-sm">Previous</button>}
            {orders.length === 20 && <button onClick={() => setPage(p => p + 1)} className="btn-gold px-4 py-1.5 text-sm">Next</button>}
          </div>
        )}
      </div>

      {selectedOrder && (
        <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Order #${String(selectedOrder.order_number).padStart(5, '0')}`} size="lg">
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-gray-400 text-xs mb-1">Customer</p><p className="font-medium">{selectedOrder.customer_name as string}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Phone</p><p>{selectedOrder.customer_phone as string}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Email</p><p>{(selectedOrder.customer_email as string) || '—'}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Pickup Location</p><p>{(selectedOrder.delivery_matatu_route as string) || '—'}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">Payment Method</p><p className="capitalize">{(selectedOrder.payment_method as string)?.replace('_', ' ')}</p></div>
              <div><p className="text-gray-400 text-xs mb-1">M-Pesa Code</p><p className="font-mono">{(selectedOrder.mpesa_code as string) || '—'}</p></div>
            </div>

            <div className="bg-[#0D0D0D] rounded-xl p-4 space-y-2">
              {(selectedOrder.items as Record<string, unknown>[])?.map((item, i) => (
                <div key={i} className="flex justify-between text-xs"><span className="text-gray-300">{item.title as string} × {item.quantity as number}</span><span>{formatKES((item.unit_price as number) * (item.quantity as number))}</span></div>
              ))}
              <hr className="border-[#1A1A1A]" />
              <div className="flex justify-between"><span className="text-gray-400">Delivery</span><span>{formatKES(parseFloat(selectedOrder.delivery_fee as string))}</span></div>
              <div className="flex justify-between font-bold"><span>Total</span><span className="text-gold">{formatKES(parseFloat(selectedOrder.total as string))}</span></div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1.5">Change Order Status</label>
                <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="input-dark text-sm w-full">
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-300 mb-1.5">Internal Notes</label>
              <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} className="input-dark text-sm min-h-[80px] resize-none w-full" placeholder="Admin notes..." />
            </div>

            <div className="flex gap-3">
              <button onClick={handleUpdateStatus} disabled={saving} className="btn-gold flex-1 py-2.5 text-sm font-semibold flex items-center justify-center gap-2">
                {saving ? <Loader2 size={16} className="animate-spin" /> : 'Save Changes'}
              </button>
              {selectedOrder.payment_status !== 'paid' && (
                <button onClick={handleMarkPaid} className="btn-outline-gold px-4 py-2.5 text-sm text-green-400 border-green-500/40 hover:bg-green-500/10">Mark Paid</button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
