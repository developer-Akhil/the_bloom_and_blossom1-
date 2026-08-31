import fs from "fs";
import path from "path";
import crypto from "crypto";
import { supabase } from "./supabaseService.js";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "feedback_store.json");
const SYNC_METADATA_PATH = path.join(DATA_DIR, "google_sync_metadata.json");

export interface GoogleSyncMetadata {
  lastSyncAttempt: string | null;
  lastSuccessfulSync: string | null;
  status: 'idle' | 'syncing' | 'success' | 'standby' | 'error';
  errorMessage: string | null;
  rating: number | null;
  userRatingCount: number | null;
  placeName: string | null;
  placeUrl: string | null;
  reviewsCount: number;
  isConfigured: boolean;
  billingRequired?: boolean;
}

// In-memory sync state
let syncInProgress = false;

function getSyncMetadata(): GoogleSyncMetadata {
  try {
    if (fs.existsSync(SYNC_METADATA_PATH)) {
      const raw = fs.readFileSync(SYNC_METADATA_PATH, "utf-8");
      const meta = JSON.parse(raw);
      meta.isConfigured = !!(process.env.GOOGLE_MAPS_API_KEY || "AIzaSyDw-2Jd4TqFB6WRAZXbIA7DtC6zp0INQuQ");
      return meta;
    }
  } catch (err) {
    console.error("[GoogleSync] Error reading sync metadata:", err);
  }

  return {
    lastSyncAttempt: null,
    lastSuccessfulSync: null,
    status: 'idle',
    errorMessage: null,
    rating: 5.0,
    userRatingCount: null,
    placeName: "The Bloom and Blossom",
    placeUrl: "https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,",
    reviewsCount: 0,
    isConfigured: true
  };
}

function saveSyncMetadata(meta: GoogleSyncMetadata) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(SYNC_METADATA_PATH, JSON.stringify(meta, null, 2), "utf-8");
  } catch (err) {
    console.error("[GoogleSync] Error saving sync metadata:", err);
  }
}

/**
 * Fetch place details and reviews from Google Places API
 * Tries Places API (New) first, then falls back to legacy Place Details API
 */
export async function fetchGoogleReviewsFromApi(): Promise<{
  placeName?: string;
  rating?: number;
  userRatingCount?: number;
  placeUrl?: string;
  reviews: Array<{
    authorName: string;
    rating: number;
    text: string;
    publishTime?: string;
    relativeTime?: string;
    profilePhotoUrl?: string;
    authorUrl?: string;
  }>;
}> {
  const apiKey = (process.env.GOOGLE_MAPS_API_KEY || "AIzaSyDw-2Jd4TqFB6WRAZXbIA7DtC6zp0INQuQ")?.trim();
  const placeId = (process.env.GOOGLE_PLACE_ID || "EiVXNFFNK0M1LCBIYXJpZHdhciwgVXR0YXJha2hhbmQsIEluZGlhIiY6JAoKDRlD2BEV3yOSLhAKGhQKEgnJV-64DkcJORHz9UCmdpFETg")?.trim();

  if (!apiKey || !placeId) {
    throw new Error("Missing GOOGLE_MAPS_API_KEY or GOOGLE_PLACE_ID in environment secrets.");
  }

  console.log(`[GoogleSync] Fetching reviews for Place ID: ${placeId.substring(0, 8)}... using Google Places API`);

  // 1. Try Google Places API (New)
  try {
    const newApiUrl = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`;
    const response = await fetch(newApiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "id,displayName,rating,userRatingCount,reviews,googleMapsUri"
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`[GoogleSync] Successfully fetched from Places API (New):`, {
        rating: data.rating,
        userRatingCount: data.userRatingCount,
        reviewsCount: data.reviews?.length || 0
      });

      const reviews = (data.reviews || []).map((r: any) => ({
        authorName: r.authorAttribution?.displayName || "Google User",
        rating: r.rating || 5,
        text: r.text?.text || r.originalText?.text || "",
        publishTime: r.publishTime || new Date().toISOString(),
        relativeTime: r.relativePublishTimeDescription || "Recently",
        profilePhotoUrl: r.authorAttribution?.photoUri || undefined,
        authorUrl: r.authorAttribution?.uri || undefined
      }));

      return {
        placeName: data.displayName?.text || "The Bloom and Blossom",
        rating: data.rating,
        userRatingCount: data.userRatingCount,
        placeUrl: data.googleMapsUri || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
        reviews
      };
    } else {
      let errMessage = `HTTP ${response.status}`;
      let isBilling = false;
      try {
        const errJson = await response.json();
        const errObj = errJson?.error || {};
        const reason = errObj?.details?.[0]?.reason || "";
        const msg = errObj?.message || "";

        if (reason === "BILLING_DISABLED" || msg.toLowerCase().includes("billing")) {
          isBilling = true;
          errMessage = "Google Cloud billing activation is required to fetch live reviews via API.";
        } else if (reason === "SERVICE_DISABLED" || msg.toLowerCase().includes("disabled")) {
          errMessage = "Google Places API is in the process of activation in your Google Cloud project.";
        } else if (reason === "API_KEY_SERVICE_BLOCKED" || reason === "API_KEY_INVALID") {
          errMessage = "API Key restriction in Google Cloud needs 'Places API (New)' and 'Places API' selected.";
        } else if (msg) {
          errMessage = msg;
        }
      } catch {
        const text = await response.text().catch(() => "");
        if (text.toLowerCase().includes("billing")) isBilling = true;
      }

      if (isBilling) {
        const billErr: any = new Error("Google Cloud project requires billing activation to fetch live updates via API. Existing verified reviews are active and unaffected.");
        billErr.isBillingError = true;
        throw billErr;
      }

      console.log(`[GoogleSync] Places API (New) notice (${response.status}): ${errMessage}. Checking legacy endpoint...`);
    }
  } catch (err: any) {
    if (err?.isBillingError) throw err;
    console.log("[GoogleSync] Places API (New) check:", err?.message || "Trying legacy endpoint");
  }

  // 2. Fallback to Legacy Google Maps Place Details API
  const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=name,rating,user_ratings_total,reviews,url&key=${encodeURIComponent(apiKey)}`;
  const legacyRes = await fetch(legacyUrl);
  
  if (!legacyRes.ok) {
    const errText = await legacyRes.text().catch(() => "");
    if (errText.toLowerCase().includes("billing") || legacyRes.status === 403) {
      const billErr: any = new Error("Google Cloud project requires billing activation to fetch live updates via API. Existing verified reviews are active and unaffected.");
      billErr.isBillingError = true;
      throw billErr;
    }
    throw new Error(`Google Places API request returned HTTP ${legacyRes.status}`);
  }

  const legacyData = await legacyRes.json().catch(() => null);
  if (!legacyData || legacyData.status !== "OK") {
    const errMsg = legacyData?.error_message || "";
    const status = legacyData?.status || "UNKNOWN";
    if (status === "REQUEST_DENIED" && (errMsg.toLowerCase().includes("billing") || errMsg.toLowerCase().includes("enable"))) {
      const billErr: any = new Error("Google Cloud project requires billing activation to fetch live updates via API. Existing verified reviews are active and unaffected.");
      billErr.isBillingError = true;
      throw billErr;
    }
    throw new Error(`Google Places API status: ${status}${errMsg ? ` - ${errMsg}` : ''}`);
  }

  const result = legacyData.result || {};
  const reviews = (result.reviews || []).map((r: any) => ({
    authorName: r.author_name || "Google User",
    rating: r.rating || 5,
    text: r.text || "",
    publishTime: r.time ? new Date(r.time * 1000).toISOString() : new Date().toISOString(),
    relativeTime: r.relative_time_description || "Recently",
    profilePhotoUrl: r.profile_photo_url || undefined,
    authorUrl: r.author_url || undefined
  }));

  return {
    placeName: result.name || "The Bloom and Blossom",
    rating: result.rating,
    userRatingCount: result.user_ratings_total,
    placeUrl: result.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    reviews
  };
}

/**
 * Main Google Review Sync function:
 * Fetches Google reviews, transforms and merges them into the feedback store
 */
export async function syncGoogleReviews(): Promise<{
  success: boolean;
  message: string;
  addedCount: number;
  totalSyncedCount: number;
  rating?: number | null;
  userRatingCount?: number | null;
}> {
  if (syncInProgress) {
    return {
      success: false,
      message: "A Google Review sync is already in progress.",
      addedCount: 0,
      totalSyncedCount: 0
    };
  }

  const metadata = getSyncMetadata();
  metadata.lastSyncAttempt = new Date().toISOString();
  metadata.status = 'syncing';
  metadata.errorMessage = null;
  saveSyncMetadata(metadata);
  syncInProgress = true;

  try {
    const apiResult = await fetchGoogleReviewsFromApi();
    
    // Read current store
    let store: any = { feedback: [], google_reviews: [], feedback_requests: [] };
    if (fs.existsSync(STORE_PATH)) {
      try {
        store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
      } catch (e) {
        console.error("[GoogleSync] Error parsing feedback store:", e);
      }
    }

    if (!Array.isArray(store.feedback)) store.feedback = [];
    if (!Array.isArray(store.google_reviews)) store.google_reviews = [];

    let addedCount = 0;
    const nowIso = new Date().toISOString();

    for (const item of apiResult.reviews) {
      if (!item.text && !item.rating) continue;

      const normAuthor = (item.authorName || "").trim().toLowerCase();
      const normSnippet = (item.text || "").trim().toLowerCase().substring(0, 40);

      // Check if already exists in store.feedback
      const existingFbIndex = store.feedback.findIndex((f: any) => {
        const fAuthor = (f.customer_name || "").trim().toLowerCase();
        const fComments = (f.comments || "").trim().toLowerCase();
        return (
          f.source === "GOOGLE" &&
          (fAuthor === normAuthor || (normSnippet && fComments.includes(normSnippet)))
        );
      });

      const feedbackId = existingFbIndex >= 0 
        ? store.feedback[existingFbIndex].feedback_id 
        : `fb_google_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

      const feedbackEntry = {
        feedback_id: feedbackId,
        feedback_request_id: null,
        customer_id: null,
        order_id: null,
        feedback_type: "DIRECT",
        source: "GOOGLE",
        rating: item.rating || 5,
        comments: item.text || "Rated on Google Maps 🌸",
        customer_name: item.authorName || "Google Customer",
        mobile_number: null,
        email_address: null,
        product_name: "Handcrafted Clips & Accessories",
        submitted_at: item.publishTime || nowIso,
        status: "ACTIVE",
        google_review_status: "submitted",
        google_review_notes: `Synced automatically from Google Maps (${apiResult.placeName || "The Bloom and Blossom"})`
      };

      if (existingFbIndex >= 0) {
        // Update existing with latest verified text / rating
        store.feedback[existingFbIndex] = {
          ...store.feedback[existingFbIndex],
          ...feedbackEntry
        };
      } else {
        // Insert new review at the beginning of the list
        store.feedback.unshift(feedbackEntry);
        addedCount++;
      }

      // Also record in google_reviews array
      const existingGrIndex = store.google_reviews.findIndex((g: any) => 
        (g.feedback_id === feedbackId) ||
        (g.review_text && normSnippet && g.review_text.toLowerCase().includes(normSnippet))
      );

      const grEntry = {
        google_review_id: `gr_${feedbackId}`,
        feedback_id: feedbackId,
        feedback_request_id: null,
        google_review_reference: `Google Review - ${item.authorName}`,
        rating: item.rating || 5,
        review_text: item.text,
        status: "submitted",
        review_date: item.publishTime || nowIso,
        created_at: nowIso,
        updated_at: nowIso
      };

      if (existingGrIndex >= 0) {
        store.google_reviews[existingGrIndex] = {
          ...store.google_reviews[existingGrIndex],
          ...grEntry
        };
      } else {
        store.google_reviews.unshift(grEntry);
      }

      // Sync with Supabase if available
      try {
        if (supabase && typeof (supabase as any).schema === "function") {
          await (supabase as any)
            .schema('bb_ecommerce_sc')
            .from('customer_feedback')
            .upsert({
              feedback_id: feedbackEntry.feedback_id,
              source: feedbackEntry.source,
              feedback_type: feedbackEntry.feedback_type,
              rating: feedbackEntry.rating,
              comments: feedbackEntry.comments,
              customer_name: feedbackEntry.customer_name,
              submitted_at: feedbackEntry.submitted_at,
              status: feedbackEntry.status,
              google_review_status: feedbackEntry.google_review_status
            }, { onConflict: 'feedback_id' });
        }
      } catch (supaErr) {
        // Non-blocking
      }
    }

    // Save updated local store
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");

    const totalGoogleReviews = store.feedback.filter((f: any) => f.source === "GOOGLE").length;

    // Update metadata
    metadata.lastSuccessfulSync = nowIso;
    metadata.status = 'success';
    metadata.rating = apiResult.rating || metadata.rating;
    metadata.userRatingCount = apiResult.userRatingCount || totalGoogleReviews;
    metadata.placeName = apiResult.placeName || metadata.placeName;
    metadata.placeUrl = apiResult.placeUrl || metadata.placeUrl;
    metadata.reviewsCount = totalGoogleReviews;
    metadata.errorMessage = null;
    metadata.billingRequired = false;
    saveSyncMetadata(metadata);

    console.log(`[GoogleSync] Sync completed successfully. Synced ${apiResult.reviews.length} reviews (${addedCount} new). Overall rating: ${metadata.rating}⭐`);

    return {
      success: true,
      message: `Successfully synced ${apiResult.reviews.length} reviews from Google Maps (${addedCount} newly added).`,
      addedCount,
      totalSyncedCount: totalGoogleReviews,
      rating: metadata.rating,
      userRatingCount: metadata.userRatingCount
    };
  } catch (error: any) {
    const isBillingError = 
      error.isBillingError ||
      error.message?.includes("billing") || 
      error.message?.includes("Billing") || 
      error.message?.includes("REQUEST_DENIED") || 
      error.message?.includes("OVER_QUERY_LIMIT");

    if (isBillingError) {
      metadata.status = 'standby';
      metadata.billingRequired = true;
      metadata.errorMessage = "Google Cloud billing link is required to enable live API polling. All existing customer reviews remain fully active on your store.";
    } else {
      console.warn("[GoogleSync] Google reviews sync notice:", error.message || error);
      metadata.status = 'error';
      metadata.errorMessage = error.message || "Failed to sync Google reviews";
    }

    saveSyncMetadata(metadata);

    return {
      success: false,
      message: isBillingError 
        ? "Google Cloud project requires billing activation to fetch live updates via API. Existing verified reviews are active and unaffected."
        : (error.message || "Failed to sync Google reviews"),
      addedCount: 0,
      totalSyncedCount: 0
    };
  } finally {
    syncInProgress = false;
  }
}

/**
 * Get current Google Reviews Sync Status & Info
 */
export function getGoogleSyncStatus() {
  return getSyncMetadata();
}
