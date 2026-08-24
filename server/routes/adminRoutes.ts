import express from "express";
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

const router = express.Router();

// Local fallback storage for product settings (availability, dynamic pricing, badges, descriptions)
const DATA_DIR = path.join(process.cwd(), "data");
const SETTINGS_FILE = path.join(DATA_DIR, "product_settings.json");

interface ProductSettings {
  availability: Record<string, boolean>;
  pricing: Record<string, number>;
  original_prices: Record<string, number>;
  best_sellers: string[];
  new_arrivals: string[];
  on_sale: string[];
  festival: string[];
  festival_config: {
    enabled: boolean;
    title: string;
    subtitle?: string;
  };
  descriptions: Record<string, string>;
  updated_at: string;
}

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getStoredSettings(): ProductSettings {
  ensureDataDir();
  if (fs.existsSync(SETTINGS_FILE)) {
    try {
      const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        availability: parsed.availability || {},
        pricing: parsed.pricing || {},
        original_prices: parsed.original_prices || {},
        best_sellers: Array.isArray(parsed.best_sellers) ? parsed.best_sellers : [],
        new_arrivals: Array.isArray(parsed.new_arrivals) ? parsed.new_arrivals : [],
        on_sale: Array.isArray(parsed.on_sale) ? parsed.on_sale : [],
        festival: Array.isArray(parsed.festival) ? parsed.festival : [],
        festival_config: parsed.festival_config && typeof parsed.festival_config === 'object' ? {
          enabled: parsed.festival_config.enabled !== false,
          title: parsed.festival_config.title || "Festival / Occasion",
          subtitle: parsed.festival_config.subtitle || "Handcrafted festive hair accessories & special occasion drops."
        } : {
          enabled: true,
          title: "Festival / Occasion",
          subtitle: "Handcrafted festive hair accessories & special occasion drops."
        },
        descriptions: parsed.descriptions || {},
        updated_at: parsed.updated_at || new Date().toISOString()
      };
    } catch (e) {
      console.error("Error reading product_settings.json:", e);
    }
  }

  const defaultSettings: ProductSettings = {
    availability: {},
    pricing: {},
    original_prices: {},
    best_sellers: [],
    new_arrivals: [],
    on_sale: [],
    festival: [],
    festival_config: {
      enabled: true,
      title: "Festival / Occasion",
      subtitle: "Handcrafted festive hair accessories & special occasion drops."
    },
    descriptions: {},
    updated_at: new Date().toISOString()
  };

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2), "utf-8");
  } catch (e) {
    console.error("Error creating default product_settings.json:", e);
  }

  return defaultSettings;
}

function saveStoredSettings(settings: Partial<ProductSettings>): ProductSettings {
  ensureDataDir();
  const current = getStoredSettings();
  const updated: ProductSettings = {
    ...current,
    ...settings,
    updated_at: new Date().toISOString()
  };

  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(updated, null, 2), "utf-8");
  } catch (e) {
    console.error("Error saving product_settings.json:", e);
  }

  return updated;
}

// Optional Supabase Admin client
const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseServiceKey && 
  !supabaseUrl.includes("placeholder") && 
  !supabaseServiceKey.includes("placeholder");

let supabaseAdmin: any = null;
if (isSupabaseConfigured) {
  try {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      db: { schema: 'bb_ecommerce_sc' }
    });
  } catch (err) {
    console.warn("Could not initialize Supabase Admin for products:", err);
  }
}

// GET /api/admin/settings & /api/products/settings
export async function handleGetSettings(_req: express.Request, res: express.Response) {
  try {
    let settings = getStoredSettings();

    // If Supabase is active, sync with database
    if (supabaseAdmin) {
      try {
        const [availRes, priceRes, attrRes] = await Promise.allSettled([
          supabaseAdmin.from('product_availability').select('product_id, in_stock'),
          supabaseAdmin.from('dynamic_prices').select('product_id, price'),
          supabaseAdmin.from('product_attributes').select('*')
        ]);

        if (availRes.status === 'fulfilled' && !availRes.value.error && availRes.value.data) {
          availRes.value.data.forEach((row: any) => {
            settings.availability[row.product_id] = row.in_stock;
          });
        }

        if (priceRes.status === 'fulfilled' && !priceRes.value.error && priceRes.value.data) {
          priceRes.value.data.forEach((row: any) => {
            settings.pricing[row.product_id] = row.price;
          });
        }

        if (attrRes.status === 'fulfilled' && !attrRes.value.error && attrRes.value.data) {
          const bs = new Set(settings.best_sellers);
          const na = new Set(settings.new_arrivals);
          const os = new Set(settings.on_sale);

          attrRes.value.data.forEach((row: any) => {
            if (row.is_best_seller) bs.add(row.product_id);
            if (row.is_new_arrival) na.add(row.product_id);
            if (row.is_on_sale) os.add(row.product_id);
            if (row.original_price !== null && row.original_price !== undefined) {
              settings.original_prices[row.product_id] = row.original_price;
            }
            if (row.description !== null && row.description !== undefined) {
              settings.descriptions[row.product_id] = row.description;
            }
          });

          settings.best_sellers = Array.from(bs);
          settings.new_arrivals = Array.from(na);
          settings.on_sale = Array.from(os);
        }

        // Cache back to disk
        saveStoredSettings(settings);
      } catch (dbErr) {
        console.warn("Supabase fetch failed, falling back to local file store:", dbErr);
      }
    }

    res.json({ success: true, settings });
  } catch (error: any) {
    console.error("Get Product Settings Error:", error);
    res.status(500).json({ error: error.message });
  }
}

router.get("/settings", handleGetSettings);

router.post("/availability", async (req, res) => {
  try {
    const { updates } = req.body;
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "No updates provided" });
    }

    // 1. Immediately persist to disk
    const current = getStoredSettings();
    const mergedAvailability = {
      ...current.availability,
      ...updates
    };
    const saved = saveStoredSettings({ availability: mergedAvailability });

    // 2. Also try updating Supabase if available
    if (supabaseAdmin) {
      try {
        const records = Object.entries(updates).map(([id, inStock]) => ({
          product_id: id,
          in_stock: inStock,
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabaseAdmin
          .from('product_availability')
          .upsert(records, { onConflict: 'product_id' });

        if (error) {
          console.warn("Supabase availability upsert warning:", error);
        }
      } catch (dbErr) {
        console.warn("Supabase sync failed (local store saved successfully):", dbErr);
      }
    }

    res.json({ success: true, availability: saved.availability });
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

    // 1. Immediately persist to disk
    const current = getStoredSettings();
    const mergedPricing = {
      ...current.pricing,
      ...updates
    };
    const saved = saveStoredSettings({ pricing: mergedPricing });

    // 2. Also try updating Supabase if available
    if (supabaseAdmin) {
      try {
        const records = Object.entries(updates).map(([id, price]) => ({
          product_id: id,
          price: price,
          updated_at: new Date().toISOString()
        }));

        const { error } = await supabaseAdmin
          .from('dynamic_prices')
          .upsert(records, { onConflict: 'product_id' });

        if (error) {
          console.warn("Supabase pricing upsert warning:", error);
        }
      } catch (dbErr) {
        console.warn("Supabase pricing sync failed (local store saved successfully):", dbErr);
      }
    }

    res.json({ success: true, pricing: saved.pricing });
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

    // 1. Immediately persist to disk
    const current = getStoredSettings();
    const bestSellersSet = new Set(current.best_sellers);
    const newArrivalsSet = new Set(current.new_arrivals);
    const onSaleSet = new Set(current.on_sale);
    const festivalSet = new Set(current.festival || []);
    const originalPrices = { ...current.original_prices };
    const descriptions = { ...current.descriptions };

    for (const [id, attrs] of Object.entries(updates) as [string, any][]) {
      if (attrs.is_best_seller !== undefined) {
        if (attrs.is_best_seller) bestSellersSet.add(id);
        else bestSellersSet.delete(id);
      }
      if (attrs.is_new_arrival !== undefined) {
        if (attrs.is_new_arrival) newArrivalsSet.add(id);
        else newArrivalsSet.delete(id);
      }
      if (attrs.is_on_sale !== undefined) {
        if (attrs.is_on_sale) onSaleSet.add(id);
        else onSaleSet.delete(id);
      }
      if (attrs.is_festival !== undefined) {
        if (attrs.is_festival) festivalSet.add(id);
        else festivalSet.delete(id);
      }
      if (attrs.original_price !== undefined) {
        originalPrices[id] = attrs.original_price;
      }
      if (attrs.description !== undefined) {
        descriptions[id] = attrs.description;
      }
    }

    const saved = saveStoredSettings({
      best_sellers: Array.from(bestSellersSet),
      new_arrivals: Array.from(newArrivalsSet),
      on_sale: Array.from(onSaleSet),
      festival: Array.from(festivalSet),
      original_prices: originalPrices,
      descriptions: descriptions
    });

    // 2. Also try updating Supabase if available
    if (supabaseAdmin) {
      try {
        for (const [id, attrs] of Object.entries(updates) as [string, any][]) {
          const payload: any = {
            product_id: id,
            updated_at: new Date().toISOString()
          };
          if (attrs.is_best_seller !== undefined) payload.is_best_seller = attrs.is_best_seller;
          if (attrs.is_new_arrival !== undefined) payload.is_new_arrival = attrs.is_new_arrival;
          if (attrs.is_on_sale !== undefined) payload.is_on_sale = attrs.is_on_sale;
          if (attrs.is_festival !== undefined) payload.is_festival = attrs.is_festival;
          if (attrs.original_price !== undefined) payload.original_price = attrs.original_price;
          if (attrs.description !== undefined) payload.description = attrs.description;

          await supabaseAdmin
            .from('product_attributes')
            .upsert(payload, { onConflict: 'product_id' });
        }
      } catch (dbErr) {
        console.warn("Supabase attributes sync failed (local store saved successfully):", dbErr);
      }
    }

    res.json({ 
      success: true, 
      best_sellers: saved.best_sellers,
      new_arrivals: saved.new_arrivals,
      on_sale: saved.on_sale,
      festival: saved.festival,
      original_prices: saved.original_prices,
      descriptions: saved.descriptions
    });
  } catch (error: any) {
    console.error("Admin Attributes Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/festival-config", async (req, res) => {
  try {
    const { enabled, title, subtitle } = req.body;
    const current = getStoredSettings();
    const newConfig = {
      enabled: enabled !== undefined ? !!enabled : current.festival_config.enabled,
      title: title !== undefined ? String(title).trim() || "Festival / Occasion" : current.festival_config.title,
      subtitle: subtitle !== undefined ? String(subtitle).trim() : current.festival_config.subtitle
    };

    const saved = saveStoredSettings({
      festival_config: newConfig
    });

    res.json({ success: true, festival_config: saved.festival_config });
  } catch (error: any) {
    console.error("Admin Festival Config Sync Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
