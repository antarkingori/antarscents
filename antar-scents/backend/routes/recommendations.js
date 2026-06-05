const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { product_id, user_id, session_id, limit = 8 } = req.query;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id required' });

    const { data: product } = await supabase
      .from('products')
      .select('tags,vendor,product_type')
      .eq('id', product_id)
      .single();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    // Fetch candidates + history tags concurrently
    const candidateQuery = supabase
      .from('products')
      .select('id,title,handle,vendor,product_type,tags,images,selling_price')
      .eq('status', 'active')
      .neq('id', product_id)
      .limit(300); // cap to avoid unbounded scans on large catalogs

    const historyQuery = (user_id || session_id)
      ? supabase
          .from('browsing_history')
          // join to products in a single round-trip to get tags
          .select('product_id, products(tags)')
          .eq(user_id ? 'user_id' : 'session_id', user_id || session_id)
          .order('viewed_at', { ascending: false })
          .limit(user_id ? 20 : 10)
      : Promise.resolve({ data: [] });

    const [{ data: candidates }, { data: historyRows }] = await Promise.all([candidateQuery, historyQuery]);

    const historyTags = (historyRows || []).flatMap(h => h.products?.tags || []);

    const scored = (candidates || []).map(p => {
      let score = 0;
      if (p.vendor === product.vendor) score += 3;
      if (p.product_type === product.product_type) score += 2;
      const sharedTags = (p.tags || []).filter(t => (product.tags || []).includes(t));
      score += sharedTags.length * 1.5;
      if (historyTags.length) {
        const historyMatch = (p.tags || []).filter(t => historyTags.includes(t));
        score += historyMatch.length;
      }
      return { ...p, score };
    }).sort((a, b) => b.score - a.score).slice(0, parseInt(limit));

    res.json({ success: true, data: scored });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
