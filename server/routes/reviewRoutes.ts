import express from "express";
import fs from "fs";
import path from "path";
import { supabase } from "../services/supabaseService.js";
import { authMiddleware, AuthenticatedRequest } from "../middlewares/authMiddleware.js";
import { 
  sendReviewApprovedEmail, 
  sendReviewRejectedEmail, 
  sendAdminReplyEmail 
} from "../services/emailService.js";

const router = express.Router();

// ---------------------------------------------------------
// Global Config Settings for Review System
// ---------------------------------------------------------
const REVIEW_CONFIG = {
  maxImagesPerReview: 5,
  maxImageSizeMB: 5,
  allowedFileTypes: ['image/jpeg', 'image/png', 'image/webp'],
  editWindowDays: 7,
  autoApprove: false, // Moderation turned on by default
  paginationSize: 20
};

// Database schema helper to handle friendly error messages
const handleDbError = (error: any, res: express.Response) => {
  if (error) {
    console.error("Database Error:", error);
    if (error.message?.includes("relation") && error.message?.includes("does not exist")) {
      return res.status(503).json({ 
        error: "Database schema is not fully migrated. Please run the SQL queries inside `supabase_schema.sql` inside your Supabase SQL Editor to enable review tables.",
        code: "MIGRATION_REQUIRED"
      });
    }
    return res.status(500).json({ error: error.message || "Internal server error" });
  }
};

// ---------------------------------------------------------
// File Path Save Helper (Decodes base64 and saves to filesystem)
// ---------------------------------------------------------
const saveBase64Image = (base64Str: string, reviewId: string, idx: number): { imageUrl: string; thumbnailUrl: string } => {
  const matches = base64Str.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid image format. Ensure base64 string begins with data:image/");
  }

  const fileType = matches[1];
  const ext = fileType === "jpeg" ? "jpg" : fileType;
  
  if (!REVIEW_CONFIG.allowedFileTypes.includes(`image/${fileType === "jpg" ? "jpeg" : fileType}`)) {
    throw new Error(`Unsupported image type: image/${fileType}. Allowed formats: JPG, PNG, WEBP.`);
  }

  const dataBuffer = Buffer.from(matches[2], "base64");
  
  // Calculate size
  const sizeMB = dataBuffer.length / (1024 * 1024);
  if (sizeMB > REVIEW_CONFIG.maxImageSizeMB) {
    throw new Error(`File size exceeds maximum limit of ${REVIEW_CONFIG.maxImageSizeMB}MB.`);
  }

  // Create public uploads directory if it does not exist
  const uploadDir = path.join(process.cwd(), "public", "uploads", "reviews");
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const fileName = `${reviewId}_${idx}_${Date.now()}.${ext}`;
  const filePath = path.join(uploadDir, fileName);

  fs.writeFileSync(filePath, dataBuffer);

  // Return local paths accessible via web server
  return {
    imageUrl: `/uploads/reviews/${fileName}`,
    thumbnailUrl: `/uploads/reviews/${fileName}` // simple reference
  };
};

// ---------------------------------------------------------
// CUSTOMER APIS
// ---------------------------------------------------------

// Check Review Eligibility
router.post("/eligibility", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { productId, productName } = req.body;
  const user = req.user;

  if (!productId && !productName) {
    return res.status(400).json({ error: "Product ID or Name is required" });
  }

  try {
    // 1. Fetch user email
    const { data: appUser, error: userErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('app_users')
      .select('email')
      .eq('id', user?.userId)
      .single();

    if (userErr || !appUser) {
      return res.status(404).json({ error: "User profile not found" });
    }

    // 2. Fetch all orders matching user_id OR guest_email that are DELIVERED and PAID
    const { data: orders, error: ordersErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('orders')
      .select('id, guest_email, user_id, order_status, payment_status')
      .or(`user_id.eq.${user?.userId},guest_email.eq.${appUser.email}`)
      .eq('order_status', 'delivered')
      .eq('payment_status', 'paid');

    if (ordersErr) return handleDbError(ordersErr, res);
    if (!orders || orders.length === 0) {
      return res.json({ eligible: false, reason: "You can only review products from orders that have been successfully delivered and paid." });
    }

    const orderIds = orders.map(o => o.id);

    // 3. Find matching order items
    const { data: orderItems, error: itemsErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('order_items')
      .select('id, order_id, product_id, product_name')
      .in('order_id', orderIds);

    if (itemsErr) return handleDbError(itemsErr, res);

    // Filter items matching this product
    const matchingItems = orderItems.filter(item => {
      const matchId = productId && item.product_id === productId;
      const matchName = productName && item.product_name?.toLowerCase().trim() === productName.toLowerCase().trim();
      return matchId || matchName;
    });

    if (matchingItems.length === 0) {
      return res.json({ eligible: false, reason: "No matching delivered purchase found for this product." });
    }

    // 4. Check if a review already exists for these order item IDs
    const matchingOrderItemIds = matchingItems.map(i => i.id);
    const { data: existingReviews, error: reviewsErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('order_item_id')
      .in('order_item_id', matchingOrderItemIds)
      .eq('user_id', user?.userId);

    if (reviewsErr) return handleDbError(reviewsErr, res);

    const alreadyReviewedIds = new Set(existingReviews?.map(r => r.order_item_id) || []);
    const unreviewedItem = matchingItems.find(item => !alreadyReviewedIds.has(item.id));

    if (!unreviewedItem) {
      return res.json({ eligible: false, reason: "You have already reviewed all items for this product in your orders." });
    }

    return res.json({ 
      eligible: true, 
      orderId: unreviewedItem.order_id, 
      orderItemId: unreviewedItem.id 
    });

  } catch (error: any) {
    console.error("Eligibility Check Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Submit a Review
router.post("/", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { productId, rating, title, review, productVariantId, images = [] } = req.body;
  const user = req.user;

  if (!productId || !rating || !review) {
    return res.status(400).json({ error: "Product ID, Rating, and Review content are required." });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({ error: "Rating must be between 1 and 5." });
  }

  try {
    // 1. Double check eligibility internally
    const { data: appUser } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('app_users')
      .select('email, full_name')
      .eq('id', user?.userId)
      .single();

    const { data: orders } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('orders')
      .select('id')
      .or(`user_id.eq.${user?.userId},guest_email.eq.${appUser?.email}`)
      .eq('order_status', 'delivered')
      .eq('payment_status', 'paid');

    if (!orders || orders.length === 0) {
      return res.status(403).json({ error: "Only verified buyers can leave reviews." });
    }

    const orderIds = orders.map(o => o.id);
    const { data: orderItems } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('order_items')
      .select('id, order_id, product_name')
      .in('order_id', orderIds);

    // Fetch product details to match by name
    const matchingItems = orderItems?.filter(item => {
      // Find matches
      return item.product_name?.toLowerCase().trim() === productId.toLowerCase().trim() || item.product_id === productId;
    }) || [];

    if (matchingItems.length === 0) {
      return res.status(403).json({ error: "No purchase history found for this product." });
    }

    // Deduplicate checking
    const matchingOrderItemIds = matchingItems.map(i => i.id);
    const { data: existingReviews } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('order_item_id')
      .in('order_item_id', matchingOrderItemIds)
      .eq('user_id', user?.userId);

    const alreadyReviewedIds = new Set(existingReviews?.map(r => r.order_item_id) || []);
    const unreviewedItem = matchingItems.find(item => !alreadyReviewedIds.has(item.id));

    if (!unreviewedItem) {
      return res.status(400).json({ error: "You have already submitted a review for this purchase." });
    }

    // 2. Insert main review row
    const reviewPayload = {
      product_id: productId,
      product_variant_id: productVariantId || null,
      order_id: unreviewedItem.order_id,
      order_item_id: unreviewedItem.id,
      user_id: user?.userId,
      rating,
      title: title || "",
      review,
      verified_purchase: true,
      status: REVIEW_CONFIG.autoApprove ? "approved" : "pending",
      helpful_count: 0,
      report_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: insertedReview, error: reviewErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .insert(reviewPayload)
      .select()
      .single();

    if (reviewErr) return handleDbError(reviewErr, res);

    // 3. Process review image uploads (base64 payload)
    const savedImages: any[] = [];
    if (images && Array.isArray(images) && images.length > 0) {
      const imagesToProcess = images.slice(0, REVIEW_CONFIG.maxImagesPerReview);
      
      for (let i = 0; i < imagesToProcess.length; i++) {
        try {
          const paths = saveBase64Image(imagesToProcess[i], insertedReview.review_id, i);
          
          const { data: imgRecord, error: imgErr } = await (supabase as any)
            .schema('bb_ecommerce_sc')
            .from('review_images')
            .insert({
              review_id: insertedReview.review_id,
              image_url: paths.imageUrl,
              thumbnail_url: paths.thumbnailUrl
            })
            .select()
            .single();

          if (!imgErr && imgRecord) {
            savedImages.push(imgRecord);
          }
        } catch (imgFail: any) {
          console.warn(`Failed uploading review image ${i}:`, imgFail.message);
        }
      }
    }

    return res.status(201).json({ 
      success: true, 
      message: REVIEW_CONFIG.autoApprove 
        ? "Review submitted successfully!" 
        : "Review submitted successfully and is pending moderation.",
      review: {
        ...insertedReview,
        images: savedImages
      }
    });

  } catch (error: any) {
    console.error("Post Review Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Edit Review (Authors only, within 7 days limit)
router.put("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { rating, title, review, images = [] } = req.body;
  const user = req.user;

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ error: "Rating must be between 1 and 5." });
  }

  try {
    // 1. Fetch original review
    const { data: original, error: origErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('*')
      .eq('review_id', id)
      .single();

    if (origErr || !original) {
      return res.status(404).json({ error: "Review not found" });
    }

    // Authenticate author
    if (original.user_id !== user?.userId) {
      return res.status(403).json({ error: "Unauthorized to edit this review" });
    }

    // Check time-window expiration
    const createdTime = new Date(original.created_at).getTime();
    const expiryTime = createdTime + (REVIEW_CONFIG.editWindowDays * 24 * 60 * 60 * 1000);
    if (Date.now() > expiryTime) {
      return res.status(400).json({ 
        error: `Review editing is only allowed within ${REVIEW_CONFIG.editWindowDays} days of submission.` 
      });
    }

    // 2. Perform updates
    const updates = {
      rating: rating !== undefined ? rating : original.rating,
      title: title !== undefined ? title : original.title,
      review: review !== undefined ? review : original.review,
      status: REVIEW_CONFIG.autoApprove ? original.status : "pending", // Re-moderate on edits
      updated_at: new Date().toISOString()
    };

    const { data: updatedReview, error: updateErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .update(updates)
      .eq('review_id', id)
      .select()
      .single();

    if (updateErr) return handleDbError(updateErr, res);

    // 3. Update images if new images array is passed
    if (images && Array.isArray(images) && images.length > 0) {
      // Delete existing disk files
      const { data: oldImages } = await (supabase as any)
        .schema('bb_ecommerce_sc')
        .from('review_images')
        .select('*')
        .eq('review_id', id);

      if (oldImages) {
        for (const img of oldImages) {
          const filePath = path.join(process.cwd(), "public", img.image_url);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch (e) {}
          }
        }
        await (supabase as any)
          .schema('bb_ecommerce_sc')
          .from('review_images')
          .delete()
          .eq('review_id', id);
      }

      // Add new base64 uploads
      const imagesToProcess = images.slice(0, REVIEW_CONFIG.maxImagesPerReview);
      for (let i = 0; i < imagesToProcess.length; i++) {
        try {
          if (imagesToProcess[i].startsWith('/uploads/')) {
            // Keep existing image URL reference
            await (supabase as any)
              .schema('bb_ecommerce_sc')
              .from('review_images')
              .insert({
                review_id: id,
                image_url: imagesToProcess[i],
                thumbnail_url: imagesToProcess[i]
              });
          } else {
            const paths = saveBase64Image(imagesToProcess[i], id, i);
            await (supabase as any)
              .schema('bb_ecommerce_sc')
              .from('review_images')
              .insert({
                review_id: id,
                image_url: paths.imageUrl,
                thumbnail_url: paths.thumbnailUrl
              });
          }
        } catch (imgFail: any) {
          console.warn("Failed saving edited image:", imgFail.message);
        }
      }
    }

    res.json({ 
      success: true, 
      message: "Review updated successfully!", 
      review: updatedReview 
    });

  } catch (error: any) {
    console.error("Edit Review Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Review (Author only, within 7 days limit)
router.delete("/:id", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const user = req.user;

  try {
    const { data: review, error: getErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('*')
      .eq('review_id', id)
      .single();

    if (getErr || !review) {
      return res.status(404).json({ error: "Review not found" });
    }

    if (review.user_id !== user?.userId) {
      return res.status(403).json({ error: "Unauthorized to delete this review." });
    }

    // Check time-window
    const createdTime = new Date(review.created_at).getTime();
    const expiryTime = createdTime + (REVIEW_CONFIG.editWindowDays * 24 * 60 * 60 * 1000);
    if (Date.now() > expiryTime) {
      return res.status(400).json({ 
        error: `Review deletion is only allowed within ${REVIEW_CONFIG.editWindowDays} days of submission.` 
      });
    }

    // Remove file images
    const { data: images } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('review_images')
      .select('image_url')
      .eq('review_id', id);

    if (images) {
      for (const img of images) {
        const filePath = path.join(process.cwd(), "public", img.image_url);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }
    }

    // Cascade delete handles relational records
    const { error: delErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .delete()
      .eq('review_id', id);

    if (delErr) return handleDbError(delErr, res);

    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error: any) {
    console.error("Delete Review Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Product Reviews (Public endpoint - Paginated, filtered, sorted)
router.get("/product/:productId", async (req, res) => {
  const { productId } = req.params;
  const { 
    page = '1', 
    limit = String(REVIEW_CONFIG.paginationSize), 
    rating, 
    withImagesOnly, 
    verifiedOnly, 
    sortBy = 'recent' 
  } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const startOffset = (pageNum - 1) * limitNum;

  try {
    // 1. Build reviews base query
    let query = (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('*, user:app_users(full_name, email), images:review_images(image_url, thumbnail_url)', { count: 'exact' })
      .eq('product_id', productId)
      .eq('status', 'approved');

    // 2. Filters
    if (rating) {
      query = query.eq('rating', parseInt(rating as string, 10));
    }
    if (verifiedOnly === 'true') {
      query = query.eq('verified_purchase', true);
    }

    // Sort order
    if (sortBy === 'recent') {
      query = query.order('created_at', { ascending: false });
    } else if (sortBy === 'highest') {
      query = query.order('rating', { ascending: false });
    } else if (sortBy === 'lowest') {
      query = query.order('rating', { ascending: true });
    } else if (sortBy === 'helpful') {
      query = query.order('helpful_count', { ascending: false });
    }

    const { data: reviews, count, error } = await query.range(startOffset, startOffset + limitNum - 1);
    if (error) return handleDbError(error, res);

    let filteredReviews = reviews || [];

    // Filter by images on memory if queried (Supabase has issues filtering nested rows on empty arrays natively)
    if (withImagesOnly === 'true') {
      filteredReviews = filteredReviews.filter((r: any) => r.images && r.images.length > 0);
    }

    // 3. Aggregate stats (averages, distributions) for product ratings
    const { data: allApproved, error: statsErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('status', 'approved');

    if (statsErr) return handleDbError(statsErr, res);

    const ratingsCount = allApproved?.length || 0;
    const ratingSum = allApproved?.reduce((acc: number, r: any) => acc + r.rating, 0) || 0;
    const averageRating = ratingsCount > 0 ? parseFloat((ratingSum / ratingsCount).toFixed(1)) : 0;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    allApproved?.forEach((r: any) => {
      const rate = r.rating as 5 | 4 | 3 | 2 | 1;
      if (distribution[rate] !== undefined) {
        distribution[rate]++;
      }
    });

    res.json({
      reviews: filteredReviews,
      totalCount: count || 0,
      page: pageNum,
      totalPages: Math.ceil((count || 0) / limitNum),
      stats: {
        averageRating,
        totalReviews: ratingsCount,
        distribution
      }
    });

  } catch (error: any) {
    console.error("Fetch Product Reviews Error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vote Review Helpful/Not Helpful
router.post("/:id/helpful", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { voteType = "helpful" } = req.body; // helpful or unhelpful
  const user = req.user;

  try {
    // 1. Log helpful vote (unique on review_id + user_id)
    const { error: voteErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('review_helpful')
      .insert({
        review_id: id,
        user_id: user?.userId,
        vote_type: voteType
      });

    if (voteErr) {
      if (voteErr.code === "23505") { // Unique constraint violation
        return res.status(400).json({ error: "You have already voted on this review." });
      }
      return handleDbError(voteErr, res);
    }

    // 2. Increment review count
    const { data: original } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('helpful_count')
      .eq('review_id', id)
      .single();

    const change = voteType === "helpful" ? 1 : -1;
    const newCount = Math.max(0, (original?.helpful_count || 0) + change);

    await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .update({ helpful_count: newCount })
      .eq('review_id', id);

    res.json({ success: true, helpfulCount: newCount });
  } catch (error: any) {
    console.error("Helpful vote error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Report Review
router.post("/:id/report", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const { id } = req.params;
  const { reason, comments } = req.body;
  const user = req.user;

  if (!reason) {
    return res.status(400).json({ error: "Reporting reason is required." });
  }

  try {
    // 1. Add report log
    const { error: repErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('review_reports')
      .insert({
        review_id: id,
        user_id: user?.userId,
        reason,
        comments: comments || "",
        created_at: new Date().toISOString()
      });

    if (repErr) return handleDbError(repErr, res);

    // 2. Increment report_count
    const { data: original } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('report_count')
      .eq('review_id', id)
      .single();

    const newReportCount = (original?.report_count || 0) + 1;

    await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .update({ report_count: newReportCount })
      .eq('review_id', id);

    res.json({ success: true, message: "Review reported successfully and flagged for administrator moderation." });
  } catch (error: any) {
    console.error("Report review error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get Me (My Personal Reviews)
router.get("/me", authMiddleware, async (req: AuthenticatedRequest, res) => {
  const user = req.user;
  try {
    const { data, error } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('*, images:review_images(image_url, thumbnail_url)')
      .eq('user_id', user?.userId)
      .order('created_at', { ascending: false });

    if (error) return handleDbError(error, res);
    res.json({ reviews: data });
  } catch (error: any) {
    console.error("Fetch personal reviews error:", error);
    res.status(500).json({ error: error.message });
  }
});

// ---------------------------------------------------------
// ADMIN APIS
// ---------------------------------------------------------

// Fetch All Reviews
router.get("/admin/list", async (req, res) => {
  const { status, rating, search, page = '1', limit = '50' } = req.query;

  const pageNum = parseInt(page as string, 10);
  const limitNum = parseInt(limit as string, 10);
  const startOffset = (pageNum - 1) * limitNum;

  try {
    let query = (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('*, user:app_users(full_name, email), images:review_images(image_url, thumbnail_url)', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (rating) {
      query = query.eq('rating', parseInt(rating as string, 10));
    }

    // Search is handled in memory/post-filtering or text match if there's text
    if (search) {
      query = query.or(`title.ilike.%${search}%,review.ilike.%${search}%`);
    }

    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(startOffset, startOffset + limitNum - 1);

    if (error) return handleDbError(error, res);

    res.json({
      reviews: data || [],
      total: count || 0,
      page: pageNum,
      totalPages: Math.ceil((count || 0) / limitNum)
    });
  } catch (error: any) {
    console.error("Admin fetch reviews error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Approve Review
router.put("/admin/:id/approve", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: updated, error: updateErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('review_id', id)
      .select('*, user:app_users(full_name, email)')
      .single();

    if (updateErr) return handleDbError(updateErr, res);

    // Send Approved Email Notification
    if (updated.user?.email) {
      await sendReviewApprovedEmail(
        updated.user.email,
        updated.user.full_name || "Customer",
        updated.product_id
      );
    }

    res.json({ success: true, message: "Review approved successfully!", review: updated });
  } catch (error: any) {
    console.error("Admin approve error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Reject Review
router.put("/admin/:id/reject", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: updated, error: updateErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('review_id', id)
      .select('*, user:app_users(full_name, email)')
      .single();

    if (updateErr) return handleDbError(updateErr, res);

    // Send Rejected Email Notification
    if (updated.user?.email) {
      await sendReviewRejectedEmail(
        updated.user.email,
        updated.user.full_name || "Customer",
        updated.product_id
      );
    }

    res.json({ success: true, message: "Review rejected successfully!", review: updated });
  } catch (error: any) {
    console.error("Admin reject error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete Review (Admin)
router.delete("/admin/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Delete files
    const { data: images } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('review_images')
      .select('image_url')
      .eq('review_id', id);

    if (images) {
      for (const img of images) {
        const filePath = path.join(process.cwd(), "public", img.image_url);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }
    }

    const { error: delErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .delete()
      .eq('review_id', id);

    if (delErr) return handleDbError(delErr, res);

    res.json({ success: true, message: "Review permanently deleted by administrator." });
  } catch (error: any) {
    console.error("Admin delete error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Reply
router.post("/admin/:id/reply", async (req, res) => {
  const { id } = req.params;
  const { reply } = req.body;

  if (!reply) {
    return res.status(400).json({ error: "Reply content cannot be empty." });
  }

  try {
    const { data: updated, error: updateErr } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .update({ admin_reply: reply, updated_at: new Date().toISOString() })
      .eq('review_id', id)
      .select('*, user:app_users(full_name, email)')
      .single();

    if (updateErr) return handleDbError(updateErr, res);

    // Send Reply Email Notification
    if (updated.user?.email) {
      await sendAdminReplyEmail(
        updated.user.email,
        updated.user.full_name || "Customer",
        updated.product_id,
        reply
      );
    }

    res.json({ success: true, message: "Reply added successfully!", review: updated });
  } catch (error: any) {
    console.error("Admin reply error:", error);
    res.status(500).json({ error: error.message });
  }
});

// View Reported Reviews
router.get("/admin/reported", async (req, res) => {
  try {
    const { data, error } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('review_reports')
      .select('*, review:product_reviews(*, user:app_users(full_name, email)), user:app_users(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) return handleDbError(error, res);

    res.json({ reported: data || [] });
  } catch (error: any) {
    console.error("Admin fetch reported error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Export reviews to CSV/Excel API
router.get("/admin/export", async (req, res) => {
  try {
    const { data, error } = await (supabase as any)
      .schema('bb_ecommerce_sc')
      .from('product_reviews')
      .select('*, user:app_users(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) return handleDbError(error, res);

    // Generate CSV raw text
    let csvContent = "Review ID,Product ID,Rating,Title,Review,Verified Purchase,Status,Helpful Count,Report Count,User Email,User Name,Created At\n";
    
    data?.forEach((r: any) => {
      const row = [
        r.review_id,
        r.product_id,
        r.rating,
        `"${(r.title || '').replace(/"/g, '""')}"`,
        `"${(r.review || '').replace(/"/g, '""')}"`,
        r.verified_purchase,
        r.status,
        r.helpful_count,
        r.report_count,
        r.user?.email || "",
        r.user?.full_name || "",
        r.created_at
      ];
      csvContent += row.join(",") + "\n";
    });

    res.header("Content-Type", "text/csv");
    res.attachment("product_reviews_export.csv");
    return res.send(csvContent);

  } catch (error: any) {
    console.error("Admin export error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
