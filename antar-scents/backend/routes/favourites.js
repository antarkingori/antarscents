const express = require('express');
const supabase = require('../lib/supabase');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('favourites').select('id,created_at,products(id,title,handle,images,selling_price,vendor)').eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { product_id } = req.body;
    if (!product_id) return res.status(400).json({ success: false, message: 'product_id required' });
    const { data, error } = await supabase.from('favourites').upsert({ user_id: req.user.id, product_id }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:product_id', authMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('favourites').delete().eq('user_id', req.user.id).eq('product_id', req.params.product_id);
    if (error) throw error;
    res.json({ success: true, message: 'Removed from favourites' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
