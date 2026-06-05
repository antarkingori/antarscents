const express = require('express');
const supabase = require('../lib/supabase');
const { authMiddleware } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get('/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [todaySales, monthRevenue, totalOrders, pendingOrders, totalProducts, recentOrders] = await Promise.all([
      supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', today.toISOString()),
      supabase.from('orders').select('total').eq('payment_status', 'paid').gte('created_at', monthStart.toISOString()),
      supabase.from('orders').select('id', { count: 'exact', head: true }),
      supabase.from('orders').select('id', { count: 'exact', head: true }).eq('order_status', 'pending'),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('orders')
        .select('id,order_number,customer_name,customer_phone,total,payment_status,order_status,payment_method,mpesa_code,created_at')
        .order('created_at', { ascending: false }).limit(10)
    ]);

    const todayTotal = (todaySales.data || []).reduce((s, o) => s + parseFloat(o.total), 0);
    const monthTotal = (monthRevenue.data || []).reduce((s, o) => s + parseFloat(o.total), 0);

    const { data: chartData } = await supabase.from('orders').select('total,created_at').eq('payment_status', 'paid').gte('created_at', thirtyDaysAgo.toISOString()).order('created_at', { ascending: true });

    const revenueByDay = {};
    (chartData || []).forEach(o => {
      const day = o.created_at.slice(0, 10);
      revenueByDay[day] = (revenueByDay[day] || 0) + parseFloat(o.total);
    });
    const revenueChart = Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue }));

    res.json({
      success: true, data: {
        today_sales: todayTotal,
        this_month_revenue: monthTotal,
        total_orders: totalOrders.count || 0,
        pending_orders_count: pendingOrders.count || 0,
        total_products: totalProducts.count || 0,
        recent_orders: recentOrders.data || [],
        revenue_chart: revenueChart
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/finances', async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = supabase.from('orders').select('id,order_number,customer_name,items,total,created_at').eq('payment_status', 'paid');
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to + 'T23:59:59');
    const { data: orders } = await query.order('created_at', { ascending: true });

    let totalRevenue = 0, totalCost = 0;
    const breakdown = (orders || []).map(order => {
      const revenue = parseFloat(order.total);
      const cost = (order.items || []).reduce((s, item) => s + (parseFloat(item.buying_price || 0) * item.quantity), 0);
      totalRevenue += revenue;
      totalCost += cost;
      return { order_number: order.order_number, date: order.created_at, customer: order.customer_name, items: order.items?.length || 0, revenue, cost, profit: revenue - cost };
    });

    const netProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) : 0;
    const byDay = {};
    breakdown.forEach(o => {
      const day = o.date.slice(0, 10);
      if (!byDay[day]) byDay[day] = { date: day, revenue: 0, cost: 0, profit: 0 };
      byDay[day].revenue += o.revenue;
      byDay[day].cost += o.cost;
      byDay[day].profit += o.profit;
    });

    res.json({
      success: true, data: {
        summary: { total_revenue: totalRevenue, total_cost: totalCost, net_profit: netProfit, profit_margin: parseFloat(profitMargin), total_orders: orders?.length || 0, avg_order_value: orders?.length ? totalRevenue / orders.length : 0 },
        chart_data: Object.values(byDay),
        orders_breakdown: breakdown
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/finances/export', async (req, res) => {
  try {
    const { from, to } = req.query;
    let query = supabase.from('orders').select('order_number,customer_name,items,total,created_at').eq('payment_status', 'paid');
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to + 'T23:59:59');
    const { data: orders } = await query;

    const rows = [['Order #', 'Date', 'Customer', 'Items', 'Revenue (KES)', 'Cost (KES)', 'Profit (KES)']];
    (orders || []).forEach(order => {
      const revenue = parseFloat(order.total);
      const cost = (order.items || []).reduce((s, i) => s + (parseFloat(i.buying_price || 0) * i.quantity), 0);
      rows.push([order.order_number, order.created_at.slice(0, 10), order.customer_name, order.items?.length || 0, revenue.toFixed(2), cost.toFixed(2), (revenue - cost).toFixed(2)]);
    });

    const csv = rows.map(r => r.join(',')).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="antar-scents-finances.csv"');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/customers', async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let query = supabase.from('users').select('id,email,full_name,phone,created_at', { count: 'exact' }).eq('role', 'customer');
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1).order('created_at', { ascending: false });
    const { data: customers, error, count } = await query;
    if (error) throw error;

    // Single batch query instead of one query per customer (avoids N+1)
    const enriched = await (async () => {
      if (!customers?.length) return [];
      const ids = customers.map(c => c.id);
      const { data: paidOrders } = await supabase
        .from('orders')
        .select('user_id,total')
        .in('user_id', ids)
        .eq('payment_status', 'paid');
      const byUser = {};
      (paidOrders || []).forEach(o => {
        if (!byUser[o.user_id]) byUser[o.user_id] = { count: 0, total: 0 };
        byUser[o.user_id].count++;
        byUser[o.user_id].total += parseFloat(o.total);
      });
      return customers.map(c => ({
        ...c,
        order_count: byUser[c.id]?.count || 0,
        total_spent: byUser[c.id]?.total || 0,
      }));
    })();

    res.json({ success: true, data: enriched, total: count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
