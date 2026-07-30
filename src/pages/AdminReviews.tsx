import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Star, 
  MessageSquare, 
  Download, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Trash2,
  CheckCircle,
  XCircle,
  Search,
  Filter
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface Review {
  review_id: string;
  product_id: string;
  rating: number;
  title: string;
  review: string;
  verified_purchase: boolean;
  status: 'pending' | 'approved' | 'rejected' | 'hidden';
  helpful_count: number;
  report_count: number;
  admin_reply: string | null;
  created_at: string;
  user: {
    full_name: string | null;
    email: string;
  } | null;
}

interface Report {
  report_id: string;
  review_id: string;
  reason: string;
  comments: string;
  created_at: string;
  user: {
    full_name: string | null;
    email: string;
  } | null;
  review: Review;
}

export function AdminReviews() {
  const { isAdminAuthenticated } = useAdminAuth();

  // Review states
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Admin Reply state
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [replyLoading, setReplyLoading] = useState<Record<string, boolean>>({});

  // Reported Logs
  const [reportedLogs, setReportedLogs] = useState<Report[]>([]);
  const [showReportedModal, setShowReportedModal] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);

  // Fetch Admin reviews
  const fetchAdminReviews = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
        ...(statusFilter && { status: statusFilter }),
        ...(ratingFilter && { rating: ratingFilter }),
        ...(searchQuery && { search: searchQuery })
      });

      const res = await fetch(`/api/reviews/admin/list?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews || []);
        setTotalCount(data.total || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (e) {
      console.error('Failed fetching admin reviews:', e);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, ratingFilter, searchQuery]);

  // Fetch Reported Logs
  const fetchReportedLogs = async () => {
    setLoadingReports(true);
    try {
      const res = await fetch('/api/reviews/admin/reported');
      if (res.ok) {
        const data = await res.json();
        setReportedLogs(data.reported || []);
      }
    } catch (e) {
      console.error('Failed fetching reports:', e);
    } finally {
      setLoadingReports(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthenticated) {
      fetchAdminReviews();
    }
  }, [isAdminAuthenticated, fetchAdminReviews]);

  // Authenticate Admin
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: { pathname: '/admin/reviews' } }} replace />;
  }

  // Approve review
  const handleApprove = async (reviewId: string) => {
    if (!window.confirm('Approve this review? It will become publicly visible.')) return;
    try {
      const res = await fetch(`/api/reviews/admin/${reviewId}/approve`, {
        method: 'PUT'
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.review_id === reviewId ? { ...r, status: 'approved' } : r));
      } else {
        alert('Approval failed.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reject review
  const handleReject = async (reviewId: string) => {
    if (!window.confirm('Reject this review? It will be hidden from the product page.')) return;
    try {
      const res = await fetch(`/api/reviews/admin/${reviewId}/reject`, {
        method: 'PUT'
      });
      if (res.ok) {
        setReviews(prev => prev.map(r => r.review_id === reviewId ? { ...r, status: 'rejected' } : r));
      } else {
        alert('Rejection failed.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete review (Permanently)
  const handleDelete = async (reviewId: string) => {
    if (!window.confirm('PERMANENTLY DELETE this review and all associated images from the database? This cannot be undone.')) return;
    try {
      const res = await fetch(`/api/reviews/admin/${reviewId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setReviews(prev => prev.filter(r => r.review_id !== reviewId));
        setTotalCount(c => c - 1);
      } else {
        alert('Deletion failed.');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Submit Admin Reply
  const handleReplySubmit = async (reviewId: string) => {
    const text = replyText[reviewId];
    if (!text || !text.trim()) return;

    setReplyLoading(prev => ({ ...prev, [reviewId]: true }));
    try {
      const res = await fetch(`/api/reviews/admin/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reply: text })
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(prev => prev.map(r => r.review_id === reviewId ? { ...r, admin_reply: data.review.admin_reply } : r));
        setReplyText(prev => ({ ...prev, [reviewId]: '' }));
      } else {
        alert('Failed to send reply.');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setReplyLoading(prev => ({ ...prev, [reviewId]: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-gray-400">
          <Link to="/admin" className="hover:text-bloom-rose transition-colors">Admin</Link>
          <span>/</span>
          <span className="text-gray-900">Review Moderation</span>
        </div>

        {/* Title Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-bloom-pink rounded-xl text-bloom-rose">
              <MessageSquare size={28} />
            </div>
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold">Review Moderation</h1>
              <p className="text-gray-500 text-sm">Approve customer feedback, flag suspicious reports, and reply to buyers.</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* View Flagged Reports Button */}
            <button
              onClick={() => {
                fetchReportedLogs();
                setShowReportedModal(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shrink-0"
            >
              <ShieldAlert size={14} />
              <span>Flagged Reports</span>
            </button>

            {/* Export Reviews Button */}
            <a
              href="/api/reviews/admin/export"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shrink-0 text-gray-700"
            >
              <Download size={14} />
              <span>Export CSV</span>
            </a>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
          {/* Search Box */}
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search in review title or description..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-bloom-rose focus:border-bloom-rose text-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="md:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-bloom-rose focus:border-bloom-rose text-sm cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending Moderation</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Rating Filter */}
          <div className="md:col-span-3">
            <select
              value={ratingFilter}
              onChange={(e) => { setRatingFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-bloom-rose focus:border-bloom-rose text-sm cursor-pointer"
            >
              <option value="">All Star Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="py-20 text-center text-gray-400 space-y-2">
            <div className="animate-spin h-6 w-6 border-2 border-bloom-rose border-t-transparent rounded-full mx-auto" />
            <p className="text-xs">Loading customer reviews...</p>
          </div>
        ) : reviews.length === 0 ? (
          <div className="py-20 text-center text-gray-400 bg-white rounded-3xl border border-gray-100">
            <MessageSquare size={44} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm font-semibold">No reviews found matching the search criteria</p>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Found {totalCount} reviews</p>

            {reviews.map((review) => (
              <div 
                key={review.review_id} 
                className={cn(
                  "bg-white rounded-3xl p-6 border transition-all space-y-4",
                  review.status === 'pending' ? "border-amber-200 shadow-[0_4px_12px_rgba(245,158,11,0.05)]" : "border-gray-100",
                  review.report_count > 0 && "border-red-200 shadow-[0_4px_12px_rgba(239,68,68,0.05)]"
                )}
              >
                {/* Header info */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">
                        {review.user?.full_name || 'Anonymous'} ({review.user?.email || 'Guest Email'})
                      </span>
                      {review.verified_purchase && (
                        <span className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-[9px] font-bold tracking-wide uppercase border border-green-100">
                          Verified Buyer
                        </span>
                      )}
                      {review.report_count > 0 && (
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded text-[9px] font-bold tracking-wide uppercase border border-red-100 flex items-center gap-0.5">
                          <AlertTriangle size={10} />
                          <span>Flagged ({review.report_count})</span>
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
                      <span>Product: <strong className="text-gray-700">{review.product_id}</strong></span>
                      <span>•</span>
                      <span>{new Date(review.created_at).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Moderation Badges / Buttons */}
                  <div className="flex items-center gap-2 shrink-0">
                    {review.status === 'pending' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(review.review_id)}
                          className="flex items-center gap-1 px-4.5 py-2 bg-bloom-rose text-white text-xs font-bold uppercase tracking-wider rounded-full hover:bg-bloom-rose/90 transition-colors"
                        >
                          <Check size={12} />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleReject(review.review_id)}
                          className="flex items-center gap-1 px-4.5 py-2 border border-gray-200 text-gray-600 text-xs font-bold uppercase tracking-wider rounded-full hover:bg-gray-50 transition-colors"
                        >
                          <X size={12} />
                          <span>Reject</span>
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase flex items-center gap-1",
                          review.status === 'approved' ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"
                        )}>
                          {review.status === 'approved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          <span>{review.status}</span>
                        </span>

                        {/* Force status change */}
                        <button
                          onClick={() => review.status === 'approved' ? handleReject(review.review_id) : handleApprove(review.review_id)}
                          className="p-1.5 border border-gray-100 text-gray-400 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-all"
                          title="Change Moderation Status"
                        >
                          <Clock size={14} />
                        </button>
                      </div>
                    )}

                    {/* Permanent Delete */}
                    <button
                      onClick={() => handleDelete(review.review_id)}
                      className="p-1.5 border border-gray-100 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all ml-1"
                      title="Permanently Delete Review"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-1.5 bg-gray-50/50 p-4 rounded-2xl border border-gray-100/60 text-sm">
                  {review.title && <h4 className="font-bold text-gray-900">{review.title}</h4>}
                  <p className="text-gray-600 leading-relaxed italic">"{review.review}"</p>
                </div>

                {/* Admin Reply form / display */}
                <div className="space-y-2 pl-4 border-l-2 border-bloom-rose/20">
                  {review.admin_reply ? (
                    <div className="space-y-1 text-xs">
                      <span className="font-bold text-bloom-rose uppercase tracking-wider">Your Reply:</span>
                      <p className="text-gray-600 italic">"{review.admin_reply}"</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Write a reply to shopper:</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Thank you for shopping with us! We appreciate your kind words..."
                          value={replyText[review.review_id] || ''}
                          onChange={(e) => setReplyText(prev => ({ ...prev, [review.review_id]: e.target.value }))}
                          className="flex-grow px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-1 focus:ring-bloom-rose focus:border-bloom-rose text-xs"
                        />
                        <button
                          disabled={replyLoading[review.review_id] || !replyText[review.review_id]?.trim()}
                          onClick={() => handleReplySubmit(review.review_id)}
                          className="px-4 py-2 bg-bloom-rose/10 text-bloom-rose hover:bg-bloom-rose hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0 disabled:opacity-40"
                        >
                          {replyLoading[review.review_id] ? 'Sending...' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))}

            {/* Pagination */}
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
        )}

      </div>

      {/* Flagged Reports Modal */}
      <AnimatePresence>
        {showReportedModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-3xl shadow-xl w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
            >
              <div className="p-6 border-b flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-600">
                  <ShieldAlert size={20} />
                  <h3 className="font-serif text-lg font-bold">Flagged Customer Reports</h3>
                </div>
                <button 
                  onClick={() => setShowReportedModal(false)}
                  className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 overflow-y-auto flex-grow space-y-4">
                {loadingReports ? (
                  <div className="py-10 text-center text-gray-400">Loading reports...</div>
                ) : reportedLogs.length === 0 ? (
                  <div className="py-10 text-center text-gray-400 italic">No flagged reviews reported yet. All clean!</div>
                ) : (
                  <div className="space-y-4">
                    {reportedLogs.map((report) => (
                      <div key={report.report_id} className="border border-red-100 bg-red-50/20 rounded-2xl p-4 space-y-3">
                        <div className="flex justify-between items-start text-xs flex-wrap gap-2">
                          <div>
                            <span className="font-bold text-gray-700">Reported Reason:</span>
                            <span className="ml-1.5 px-2 py-0.5 bg-red-50 text-red-700 rounded-md font-semibold border border-red-100">
                              {report.reason}
                            </span>
                          </div>
                          <span className="text-gray-400">{new Date(report.created_at).toLocaleString()}</span>
                        </div>

                        {report.comments && (
                          <p className="text-xs text-gray-600 leading-relaxed pl-3 border-l-2 border-red-200">
                            <strong>Details:</strong> "{report.comments}"
                          </p>
                        )}

                        <div className="border-t border-gray-100 pt-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-gray-400">Flagged by:</span>
                            <span className="ml-1.5 font-semibold text-gray-700">
                              {report.user?.full_name || 'Anonymous'} ({report.user?.email || 'N/A'})
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="text-gray-400">For review:</span>
                            <span className="font-semibold text-gray-600">"{report.review?.review?.substring(0, 40)}..."</span>
                            
                            <button
                              onClick={async () => {
                                if (window.confirm('Would you like to delete this flagged review permanently?')) {
                                  await handleDelete(report.review_id);
                                  await fetchReportedLogs();
                                }
                              }}
                              className="px-2.5 py-1 text-red-600 bg-red-100 hover:bg-red-200 rounded font-semibold text-[10px] uppercase tracking-wider transition-colors ml-2"
                            >
                              Delete Review
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t bg-gray-50 flex justify-end">
                <button
                  onClick={() => setShowReportedModal(false)}
                  className="px-5 py-2 bg-gray-200 hover:bg-gray-300 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
