import express from "express";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Initialize Supabase with the Service Role key to bypass RLS securely from the server
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'bb_ecommerce_sc' }
});

router.post("/availability", async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    const records = Object.entries(updates).map(([id, inStock]) => ({
      product_id: id,
      in_stock: inStock,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabaseAdmin
      .from('product_availability')
      .upsert(records, { onConflict: 'product_id' });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Admin Availability Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/pricing", async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    const records = Object.entries(updates).map(([id, price]) => ({
      product_id: id,
      price: price,
      updated_at: new Date().toISOString()
    }));

    const { data, error } = await supabaseAdmin
      .from('dynamic_prices')
      .upsert(records, { onConflict: 'product_id' });

    if (error) throw error;
    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Admin Pricing Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/attributes", async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    // Since updates can be partial for each product (e.g. { "prod1": { is_best_seller: true } }), 
    // we need to merge with existing data or just use upsert with a carefully constructed object
    // Wait, Supabase allows partial upserts if we just send what we have, but it might set others to null or default
    // We will do individual updates/upserts per product to be safe
    const results = [];
    for (const [id, attrs] of Object.entries(updates) as [string, any][]) {
      const { data: existing, error: existError } = await supabaseAdmin
        .from('product_attributes')
        .select('*')
        .eq('product_id', id)
        .single();
      
      const payload = {
         product_id: id,
         is_best_seller: attrs.is_best_seller !== undefined ? attrs.is_best_seller : (existing?.is_best_seller ?? false),
         is_new_arrival: attrs.is_new_arrival !== undefined ? attrs.is_new_arrival : (existing?.is_new_arrival ?? false),
         is_on_sale: attrs.is_on_sale !== undefined ? attrs.is_on_sale : (existing?.is_on_sale ?? false),
         original_price: attrs.original_price !== undefined ? attrs.original_price : (existing?.original_price ?? null),
         description: attrs.description !== undefined ? attrs.description : (existing?.description ?? null),
         updated_at: new Date().toISOString()
      };

      const { data, error } = await supabaseAdmin
        .from('product_attributes')
        .upsert(payload, { onConflict: 'product_id' });
      
      if (error) {
        console.error("Failed to upsert attribute for", id, error);
        throw error;
      }
      results.push(data);
    }

    res.json({ success: true, count: results.length });
  } catch (error: any) {
    console.error("Admin Attributes Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
