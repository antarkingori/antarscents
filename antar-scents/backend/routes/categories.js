const express = require('express');
const supabase = require('../lib/supabase');
const { authMiddleware } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');

const router = express.Router();

// GET /api/categories — public, active only
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('id,name,slug,sort_order').eq('active', true).order('sort_order');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.json({ success: true, data: [] }); // graceful fallback if table missing
  }
});

// GET /api/categories/all — admin, includes inactive
router.get('/all', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    res.json({ success: true, data: [] });
  }
});

// POST /api/categories — admin, create
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, slug, sort_order = 0, active = true } = req.body;
    if (!name || !slug) return res.status(400).json({ success: false, message: 'name and slug required' });
    const { data, error } = await supabase.from('categories').insert({ name, slug, sort_order, active }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/categories/:id — admin, update
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updates = {};
    const { name, slug, sort_order, active } = req.body;
    if (name !== undefined) updates.name = name;
    if (slug !== undefined) updates.slug = slug;
    if (sort_order !== undefined) updates.sort_order = sort_order;
    if (active !== undefined) updates.active = active;
    const { data, error } = await supabase.from('categories').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/categories/:id — admin
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { error } = await supabase.from('categories').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
