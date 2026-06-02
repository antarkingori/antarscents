const express = require('express');
const { z } = require('zod');
const supabase = require('../lib/supabase');

const router = express.Router();

const browsingSchema = z.object({
  product_id: z.string().uuid(),
  user_id: z.string().uuid().optional(),
  session_id: z.string().optional()
});

router.post('/', async (req, res) => {
  try {
    const data = browsingSchema.parse(req.body);
    await supabase.from('browsing_history').insert({ product_id: data.product_id, user_id: data.user_id || null, session_id: data.session_id || null });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
