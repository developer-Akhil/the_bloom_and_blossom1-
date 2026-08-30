import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Star, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  ExternalLink, 
  ShieldCheck, 
  X, 
  Search, 
  PenLine,
  Sparkles
} from 'lucide-react';
import { 
  FEATURED_REVIEWS, 
  REVIEW_SOURCES_CONFIG, 
  ReviewSource, 
  SocialReview 
} from '../data/reviewsData';
import { siteConfig } from '../config/site';
import { cn } from '../lib/utils';

// Google Colored G Logo Component
export function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
    </svg>
  );
}

// Google Wordmark (Google in authentic brand colors)
export function GoogleWordmark({ className = "text-2xl" }: { className?: string }) {
  return (
    <span className={cn("font-bold tracking-tight inline-flex items-center select-none font-sans", className)}>
      <span className="text-[#4285F4]">G</span>
      <span className="text-[#EA4335]">o</span>
      <span className="text-[#FBBC05]">o</span>
      <span className="text-[#4285F4]">g</span>
      <span className="text-[#34A853]">l</span>
      <span className="text-[#EA4335]">e</span>
    </span>
  );
}

// Trustpilot Logo Icon
export function TrustpilotIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.7 8.3L21.6 9L16.4 13.6L17.9 20.4L12 16.9L6.1 20.4L7.6 13.6L2.4 9L9.3 8.3L12 2Z" fill="#00B67A"/>
      <path d="M17.9 20.4L12 16.9V2L14.7 8.3L21.6 9L16.4 13.6L17.9 20.4Z" fill="#005128"/>
    </svg>
  );
}

// Instagram Logo Icon
export function InstagramGradientIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="url(#ig-grad)"/>
      <path d="M12 7C9.24 7 7 9.24 7 12C7 14.76 9.24 17 12 17C14.76 17 17 14.76 17 12C17 9.24 14.76 7 12 7ZM12 15.2C10.23 15.2 8.8 13.77 8.8 12C8.8 10.23 10.23 8.8 12 8.8C13.77 8.8 15.2 10.23 15.2 12C15.2 13.77 13.77 15.2 12 15.2Z" fill="white"/>
      <circle cx="16.5" cy="7.5" r="1.1" fill="white"/>
      <defs>
        <linearGradient id="ig-grad" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FA7E1E"/>
          <stop offset="0.5" stopColor="#D62976"/>
          <stop offset="1" stopColor="#962FBF"/>
        </linearGradient>
      </defs>
    </svg>
  );
}

// Platform Source Badge
export function SourceBadge({ source }: { source: ReviewSource }) {
  switch (source) {
    case 'google':
      return <GoogleIcon className="w-5 h-5 shrink-0" />;
    case 'instagram':
      return <InstagramGradientIcon className="w-5 h-5 shrink-0" />;
    case 'trustpilot':
      return <TrustpilotIcon className="w-5 h-5 shrink-0" />;
    case 'website':
    default:
      return (
        <span className="w-5 h-5 rounded-full bg-bloom-pink text-bloom-rose flex items-center justify-center font-serif text-[11px] font-bold shadow-xs">
          🌸
        </span>
      );
  }
}

export function GoogleReviewsSection() {
  const [reviews, setReviews] = useState<SocialReview[]>(FEATURED_REVIEWS);
  const [selectedSource, setSelectedSource] = useState<'all' | ReviewSource>('all');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAllReviewsModalOpen, setIsAllReviewsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalSourceFilter, setModalSourceFilter] = useState<'all' | ReviewSource>('all');
  const [modalSortOrder, setModalSortOrder] = useState<'newest' | 'rating' | 'popular'>('newest');
  
  const carouselRef = useRef<HTMLDivElement>(null);

  // Fetch live backend feedback submissions & Google reviews dynamically
  useEffect(() => {
    let isMounted = true;
    const fetchLiveFeedback = async () => {
      try {
        const res = await fetch('/api/feedback/public');
        if (res.ok) {
          const data = await res.json();
          if (data.reviews && Array.isArray(data.reviews) && data.reviews.length > 0) {
            if (isMounted) {
              setReviews(() => {
                const liveList: SocialReview[] = data.reviews;
                const uniqueMap = new Map<string, SocialReview>();
                
                // Add live feedback from database / server store first
                liveList.forEach(item => {
                  const key = (item.authorName || item.id).toLowerCase().trim();
                  uniqueMap.set(key, item);
                });

                // Add any missing static showcase reviews
                FEATURED_REVIEWS.forEach(item => {
                  const key = (item.authorName || item.id).toLowerCase().trim();
                  if (!uniqueMap.has(key)) {
                    uniqueMap.set(key, item);
                  }
                });

                return Array.from(uniqueMap.values());
              });
            }
          }
        }
      } catch (err) {
        console.error('Error fetching live reviews feed:', err);
      }
    };

    fetchLiveFeedback();
    return () => { isMounted = false; };
  }, []);

  // Filter reviews based on source tab
  const filteredReviews = selectedSource === 'all' 
    ? reviews 
    : reviews.filter(r => r.source === selectedSource);

  // Dynamic counts per category
  const googleCount = reviews.filter(r => r.source === 'google').length;
  const websiteCount = reviews.filter(r => r.source === 'website').length;
  const instagramCount = reviews.filter(r => r.source === 'instagram').length;
  const trustpilotCount = reviews.filter(r => r.source === 'trustpilot').length;

  // Items visible per page on responsive screens
  const itemsPerPage = 4;
  const maxPages = Math.ceil(filteredReviews.length / itemsPerPage);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, maxPages - 1)));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < maxPages - 1 ? prev + 1 : 0));
  };

  // Reset page when source tab changes
  const handleTabChange = (source: 'all' | ReviewSource) => {
    setSelectedSource(source);
    setCurrentIndex(0);
  };

  // All Reviews modal search & filter
  const modalFilteredReviews = reviews.filter(review => {
    const matchesSource = modalSourceFilter === 'all' || review.source === modalSourceFilter;
    const matchesSearch = searchQuery === '' || 
      review.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      review.reviewText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (review.productName && review.productName.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSource && matchesSearch;
  }).sort((a, b) => {
    if (modalSortOrder === 'rating') return b.rating - a.rating;
    if (modalSortOrder === 'popular') return (b.likesCount || 0) - (a.likesCount || 0);
    return 0; // default newest
  });

  return (
    <section className="py-16 md:py-24 bg-[#FCF8F8] relative overflow-hidden" id="customer-reviews">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        
        {/* Top Header: Title & Write a Review Button (Matches Screenshot) */}
        <div className="relative mb-8">
          <div className="text-center space-y-3">
            <h2 className="font-sans text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
              Google Reviews
            </h2>

            {/* Central Rating Badge & Google Logo (Exact Screenshot Match) */}
            <div className="flex flex-col items-center justify-center space-y-1.5 pt-1">
              <span className="font-bold text-lg text-gray-900">Excellent</span>
              
              {/* 5 Stars */}
              <div className="flex items-center space-x-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={22} className="fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Based on reviews count */}
              <p className="text-xs md:text-sm font-semibold text-gray-500">
                Based on <span className="text-gray-900 font-bold">34 Reviews</span>
              </p>

              {/* Google Brand Logo */}
              <div className="pt-1">
                <GoogleWordmark className="text-2xl md:text-3xl" />
              </div>
            </div>
          </div>

          {/* Top Right "Write a Review" Button (Direct Google Review Link) */}
          <div className="mt-6 md:mt-0 flex justify-center md:absolute md:top-6 md:right-0">
            <a
              href={siteConfig.social.googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-2.5 bg-[#1F2937] hover:bg-black text-white text-xs md:text-sm font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex items-center space-x-2 active:scale-95 group"
            >
              <PenLine size={15} className="group-hover:rotate-6 transition-transform" />
              <span>Write a Review</span>
              <ExternalLink size={13} className="text-gray-400 group-hover:text-white transition-colors" />
            </a>
          </div>
        </div>

        {/* Source Filter Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
          <button
            onClick={() => handleTabChange('all')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border",
              selectedSource === 'all'
                ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            )}
          >
            All Reviews ({reviews.length})
          </button>

          <button
            onClick={() => handleTabChange('google')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1.5",
              selectedSource === 'google'
                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:border-blue-300"
            )}
          >
            <GoogleIcon className="w-3.5 h-3.5" />
            <span>Google ({googleCount > 0 ? googleCount : 34})</span>
          </button>

          <button
            onClick={() => handleTabChange('website')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1.5",
              selectedSource === 'website'
                ? "bg-bloom-rose text-white border-bloom-rose shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:border-pink-300"
            )}
          >
            <ShieldCheck size={14} className="text-bloom-rose shrink-0" />
            <span>Verified Customers ({websiteCount > 0 ? websiteCount : 48})</span>
          </button>

          <button
            onClick={() => handleTabChange('instagram')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1.5",
              selectedSource === 'instagram'
                ? "bg-[#E1306C] text-white border-[#E1306C] shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:border-pink-300"
            )}
          >
            <InstagramGradientIcon className="w-3.5 h-3.5" />
            <span>Instagram Community ({instagramCount > 0 ? instagramCount : 26})</span>
          </button>

          <button
            onClick={() => handleTabChange('trustpilot')}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-semibold transition-all border flex items-center space-x-1.5",
              selectedSource === 'trustpilot'
                ? "bg-[#00B67A] text-white border-[#00B67A] shadow-sm"
                : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300"
            )}
          >
            <TrustpilotIcon className="w-3.5 h-3.5" />
            <span>Trustpilot ({trustpilotCount > 0 ? trustpilotCount : 18})</span>
          </button>
        </div>

        {/* Carousel Container with Left/Right Arrows (Screenshot Match) */}
        <div className="relative">
          {/* Left Arrow */}
          <button
            onClick={handlePrev}
            aria-label="Previous Reviews"
            className="absolute -left-3 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white text-gray-600 shadow-md hover:bg-gray-50 hover:text-gray-900 border border-gray-100 flex items-center justify-center transition-all focus:outline-none"
          >
            <ChevronLeft size={20} />
          </button>

          {/* Review Cards Grid / Slider */}
          <div 
            ref={carouselRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5"
          >
            {filteredReviews.slice(currentIndex * itemsPerPage, (currentIndex * itemsPerPage) + itemsPerPage).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>

          {/* Right Arrow */}
          <button
            onClick={handleNext}
            aria-label="Next Reviews"
            className="absolute -right-3 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-10 md:h-10 rounded-full bg-white text-gray-600 shadow-md hover:bg-gray-50 hover:text-gray-900 border border-gray-100 flex items-center justify-center transition-all focus:outline-none"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Carousel Pagination Dots (Screenshot Match) */}
        {maxPages > 1 && (
          <div className="flex items-center justify-center space-x-2 mt-8">
            {[...Array(maxPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-all",
                  currentIndex === i ? "w-6 bg-gray-800" : "bg-gray-300 hover:bg-gray-400"
                )}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Bottom "Show all Reviews" Bar (Screenshot Match) */}
        <div className="mt-8 flex items-center justify-end">
          <button
            onClick={() => setIsAllReviewsModalOpen(true)}
            className="inline-flex items-center space-x-2 text-sm font-semibold text-gray-800 hover:text-bloom-rose transition-colors group"
          >
            <GoogleIcon className="w-4 h-4" />
            <span className="group-hover:underline underline-offset-4">Show all Reviews</span>
            <ExternalLink size={14} className="text-gray-400 group-hover:text-bloom-rose transition-colors" />
          </button>
        </div>

      </div>

      {/* ======================================================== */}
      {/* SHOW ALL REVIEWS MODAL / BROWSER */}
      {/* ======================================================== */}
      <AnimatePresence>
        {isAllReviewsModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-[#FFF9F9]">
                <div>
                  <div className="flex items-center space-x-2">
                    <GoogleIcon className="w-5 h-5" />
                    <h3 className="font-serif text-2xl font-bold text-gray-900">
                      All Customer Reviews & Ratings
                    </h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Authentic feedback verified across Google, Verified Customers, Instagram DMs, and Trustpilot.
                  </p>
                </div>
                <button
                  onClick={() => setIsAllReviewsModalOpen(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X size={22} />
                </button>
              </div>

              {/* Filters & Search Row */}
              <div className="p-4 md:p-6 border-b border-gray-100 bg-white space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search Input */}
                  <div className="relative flex-grow">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search reviews by name, keyword, or product..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-bloom-rose/30 focus:bg-white"
                    />
                  </div>

                  {/* Sort Order */}
                  <select
                    value={modalSortOrder}
                    onChange={(e) => setModalSortOrder(e.target.value as any)}
                    className="px-4 py-2 text-xs font-semibold bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-bloom-rose/30"
                  >
                    <option value="newest">Sort: Most Recent</option>
                    <option value="rating">Sort: Highest Rating (5⭐)</option>
                    <option value="popular">Sort: Most Helpful</option>
                  </select>
                </div>

                {/* Source Filter Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {(['all', 'google', 'website', 'instagram', 'trustpilot'] as const).map((src) => (
                    <button
                      key={src}
                      onClick={() => setModalSourceFilter(src)}
                      className={cn(
                        "px-3 py-1 rounded-full text-xs font-semibold transition-all capitalize",
                        modalSourceFilter === src
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      )}
                    >
                      {src === 'all' ? 'All Channels' : src === 'website' ? 'Verified Customers' : src}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reviews List Scroll Area */}
              <div className="p-4 md:p-6 overflow-y-auto flex-grow space-y-4">
                {modalFilteredReviews.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <p>No reviews match your search or filter.</p>
                  </div>
                ) : (
                  modalFilteredReviews.map((review) => (
                    <div
                      key={review.id}
                      className="p-5 rounded-2xl bg-[#FFF9F9] border border-pink-100/60 flex flex-col space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          {/* Avatar */}
                          {review.authorAvatar ? (
                            <img
                              src={review.authorAvatar}
                              alt={review.authorName}
                              className="w-10 h-10 rounded-full object-cover shadow-xs border border-white"
                            />
                          ) : (
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase shadow-xs",
                              review.avatarBg || "bg-purple-600",
                              review.avatarColor || "text-white"
                            )}>
                              {review.authorName.charAt(0)}
                            </div>
                          )}

                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="font-bold text-sm text-gray-900">
                                {review.authorName}
                              </span>
                              {review.isVerified && (
                                <CheckCircle2 size={15} className="fill-[#1877F2] text-white shrink-0" />
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                              <span>{review.date}</span>
                              {review.productName && (
                                <>
                                  <span>•</span>
                                  <span className="text-bloom-rose font-medium">{review.productName}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <SourceBadge source={review.source} />
                          {review.sourceUrl && (
                            <a
                              href={review.sourceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gray-400 hover:text-gray-600 p-1"
                              title="View Original Review"
                            >
                              <ExternalLink size={13} />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center space-x-1 text-amber-400">
                        {[...Array(review.rating)].map((_, i) => (
                          <Star key={i} size={15} className="fill-amber-400 text-amber-400" />
                        ))}
                      </div>

                      {/* Review Text */}
                      <p className="text-gray-700 text-sm leading-relaxed">
                        {review.reviewText}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Modal Footer Link */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
                <a
                  href={siteConfig.social.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-blue-600 hover:underline flex items-center space-x-1"
                >
                  <GoogleIcon className="w-3.5 h-3.5" />
                  <span>Open Bloom & Blossom on Google Maps</span>
                </a>

                <a
                  href={siteConfig.social.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-[#1F2937] hover:bg-black text-white rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <PenLine size={13} />
                  <span>Write Your Review on Google</span>
                  <ExternalLink size={12} className="text-gray-400" />
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

// Single Review Card Matching Screenshot Exactly
function ReviewCard({ review }: { review: SocialReview }) {
  return (
    <div className="bg-[#FFF8F9] border border-pink-100/70 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between h-full min-h-[190px] relative">
      <div>
        {/* Card Header: Avatar, Name + Blue Tick, Platform Icon (Exact Screenshot Match) */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2.5">
            {/* Avatar */}
            {review.authorAvatar ? (
              <img
                src={review.authorAvatar}
                alt={review.authorName}
                className="w-10 h-10 rounded-full object-cover shadow-xs border border-white shrink-0"
              />
            ) : (
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm uppercase shadow-xs shrink-0",
                review.avatarBg || "bg-purple-600",
                review.avatarColor || "text-white"
              )}>
                {review.authorName.charAt(0).toLowerCase()}
              </div>
            )}

            {/* Author Name + Blue Verified Tick */}
            <div className="flex items-center space-x-1">
              <span className="font-bold text-sm text-gray-900 tracking-tight">
                {review.authorName}
              </span>
              {review.isVerified && (
                <CheckCircle2 size={16} className="fill-[#1877F2] text-white shrink-0" />
              )}
            </div>
          </div>

          {/* Top Right Source Icon (Google, Instagram, Website, Trustpilot) */}
          <div className="shrink-0 pl-1">
            <SourceBadge source={review.source} />
          </div>
        </div>

        {/* 5 Yellow Stars (Exact Screenshot Match) */}
        <div className="flex items-center space-x-1 text-amber-400 mb-2.5">
          {[...Array(review.rating)].map((_, i) => (
            <Star key={i} size={16} className="fill-amber-400 text-amber-400" />
          ))}
        </div>

        {/* Review Text */}
        <p className="text-gray-800 text-xs md:text-sm leading-relaxed line-clamp-4">
          {review.reviewText}
        </p>
      </div>

      {/* Subtle product tag or location if available */}
      {review.productName && (
        <div className="pt-3 mt-3 border-t border-pink-100/40 text-[10px] text-gray-400 flex items-center justify-between">
          <span className="truncate max-w-[170px]">{review.productName}</span>
          <span>{review.date}</span>
        </div>
      )}
    </div>
  );
}
