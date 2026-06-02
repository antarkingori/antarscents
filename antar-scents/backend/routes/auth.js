const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { z } = require('zod');
const supabase = require('../lib/supabase');
const { authMiddleware } = require('../middleware/auth');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../lib/email');

const router = express.Router();

const USER_FIELDS = 'id,email,full_name,phone,role,email_verified,created_at';

const registerSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const { data: existing } = await supabase.from('users').select('id').eq('email', data.email).single();
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }
    const password_hash = await bcrypt.hash(data.password, 12);
    const { data: user, error } = await supabase.from('users').insert({
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      password_hash,
      role: 'customer',
      email_verified: false
    }).select(USER_FIELDS).single();
    if (error) throw error;

    // Send verification email — non-blocking so registration succeeds even if email fails
    try {
      const token = crypto.randomBytes(32).toString('hex');
      const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      await supabase.from('email_verification_tokens').insert({ user_id: user.id, token, expires_at });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      await sendVerificationEmail(user.email, `${frontendUrl}/account/verify-email?token=${token}`);
    } catch (emailErr) {
      console.warn('[EMAIL] Verification email failed:', emailErr.message);
    }

    const jwtToken = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.status(201).json({ success: true, data: { user, token: jwtToken } });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const { data: user, error } = await supabase.from('users').select('*').eq('email', data.email).single();
    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    const { password_hash, ...safeUser } = user;
    res.json({ success: true, data: { user: safeUser, token } });
  } catch (err) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ success: false, message: err.errors[0].message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    const { data: user, error } = await supabase.from('users').select(USER_FIELDS).eq('id', req.user.id).single();
    if (error || !user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: 'Both passwords required' });
    }
    const { data: user } = await supabase.from('users').select('password_hash').eq('id', req.user.id).single();
    const valid = await bcrypt.compare(current_password, user.password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password incorrect' });
    const password_hash = await bcrypt.hash(new_password, 12);
    await supabase.from('users').update({ password_hash }).eq('id', req.user.id);
    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Verify email — consume token and mark user as verified
router.post('/verify-email', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ success: false, message: 'Token required' });

    const { data: record, error } = await supabase
      .from('email_verification_tokens')
      .select('user_id, expires_at')
      .eq('token', token)
      .single();

    if (error || !record) return res.status(400).json({ success: false, message: 'Invalid or expired verification link' });
    if (new Date(record.expires_at) < new Date()) {
      await supabase.from('email_verification_tokens').delete().eq('token', token);
      return res.status(400).json({ success: false, message: 'Verification link has expired. Please request a new one.' });
    }

    await supabase.from('users').update({ email_verified: true }).eq('id', record.user_id);
    await supabase.from('email_verification_tokens').delete().eq('token', token);

    res.json({ success: true, message: 'Email verified successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Resend verification email
router.post('/resend-verification', authMiddleware, async (req, res) => {
  try {
    const { data: user } = await supabase.from('users').select('id,email,email_verified').eq('id', req.user.id).single();
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.email_verified) return res.json({ success: true, message: 'Email is already verified' });

    // Delete existing token and create a fresh one
    await supabase.from('email_verification_tokens').delete().eq('user_id', user.id);
    const token = crypto.randomBytes(32).toString('hex');
    const expires_at = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('email_verification_tokens').insert({ user_id: user.id, token, expires_at });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    await sendVerificationEmail(user.email, `${frontendUrl}/account/verify-email?token=${token}`);

    res.json({ success: true, message: 'Verification email sent' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Google OAuth — exchange Supabase access_token for our backend JWT
router.post('/google', async (req, res) => {
  try {
    const { access_token } = req.body;
    if (!access_token) return res.status(400).json({ success: false, message: 'access_token required' });

    const { data: { user: sbUser }, error } = await supabase.auth.getUser(access_token);
    if (error || !sbUser) return res.status(401).json({ success: false, message: 'Invalid Supabase token' });

    const email = sbUser.email;
    const full_name = sbUser.user_metadata?.full_name || sbUser.user_metadata?.name || email.split('@')[0];

    let { data: user } = await supabase.from('users').select(USER_FIELDS).eq('email', email).single();

    if (!user) {
      const { data: newUser, error: insertErr } = await supabase.from('users').insert({
        full_name,
        email,
        phone: '',
        password_hash: '',
        role: 'customer',
        email_verified: true, // Google verifies the email
      }).select(USER_FIELDS).single();
      if (insertErr) throw insertErr;
      user = newUser;
    } else if (!user.email_verified) {
      await supabase.from('users').update({ email_verified: true }).eq('id', user.id);
      user = { ...user, email_verified: true };
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' });
    res.json({ success: true, data: { user, token } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Forgot password — send reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });

    const { data: user } = await supabase.from('users').select('id,email').eq('email', email).single();

    if (user) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires_at = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      await supabase.from('password_reset_tokens').upsert({ user_id: user.id, token, expires_at }, { onConflict: 'user_id' });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      await sendPasswordResetEmail(user.email, `${frontendUrl}/account/reset-password?token=${token}`);
    }

    res.json({ success: true, message: 'If the email exists, a reset link has been sent.' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Reset password — consume token and set new password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ success: false, message: 'Token and password required' });
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });

    const { data: record, error } = await supabase
      .from('password_reset_tokens').select('user_id, expires_at').eq('token', token).single();

    if (error || !record) return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
    if (new Date(record.expires_at) < new Date()) {
      await supabase.from('password_reset_tokens').delete().eq('token', token);
      return res.status(400).json({ success: false, message: 'Reset link has expired. Please request a new one.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    await supabase.from('users').update({ password_hash }).eq('id', record.user_id);
    await supabase.from('password_reset_tokens').delete().eq('token', token);

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
