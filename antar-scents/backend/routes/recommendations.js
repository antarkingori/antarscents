const express = require('express');
const supabase = require('../lib/supabase');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { product_id, user_id, session_id, limit = 8 } = req.query;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id required' });

    const { data: product } = await supabase.from('products').select('tags,vendor,product_type').eq('id', product_id).single();
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

    const { data: allProducts } = await supabase.from('products').select('id,title,handle,vendor,product_type,tags,images,selling_price').eq('status', 'active').neq('id', product_id);

    let historyTags = [];
    if (user_id) {
      const { data: history } = await supabase.from('browsing_history').select('product_id').eq('user_id', user_id).order('viewed_at', { ascending: false }).limit(20);
      if (history?.length) {
        const historyIds = history.map(h => h.product_id);
        const { data: historyProducts } = await supabase.from('products').select('tags').in('id', historyIds);
        historyTags = (historyProducts || []).flatMap(p => p.tags || []);
      }
    } else if (session_id) {
      const { data: history } = await supabase.from('browsing_history').select('product_id').eq('session_id', session_id).order('viewed_at', { ascending: false }).limit(10);
      if (history?.length) {
        const historyIds = history.map(h => h.product_id);
        const { data: historyProducts } = await supabase.from('products').select('tags').in('id', historyIds);
        historyTags = (historyProducts || []).flatMap(p => p.tags || []);
      }
    }

    const scored = (allProducts || []).map(p => {
      let score = 0;
      if (p.vendor === product.vendor) score += 3;
      if (p.product_type === product.product_type) score += 2;
      const sharedTags = (p.tags || []).filter(t => (product.tags || []).includes(t));
      score += sharedTags.length * 1.5;
      if (historyTags.length) {
        const historyMatch = (p.tags || []).filter(t => historyTags.includes(t));
        score += historyMatch.length * 1;
      }
      return { ...p, score };
    }).sort((a, b) => b.score - a.score).slice(0, parseInt(limit));

    res.json({ success: true, data: scored });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
