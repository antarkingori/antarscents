const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const { authMiddleware } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const productSchema = z.object({
  title: z.string().min(1),
  handle: z.string().min(1),
  body_html: z.string().optional(),
  vendor: z.string().optional(),
  product_type: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['active', 'draft', 'archived']).default('active'),
  images: z.array(z.any()).optional(),
  variants: z.array(z.any()).optional(),
  buying_price: z.number().optional(),
  selling_price: z.number()
});

router.get('/', async (req, res) => {
  try {
    const { category, vendor, tags, min_price, max_price, sort, page = 1, limit = 20, search } = req.query;
    let query = supabase.from('products').select('id,title,handle,vendor,product_type,tags,status,images,variants,selling_price,created_at', { count: 'exact' }).eq('status', 'active');

    if (search) query = query.ilike('title', `%${search}%`);
    if (vendor) query = query.eq('vendor', vendor);
    if (category) query = query.eq('product_type', category);
    if (min_price) query = query.gte('selling_price', parseFloat(min_price));
    if (max_price) query = query.lte('selling_price', parseFloat(max_price));
    if (tags) query = query.overlaps('tags', tags.split(','));

    if (sort === 'price_asc') query = query.order('selling_price', { ascending: true });
    else if (sort === 'price_desc') query = query.order('selling_price', { ascending: false });
    else if (sort === 'newest') query = query.order('created_at', { ascending: false });
    else query = query.order('created_at', { ascending: false });

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.range(offset, offset + parseInt(limit) - 1);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ success: true, data, total: count, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:slug', async (req, res) => {
  try {
    const { data, error } = await supabase.from('products').select('id,title,handle,body_html,vendor,product_type,tags,status,images,variants,selling_price,created_at,updated_at').eq('handle', req.params.slug).single();
    if (error || !data) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const data = productSchema.parse(req.body);
    const { data: product, error } = await supabase.from('products').insert(data).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data: product });
  } catch (err) {
    if (err.name === 'ZodError') return res.status(400).json({ success: false, message: err.errors[0].message });
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    const { data, error } = await supabase.from('products').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('products').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/import-csv', authMiddleware, adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const csvContent = req.file.buffer.toString('utf-8');
    const records = parse(csvContent, { columns: true, skip_empty_lines: true });

    const products = records.map(r => ({
      title: r['Title'] || '',
      handle: r['Handle'] || r['Title']?.toLowerCase().replace(/\s+/g, '-') || '',
      body_html: r['Body (HTML)'] || r['body_html'] || '',
      vendor: r['Vendor'] || '',
      product_type: r['Type'] || '',
      tags: r['Tags'] ? r['Tags'].split(',').map(t => t.trim()) : [],
      selling_price: parseFloat(r['Variant Price'] || r['selling_price'] || 0),
      buying_price: parseFloat(r['Variant Cost'] || r['buying_price'] || 0),
      status: (r['Status'] || 'active').toLowerCase(),
      images: r['Image Src'] ? [{ src: r['Image Src'] }] : [],
      variants: [{
        sku: r['Variant SKU'] || '',
        price: parseFloat(r['Variant Price'] || 0),
        inventory_quantity: parseInt(r['Variant Inventory Qty'] || 0)
      }]
    })).filter(p => p.title && p.handle);

    let imported = 0, failed = 0;
    for (const product of products) {
      const { error } = await supabase.from('products').upsert(product, { onConflict: 'handle' });
      if (error) failed++;
      else imported++;
    }
    res.json({ success: true, message: `${imported} products imported, ${failed} failed`, data: { imported, failed } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
