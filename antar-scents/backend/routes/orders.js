const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

const orderSchema = z.object({
  customer_name: z.string().min(2),
  customer_email: z.string().email().optional().nullable().or(z.literal('')),
  customer_phone: z.string().regex(/^(\+?254|0)[17]\d{8}$/),
  delivery_name: z.string().optional(),
  delivery_phone: z.string().optional(),
  delivery_matatu_route: z.string().optional(),
  delivery_notes: z.string().optional(),
  items: z.array(z.object({
    product_id: z.string(),
    title: z.string(),
    variant: z.string().optional(),
    quantity: z.number().int().positive().max(99),
    unit_price: z.number().optional(), // accepted but ignored — fetched from DB
    image: z.string().optional()
  })).min(1),
  delivery_fee: z.number().min(0).max(50000),
  payment_method: z.enum(['mpesa_till', 'mpesa_stk', 'paystack_card', 'paystack_mobile']),
  // subtotal/total accepted but ignored — computed server-side from DB prices
  subtotal: z.number().optional(),
  total: z.number().optional(),
});

router.post('/', optionalAuth, async (req, res) => {
  try {
    const data = orderSchema.parse(req.body);

    // Fetch actual selling prices from DB — never trust client-provided prices
    const productIds = [...new Set(data.items.map(i => i.product_id))];
    const { data: products, error: pErr } = await supabase
      .from('products')
      .select('id, selling_price, title, status, images')
      .in('id', productIds);
    if (pErr) throw pErr;

    const productMap = Object.fromEntries((products || []).map(p => [p.id, p]));

    const verifiedItems = [];
    for (const item of data.items) {
      const product = productMap[item.product_id];
      if (!product) return res.status(400).json({ success: false, message: 'One or more products were not found' });
      if (product.status !== 'active') return res.status(400).json({ success: false, message: `"${product.title}" is no longer available` });
      verifiedItems.push({
        product_id: item.product_id,
        title: item.title || product.title,
        variant: item.variant || null,
        quantity: item.quantity,
        unit_price: product.selling_price,
        image: item.image || product.images?.[0]?.src || null,
      });
    }

    // Compute totals server-side from verified DB prices
    const subtotal = verifiedItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    const total = subtotal + data.delivery_fee;

    const orderData = {
      customer_name: data.customer_name,
      customer_email: data.customer_email || null,
      customer_phone: data.customer_phone,
      delivery_name: data.delivery_name || null,
      delivery_phone: data.delivery_phone || null,
      delivery_matatu_route: data.delivery_matatu_route || null,
      delivery_notes: data.delivery_notes || null,
      items: verifiedItems,
      subtotal,
      delivery_fee: data.delivery_fee,
      total,
      payment_method: data.payment_method,
      user_id: req.user?.id || null,
      payment_status: 'pending',
      order_status: 'pending',
    };

    const { data: order, error } = await supabase.from('orders').insert(orderData).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data: order });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { status, payment_status, payment_method, from, to, search, page = 1, limit = 20 } = req.query;
    let query = supabase.from('orders').select('*', { count: 'exact' });

    if (req.user.role !== 'admin') {
      query = query.eq('user_id', req.user.id);
    } else {
      if (status) query = query.eq('order_status', status);
      if (payment_status) query = query.eq('payment_status', payment_status);
      if (payment_method) query = query.eq('payment_method', payment_method);
      if (from) query = query.gte('created_at', from);
      if (to) query = query.lte('created_at', to + 'T23:59:59');
      if (search) query = query.or(`customer_name.ilike.%${search}%,customer_phone.ilike.%${search}%`);
    }

    query = query.order('created_at', { ascending: false });
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ success: true, data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/track', async (req, res) => {
  try {
    const { order_number, phone } = req.query;
    if (!order_number || !phone) return res.status(400).json({ success: false, message: 'Order number and phone required' });
    const { data, error } = await supabase.from('orders').select('order_number,order_status,payment_status,payment_method,items,delivery_matatu_route,created_at,updated_at,customer_name').eq('order_number', parseInt(order_number)).eq('customer_phone', phone).single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Order not found' });
    if (req.user?.role !== 'admin' && data.user_id !== req.user?.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { order_status, admin_notes } = req.body;
    const updates = { order_status, updated_at: new Date().toISOString() };
    if (admin_notes !== undefined) updates.admin_notes = admin_notes;
    const { data, error } = await supabase.from('orders').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/payment-status', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('orders').update({ payment_status: 'paid', order_status: 'confirmed', updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/mpesa-code', async (req, res) => {
  try {
    const { mpesa_code } = req.body;
    if (!mpesa_code) return res.status(400).json({ success: false, message: 'M-Pesa code required' });
    const { data, error } = await supabase.from('orders').update({ mpesa_code: mpesa_code.toUpperCase(), payment_status: 'pending', order_status: 'confirmed', updated_at: new Date().toISOString() }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data, message: 'M-Pesa code submitted. Order confirmed.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
