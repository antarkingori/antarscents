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
    if (category) query = query.ilike('product_type', category);
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

router.post('/upload-image', authMiddleware, adminMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });
    const ext = (req.file.originalname.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z]/g, '');
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(filename, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filename);
    res.json({ success: true, data: { url: publicUrl } });
  } catch (err) {
    res.status(500).json({ success: false, message: `Upload failed: ${err.message}. Ensure a public "product-images" bucket exists in Supabase Storage.` });
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
      timeout: 25000,
      maxRedirects: 5,
    });

    const $ = cheerio.load(html);
    let title = '', bodyHtml = '', images = [], price = 0, vendor = '', tags = [], variants = [];

    const baseUrl = new URL(url);
    const toAbs = (src) => {
      if (!src) return '';
      try { return src.startsWith('//') ? `${baseUrl.protocol}${src}` : src.startsWith('/') ? `${baseUrl.origin}${src}` : src; }
      catch { return src; }
    };

    // ── 1. JSON-LD structured data ──────────────────────────────────────────
    $('script[type="application/ld+json"]').each((_, el) => {
      try {
        const raw = JSON.parse($(el).html() || '{}');
        const items = Array.isArray(raw) ? raw.flat() : [raw];
        for (const item of items) {
          const type = item['@type'] || '';
          if (!['Product', 'IndividualProduct'].includes(type) && !Array.isArray(raw)) continue;
          if (!title && item.name) title = String(item.name);
          if (!bodyHtml && item.description) bodyHtml = `<p>${String(item.description).replace(/\n+/g, '</p><p>')}</p>`;
          if (!vendor && item.brand?.name) vendor = String(item.brand.name);
          if (!price) {
            const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
            if (offers?.price) price = parseFloat(offers.price) || 0;
          }
          if (!images.length) {
            const imgs = Array.isArray(item.image) ? item.image : item.image ? [item.image] : [];
            images = imgs.slice(0, 8).map(i => ({ src: toAbs(typeof i === 'string' ? i : (i.url || i.contentUrl || '')) })).filter(i => i.src);
          }
          if (!tags.length && item.keywords) tags = String(item.keywords).split(',').map(t => t.trim()).filter(Boolean).slice(0, 10);
        }
      } catch {}
    });

    // ── 2. OG / meta fallback ───────────────────────────────────────────────
    if (!title) title = $('meta[property="og:title"]').attr('content') || $('meta[name="twitter:title"]').attr('content') || $('title').text().split('|')[0].split(':')[0].trim() || '';
    if (!bodyHtml) {
      const desc = $('meta[property="og:description"]').attr('content') || $('meta[name="description"]').attr('content') || '';
      if (desc) bodyHtml = `<p>${desc}</p>`;
    }
    if (images.length < 2) {
      $('meta[property="og:image"]').each((_, el) => {
        const src = toAbs($(el).attr('content') || '');
        if (src && !images.find(i => i.src === src)) images.push({ src });
      });
    }

    // ── 3. Platform-specific selectors ─────────────────────────────────────
    if (hostname.includes('amazon.')) {
      if (!title) title = $('#productTitle, #title').first().text().trim();
      if (!vendor) vendor = $('#bylineInfo').text().replace(/^(Visit the|Brand:|by)\s*/i, '').replace(/\s*Store$/i, '').trim();
      if (!price) {
        const whole = $('.a-price-whole').first().text().replace(/[^0-9]/g, '');
        const frac = $('.a-price-fraction').first().text().replace(/[^0-9]/g, '') || '00';
        if (whole) price = parseFloat(`${whole}.${frac}`);
        if (!price) price = parseFloat($('#priceblock_ourprice, #priceblock_dealprice, .apexPriceToPay span').first().text().replace(/[^0-9.]/g, '')) || 0;
      }
      if (!bodyHtml) {
        const bullets = [];
        $('#feature-bullets ul li span:not(.aok-hidden), #feature-bullets li span').each((_, el) => {
          const text = $(el).text().trim();
          if (text && text.length > 8 && !text.startsWith('Make sure')) bullets.push(`<li>${text}</li>`);
        });
        const desc = $('#productDescription p').text().trim();
        const parts = [];
        if (bullets.length) parts.push(`<ul>${bullets.join('')}</ul>`);
        if (desc) parts.push(`<p>${desc}</p>`);
        if (parts.length) bodyHtml = parts.join('');
      }
      // Amazon image gallery
      if (images.length < 2) {
        const mainImg = toAbs($('#landingImage, #imgTagWrapperId img').first().attr('data-old-hires') || $('#landingImage').attr('src') || '');
        if (mainImg && !images.find(i => i.src === mainImg)) images.unshift({ src: mainImg });
      }
    }

    if (hostname.includes('aliexpress.')) {
      if (!title) title = $('h1.product-title-text, h1[data-spm], h1').first().text().trim();
      if (!vendor) vendor = $('.shop-name, .store-name, [class*="storeName"]').first().text().trim();
      if (!price) price = parseFloat([$('.product-price-value', '[class*="uniform-banner-box-price"]', '[class*="price-current"]').first().text()].join('').replace(/[^0-9.]/g, '')) || 0;
      if (!bodyHtml) {
        const desc = $('.product-description, #product-description').text().trim();
        if (desc) bodyHtml = `<p>${desc}</p>`;
      }
      // Try to collect gallery images
      if (images.length < 2) {
        $('img[src*="alicdn.com"], img[data-src*="alicdn.com"]').each((_, el) => {
          let src = toAbs($(el).attr('data-src') || $(el).attr('src') || '');
          if (src && src.includes('alicdn') && !images.find(i => i.src === src)) {
            src = src.replace(/_[0-9]+x[0-9]+(\.[a-z]+)$/i, '$1');
            images.push({ src });
          }
        });
      }
    }

    if (hostname.includes('alibaba.')) {
      if (!title) title = $('h1.product-name, h1.title, [class*="product-name"] h1, h1').first().text().trim();
      if (!vendor) vendor = $('.company-name a, .supplier-name a, .seller-name').first().text().trim();
      if (!price) {
        const priceText = $('.price-main, .price-range, [class*="price"]').first().text().trim();
        price = parseFloat(priceText.replace(/[^0-9.]/g, '')) || 0;
      }
    }

    // Generic gallery image scraping as final fallback
    if (images.length < 2) {
      $('img[srcset], img[data-src], img[data-zoom-src]').each((_, el) => {
        if (images.length >= 8) return false;
        const src = toAbs($(el).attr('data-zoom-src') || $(el).attr('data-src') || $(el).attr('src') || '');
        const w = parseInt($(el).attr('width') || '0', 10);
        const h = parseInt($(el).attr('height') || '0', 10);
        if (src && (w > 200 || h > 200 || (!w && !h)) && !src.includes('logo') && !src.includes('icon') && !images.find(i => i.src === src)) {
          images.push({ src });
        }
      });
    }

    title = title.replace(/\s+/g, ' ').trim().slice(0, 255);
    const handle = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 100) || `product-${Date.now()}`;

    res.json({
      success: true,
      data: { title, handle, body_html: bodyHtml, vendor, images: images.slice(0, 10), selling_price: price, product_type: '', tags, variants, status: 'draft' }
    });
  } catch (err) {
    const msg = err.code === 'ECONNABORTED' || err.code === 'ETIMEDOUT'
      ? 'Request timed out — the site may be blocking access. Try a direct product link.'
      : `Could not extract product: ${err.message}`;
    res.status(500).json({ success: false, message: msg });
  }
});

module.exports = router;
