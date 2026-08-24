import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { 
  Star, 
  Sparkles, 
  CheckCircle2, 
  Heart, 
  ExternalLink, 
  ArrowRight, 
  ShoppingBag, 
  MessageSquare,
  ShieldCheck,
  Send,
  RefreshCw,
  Gift
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FeedbackRequest } from '../types';

export function CustomerFeedback() {
  const [searchParams] = useSearchParams();
  const params = useParams();
  const urlToken = params.token || searchParams.get('token') || searchParams.get('t') || '';
  const urlOrderId = searchParams.get('order') || searchParams.get('order_id') || searchParams.get('ref') || '';
  const urlSource = searchParams.get('source') || searchParams.get('s') || '';

  // Form states
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comments, setComments] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [productName, setProductName] = useState('');
  const [orderId, setOrderId] = useState(urlOrderId);

  // Metadata & Request lookup
  const [loadingToken, setLoadingToken] = useState(false);
  const [linkedRequest, setLinkedRequest] = useState<FeedbackRequest | null>(null);

  // Submission & Post-submit flow states
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedFeedbackId, setSubmittedFeedbackId] = useState<string | null>(null);
  const [googleReviewMarked, setGoogleReviewMarked] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  // Google Review URL
  const GOOGLE_REVIEW_URL = "https://g.page/r/bloom-and-blossom-reviews/review";

  // Fetch token details if token is in URL
  useEffect(() => {
    if (!urlToken) return;

    const fetchTokenInfo = async () => {
      setLoadingToken(true);
      try {
        const res = await fetch(`/api/feedback/requests/${encodeURIComponent(urlToken)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.request) {
            setLinkedRequest(data.request);
            if (data.request.customer_name) setCustomerName(data.request.customer_name);
            if (data.request.mobile_number) setMobileNumber(data.request.mobile_number);
            if (data.request.email_address) setEmailAddress(data.request.email_address);
            if (data.request.product_name) setProductName(data.request.product_name);
            if (data.request.order_id) setOrderId(data.request.order_id);
          }
        }
      } catch (err) {
        console.warn('Could not load prefilled token request details:', err);
      } finally {
        setLoadingToken(false);
      }
    };

    fetchTokenInfo();
  }, [urlToken]);

  // Handle Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (rating === 0) {
      setErrorMessage('Please choose a star rating for your experience (1 to 5 stars).');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        token: urlToken || null,
        feedback_request_id: linkedRequest?.feedback_request_id || null,
        order_id: orderId.trim() || null,
        rating,
        comments: comments.trim(),
        customer_name: customerName.trim() || null,
        mobile_number: mobileNumber.trim() || null,
        email_address: emailAddress.trim() || null,
        product_name: productName.trim() || null,
        source: urlSource || linkedRequest?.source || (orderId ? 'WEBSITE' : 'OTHER'),
        feedback_type: linkedRequest?.feedback_type || (orderId ? 'DIRECT' : 'INDIRECT')
      };

      const res = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit feedback. Please try again.');
      }

      setSubmittedFeedbackId(data.feedback?.feedback_id || null);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setErrorMessage(err.message || 'Something went wrong while submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Google Review status confirmation
  const handleGoogleReviewClick = async () => {
    if (!submittedFeedbackId) return;
    setGoogleSubmitting(true);
    try {
      await fetch('/api/feedback/google-review-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feedback_id: submittedFeedbackId,
          status: 'submitted',
          notes: 'Customer clicked review confirmation'
        })
      });
      setGoogleReviewMarked(true);
    } catch (e) {
      console.error('Error updating Google Review status:', e);
    } finally {
      setGoogleSubmitting(false);
    }
  };

  const getRatingLabel = (val: number) => {
    switch (val) {
      case 5: return '⭐⭐⭐⭐⭐ Exceptional & Blooming! 🌸';
      case 4: return '⭐⭐⭐⭐ Very Good experience!';
      case 3: return '⭐⭐⭐ Good, with room to improve';
      case 2: return '⭐⭐ Needs improvement';
      case 1: return '⭐ Unsatisfactory';
      default: return 'Select your rating';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF5F7] via-[#FFF9FA] to-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        
        {/* Brand Banner Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-white/80 backdrop-blur rounded-2xl shadow-sm border border-bloom-pink/40 mb-3">
            <Heart className="text-bloom-rose fill-bloom-rose/20 mr-2 animate-pulse" size={24} />
            <span className="font-serif text-bloom-dark tracking-wider font-semibold text-lg">The Bloom & Blossom</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-gray-900 tracking-tight">
            Share Your Experience 🌸
          </h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-md mx-auto">
            Your honest thoughts help our handmade craft bloom. Whether you ordered here or on social media, we cherish your voice!
          </p>

          {linkedRequest && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }} 
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 inline-block bg-white px-4 py-2 rounded-full border border-pink-200 text-xs text-bloom-rose font-medium shadow-xs"
            >
              ✨ Personalized invitation for {linkedRequest.customer_name || 'you'} via {linkedRequest.source}
            </motion.div>
          )}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl shadow-xl shadow-pink-100/50 border border-bloom-pink/30 overflow-hidden">
          
          <AnimatePresence mode="wait">
            {!isSubmitted ? (
              <motion.form 
                key="feedback-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: -20 }}
                onSubmit={handleSubmit}
                className="p-6 sm:p-10 space-y-8"
              >
                {/* 1. Rating Section */}
                <div className="text-center space-y-3">
                  <label className="block text-sm font-bold uppercase tracking-wider text-gray-700">
                    How was your overall experience? <span className="text-bloom-rose">*</span>
                  </label>

                  <div className="flex items-center justify-center gap-2 sm:gap-3 py-2">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = (hoverRating || rating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          className="p-2 transition-transform hover:scale-125 active:scale-95 focus:outline-hidden"
                          aria-label={`Rate ${star} star`}
                        >
                          <Star 
                            size={36} 
                            className={`transition-colors duration-200 ${
                              isFilled 
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm' 
                                : 'text-gray-200 hover:text-amber-200'
                            }`}
                          />
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-sm font-medium text-bloom-rose min-h-[20px]">
                    {getRatingLabel(hoverRating || rating)}
                  </p>
                </div>

                {/* 2. Feedback / Comments */}
                <div>
                  <label htmlFor="comments" className="block text-sm font-bold text-gray-800 mb-2">
                    Your Feedback & Thoughts
                  </label>
                  <textarea
                    id="comments"
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Tell us about the craftsmanship, delivery, customization, or how we can make your next order even more delightful..."
                    className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-bloom-rose focus:ring-2 focus:ring-bloom-pink/50 outline-hidden transition text-sm text-gray-800 placeholder-gray-400 bg-gray-50/50 focus:bg-white resize-y"
                  />
                </div>

                {/* Optional Details Header */}
                <div className="pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                      Customer Details (Voluntary & Optional)
                    </h3>
                    <span className="text-[11px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                      All fields below are optional
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Name */}
                    <div>
                      <label htmlFor="name" className="block text-xs font-semibold text-gray-700 mb-1">
                        Your Name <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="e.g. Priya Sharma"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-bloom-rose focus:ring-2 focus:ring-bloom-pink/40 outline-hidden text-sm text-gray-800 bg-white"
                      />
                    </div>

                    {/* Mobile Number */}
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1">
                        Mobile Number <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="e.g. +91 98765 43210"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-bloom-rose focus:ring-2 focus:ring-bloom-pink/40 outline-hidden text-sm text-gray-800 bg-white"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-xs font-semibold text-gray-700 mb-1">
                        Email Address <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="e.g. name@example.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-bloom-rose focus:ring-2 focus:ring-bloom-pink/40 outline-hidden text-sm text-gray-800 bg-white"
                      />
                    </div>

                    {/* Order / Reference Number */}
                    <div>
                      <label htmlFor="orderRef" className="block text-xs font-semibold text-gray-700 mb-1">
                        Order / Ref # <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        id="orderRef"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="e.g. BB10025 or Insta DM"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-bloom-rose focus:ring-2 focus:ring-bloom-pink/40 outline-hidden text-sm text-gray-800 bg-white"
                      />
                    </div>

                    {/* Product Name */}
                    <div className="sm:col-span-2">
                      <label htmlFor="product" className="block text-xs font-semibold text-gray-700 mb-1">
                        Product / Item Purchased <span className="text-gray-400 font-normal">(Optional)</span>
                      </label>
                      <input
                        type="text"
                        id="product"
                        value={productName}
                        onChange={(e) => setProductName(e.target.value)}
                        placeholder="e.g. Customised Name Bow, Satin Scrunchie Set"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-bloom-rose focus:ring-2 focus:ring-bloom-pink/40 outline-hidden text-sm text-gray-800 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {errorMessage && (
                  <motion.div 
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-200 flex items-center gap-3"
                  >
                    <span>⚠️</span>
                    <span>{errorMessage}</span>
                  </motion.div>
                )}

                {/* Submit Action */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-4 px-6 bg-gradient-to-r from-bloom-rose to-pink-600 hover:from-bloom-rose/90 hover:to-pink-700 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 text-base"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} />
                        <span>Submitting Your Feedback...</span>
                      </>
                    ) : (
                      <>
                        <Send size={20} />
                        <span>Submit Feedback</span>
                      </>
                    )}
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-3">
                    Your feedback is saved securely. No order number or personal details are required to submit.
                  </p>
                </div>
              </motion.form>
            ) : (
              /* Success & Google Review Prompt Screen */
              <motion.div 
                key="feedback-success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 sm:p-12 text-center space-y-8"
              >
                {/* Checkmark Animation */}
                <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-green-200">
                  <CheckCircle2 size={44} className="stroke-[2.5]" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">
                    Thank You So Much! 🌸
                  </h2>
                  <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto">
                    We have received your feedback! Every handmade stitch and detail is crafted with care, and your insights mean the world to us.
                  </p>
                </div>

                {/* Google Review Prompt Card */}
                {rating >= 4 && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-amber-50/70 via-pink-50/50 to-white p-6 sm:p-8 rounded-3xl border border-amber-200/80 shadow-sm text-left space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl shrink-0">
                        <Sparkles size={24} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                          Help Others Find Bloom & Blossom! ⭐
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                          Since you had a blooming <strong>{rating}-star experience</strong>, would you be kind enough to leave us a quick review on Google? It helps our small handmade shop grow!
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                      <a
                        href={GOOGLE_REVIEW_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleGoogleReviewClick}
                        className="flex-1 py-3 px-5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow transition text-center flex items-center justify-center gap-2"
                      >
                        <span>Review Us On Google</span>
                        <ExternalLink size={16} />
                      </a>

                      {!googleReviewMarked ? (
                        <button
                          type="button"
                          onClick={handleGoogleReviewClick}
                          disabled={googleSubmitting}
                          className="py-3 px-4 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition text-center cursor-pointer"
                        >
                          {googleSubmitting ? 'Saving...' : "I've Left A Google Review ✓"}
                        </button>
                      ) : (
                        <div className="py-2.5 px-4 bg-green-100 text-green-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                          <CheckCircle2 size={15} />
                          <span>Google Review Noted!</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* Return Actions */}
                <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/"
                    className="w-full sm:w-auto px-8 py-3 bg-bloom-rose text-white font-semibold rounded-xl hover:bg-bloom-rose/90 transition text-sm inline-flex items-center justify-center gap-2"
                  >
                    <span>Explore Store</span>
                    <ArrowRight size={16} />
                  </Link>

                  <Link
                    to="/collections"
                    className="w-full sm:w-auto px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition text-sm inline-flex items-center justify-center gap-2"
                  >
                    <ShoppingBag size={16} />
                    <span>View New Collections</span>
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Footer Guarantee */}
        <div className="mt-8 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
          <ShieldCheck size={16} className="text-bloom-rose" />
          <span>The Bloom & Blossom — Handcrafted with love in Haridwar, India</span>
        </div>

      </div>
    </div>
  );
}
