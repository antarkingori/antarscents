require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const supabase = require('./lib/supabase');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/recommendations', require('./routes/recommendations'));
app.use('/api/browsing', require('./routes/browsing'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/favourites', require('./routes/favourites'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

async function seedAdmin() {
  const { data: existing } = await supabase.from('users').select('id').eq('email', process.env.ADMIN_EMAIL).single();
  if (!existing) {
    const password_hash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
    await supabase.from('users').insert({ email: process.env.ADMIN_EMAIL, password_hash, full_name: 'Admin', role: 'admin', phone: '+254000000000' });
    console.log('Admin user seeded');
  }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`ANTAR SCENTS API running on port ${PORT}`);
  try { await seedAdmin(); } catch (e) { console.error('Seed admin error:', e.message); }
});
