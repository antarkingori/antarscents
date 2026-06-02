require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const supabase = require('./lib/supabase');

const app = express();

// Security & middleware
app.use(helmet());
// CORS: reflect exact request origin so credentials work with any origin in dev;
// restrict to FRONTEND_URL in production
app.use(cors({
  origin: process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check (must come before auth middleware)
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/browsing', require('./routes/browsing'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/favourites', require('./routes/favourites'));
app.use('/api/categories', require('./routes/categories'));

// Error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Seed admin user on startup — always syncs password from env so changing
// ADMIN_PASSWORD + redeploying always takes effect
async function seedAdmin() {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
    console.warn('[WARN] ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed');
    return;
  }
  const password_hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
  const { data: existing } = await supabase.from('users').select('id').eq('email', process.env.ADMIN_EMAIL).single();
  if (!existing) {
    const { error } = await supabase.from('users').insert({
      email: process.env.ADMIN_EMAIL,
      password_hash,
      full_name: 'Admin',
      role: 'admin',
      phone: '+254000000000',
      email_verified: true
    });
    if (error) console.error('[SEED] Admin seed error:', error.message);
    else console.log('[SEED] Admin user created:', process.env.ADMIN_EMAIL);
  } else {
    const { error } = await supabase.from('users').update({ password_hash, role: 'admin', email_verified: true }).eq('id', existing.id);
    if (error) console.error('[SEED] Admin update error:', error.message);
    else console.log('[SEED] Admin password synced:', process.env.ADMIN_EMAIL);
  }
}

async function seedCategories() {
  try {
    const { data: existing, error: checkErr } = await supabase.from('categories').select('id').limit(1);
    if (checkErr) return; // table may not exist yet — skip gracefully
    if (existing && existing.length > 0) return; // already seeded

    // Try to seed from existing product_type values
    const { data: products } = await supabase.from('products').select('product_type').not('product_type', 'is', null).not('product_type', 'eq', '');
    const types = [...new Set((products || []).map(p => p.product_type).filter(Boolean))];

    let categories = types.map((type, i) => ({
      name: type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      slug: type.toLowerCase().replace(/\s+/g, '-'),
      sort_order: i,
      active: true,
    }));

    if (categories.length === 0) {
      categories = [
        { name: 'Men', slug: 'men', sort_order: 0, active: true },
        { name: 'Women', slug: 'women', sort_order: 1, active: true },
        { name: 'Unisex', slug: 'unisex', sort_order: 2, active: true },
        { name: 'Gift Sets', slug: 'gift-sets', sort_order: 3, active: true },
        { name: 'Luxury', slug: 'luxury', sort_order: 4, active: true },
        { name: 'Travel Size', slug: 'travel-size', sort_order: 5, active: true },
      ];
    }

    const { error } = await supabase.from('categories').insert(categories);
    if (error) console.error('[SEED] Categories error:', error.message);
    else console.log('[SEED] Categories seeded:', categories.length);
  } catch (e) {
    console.error('[SEED] Categories seed error:', e.message);
  }
}

const PORT = parseInt(process.env.PORT || '5000', 10);
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`[SERVER] ANTAR SCENTS API running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  try { await seedAdmin(); } catch (e) { console.error('[SEED] Error:', e.message); }
  try { await seedCategories(); } catch (e) { console.error('[SEED] Categories error:', e.message); }
});

module.exports = app;
