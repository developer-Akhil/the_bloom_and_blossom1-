import express from "express";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { supabase } from "../services/supabaseService.js";

const router = express.Router();

// --------------------------------------------------------------------------
// Local Fallback Storage File for Zero-Config / Offline / Preview Reliability
// --------------------------------------------------------------------------
const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "feedback_store.json");

interface FeedbackRequestData {
  feedback_request_id: string;
  customer_id?: string | null;
  order_id?: string | null;
  source: string;
  feedback_type: 'DIRECT' | 'INDIRECT';
  product_id?: string | null;
  product_name?: string | null;
  customer_name?: string | null;
  mobile_number?: string | null;
  email_address?: string | null;
  notes?: string | null;
  request_status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  feedback_link_token: string;
  sent_at?: string | null;
  created_at: string;
}

interface FeedbackData {
  feedback_id: string;
  feedback_request_id?: string | null;
  customer_id?: string | null;
  order_id?: string | null;
  feedback_type: 'DIRECT' | 'INDIRECT';
  source: string;
  rating: number;
  comments?: string;
  customer_name?: string | null;
  mobile_number?: string | null;
  email_address?: string | null;
  product_name?: string | null;
  submitted_at: string;
  status: 'ACTIVE' | 'ARCHIVED';
  google_review_status: 'submitted' | 'not_submitted' | 'unknown' | 'clicked' | 'skipped';
  google_review_notes?: string | null;
}

interface GoogleReviewData {
  google_review_id: string;
  feedback_id?: string | null;
  feedback_request_id?: string | null;
  google_review_reference?: string | null;
  rating?: number | null;
  review_text?: string | null;
  status: 'submitted' | 'not_submitted' | 'unknown' | 'clicked' | 'skipped';
  review_date?: string | null;
  created_at: string;
  updated_at: string;
}

interface StoreState {
  feedback_requests: FeedbackRequestData[];
  feedback: FeedbackData[];
  google_reviews: GoogleReviewData[];
}

// Initial Seed Data to make the dashboard immediately useful and visually rich
const INITIAL_SEED: StoreState = {
  feedback_requests: [
    {
      feedback_request_id: "req_seed_1",
      customer_id: null,
      order_id: "BB10025",
      source: "WEBSITE",
      feedback_type: "DIRECT",
      product_id: null,
      product_name: "Pastel Rainbow Name Headband",
      customer_name: "Priya Sharma",
      mobile_number: "+91 9876543210",
      email_address: "priya.s@example.com",
      notes: "Website checkout customer",
      request_status: "COMPLETED",
      feedback_link_token: "bb_priya_2026",
      sent_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      feedback_request_id: "req_seed_2",
      customer_id: null,
      order_id: null,
      source: "INSTAGRAM",
      feedback_type: "INDIRECT",
      product_id: null,
      product_name: "Customised Name Hairband",
      customer_name: "Rahul Verma",
      mobile_number: "+91 9811223344",
      email_address: "rahul.v@example.com",
      notes: "DM inquiry from Instagram page",
      request_status: "COMPLETED",
      feedback_link_token: "bb_rahul_insta",
      sent_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      feedback_request_id: "req_seed_3",
      customer_id: null,
      order_id: null,
      source: "WHATSAPP",
      feedback_type: "INDIRECT",
      product_id: null,
      product_name: "Black Pearl Name Bow",
      customer_name: "Neha Gupta",
      mobile_number: "+91 9723456789",
      email_address: null,
      notes: "WhatsApp order consultation",
      request_status: "COMPLETED",
      feedback_link_token: "bb_neha_wa",
      sent_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      feedback_request_id: "req_seed_4",
      customer_id: null,
      order_id: null,
      source: "FACEBOOK",
      feedback_type: "INDIRECT",
      product_id: null,
      product_name: "Skyblue Long-Tail Name Bow",
      customer_name: "Amit Patel",
      mobile_number: null,
      email_address: "amit.patel@example.com",
      notes: "Facebook Messenger query",
      request_status: "COMPLETED",
      feedback_link_token: "bb_amit_fb",
      sent_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 4).toISOString()
    }
  ],
  feedback: [
    {
      feedback_id: "fb_akhil_google",
      feedback_request_id: null,
      customer_id: null,
      order_id: null,
      feedback_type: "DIRECT",
      source: "GOOGLE",
      rating: 5,
      comments: "I ordered some clips for my Daughter. All were so pretty and eye catching. Good quality and quick delivery.",
      customer_name: "Akhil",
      mobile_number: null,
      email_address: null,
      product_name: "Handcrafted Clips Set",
      submitted_at: new Date().toISOString(),
      status: "ACTIVE",
      google_review_status: "submitted",
      google_review_notes: "Google Maps review"
    },
    {
      feedback_id: "fb_kavita_aug27",
      feedback_request_id: null,
      customer_id: null,
      order_id: null,
      feedback_type: "INDIRECT",
      source: "WEBSITE",
      rating: 5,
      comments: "My personal experience is very good i m very happy with this product n delivery bhi time se pahele mil gai",
      customer_name: "Kavita",
      mobile_number: "+91 9897123456",
      email_address: "kavita.c@example.com",
      product_name: "Name Bows",
      submitted_at: "2026-08-27T17:29:00.000Z",
      status: "ACTIVE",
      google_review_status: "not_submitted",
      google_review_notes: "Customer feedback via website form"
    },
    {
      feedback_id: "fb_seed_1",
      feedback_request_id: "req_seed_1",
      customer_id: null,
      order_id: "BB10025",
      feedback_type: "DIRECT",
      source: "WEBSITE",
      rating: 5,
      comments: "The hairband is so beautifully customized! The colors are gorgeous and quality is top-notch. My daughter loves it.",
      customer_name: "Priya Sharma",
      mobile_number: "+91 9876543210",
      email_address: "priya.s@example.com",
      product_name: "Pastel Rainbow Name Headband",
      submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      status: "ACTIVE",
      google_review_status: "submitted",
      google_review_notes: "Reviewed with 5 stars on Google Maps"
    },
    {
      feedback_id: "fb_seed_2",
      feedback_request_id: "req_seed_2",
      customer_id: null,
      order_id: null,
      feedback_type: "INDIRECT",
      source: "INSTAGRAM",
      rating: 5,
      comments: "Ordered directly through Insta DM. Super friendly support and the packaging was lovely!",
      customer_name: "Rahul Verma",
      mobile_number: "+91 9811223344",
      email_address: "rahul.v@example.com",
      product_name: "Customised Name Hairband",
      submitted_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      status: "ACTIVE",
      google_review_status: "submitted",
      google_review_notes: "Confirmed Google Review"
    },
    {
      feedback_id: "fb_seed_3",
      feedback_request_id: "req_seed_3",
      customer_id: null,
      order_id: null,
      feedback_type: "INDIRECT",
      source: "WHATSAPP",
      rating: 5,
      comments: "Quick delivery and the pearls are securely stitched. Very premium feel!",
      customer_name: "Neha Gupta",
      mobile_number: "+91 9723456789",
      email_address: null,
      product_name: "Black Pearl Name Bow",
      submitted_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      status: "ACTIVE",
      google_review_status: "submitted",
      google_review_notes: null
    },
    {
      feedback_id: "fb_seed_4",
      feedback_request_id: "req_seed_4",
      customer_id: null,
      order_id: null,
      feedback_type: "INDIRECT",
      source: "FACEBOOK",
      rating: 4,
      comments: "Loved the embroidery and design. Would love to see more pastel color options in the future.",
      customer_name: "Amit Patel",
      mobile_number: null,
      email_address: "amit.patel@example.com",
      product_name: "Skyblue Long-Tail Name Bow",
      submitted_at: new Date(Date.now() - 86400000 * 4).toISOString(),
      status: "ACTIVE",
      google_review_status: "not_submitted",
      google_review_notes: null
    },
    {
      feedback_id: "fb_seed_5",
      feedback_request_id: null,
      customer_id: null,
      order_id: "BB10018",
      feedback_type: "DIRECT",
      source: "WEBSITE",
      rating: 5,
      comments: "Excellent shopping experience, received on time for my niece's birthday party!",
      customer_name: "Ananya Roy",
      mobile_number: "+91 9845012345",
      email_address: "ananya.r@example.com",
      product_name: "Red Glitter Name Headband",
      submitted_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      status: "ACTIVE",
      google_review_status: "submitted",
      google_review_notes: "Google review verified"
    },
    {
      feedback_id: "fb_seed_6",
      feedback_request_id: null,
      customer_id: null,
      order_id: null,
      feedback_type: "INDIRECT",
      source: "WALK_IN",
      rating: 5,
      comments: "Visited the pop-up stall in Haridwar. The accessories are even prettier in person.",
      customer_name: "Meera Joshi",
      mobile_number: "+91 9910022334",
      email_address: null,
      product_name: "Scrunchies & Bows Combo",
      submitted_at: new Date(Date.now() - 86400000 * 6).toISOString(),
      status: "ACTIVE",
      google_review_status: "not_submitted",
      google_review_notes: null
    }
  ],
  google_reviews: [
    {
      google_review_id: "gr_akhil_google",
      feedback_id: "fb_akhil_google",
      feedback_request_id: null,
      google_review_reference: "Google Review - Akhil",
      rating: 5,
      review_text: "I ordered some clips for my Daughter. All were so pretty and eye catching. Good quality and quick delivery.",
      status: "submitted",
      review_date: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      google_review_id: "gr_seed_1",
      feedback_id: "fb_seed_1",
      feedback_request_id: "req_seed_1",
      google_review_reference: "Google Review #101",
      rating: 5,
      review_text: "Top quality customised hair accessories!",
      status: "submitted",
      review_date: new Date(Date.now() - 86400000 * 2).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 2).toISOString()
    },
    {
      google_review_id: "gr_seed_2",
      feedback_id: "fb_seed_2",
      feedback_request_id: "req_seed_2",
      google_review_reference: "Google Review #102",
      rating: 5,
      review_text: "Great experience ordering via Instagram DM.",
      status: "submitted",
      review_date: new Date(Date.now() - 86400000 * 3).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 3).toISOString()
    },
    {
      google_review_id: "gr_seed_3",
      feedback_id: "fb_seed_3",
      feedback_request_id: "req_seed_3",
      google_review_reference: "Google Review #103",
      rating: 5,
      review_text: "Loved the pearl name bow!",
      status: "submitted",
      review_date: new Date(Date.now() - 86400000 * 1).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 1).toISOString()
    },
    {
      google_review_id: "gr_seed_5",
      feedback_id: "fb_seed_5",
      feedback_request_id: null,
      google_review_reference: "Google Review #105",
      rating: 5,
      review_text: "Beautiful bows and quick delivery.",
      status: "submitted",
      review_date: new Date(Date.now() - 86400000 * 5).toISOString(),
      created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
      updated_at: new Date(Date.now() - 86400000 * 5).toISOString()
    }
  ]
};

function getLocalStore(): StoreState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STORE_PATH)) {
      fs.writeFileSync(STORE_PATH, JSON.stringify(INITIAL_SEED, null, 2), "utf-8");
      return INITIAL_SEED;
    }
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("[FeedbackStore] Error reading local store:", e);
    return INITIAL_SEED;
  }
}

function saveLocalStore(state: StoreState): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(state, null, 2), "utf-8");
  } catch (e) {
    console.error("[FeedbackStore] Error saving local store:", e);
  }
}

// --------------------------------------------------------------------------
// 1. Create a Feedback Request (Admin)
// --------------------------------------------------------------------------
router.post("/requests", async (req, res) => {
  try {
    const {
      source = "INSTAGRAM",
      feedback_type,
      order_id = null,
      customer_name = null,
      mobile_number = null,
      email_address = null,
      product_name = null,
      product_id = null,
      notes = null
    } = req.body;

    // Determine type: DIRECT if order_id is present, otherwise INDIRECT unless specified
    const calculatedType: 'DIRECT' | 'INDIRECT' = feedback_type 
      ? feedback_type 
      : (order_id ? 'DIRECT' : 'INDIRECT');

    const requestId = `req_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
    const token = `bb_${crypto.randomBytes(6).toString('hex')}`;

    const newRequest: FeedbackRequestData = {
      feedback_request_id: requestId,
      customer_id: null,
      order_id: order_id || null,
      source: String(source).toUpperCase(),
      feedback_type: calculatedType,
      product_id: product_id || null,
      product_name: product_name || null,
      customer_name: customer_name || null,
      mobile_number: mobile_number || null,
      email_address: email_address || null,
      notes: notes || null,
      request_status: "PENDING",
      feedback_link_token: token,
      sent_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    };

    // Try Supabase first if available
    let savedToSupabase = false;
    try {
      if (supabase && typeof (supabase as any).schema === "function") {
        const { error } = await (supabase as any)
          .schema('bb_ecommerce_sc')
          .from('feedback_requests')
          .insert({
            feedback_request_id: newRequest.feedback_request_id,
            order_id: newRequest.order_id,
            source: newRequest.source,
            feedback_type: newRequest.feedback_type,
            product_name: newRequest.product_name,
            customer_name: newRequest.customer_name,
            mobile_number: newRequest.mobile_number,
            email_address: newRequest.email_address,
            notes: newRequest.notes,
            request_status: newRequest.request_status,
            feedback_link_token: newRequest.feedback_link_token
          });
        if (!error) savedToSupabase = true;
      }
    } catch {
      // Fallback
    }

    // Always keep local store in sync
    const store = getLocalStore();
    store.feedback_requests.unshift(newRequest);
    saveLocalStore(store);

    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
    const host = req.headers['x-forwarded-host'] || req.get('host') || 'localhost:3000';
    const feedbackUrl = `${protocol}://${host}/feedback?token=${token}`;

    return res.status(201).json({
      success: true,
      request: newRequest,
      feedbackUrl,
      token,
      savedToSupabase
    });
  } catch (error: any) {
    console.error("[Feedback API] Error creating feedback request:", error);
    return res.status(500).json({ error: error.message || "Failed to create feedback request" });
  }
});

// --------------------------------------------------------------------------
// 2. Fetch Request by Token (Public Form Lookup)
// --------------------------------------------------------------------------
router.get("/requests/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.status(400).json({ error: "Token is required" });

    // Look in local store
    const store = getLocalStore();
    const found = store.feedback_requests.find(
      r => r.feedback_link_token === token || r.feedback_request_id === token
    );

    if (found) {
      return res.json({ success: true, request: found });
    }

    // Attempt Supabase lookup
    try {
      if (supabase && typeof (supabase as any).schema === "function") {
        const { data, error } = await (supabase as any)
          .schema('bb_ecommerce_sc')
          .from('feedback_requests')
          .select('*')
          .or(`feedback_link_token.eq.${token},feedback_request_id.eq.${token}`)
          .single();
        if (!error && data) {
          return res.json({ success: true, request: data });
        }
      }
    } catch {
      // ignore
    }

    return res.status(404).json({ error: "Feedback request token not found or expired" });
  } catch (error: any) {
    console.error("[Feedback API] Error looking up token:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch feedback request" });
  }
});

// --------------------------------------------------------------------------
// 3. Submit Customer Feedback (Public Form)
// --------------------------------------------------------------------------
router.post("/submit", async (req, res) => {
  try {
    const {
      token = null,
      feedback_request_id = null,
      order_id = null,
      rating,
      comments = "",
      customer_name = null,
      mobile_number = null,
      email_address = null,
      product_name = null,
      source = null,
      feedback_type = null
    } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ error: "Please provide a valid rating between 1 and 5 stars" });
    }

    const store = getLocalStore();

    // Check if linked to an existing request via token or request ID
    let linkedRequest: FeedbackRequestData | undefined;
    if (token) {
      linkedRequest = store.feedback_requests.find(r => r.feedback_link_token === token || r.feedback_request_id === token);
    } else if (feedback_request_id) {
      linkedRequest = store.feedback_requests.find(r => r.feedback_request_id === feedback_request_id);
    }

    const resolvedOrderId = order_id || linkedRequest?.order_id || null;
    const resolvedType: 'DIRECT' | 'INDIRECT' = feedback_type 
      ? feedback_type 
      : (linkedRequest?.feedback_type || (resolvedOrderId ? 'DIRECT' : 'INDIRECT'));
    
    const resolvedSource = (source || linkedRequest?.source || (resolvedOrderId ? 'WEBSITE' : 'WEBSITE')).toUpperCase();
    const resolvedName = customer_name || linkedRequest?.customer_name || null;
    const resolvedMobile = mobile_number || linkedRequest?.mobile_number || null;
    const resolvedEmail = email_address || linkedRequest?.email_address || null;
    const resolvedProduct = product_name || linkedRequest?.product_name || null;

    const feedbackId = `fb_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

    const newFeedback: FeedbackData = {
      feedback_id: feedbackId,
      feedback_request_id: linkedRequest?.feedback_request_id || feedback_request_id || null,
      customer_id: null,
      order_id: resolvedOrderId,
      feedback_type: resolvedType,
      source: resolvedSource,
      rating: numRating,
      comments: String(comments || "").trim(),
      customer_name: resolvedName,
      mobile_number: resolvedMobile,
      email_address: resolvedEmail,
      product_name: resolvedProduct,
      submitted_at: new Date().toISOString(),
      status: "ACTIVE",
      google_review_status: "not_submitted",
      google_review_notes: null
    };

    // Update the request status if linked
    if (linkedRequest) {
      linkedRequest.request_status = "COMPLETED";
    }

    // Save to local store
    store.feedback.unshift(newFeedback);
    saveLocalStore(store);

    // Try Supabase insert
    try {
      if (supabase && typeof (supabase as any).schema === "function") {
        await (supabase as any)
          .schema('bb_ecommerce_sc')
          .from('feedback')
          .insert({
            feedback_id: newFeedback.feedback_id,
            feedback_request_id: newFeedback.feedback_request_id,
            order_id: newFeedback.order_id,
            feedback_type: newFeedback.feedback_type,
            source: newFeedback.source,
            rating: newFeedback.rating,
            comments: newFeedback.comments,
            customer_name: newFeedback.customer_name,
            mobile_number: newFeedback.mobile_number,
            email_address: newFeedback.email_address,
            product_name: newFeedback.product_name,
            status: newFeedback.status,
            google_review_status: newFeedback.google_review_status
          });

        if (linkedRequest) {
          await (supabase as any)
            .schema('bb_ecommerce_sc')
            .from('feedback_requests')
            .update({ request_status: 'COMPLETED' })
            .eq('feedback_request_id', linkedRequest.feedback_request_id);
        }
      }
    } catch {
      // ignore
    }

    return res.status(201).json({
      success: true,
      message: "Thank you for your valuable feedback! 🌸",
      feedback: newFeedback,
      shouldPromptGoogleReview: numRating >= 4
    });
  } catch (error: any) {
    console.error("[Feedback API] Error submitting feedback:", error);
    return res.status(500).json({ error: error.message || "Failed to submit feedback" });
  }
});

// --------------------------------------------------------------------------
// 4. Update Google Review Action / Status
// --------------------------------------------------------------------------
router.post("/google-review-status", async (req, res) => {
  try {
    const {
      feedback_id,
      status = "submitted",
      google_review_reference = null,
      notes = null
    } = req.body;

    if (!feedback_id) {
      return res.status(400).json({ error: "Feedback ID is required" });
    }

    const store = getLocalStore();
    const fb = store.feedback.find(f => f.feedback_id === feedback_id);

    if (fb) {
      fb.google_review_status = status;
      if (notes) fb.google_review_notes = notes;

      const grId = `gr_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
      const newGR: GoogleReviewData = {
        google_review_id: grId,
        feedback_id: fb.feedback_id,
        feedback_request_id: fb.feedback_request_id || null,
        google_review_reference: google_review_reference || `Direct Confirmation`,
        rating: fb.rating,
        review_text: fb.comments || null,
        status: status,
        review_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      store.google_reviews.unshift(newGR);
      saveLocalStore(store);
    }

    // Update in Supabase if table exists
    try {
      if (supabase && typeof (supabase as any).schema === "function") {
        await (supabase as any)
          .schema('bb_ecommerce_sc')
          .from('feedback')
          .update({ 
            google_review_status: status,
            google_review_notes: notes 
          })
          .eq('feedback_id', feedback_id);
      }
    } catch {
      // ignore
    }

    return res.json({ success: true, message: "Google review status updated" });
  } catch (error: any) {
    console.error("[Feedback API] Error updating google review status:", error);
    return res.status(500).json({ error: error.message || "Failed to update Google review status" });
  }
});

// --------------------------------------------------------------------------
// 5. Admin Dashboard Analytics & Summary
// --------------------------------------------------------------------------
router.get("/admin/dashboard", async (_req, res) => {
  try {
    const store = getLocalStore();
    const feedbackList = store.feedback || [];
    const requestsList = store.feedback_requests || [];

    const totalFeedback = feedbackList.length;
    const directFeedback = feedbackList.filter(f => f.feedback_type === "DIRECT").length;
    const indirectFeedback = feedbackList.filter(f => f.feedback_type === "INDIRECT").length;

    const totalRatingSum = feedbackList.reduce((sum, f) => sum + (f.rating || 0), 0);
    const averageRating = totalFeedback > 0 ? (totalRatingSum / totalFeedback).toFixed(2) : "0.00";

    const googleReviewsCount = feedbackList.filter(f => f.google_review_status === "submitted").length;
    const googleReviewConversion = totalFeedback > 0 
      ? Math.round((googleReviewsCount / totalFeedback) * 100) 
      : 0;

    // Source breakdown
    const sourceBreakdown: Record<string, number> = {
      WEBSITE: 0,
      INSTAGRAM: 0,
      FACEBOOK: 0,
      WHATSAPP: 0,
      PHONE: 0,
      WALK_IN: 0,
      OTHER: 0
    };

    feedbackList.forEach(f => {
      const src = (f.source || "OTHER").toUpperCase();
      if (sourceBreakdown[src] !== undefined) {
        sourceBreakdown[src]++;
      } else {
        sourceBreakdown.OTHER = (sourceBreakdown.OTHER || 0) + 1;
      }
    });

    // Rating histogram
    const ratingHistogram = {
      5: feedbackList.filter(f => f.rating === 5).length,
      4: feedbackList.filter(f => f.rating === 4).length,
      3: feedbackList.filter(f => f.rating === 3).length,
      2: feedbackList.filter(f => f.rating === 2).length,
      1: feedbackList.filter(f => f.rating === 1).length
    };

    return res.json({
      success: true,
      metrics: {
        totalFeedback,
        directFeedback,
        indirectFeedback,
        averageRating: Number(averageRating),
        googleReviewsCount,
        googleReviewConversion,
        totalRequests: requestsList.length,
        pendingRequests: requestsList.filter(r => r.request_status === "PENDING").length
      },
      sourceBreakdown,
      ratingHistogram,
      recentFeedback: feedbackList.slice(0, 10),
      recentRequests: requestsList.slice(0, 10)
    });
  } catch (error: any) {
    console.error("[Feedback API] Error getting dashboard metrics:", error);
    return res.status(500).json({ error: error.message || "Failed to load dashboard metrics" });
  }
});

// --------------------------------------------------------------------------
// 6. Admin Feedback List with Filtering and Search
// --------------------------------------------------------------------------
router.get("/admin/list", async (req, res) => {
  try {
    const {
      type,
      source,
      rating,
      google_status,
      search = "",
      page = "1",
      limit = "25"
    } = req.query;

    const store = getLocalStore();
    let list = [...store.feedback];

    // Filter by type
    if (type && type !== "ALL") {
      list = list.filter(f => f.feedback_type === String(type).toUpperCase());
    }

    // Filter by source
    if (source && source !== "ALL") {
      list = list.filter(f => f.source === String(source).toUpperCase());
    }

    // Filter by rating
    if (rating && rating !== "ALL") {
      list = list.filter(f => f.rating === Number(rating));
    }

    // Filter by google review status
    if (google_status && google_status !== "ALL") {
      list = list.filter(f => f.google_review_status === String(google_status));
    }

    // Search
    if (search && String(search).trim() !== "") {
      const q = String(search).toLowerCase().trim();
      list = list.filter(f => 
        (f.customer_name && f.customer_name.toLowerCase().includes(q)) ||
        (f.comments && f.comments.toLowerCase().includes(q)) ||
        (f.email_address && f.email_address.toLowerCase().includes(q)) ||
        (f.mobile_number && f.mobile_number.includes(q)) ||
        (f.order_id && f.order_id.toLowerCase().includes(q)) ||
        (f.product_name && f.product_name.toLowerCase().includes(q))
      );
    }

    const total = list.length;
    const p = Math.max(1, parseInt(String(page), 10) || 1);
    const l = Math.max(1, parseInt(String(limit), 10) || 25);
    const totalPages = Math.ceil(total / l) || 1;
    const startIndex = (p - 1) * l;
    const paginated = list.slice(startIndex, startIndex + l);

    return res.json({
      success: true,
      feedback: paginated,
      total,
      page: p,
      totalPages
    });
  } catch (error: any) {
    console.error("[Feedback API] Error fetching admin list:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch feedback list" });
  }
});

// --------------------------------------------------------------------------
// 7. Update Google Review Status / Admin Notes for Feedback
// --------------------------------------------------------------------------
router.put("/admin/:id/google-status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const store = getLocalStore();
    const fb = store.feedback.find(f => f.feedback_id === id);

    if (!fb) {
      return res.status(404).json({ error: "Feedback entry not found" });
    }

    if (status) fb.google_review_status = status;
    if (notes !== undefined) fb.google_review_notes = notes;

    saveLocalStore(store);

    return res.json({ success: true, feedback: fb });
  } catch (error: any) {
    console.error("[Feedback API] Error updating feedback entry:", error);
    return res.status(500).json({ error: error.message || "Failed to update feedback" });
  }
});

// --------------------------------------------------------------------------
// 8. Delete / Archive Feedback Entry
// --------------------------------------------------------------------------
router.delete("/admin/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const store = getLocalStore();
    const index = store.feedback.findIndex(f => f.feedback_id === id);

    if (index === -1) {
      return res.status(404).json({ error: "Feedback entry not found" });
    }

    const removed = store.feedback.splice(index, 1)[0];
    saveLocalStore(store);

    return res.json({ success: true, removed });
  } catch (error: any) {
    console.error("[Feedback API] Error deleting feedback entry:", error);
    return res.status(500).json({ error: error.message || "Failed to delete feedback" });
  }
});

// --------------------------------------------------------------------------
// 9. Export Feedback as CSV
// --------------------------------------------------------------------------
router.get("/admin/export", async (_req, res) => {
  try {
    const store = getLocalStore();
    const feedbackList = store.feedback || [];

    const headers = [
      "Feedback ID",
      "Type",
      "Source",
      "Rating",
      "Customer Name",
      "Mobile Number",
      "Email Address",
      "Order ID",
      "Product Name",
      "Comments",
      "Google Review Status",
      "Submitted Date"
    ];

    const rows = feedbackList.map(f => [
      f.feedback_id,
      f.feedback_type,
      f.source,
      f.rating,
      `"${(f.customer_name || '').replace(/"/g, '""')}"`,
      `"${(f.mobile_number || '').replace(/"/g, '""')}"`,
      `"${(f.email_address || '').replace(/"/g, '""')}"`,
      `"${(f.order_id || '').replace(/"/g, '""')}"`,
      `"${(f.product_name || '').replace(/"/g, '""')}"`,
      `"${(f.comments || '').replace(/"/g, '""')}"`,
      f.google_review_status,
      f.submitted_at
    ]);

    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=bloom_and_blossom_feedback_${Date.now()}.csv`);
    return res.send(csvContent);
  } catch (error: any) {
    console.error("[Feedback API] Error exporting CSV:", error);
    return res.status(500).json({ error: error.message || "Failed to export CSV" });
  }
});

// --------------------------------------------------------------------------
// 10. Public Live Reviews Feed for Customer Showcase
// --------------------------------------------------------------------------
router.get("/public", async (_req, res) => {
  try {
    const store = getLocalStore();
    const feedbackList = (store.feedback || []).filter(f => f.status !== "ARCHIVED");

    // Map store feedback to social review items
    const liveReviews = feedbackList.map(f => {
      let src: 'google' | 'website' | 'instagram' | 'trustpilot' = 'website';
      let srcLabel = 'Verified Customer';
      const fSource = (f.source || '').toUpperCase();
      
      if (fSource === 'GOOGLE') {
        src = 'google';
        srcLabel = 'Google';
      } else if (fSource === 'INSTAGRAM') {
        src = 'instagram';
        srcLabel = 'Instagram DM';
      } else if (fSource === 'TRUSTPILOT') {
        src = 'trustpilot';
        srcLabel = 'Trustpilot';
      } else {
        src = 'website';
        srcLabel = 'Verified Customer';
      }

      // Format date
      let dateLabel = 'Recently';
      if (f.submitted_at) {
        const d = new Date(f.submitted_at);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays <= 0) dateLabel = 'Today';
        else if (diffDays === 1) dateLabel = 'Yesterday';
        else if (diffDays < 7) dateLabel = `${diffDays} days ago`;
        else if (diffDays < 30) dateLabel = `${Math.floor(diffDays / 7)} weeks ago`;
        else dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }

      return {
        id: f.feedback_id,
        authorName: f.customer_name || 'Verified Customer',
        rating: f.rating || 5,
        reviewText: f.comments || 'Loved the quality and craft! Beautiful collection 🌸',
        source: src,
        sourceLabel: srcLabel,
        sourceUrl: src === 'google' 
          ? 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,'
          : '/feedback',
        isVerified: true,
        date: dateLabel,
        rawDate: f.submitted_at,
        productName: f.product_name || 'Handcrafted Hair Accessory',
        location: f.source === 'WALK_IN' ? 'Haridwar' : undefined,
        likesCount: 5 + (f.rating * 2)
      };
    });

    return res.json({
      success: true,
      reviews: liveReviews,
      totalCount: liveReviews.length
    });
  } catch (error: any) {
    console.error("[Feedback API] Error loading public reviews feed:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch public reviews" });
  }
});

export default router;
