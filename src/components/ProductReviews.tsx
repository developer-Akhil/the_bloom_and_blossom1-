import React, { useState, useEffect, useCallback } from 'react';
import { 
  Star, 
  ThumbsUp, 
  Flag, 
  Image as ImageIcon, 
  Trash2, 
  Edit3, 
  CheckCircle, 
  X, 
  ChevronDown, 
  MessageSquare,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

interface ReviewImage {
  image_url: string;
  thumbnail_url: string;
}

interface Review {
  review_id: string;
  product_id: string;
  rating: number;
  title: string;
  review: string;
  verified_purchase: boolean;
  helpful_count: number;
  report_count: number;
  admin_reply: string | null;
  created_at: string;
  user_id: string;
  user: {
    full_name: string | null;
    email: string;
  } | null;
  images: ReviewImage[];
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  // Auth state
  const token = localStorage.getItem('bloom_token');
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  // Reviews and stats
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [dbErrorMsg, setDbErrorMsg] = useState<string | null>(null);

  // Filters & Pagination
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [imagesFilter, setImagesFilter] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Eligibility
  const [eligible, setEligible] = useState(false);
  const [eligibleOrderId, setEligibleOrderId] = useState<string | null>(null);
  const [eligibleOrderItemId, setEligibleOrderItemId] = useState<string | null>(null);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [eligibilityReason, setEligibilityReason] = useState<string | null>(null);

  // Review submission state
  const [showForm, setShowForm] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formReview, setFormReview] = useState('');
  const [formImages, setFormImages] = useState<string[]>([]); // base64 strings
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Helpful & reporting feedback map
  const [votedReviews, setVotedReviews] = useState<Record<string, boolean>>({});
  const [reportedReviews, setReportedReviews] = useState<Record<string, boolean>>({});

  // Image enlarger modal
  const [activeEnlargedImage, setActiveEnlargedImage] = useState<string | null>(null);

  // Decode local current user
  useEffect(() => {
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setCurrentUser({ id: payload.userId || payload.id, email: payload.email });
      } catch (e) {
        console.error('Failed parsing JWT token', e);
      }
    } else {
      setCurrentUser(null);
    }
  }, [token]);

  // Fetch reviews & stats
  const fetchReviews = useCallback(async () => {
    setLoading(true);
    setDbErrorMsg(null);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        sortBy,
        ...(ratingFilter !== null && { rating: String(ratingFilter) }),
        ...(verifiedFilter && { verifiedOnly: 'true' }),
        ...(imagesFilter && { withImagesOnly: 'true' })
      });

      const res = await fetch(`/api/reviews/product/${productId}?${queryParams.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'MIGRATION_REQUIRED') {
          setDbErrorMsg(data.error);
        } else {
          console.error(data.error);
        }
        return;
      }

      setReviews(data.reviews || []);
      setTotalPages(data.totalPages || 1);
      if (data.stats) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Fetch reviews fail:', err);
    } finally {
      setLoading(false);
    }
  }, [productId, page, sortBy, ratingFilter, verifiedFilter, imagesFilter]);

  // Check eligibility for reviews
  const checkEligibility = useCallback(async () => {
    if (!token) {
      setEligibilityChecked(true);
      return;
    }
    try {
      const res = await fetch('/api/reviews/eligibility', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, productName })
      });
      const data = await res.json();
      if (res.ok) {
        setEligible(data.eligible);
        setEligibleOrderId(data.orderId);
        setEligibleOrderItemId(data.orderItemId);
        setEligibilityReason(data.reason);
      }
    } catch (e) {
      console.error('Eligibility validation error:', e);
    } finally {
      setEligibilityChecked(true);
    }
  }, [token, productId, productName]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  // Handle image files selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (formImages.length + files.length > 5) {
      setFormError('You can upload up to 5 images only.');
      return;
    }

    Array.from(files).forEach(file => {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setFormError('Only JPG, PNG and WEBP files are allowed.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Each image must be smaller than 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setFormImages(prev => [...prev, reader.result as string]);
          setFormError('');
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeSelectedImage = (idx: number) => {
    setFormImages(prev => prev.filter((_, i) => i !== idx));
  };

  // Submit Review Form
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formReview.trim()) {
      setFormError('Review description is required.');
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const isEditing = !!editingReviewId;
      const url = isEditing ? `/api/reviews/${editingReviewId}` : '/api/reviews';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          rating: formRating,
          title: formTitle,
          review: formReview,
          images: formImages
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || 'Failed to submit review.');
      } else {
        // Reset form
        setShowForm(false);
        setEditingReviewId(null);
        setFormTitle('');
        setFormReview('');
        setFormImages([]);
        setFormRating(5);
        
        // Refresh
        await fetchReviews();
        await checkEligibility();
      }
    } catch (err: any) {
      setFormError(err.message || 'An error occurred during submission.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enter Edit mode
  const handleEditClick = (review: Review) => {
    setEditingReviewId(review.review_id);
    setFormRating(review.rating);
    setFormTitle(review.title);
    setFormReview(review.review);
    setFormImages(review.images.map(img => img.image_url)); // Keep existing
    setShowForm(true);
    setFormError('');
    // Scroll to form
    const el = document.getElementById('review-form-container');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Delete Review
  const handleDeleteClick = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        await fetchReviews();
        await checkEligibility();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete review');
      }
    } catch (e) {
      console.error('Delete review failed:', e);
    }
  };

  // Helpful Voting
  const handleHelpfulVote = async (reviewId: string) => {
    if (!token) {
      alert('Please log in to vote.');
      return;
    }
    if (votedReviews[reviewId]) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ voteType: 'helpful' })
      });
      const data = await res.json();
      if (res.ok) {
        setReviews(prev => prev.map(r => r.review_id === reviewId ? { ...r, helpful_count: data.helpfulCount } : r));
        setVotedReviews(prev => ({ ...prev, [reviewId]: true }));
      } else {
        alert(data.error);
      }
    } catch (e) {
      console.error('Vote error:', e);
    }
  };

  // Report Review
  const handleReportReview = async (reviewId: string) => {
    if (!token) {
      alert('Please log in to report reviews.');
      return;
    }
    if (reportedReviews[reviewId]) return;

    const reason = window.prompt('Please enter the reason for reporting this review (e.g., Spam, Offensive language, Fake review):');
    if (!reason) return;

    try {
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      if (res.ok) {
        alert('Thank you. The review has been reported and flagged for admin review.');
        setReportedReviews(prev => ({ ...prev, [reviewId]: true }));
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (e) {
      console.error('Report error:', e);
    }
  };

  // Check if review is editable (submitted within last 7 days)
  const isReviewEditable = (createdAt: string) => {
    const createdTime = new Date(createdAt).getTime();
    const limit = 7 * 24 * 60 * 60 * 1000; // 7 days in ms
    return (Date.now() - createdTime) < limit;
  };

  return (
    <section className="mt-24 border-t border-gray-100 pt-16" id="product-reviews-section">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-100">
          <div>
            <h2 className="font-serif text-3xl font-bold tracking-tight text-gray-900">Customer Reviews</h2>
            <p className="text-sm text-gray-500 mt-1">Real feedback from verified buyers of {productName}</p>
          </div>
          
          {token ? (
            eligible ? (
              <button 
                onClick={() => {
                  setEditingReviewId(null);
                  setShowForm(!showForm);
                  setFormTitle('');
                  setFormReview('');
                  setFormImages([]);
                  setFormRating(5);
                }}
                className="px-6 py-3 bg-bloom-rose text-white text-sm font-semibold rounded-full shadow-md hover:bg-bloom-rose/90 transition-all flex items-center gap-2"
              >
                <Sparkles size={16} />
                <span>{showForm ? 'Cancel Review' : 'Write a Review'}</span>
              </button>
            ) : (
              eligibilityChecked && (
                <div className="text-right text-xs text-gray-400 max-w-xs leading-relaxed italic bg-gray-50 px-4 py-2.5 rounded-2xl border border-gray-100">
                  {eligibilityReason || "Only customers who purchased and received this product can write a review."}
                </div>
              )
            )
          ) : (
            <div className="text-sm text-gray-500">
              Please <a href="/auth" className="text-bloom-rose font-semibold hover:underline">Log In</a> to leave a review.
            </div>
          )}
        </div>

        {/* Database Migration Warning */}
        {dbErrorMsg && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4 text-amber-800">
            <AlertTriangle className="flex-shrink-0" size={24} />
            <div>
              <h4 className="font-bold text-sm">Database Setup Required</h4>
              <p className="text-xs mt-1 leading-relaxed text-amber-700">{dbErrorMsg}</p>
            </div>
          </div>
        )}

        {/* Form Container */}
        <AnimatePresence>
          {showForm && (
            <motion.div 
              id="review-form-container"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white border border-bloom-rose/20 rounded-3xl p-6 md:p-8 shadow-sm space-y-6"
            >
              <h3 className="font-serif text-xl font-semibold">
                {editingReviewId ? 'Edit Your Review' : 'Share Your Experience'}
              </h3>
              
              <form onSubmit={handleSubmitReview} className="space-y-5">
                {/* Rating Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Your Rating *</label>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((stars) => (
                      <button
                        key={stars}
                        type="button"
                        onClick={() => setFormRating(stars)}
                        className="text-gray-300 hover:text-amber-400 transition-colors"
                      >
                        <Star 
                          size={28} 
                          className={cn(
                            "stroke-1.5",
                            stars <= formRating ? "fill-amber-400 stroke-amber-400" : "text-gray-300"
                          )} 
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Review Title (Optional)</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g., Absolutely gorgeous scrunchie!"
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-1 focus:ring-bloom-rose focus:border-bloom-rose text-sm"
                  />
                </div>

                {/* Review Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Your Review *</label>
                  <textarea
                    rows={4}
                    value={formReview}
                    onChange={(e) => setFormReview(e.target.value)}
                    placeholder="Describe your experience, quality of material, color, and packaging..."
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-2xl focus:ring-1 focus:ring-bloom-rose focus:border-bloom-rose text-sm"
                  />
                </div>

                {/* Image Attachments */}
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-2">
                    <ImageIcon size={14} />
                    <span>Attach Images (Max 5, JPG/PNG/WEBP, up to 5MB each)</span>
                  </label>
                  
                  <div className="flex flex-wrap gap-4 items-center">
                    {/* Add Button */}
                    {formImages.length < 5 && (
                      <label className="w-20 h-20 border border-dashed border-gray-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 hover:border-bloom-rose/40 transition-colors">
                        <ImageIcon className="text-gray-400 mb-1" size={18} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Add</span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    )}

                    {/* Previews */}
                    {formImages.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-20 rounded-2xl overflow-hidden border">
                        <img 
                          src={img} 
                          alt={`Attachment preview ${idx}`} 
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeSelectedImage(idx)}
                          className="absolute top-1 right-1 bg-black/60 hover:bg-black/85 text-white p-1 rounded-full transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {formError && (
                  <p className="text-xs text-red-500 font-semibold">{formError}</p>
                )}

                {/* Submit buttons */}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingReviewId(null);
                    }}
                    className="px-5 py-2.5 border border-gray-200 rounded-full text-sm font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-bloom-rose text-white text-sm font-semibold rounded-full shadow-md hover:bg-bloom-rose/90 transition-colors disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : editingReviewId ? 'Save Changes' : 'Submit Review'}
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Aggregate Stats Section */}
        {!dbErrorMsg && stats.totalReviews > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center bg-gray-50/50 rounded-3xl p-6 md:p-8 border border-gray-100">
            {/* Score Summary */}
            <div className="md:col-span-4 flex flex-col items-center justify-center text-center space-y-2 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0">
              <h3 className="font-serif text-5xl font-bold tracking-tight text-gray-900">{stats.averageRating}</h3>
              <div className="flex gap-0.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star 
                    key={star} 
                    size={20} 
                    className={cn(
                      "stroke-1.5",
                      star <= Math.round(stats.averageRating) ? "fill-amber-400 stroke-amber-400" : "text-gray-200"
                    )} 
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 font-medium">Based on {stats.totalReviews} customer reviews</p>
            </div>

            {/* Distribution Graph */}
            <div className="md:col-span-8 space-y-2.5">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = stats.distribution[stars as 5|4|3|2|1] || 0;
                const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                return (
                  <div key={stars} className="flex items-center text-xs font-medium text-gray-600 gap-4">
                    <span className="w-10 text-right shrink-0">{stars} ★</span>
                    <div className="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-bloom-rose/80 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-10 text-left shrink-0 text-gray-400">
                      {count} ({Math.round(percentage)}%)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters and Sorters */}
        {!dbErrorMsg && stats.totalReviews > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-b border-gray-100">
            {/* Active Star Rating filters */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-2">Filter:</span>
              <button
                onClick={() => { setRatingFilter(null); setPage(1); }}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all",
                  ratingFilter === null 
                    ? "bg-bloom-rose/10 border-bloom-rose text-bloom-rose shadow-sm" 
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                All Ratings
              </button>
              {[5, 4, 3, 2, 1].map(stars => (
                <button
                  key={stars}
                  onClick={() => { setRatingFilter(stars); setPage(1); }}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1",
                    ratingFilter === stars 
                      ? "bg-bloom-rose/10 border-bloom-rose text-bloom-rose shadow-sm" 
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  )}
                >
                  <span>{stars}</span>
                  <Star size={10} className="fill-current text-current" />
                </button>
              ))}
            </div>

            {/* Sorter and checklist */}
            <div className="flex items-center gap-4 text-xs font-medium text-gray-600 shrink-0">
              <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={verifiedFilter}
                  onChange={(e) => { setVerifiedFilter(e.target.checked); setPage(1); }}
                  className="rounded border-gray-300 text-bloom-rose focus:ring-bloom-rose text-xs h-3.5 w-3.5"
                />
                <span>Verified Buyer Only</span>
              </label>

              <label className="flex items-center gap-1.5 cursor-pointer hover:text-gray-800 transition-colors">
                <input
                  type="checkbox"
                  checked={imagesFilter}
                  onChange={(e) => { setImagesFilter(e.target.checked); setPage(1); }}
                  className="rounded border-gray-300 text-bloom-rose focus:ring-bloom-rose text-xs h-3.5 w-3.5"
                />
                <span>With Photos</span>
              </label>

              <div className="flex items-center gap-1">
                <span className="text-gray-400">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="border-0 bg-transparent py-0 pl-1 pr-6 focus:ring-0 text-xs font-bold text-gray-700 cursor-pointer"
                >
                  <option value="recent">Most Recent</option>
                  <option value="helpful">Most Helpful</option>
                  <option value="highest">Highest Rated</option>
                  <option value="lowest">Lowest Rated</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Reviews List */}
        {!dbErrorMsg && (
          loading ? (
            <div className="py-20 text-center text-gray-400 space-y-2">
              <div className="animate-spin h-6 w-6 border-2 border-bloom-rose border-t-transparent rounded-full mx-auto" />
              <p className="text-xs">Loading product reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="py-20 text-center text-gray-400 bg-gray-50/50 rounded-3xl border border-gray-50">
              <MessageSquare size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-semibold">No reviews matching the selection</p>
              <p className="text-xs mt-1 text-gray-400 max-w-xs mx-auto">
                {ratingFilter !== null || verifiedFilter || imagesFilter 
                  ? "Try relaxing your filter criteria to see reviews." 
                  : "Be the first to leave a review of this product after ordering!"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reviews.map((review) => {
                const authorName = review.user?.full_name || 'Anonymous Buyer';
                const isMyReview = currentUser && review.user_id === currentUser.id;
                const editable = isMyReview && isReviewEditable(review.created_at);

                return (
                  <div key={review.review_id} className="py-8 space-y-4">
                    {/* Author & Stars Line */}
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-gray-900">{authorName}</span>
                          {review.verified_purchase && (
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-[10px] font-bold tracking-wide uppercase flex items-center gap-1 border border-green-100 shrink-0">
                              <CheckCircle size={10} className="fill-green-700 text-white" />
                              <span>Verified Purchase</span>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <div className="flex text-amber-400 gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star 
                                key={s} 
                                size={12} 
                                className={cn(
                                  "stroke-1.5",
                                  s <= review.rating ? "fill-amber-400 stroke-amber-400" : "text-gray-200"
                                )} 
                              />
                            ))}
                          </div>
                          <span>•</span>
                          <span>{new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                        </div>
                      </div>

                      {/* Edit or delete triggers */}
                      {editable && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditClick(review)}
                            className="p-1.5 text-gray-400 hover:text-bloom-rose hover:bg-gray-50 rounded-lg transition-colors"
                            title="Edit Review (Available for 7 days)"
                          >
                            <Edit3 size={15} />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(review.review_id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition-colors"
                            title="Delete Review"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Review Body */}
                    <div className="space-y-1.5">
                      {review.title && (
                        <h4 className="font-bold text-sm text-gray-900">{review.title}</h4>
                      )}
                      <p className="text-sm text-gray-600 leading-relaxed white-space-pre-wrap">{review.review}</p>
                    </div>

                    {/* Review Images */}
                    {review.images && review.images.length > 0 && (
                      <div className="flex flex-wrap gap-2.5">
                        {review.images.map((img, i) => (
                          <button
                            key={i}
                            onClick={() => setActiveEnlargedImage(img.image_url)}
                            className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 hover:opacity-90 active:scale-95 transition-all"
                          >
                            <img 
                              src={img.image_url} 
                              alt="Review attachment" 
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Admin Reply */}
                    {review.admin_reply && (
                      <div className="bg-bloom-pink/30 border border-bloom-rose/10 rounded-2xl p-4 ml-4 flex gap-3 text-sm">
                        <div className="bg-bloom-rose/10 text-bloom-rose h-8 w-8 rounded-full flex items-center justify-center font-serif font-bold italic flex-shrink-0">
                          B
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-800 text-xs uppercase tracking-wider">Bloom & Blossom Store Response</span>
                          </div>
                          <p className="text-gray-600 leading-relaxed text-xs italic">"{review.admin_reply}"</p>
                        </div>
                      </div>
                    )}

                    {/* Helpful & Report actions */}
                    <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 pt-1">
                      <button 
                        onClick={() => handleHelpfulVote(review.review_id)}
                        disabled={votedReviews[review.review_id]}
                        className={cn(
                          "flex items-center gap-1.5 hover:text-bloom-rose transition-colors py-1 px-2 hover:bg-gray-50 rounded-lg",
                          votedReviews[review.review_id] && "text-bloom-rose pointer-events-none"
                        )}
                      >
                        <ThumbsUp size={13} />
                        <span>Helpful ({review.helpful_count || 0})</span>
                      </button>

                      <button 
                        onClick={() => handleReportReview(review.review_id)}
                        disabled={reportedReviews[review.review_id]}
                        className={cn(
                          "flex items-center gap-1 hover:text-amber-600 transition-colors py-1 px-2 hover:bg-gray-50 rounded-lg",
                          reportedReviews[review.review_id] && "text-amber-600 pointer-events-none"
                        )}
                      >
                        <Flag size={13} />
                        <span>{reportedReviews[review.review_id] ? 'Reported' : 'Report'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-8">
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className="px-4 py-2 border rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span className="text-xs text-gray-500 font-semibold px-2">Page {page} of {totalPages}</span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className="px-4 py-2 border rounded-full text-xs font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )
        )}

      </div>

      {/* Image Zoom Modal */}
      <AnimatePresence>
        {activeEnlargedImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveEnlargedImage(null)}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          >
            <button 
              onClick={() => setActiveEnlargedImage(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2"
            >
              <X size={24} />
            </button>
            <motion.img 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              src={activeEnlargedImage} 
              alt="Enlarged review photo" 
              className="max-h-[85vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>

    </section>
  );
}
