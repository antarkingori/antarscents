const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const { z } = require('zod');
const supabase = require('../lib/supabase');

const router = express.Router();

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many payment requests. Please try again later.' }
});

async function getMpesaToken() {
  const auth = Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64');
  const isProduction = process.env.NODE_ENV === 'production';
  const url = isProduction
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';
  const { data } = await axios.get(url, { headers: { Authorization: `Basic ${auth}` } });
  return data.access_token;
}

router.post('/mpesa/stk-push', paymentLimiter, async (req, res) => {
  try {
    const stkSchema = z.object({
      phone: z.string(),
      amount: z.number().positive(),
      order_id: z.string().uuid()
    });
    const { phone, amount, order_id } = stkSchema.parse(req.body);

    const normalizedPhone = phone.replace(/^0/, '254').replace(/^\+/, '');
    const token = await getMpesaToken();
    const timestamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
    const shortcode = process.env.MPESA_SHORTCODE;
    const passkey = process.env.MPESA_PASSKEY;
    const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    const isProduction = process.env.NODE_ENV === 'production';
    const stkUrl = isProduction
      ? 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';

    const { data: stkData } = await axios.post(stkUrl, {
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerBuyGoodsOnline',
      Amount: Math.ceil(amount),
      PartyA: normalizedPhone,
      PartyB: shortcode,
      PhoneNumber: normalizedPhone,
      CallBackURL: process.env.MPESA_CALLBACK_URL,
      AccountReference: `ANTAR-${order_id.slice(0, 8).toUpperCase()}`,
      TransactionDesc: 'Antar Scents Order Payment'
    }, { headers: { Authorization: `Bearer ${token}` } });

    await supabase.from('orders').update({ payment_status: 'pending' }).eq('id', order_id);
    res.json({ success: true, data: { CheckoutRequestID: stkData.CheckoutRequestID, MerchantRequestID: stkData.MerchantRequestID } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.response?.data?.errorMessage || err.message });
  }
});

router.post('/mpesa/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    const callback = Body?.stkCallback;
    if (!callback) return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });

    const resultCode = callback.ResultCode;
    const checkoutRequestId = callback.CheckoutRequestID;

    if (resultCode === 0) {
      const metadata = callback.CallbackMetadata?.Item || [];
      const mpesaCode = metadata.find(i => i.Name === 'MpesaReceiptNumber')?.Value;
      await supabase.from('orders').update({ payment_status: 'paid', mpesa_code: mpesaCode, order_status: 'confirmed', updated_at: new Date().toISOString() }).eq('mpesa_checkout_id', checkoutRequestId);
    } else {
      await supabase.from('orders').update({ payment_status: 'failed' }).eq('mpesa_checkout_id', checkoutRequestId);
    }
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (err) {
    res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

router.post('/paystack/initialize', paymentLimiter, async (req, res) => {
  try {
    const { email, amount, order_id } = req.body;
    if (!email || !amount || !order_id) {
      return res.status(400).json({ success: false, message: 'email, amount and order_id required' });
    }
    const { data } = await axios.post('https://api.paystack.co/transaction/initialize', {
      email,
      amount: Math.ceil(amount * 100),
      reference: `ANT-${order_id.slice(0, 8).toUpperCase()}-${Date.now()}`,
      metadata: { order_id }
    }, { headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` } });

    res.json({ success: true, data: { authorization_url: data.data.authorization_url, reference: data.data.reference } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
  }
});

router.get('/paystack/verify/:reference', async (req, res) => {
  try {
    const { data } = await axios.get(`https://api.paystack.co/transaction/verify/${req.params.reference}`, {
      headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` }
    });
    if (data.data.status === 'success') {
      const orderId = data.data.metadata?.order_id;
      if (orderId) {
        await supabase.from('orders').update({ payment_status: 'paid', paystack_reference: req.params.reference, order_status: 'confirmed', updated_at: new Date().toISOString() }).eq('id', orderId);
      }
      res.json({ success: true, data: { status: 'paid', reference: req.params.reference } });
    } else {
      res.json({ success: false, message: 'Payment not successful', data: { status: data.data.status } });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.response?.data?.message || err.message });
  }
});

module.exports = router;
