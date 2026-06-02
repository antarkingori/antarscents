const express = require('express');
const multer = require('multer');
const { parse } = require('csv-parse/sync');
const { z } = require('zod');
const jwt = require('jsonwebtoken');
const axios = require('axios');
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
    // Admins see all statuses; public sees active only
    let adminRequest = false;
    try {
      const token = (req.headers.authorization || '').replace('Bearer ', '');
      if (token) {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (decoded.role === 'admin') adminRequest = true;
      }
    } catch {}

    const { category, vendor, tags, min_price, max_price, sort, page = 1, limit = 20, search, status } = req.query;
    let query = supabase.from('products').select('id,title,handle,vendor,product_type,tags,status,images,variants,selling_price,buying_price,created_at', { count: 'exact' });

    if (!adminRequest) {
      query = query.eq('status', 'active');
    } else if (status) {
      query = query.eq('status', status);
    }

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

router.post('/import-url', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ success: false, message: 'URL required' });

    let hostname;
    try { hostname = new URL(url).hostname.replace('www.', ''); }
    catch { return res.status(400).json({ success: false, message: 'Invalid URL' }); }

    const cheerio = require('cheerio');
    const { data: html } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Connection': 'keep-alive',
      },
      timeout: 20000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(html);
    let title = '', description = '', images = [], price = 0, vendor = '';

    // 1. JSON-LD structured data (most reliable)
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const json = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(json) ? json : [json];
        for (const item of items) {
          if (!title && item.name) title = String(item.name);
          if (!description && item.description) description = String(item.description);
          if (!price && item.offers?.price) price = parseFloat(item.offers.price) || 0;
          if (!vendor && item.brand?.name) vendor = String(item.brand.name);
          if (!images.length) {
            const imgs = Array.isArray(item.image) ? item.image : (item.image ? [item.image] : []);
            images = imgs.slice(0, 6).map(i => ({ src: typeof i === 'string' ? i : (i.url || i.contentUrl || '') })).filter(i => i.src);
          }
        }
      } catch {}
    });

    // 2. OG / meta fallback
    if (!title) title = $('meta[property="og:title"]').attr('content') || $('title').text().split('|')[0].split(':')[0].trim() || '';
    if (!description) description = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
    if (!images.length) {
      const ogImg = $('meta[property="og:image"]').attr('content');
      if (ogImg) images = [{ src: ogImg }];
    }

    // 3. Platform-specific selectors
    if (hostname.includes('amazon.')) {
      if (!title) title = $('#productTitle').text().trim();
      if (!vendor) vendor = $('#bylineInfo').text().replace(/^(Visit the|Brand:|by)\s*/i, '').replace(/\s*Store$/i, '').trim();
      if (!price) {
        const whole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
        const frac = $('.a-price-fraction').first().text().replace(/[^0-9]/g, '') || '00';
        if (whole) price = parseFloat(`${whole}.${frac}`);
      }
      if (!description) {
        const bullets = [];
        $('#feature-bullets ul li span:not(.aok-hidden)').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 10) bullets.push(text);
        });
        if (bullets.length) description = bullets.join('\n');
      }
    }

    if (hostname.includes('aliexpress.')) {
      if (!title) title = $('h1').first().text().trim();
      if (!price) {
        const priceEl = $('.product-price-value, [class*="price-current"]').first();
        price = parseFloat(priceEl.text().replace(/[^0-9.]/g, '')) || 0;
      }
    }

    if (hostname.includes('alibaba.')) {
      if (!title) title = $('h1.product-name, h1.title, h1').first().text().trim();
      if (!vendor) vendor = $('.company-name a, .seller-name').first().text().trim();
      if (!price) {
        const priceText = $('.price-main, .price-range, .price').first().text().trim();
        price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      }
    }

    title = title.replace(/\s+/g, ' ').trim().slice(0, 255);
    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || `product-${Date.now()}`;

    res.json({
      success: true,
      data: { title, handle, body_html: description, vendor, images, selling_price: price, product_type: '', tags: [], status: 'draft' }
    });
  } catch (err) {
    const msg = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT'
      ? 'Request timed out — the site may be blocking access. Try a direct product link.'
      : `Could not extract product: ${err.message}`;
    res.status(500).json({ success: false, message: msg });
  }
});

module.exports = router;
