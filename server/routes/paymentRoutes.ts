import express from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import { siteConfig } from '../../src/config/site.js';

const router = express.Router();

const getRazorpayClient = () => {
  let key_id = process.env.RAZORPAY_KEY_ID?.trim() || "";
  let key_secret = process.env.RAZORPAY_KEY_SECRET?.trim() || "";

  // Strip leading/trailing quotes if they accidentally included them in the dashboard string
  key_id = key_id.replace(/^["']|["']$/g, '').trim();
  key_secret = key_secret.replace(/^["']|["']$/g, '').trim();

  console.log("Initializing Razorpay with key_id:", key_id, "key_secret.length:", key_secret.length);

  if (!key_id || !key_secret || key_id === 'YOUR_RAZORPAY_KEY_ID' || key_secret === 'YOUR_RAZORPAY_KEY_SECRET') {
    throw new Error('Razorpay keys not configured or are placeholders');
  }

  if (!key_id.startsWith('rzp_test_') && !key_id.startsWith('rzp_live_')) {
    throw new Error('RAZORPAY_KEY_ID should start with rzp_test_ or rzp_live_. Current value starts with: ' + key_id.substring(0, 5));
  }
  return new Razorpay({ key_id, key_secret });
};

router.post('/create-order', async (req, res) => {
  try {
    const { amount, phone, name, email } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: 'Amount is required' });
    }

    const amountInPaise = Math.round(amount * 100);
    if (amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be at least ₹1 (100 paise)' });
    }

    let razorpay;
    try {
      razorpay = getRazorpayClient();
    } catch (e: any) {
      console.error("Razorpay Client configuration error:", e.message);
      return res.status(401).json({ error: 'Gateway Not Configured', details: e.message });
    }

    const receipt = 'RECEIPT_' + Date.now() + Math.random().toString(36).substring(2, 7);
    
    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: receipt
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (createError: any) {
      console.error('Payment initiation error:', createError);
      if (createError.statusCode === 401 || createError.statusCode === '401' || createError?.error?.description === 'Authentication failed') {
        return res.status(401).json({ 
          error: 'Gateway Authentication Failed', 
          details: 'Your Razorpay credentials (Key and Secret) do not match or are invalid. Please check your Dashboard API keys and ensure both RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set correctly without extra characters or quotes.' 
        });
      }
      return res.status(500).json({ error: 'Internal server error', details: createError?.message || createError?.toString() });
    }

    
    return res.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: razorpay.key_id || process.env.RAZORPAY_KEY_ID?.replace(/^["']|["']$/g, '').trim()
    });

  } catch (error: any) {
    console.error('Payment endpoints error:', error);
    return res.status(500).json({ error: 'Unexpected server error', details: error?.message || error?.toString() });
  }
});

router.post('/verify-payment', async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ error: 'Missing payment verification details' });
    }

    let key_secret = process.env.RAZORPAY_KEY_SECRET;
    if (!key_secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }
    key_secret = key_secret.replace(/^["']|["']$/g, '').trim();

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', key_secret)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature === razorpay_signature) {
      return res.json({ success: true, message: 'Payment verified successfully' });
    } else {
      return res.status(400).json({ success: false, error: 'Invalid signature' });
    }
  } catch (error: any) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Internal server error', details: error?.message || String(error) });
  }
});

router.post('/webhook', async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn("Webhook secret not configured, skipping verification.");
      return res.status(200).send('OK');
    }

    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).send('Missing signature');
    }

    const payload = (req as any).rawBody || JSON.stringify(req.body);
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    if (expectedSignature !== signature) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body.event;
    console.log('Webhook Event Received:', event, req.body);
    
    // In a real application, you would persist this via your database model:
    // INSERT INTO bb_ecommerce_sc.payment_webhooks ...

    if (event === 'payment.captured') {
      // payment captured logic
    }

    res.status(200).json({ status: 'ok' });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).send('Webhook Processing Error');
  }
});

router.post('/refund', async (req, res) => {
   res.status(501).json({ error: 'Refund endpoint needs standard verification logic mapping' });
});

export default router;

