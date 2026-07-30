import express from "express";
import { supabase } from "../services/supabaseService.js";
import { sendDispatchConfirmationEmail } from "../services/emailService.js";

const router = express.Router();

router.post("/", async (req, res) => {
  const { newOrderId, guest_email, guest_phone, total_amount, discount_applied, final_amount, shipping_address, payment_status, payment_id, user_id, order_status, product_name, product_code, cartItems } = req.body;

  try {
    const { error: orderError } = await (supabase as any).schema('bb_ecommerce_sc').from('orders').insert({
      id: newOrderId,
      guest_email,
      guest_phone,
      total_amount,
      discount_applied,
      final_amount,
      shipping_address,
      payment_status,
      payment_id,
      user_id,
      order_status,
      product_name,
      product_code
    });

    if (orderError) {
      console.error('Order creation error:', orderError);
      return res.status(500).json({ error: "Failed to create order" });
    }

    if (cartItems && cartItems.length > 0) {
      const { error: itemsError } = await (supabase as any).schema('bb_ecommerce_sc').from('order_items').insert(cartItems);
      if (itemsError) {
        console.error('Order items creation error:', itemsError);
      }
    }

    return res.status(201).json({ success: true, id: newOrderId });
  } catch (err) {
    console.error('Create Order API error:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { data: orders, error } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch all orders error:', error);
      return res.status(500).json({ error: "Failed to fetch orders" });
    }

    return res.status(200).json({ orders });
  } catch (err) {
    console.error('All Orders API error:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/:id/status", async (req, res) => {
  const { id } = req.params;
  const { order_status } = req.body;
  try {
    const { data: order, error } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('orders')
      .update({ order_status })
      .eq('id', id)
      .select()
      .single();

    if (error || !order) {
      console.error('Update order status error:', error);
      return res.status(500).json({ error: "Failed to update order status" });
    }

    // Call email trigger if dispatched
    if (order_status === 'dispatched' || order_status === 'shipped') {
       try {
          let shippingDataObj = order.shipping_address;
          if (typeof shippingDataObj === 'string') {
            try { shippingDataObj = JSON.parse(shippingDataObj); } catch(e) {}
          }
          const email = order.guest_email || shippingDataObj?.email;
          if (email) {
            await sendDispatchConfirmationEmail(email, {
              orderId: order.id,
              shippingData: shippingDataObj,
              productNames: order.product_name
            });
          }
       } catch (e) {
          console.error("Failed to send dispatch email:", e);
       }
    }

    return res.status(200).json({ order });
  } catch (err) {
    console.error('Update Order API error:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const { data: order, error: orderError } = await (supabase as any).schema('bb_ecommerce_sc').from('orders').select('*').eq('id', id).single();
    
    if (orderError || !order) {
      console.error('Order fetch error:', orderError);
      return res.status(404).json({ error: "Order not found" });
    }

    const { data: items, error: itemsError } = await (supabase as any).schema('bb_ecommerce_sc').from('order_items').select('*').eq('order_id', id);

    if (itemsError) {
      console.error('Order items fetch error:', itemsError);
      return res.status(500).json({ error: "Failed to fetch order items" });
    }

    return res.status(200).json({ order, items });
  } catch (err) {
    console.error('Order API error:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
