import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Download, 
  Search, 
  Filter, 
  Link as LinkIcon, 
  Copy, 
  Check, 
  Share2, 
  Plus, 
  RefreshCw, 
  Trash2, 
  ExternalLink,
  MessageCircle,
  Mail,
  Phone,
  Store,
  Instagram,
  Facebook,
  Globe,
  HelpCircle,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Clock,
  Send
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { CustomerFeedback, FeedbackRequest, FeedbackSource, FeedbackType, GoogleReviewStatus } from '../types';

export function AdminFeedback() {
  const { isAdminAuthenticated } = useAdminAuth();

  // Dashboard Data
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<{
    totalFeedback: number;
    directFeedback: number;
    indirectFeedback: number;
    averageRating: number;
    googleReviewsCount: number;
    googleReviewConversion: number;
    totalRequests: number;
    pendingRequests: number;
  }>({
    totalFeedback: 0,
    directFeedback: 0,
    indirectFeedback: 0,
    averageRating: 0,
    googleReviewsCount: 0,
    googleReviewConversion: 0,
    totalRequests: 0,
    pendingRequests: 0
  });

  const [sourceBreakdown, setSourceBreakdown] = useState<Record<string, number>>({});
  const [ratingHistogram, setRatingHistogram] = useState<Record<string, number>>({});

  // Filter & Search
  const [feedbackList, setFeedbackList] = useState<CustomerFeedback[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [ratingFilter, setRatingFilter] = useState<string>('ALL');
  const [googleFilter, setGoogleFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Link Generator Modal
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genSource, setGenSource] = useState<FeedbackSource>('INSTAGRAM');
  const [genType, setGenType] = useState<FeedbackType>('INDIRECT');
  const [genCustomerName, setGenCustomerName] = useState('');
  const [genMobile, setGenMobile] = useState('');
  const [genEmail, setGenEmail] = useState('');
  const [genOrderId, setGenOrderId] = useState('');
  const [genProductName, setGenProductName] = useState('');
  const [genNotes, setGenNotes] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    token: string;
    feedbackUrl: string;
    request: FeedbackRequest;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Status update tracker state
  const [updatingGoogleId, setUpdatingGoogleId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'feedback' | 'requests'>('feedback');
  const [recentRequests, setRecentRequests] = useState<FeedbackRequest[]>([]);

  // Google Reviews Live Sync State
  const [syncStatus, setSyncStatus] = useState<{
    isConfigured?: boolean;
    billingRequired?: boolean;
    lastSuccessfulSync?: string | null;
    status?: string;
    rating?: number | null;
    userRatingCount?: number | null;
    placeName?: string | null;
    placeUrl?: string | null;
    errorMessage?: string | null;
  }>({});
  const [syncingGoogle, setSyncingGoogle] = useState(false);
  const [syncFeedbackToast, setSyncFeedbackToast] = useState<string | null>(null);

  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/feedback/google/status');
      if (res.ok) {
        const data = await res.json();
        setSyncStatus(data);
      }
    } catch (e) {
      console.error('Failed to load Google sync status:', e);
    }
  }, []);

  const handleTriggerGoogleSync = async () => {
    setSyncingGoogle(true);
    setSyncFeedbackToast(null);
    try {
      const res = await fetch('/api/feedback/google/sync', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSyncFeedbackToast(data.message || 'Google Reviews synced successfully! 🌸');
        fetchDashboardData();
        fetchFeedbackList();
        fetchSyncStatus();
      } else {
        setSyncFeedbackToast(data.message || 'Failed to sync Google Reviews');
      }
    } catch (err: any) {
      setSyncFeedbackToast(err.message || 'Network error while syncing Google Reviews');
    } finally {
      setSyncingGoogle(false);
      setTimeout(() => setSyncFeedbackToast(null), 6000);
    }
  };

  // Fetch Dashboard Summary & List
  const fetchDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/feedback/admin/dashboard');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data.metrics || {});
        setSourceBreakdown(data.sourceBreakdown || {});
        setRatingHistogram(data.ratingHistogram || {});
        setRecentRequests(data.recentRequests || []);
      }
    } catch (e) {
      console.error('Failed to load dashboard metrics:', e);
    }
  }, []);

  const fetchFeedbackList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        ...(typeFilter !== 'ALL' && { type: typeFilter }),
        ...(sourceFilter !== 'ALL' && { source: sourceFilter }),
        ...(ratingFilter !== 'ALL' && { rating: ratingFilter }),
        ...(googleFilter !== 'ALL' && { google_status: googleFilter }),
        ...(searchQuery.trim() && { search: searchQuery.trim() })
      });

      const res = await fetch(`/api/feedback/admin/list?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setFeedbackList(data.feedback || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to load feedback list:', e);
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, sourceFilter, ratingFilter, googleFilter, searchQuery]);

  useEffect(() => {
    fetchDashboardData();
    fetchSyncStatus();
  }, [fetchDashboardData, fetchSyncStatus]);

  useEffect(() => {
    fetchFeedbackList();
  }, [fetchFeedbackList]);

  // Check auth
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: { pathname: '/admin/feedback' } }} replace />;
  }

  // Handle Generate Feedback Link
  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await fetch('/api/feedback/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: genSource,
          feedback_type: genOrderId ? 'DIRECT' : genType,
          customer_name: genCustomerName.trim() || null,
          mobile_number: genMobile.trim() || null,
          email_address: genEmail.trim() || null,
          order_id: genOrderId.trim() || null,
          product_name: genProductName.trim() || null,
          notes: genNotes.trim() || null
        })
      });

      if (res.ok) {
        const data = await res.json();
        setGeneratedResult({
          token: data.token,
          feedbackUrl: data.feedbackUrl,
          request: data.request
        });
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Failed to generate feedback link:', e);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Inline Google Status Update
  const handleUpdateGoogleStatus = async (feedbackId: string, newStatus: GoogleReviewStatus) => {
    setUpdatingGoogleId(feedbackId);
    try {
      const res = await fetch(`/api/feedback/admin/${feedbackId}/google-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setFeedbackList(prev => prev.map(f => f.feedback_id === feedbackId ? { ...f, google_review_status: newStatus } : f));
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Failed to update google review status:', e);
    } finally {
      setUpdatingGoogleId(null);
    }
  };

  // Delete Feedback
  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this feedback record?')) return;
    try {
      const res = await fetch(`/api/feedback/admin/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setFeedbackList(prev => prev.filter(f => f.feedback_id !== id));
        fetchDashboardData();
      }
    } catch (e) {
      console.error('Failed to delete feedback entry:', e);
    }
  };

  const getSourceIcon = (src: string) => {
    switch (src?.toUpperCase()) {
      case 'INSTAGRAM': return <Instagram size={14} className="text-pink-600" />;
      case 'WHATSAPP': return <MessageCircle size={14} className="text-green-600" />;
      case 'FACEBOOK': return <Facebook size={14} className="text-blue-600" />;
      case 'PHONE': return <Phone size={14} className="text-amber-600" />;
      case 'WALK_IN': return <Store size={14} className="text-purple-600" />;
      case 'WEBSITE': return <Globe size={14} className="text-bloom-rose" />;
      default: return <HelpCircle size={14} className="text-gray-600" />;
    }
  };

  const getSourceBadgeColor = (src: string) => {
    switch (src?.toUpperCase()) {
      case 'INSTAGRAM': return 'bg-pink-50 text-pink-700 border-pink-200';
      case 'WHATSAPP': return 'bg-green-50 text-green-700 border-green-200';
      case 'FACEBOOK': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PHONE': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'WALK_IN': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'WEBSITE': return 'bg-rose-50 text-bloom-rose border-rose-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
      
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="flex items-center space-x-3">
          <Link 
            to="/admin" 
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition flex items-center gap-1 text-sm font-medium"
          >
            <ArrowLeft size={16} />
            <span>Hub</span>
          </Link>
          <div>
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
              Customer Feedback & Google Reviews
            </h1>
            <p className="text-gray-500 text-xs md:text-sm">
              Track customer voice across Website, Instagram, WhatsApp, Facebook & Walk-ins.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <a
            href="/api/feedback/admin/export"
            download
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </a>

          <button
            type="button"
            onClick={() => {
              setGeneratedResult(null);
              setShowGenerateModal(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-bloom-rose hover:bg-bloom-rose/90 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus size={16} />
            <span>Generate Feedback Link</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. Summary Metrics & Conversion Cards */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Feedback */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Feedback</span>
            <MessageSquare size={18} className="text-bloom-rose" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{metrics.totalFeedback}</div>
          <div className="text-[11px] text-gray-500 mt-1 flex items-center gap-1">
            <span>Direct: <strong>{metrics.directFeedback}</strong></span>
            <span>•</span>
            <span>Indirect: <strong>{metrics.indirectFeedback}</strong></span>
          </div>
        </div>

        {/* Direct Feedback */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Direct (Orders)</span>
            <Globe size={18} className="text-blue-500" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{metrics.directFeedback}</div>
          <p className="text-[11px] text-gray-400 mt-1">Linked to website orders</p>
        </div>

        {/* Indirect Feedback */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Indirect (Social)</span>
            <Instagram size={18} className="text-pink-500" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900">{metrics.indirectFeedback}</div>
          <p className="text-[11px] text-gray-400 mt-1">Insta, WhatsApp, Phone & In-store</p>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <div className="flex items-center justify-between text-gray-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Rating</span>
            <Star size={18} className="text-amber-400 fill-amber-400" />
          </div>
          <div className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-1.5">
            <span>{metrics.averageRating || '0.00'}</span>
            <span className="text-sm font-normal text-amber-500">⭐</span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">Across all channels</p>
        </div>

        {/* Google Reviews & Conversion */}
        <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-amber-500/10 via-rose-50/30 to-white p-5 rounded-2xl border border-amber-200/70 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Google Reviews</span>
            <Sparkles size={18} className="text-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-bold text-gray-900">{metrics.googleReviewsCount}</span>
            <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
              {metrics.googleReviewConversion}% Conv.
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1">Verified on Google Maps</p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* Google Reviews Automatic Live Sync Banner */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-amber-200/60 shadow-xs mb-8 bg-gradient-to-r from-amber-50/40 via-white to-rose-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start md:items-center space-x-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200/80 shadow-xs flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-bold text-gray-900 text-base md:text-lg flex items-center gap-1.5">
                  <span>Google Reviews Auto-Sync</span>
                  {syncStatus.billingRequired || syncStatus.status === 'standby' ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full" title="Google Cloud billing link needed to enable live API queries">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      Configured • Standby (Billing Activation)
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      {syncStatus.isConfigured ? 'Connected & Active' : 'Active'}
                    </span>
                  )}
                </h2>
              </div>
              <p className="text-xs text-gray-600 mt-0.5">
                Automatically fetches fresh reviews from <strong>{syncStatus.placeName || 'The Bloom and Blossom'}</strong> and displays them on your website's Google Reviews showcase.
              </p>
              {syncStatus.lastSuccessfulSync && (
                <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <Clock size={11} />
                  <span>Last synced: {new Date(syncStatus.lastSuccessfulSync).toLocaleString()}</span>
                  {syncStatus.rating && (
                    <>
                      <span>•</span>
                      <span className="font-semibold text-amber-600">{syncStatus.rating} ⭐ on Google Maps</span>
                    </>
                  )}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {syncStatus.placeUrl && (
              <a
                href={syncStatus.placeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-2xs"
              >
                <span>View on Google</span>
                <ExternalLink size={13} />
              </a>
            )}

            <button
              type="button"
              onClick={handleTriggerGoogleSync}
              disabled={syncingGoogle}
              className="px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw size={14} className={syncingGoogle ? "animate-spin" : ""} />
              <span>{syncingGoogle ? "Syncing Reviews..." : "Sync from Google Now"}</span>
            </button>
          </div>
        </div>

        {/* Sync Toast Feedback */}
        {syncFeedbackToast && (
          <div className="mt-3 p-3 bg-white/90 border border-amber-200 rounded-xl text-xs text-gray-800 flex items-center gap-2 shadow-xs">
            <CheckCircle2 size={16} className="text-green-600 shrink-0" />
            <span className="font-medium">{syncFeedbackToast}</span>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. Source Breakdown & Rating Histogram */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Source Channels */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center justify-between">
            <span>Feedback by Acquisition Source</span>
            <span className="text-xs text-gray-400 font-normal">All channels</span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[
              { key: 'WEBSITE', label: 'Website Order', icon: Globe, color: 'text-bloom-rose bg-rose-50' },
              { key: 'INSTAGRAM', label: 'Instagram DM', icon: Instagram, color: 'text-pink-600 bg-pink-50' },
              { key: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600 bg-green-50' },
              { key: 'FACEBOOK', label: 'Facebook', icon: Facebook, color: 'text-blue-600 bg-blue-50' },
              { key: 'PHONE', label: 'Phone Call', icon: Phone, color: 'text-amber-600 bg-amber-50' },
              { key: 'WALK_IN', label: 'Walk-in / Pop-up', icon: Store, color: 'text-purple-600 bg-purple-50' },
              { key: 'OTHER', label: 'Other', icon: HelpCircle, color: 'text-gray-600 bg-gray-50' },
            ].map(({ key, label, icon: Icon, color }) => {
              const count = sourceBreakdown[key] || 0;
              const percent = metrics.totalFeedback > 0 ? Math.round((count / metrics.totalFeedback) * 100) : 0;
              return (
                <div key={key} className="p-3 rounded-2xl border border-gray-100 bg-gray-50/50 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-1.5 rounded-lg ${color}`}>
                      <Icon size={16} />
                    </div>
                    <span className="text-xs font-bold text-gray-900">{count}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-700 truncate">{label}</p>
                    <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-bloom-rose h-full rounded-full transition-all duration-500" 
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 mt-1 block">{percent}% of total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Rating Breakdown */}
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-800 mb-4 flex items-center justify-between">
            <span>Rating Distribution</span>
            <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
              <Star size={12} className="fill-amber-400" /> {metrics.averageRating} Avg
            </span>
          </h2>

          <div className="space-y-2.5">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = ratingHistogram[stars] || 0;
              const percent = metrics.totalFeedback > 0 ? Math.round((count / metrics.totalFeedback) * 100) : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-12 font-medium text-gray-600 flex items-center gap-1">
                    {stars} <Star size={11} className="text-amber-400 fill-amber-400" />
                  </span>
                  <div className="flex-1 bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-400 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-bold text-gray-700">{count}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 p-3 bg-pink-50/50 rounded-2xl border border-pink-100 text-[11px] text-gray-600 flex items-center gap-2">
            <Sparkles size={16} className="text-bloom-rose shrink-0" />
            <span>High-rating customers (4–5⭐) are automatically prompted to review on Google!</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. Filters, Search & Navigation Tabs */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-xs p-6 mb-8 space-y-6">
        
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4 flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('feedback')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'feedback' 
                  ? 'bg-bloom-rose text-white shadow-xs' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <MessageSquare size={14} />
              <span>Feedback Submissions ({totalCount})</span>
            </button>

            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeTab === 'requests' 
                  ? 'bg-bloom-rose text-white shadow-xs' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <LinkIcon size={14} />
              <span>Feedback Requests ({recentRequests.length})</span>
            </button>
          </div>

          <button
            onClick={() => {
              fetchDashboardData();
              fetchFeedbackList();
            }}
            className="p-2 text-gray-400 hover:text-bloom-rose hover:bg-pink-50 rounded-xl transition"
            title="Refresh Data"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {activeTab === 'feedback' && (
          <>
            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search Box */}
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Search name, phone, order, comments..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-hidden focus:border-bloom-rose focus:bg-white transition"
                />
              </div>

              {/* Type Filter */}
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-hidden focus:border-bloom-rose"
                >
                  <option value="ALL">All Types (Direct & Indirect)</option>
                  <option value="DIRECT">DIRECT (Website Orders)</option>
                  <option value="INDIRECT">INDIRECT (Social Media / Walk-in)</option>
                </select>
              </div>

              {/* Source Filter */}
              <div>
                <select
                  value={sourceFilter}
                  onChange={(e) => {
                    setSourceFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-hidden focus:border-bloom-rose"
                >
                  <option value="ALL">All Sources / Channels</option>
                  <option value="WEBSITE">Website</option>
                  <option value="INSTAGRAM">Instagram</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="FACEBOOK">Facebook</option>
                  <option value="PHONE">Phone</option>
                  <option value="WALK_IN">Walk-in</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              {/* Rating Filter */}
              <div>
                <select
                  value={ratingFilter}
                  onChange={(e) => {
                    setRatingFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-hidden focus:border-bloom-rose"
                >
                  <option value="ALL">All Star Ratings</option>
                  <option value="5">5 Stars ⭐⭐⭐⭐⭐</option>
                  <option value="4">4 Stars ⭐⭐⭐⭐</option>
                  <option value="3">3 Stars ⭐⭐⭐</option>
                  <option value="2">2 Stars ⭐⭐</option>
                  <option value="1">1 Star ⭐</option>
                </select>
              </div>

              {/* Google Review Filter */}
              <div>
                <select
                  value={googleFilter}
                  onChange={(e) => {
                    setGoogleFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-hidden focus:border-bloom-rose"
                >
                  <option value="ALL">All Google Review Statuses</option>
                  <option value="submitted">Google Review Submitted ✓</option>
                  <option value="not_submitted">Not Submitted Yet</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            </div>

            {/* Feedback Entries Table / List */}
            {loading ? (
              <div className="py-16 text-center text-gray-400 space-y-3">
                <RefreshCw className="animate-spin mx-auto text-bloom-rose" size={28} />
                <p className="text-xs">Loading customer feedback records...</p>
              </div>
            ) : feedbackList.length === 0 ? (
              <div className="py-16 text-center text-gray-400 space-y-3 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <MessageSquare className="mx-auto text-gray-300" size={36} />
                <p className="text-sm font-semibold text-gray-600">No feedback records found</p>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Try adjusting your filters, or generate a new feedback link to share with your customers.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbackList.map((item) => (
                  <div
                    key={item.feedback_id}
                    className="p-5 rounded-2xl border border-gray-100 hover:border-bloom-pink/50 hover:shadow-xs transition bg-white space-y-3"
                  >
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-50 pb-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Customer Name */}
                        <span className="font-bold text-gray-900 text-sm">
                          {item.customer_name || 'Anonymous Customer'}
                        </span>

                        {/* Source Badge */}
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getSourceBadgeColor(item.source)}`}>
                          {getSourceIcon(item.source)}
                          <span>{item.source}</span>
                        </span>

                        {/* Type Badge */}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          item.feedback_type === 'DIRECT' 
                            ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          {item.feedback_type}
                        </span>

                        {/* Order ID if direct */}
                        {item.order_id && (
                          <span className="text-[11px] font-mono bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-semibold">
                            Order #{item.order_id}
                          </span>
                        )}
                      </div>

                      {/* Timestamp */}
                      <span className="text-[11px] text-gray-400 flex items-center gap-1">
                        <Clock size={12} />
                        {new Date(item.submitted_at).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    {/* Middle Section: Stars & Comments */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <div className="flex items-center text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                              key={s} 
                              size={15} 
                              className={s <= item.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'} 
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-700">({item.rating}/5)</span>
                        
                        {item.product_name && (
                          <span className="text-xs text-bloom-rose bg-pink-50 px-2 py-0.5 rounded-md font-medium">
                            🛍️ {item.product_name}
                          </span>
                        )}
                      </div>

                      {item.comments ? (
                        <p className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-gray-50/70 p-3 rounded-xl border border-gray-100">
                          "{item.comments}"
                        </p>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No written comments provided.</p>
                      )}
                    </div>

                    {/* Footer Row: Contact Details & Google Review Status Switcher */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs">
                      {/* Customer Contact Details */}
                      <div className="flex items-center gap-3 text-gray-500 text-[11px] flex-wrap">
                        {item.mobile_number ? (
                          <a href={`tel:${item.mobile_number}`} className="hover:text-bloom-rose flex items-center gap-1">
                            <Phone size={12} />
                            <span>{item.mobile_number}</span>
                          </a>
                        ) : null}

                        {item.email_address ? (
                          <a href={`mailto:${item.email_address}`} className="hover:text-bloom-rose flex items-center gap-1">
                            <Mail size={12} />
                            <span>{item.email_address}</span>
                          </a>
                        ) : null}

                        {!item.mobile_number && !item.email_address && (
                          <span className="text-gray-400 italic">No contact info provided</span>
                        )}
                      </div>

                      {/* Google Review Status Selector */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-gray-500">Google Review:</span>
                        <select
                          value={item.google_review_status || 'not_submitted'}
                          disabled={updatingGoogleId === item.feedback_id}
                          onChange={(e) => handleUpdateGoogleStatus(item.feedback_id, e.target.value as GoogleReviewStatus)}
                          className={`text-xs font-bold rounded-lg px-2.5 py-1 border transition cursor-pointer ${
                            item.google_review_status === 'submitted'
                              ? 'bg-green-50 text-green-700 border-green-300'
                              : item.google_review_status === 'clicked'
                              ? 'bg-amber-50 text-amber-700 border-amber-300'
                              : 'bg-gray-50 text-gray-600 border-gray-200'
                          }`}
                        >
                          <option value="submitted">✓ Submitted on Google</option>
                          <option value="clicked">Clicked Link (Pending)</option>
                          <option value="not_submitted">Not Submitted</option>
                          <option value="unknown">Unknown</option>
                        </select>

                        {/* Delete Entry */}
                        <button
                          type="button"
                          onClick={() => handleDeleteFeedback(item.feedback_id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg transition"
                          title="Delete feedback entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100 text-xs">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      className="px-4 py-2 border rounded-xl disabled:opacity-40 hover:bg-gray-50 font-semibold"
                    >
                      Previous
                    </button>
                    <span className="text-gray-500 font-medium">Page {page} of {totalPages}</span>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      className="px-4 py-2 border rounded-xl disabled:opacity-40 hover:bg-gray-50 font-semibold"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Requests Tab */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500">
                Feedback invitation links generated by admin for specific customers.
              </p>
              <button
                onClick={() => {
                  setGeneratedResult(null);
                  setShowGenerateModal(true);
                }}
                className="px-3 py-1.5 bg-bloom-rose text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
              >
                <Plus size={14} />
                <span>New Link</span>
              </button>
            </div>

            {recentRequests.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs">No feedback links generated yet.</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentRequests.map((req) => {
                  const url = `${window.location.origin}/feedback?token=${req.feedback_link_token}`;
                  return (
                    <div key={req.feedback_request_id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{req.customer_name || 'Generic Customer'}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${getSourceBadgeColor(req.source)}`}>
                            {req.source}
                          </span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                            Token: {req.feedback_link_token}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          {req.product_name ? `Product: ${req.product_name} • ` : ''}
                          Status: <strong className={req.request_status === 'COMPLETED' ? 'text-green-600' : 'text-amber-600'}>{req.request_status}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(url)}
                          className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1 font-semibold"
                        >
                          <Copy size={12} />
                          <span>Copy Link</span>
                        </button>
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-gray-400 hover:text-bloom-rose"
                          title="Open Form"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. Link Generator Modal */}
      {/* ------------------------------------------------------------- */}
      <AnimatePresence>
        {showGenerateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2">
                    <Sparkles className="text-bloom-rose" size={20} />
                    <span>Generate Customer Feedback Link</span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Works for social media buyers, WhatsApp chats, or website orders.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGenerateModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full"
                >
                  ✕
                </button>
              </div>

              {!generatedResult ? (
                <form onSubmit={handleGenerateLink} className="space-y-4 text-xs">
                  
                  {/* Channel / Source Selection */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">
                      Customer Source / Channel <span className="text-bloom-rose">*</span>
                    </label>
                    <select
                      value={genSource}
                      onChange={(e) => setGenSource(e.target.value as FeedbackSource)}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-bloom-rose text-xs font-semibold bg-white"
                    >
                      <option value="INSTAGRAM">Instagram DM</option>
                      <option value="WHATSAPP">WhatsApp Chat</option>
                      <option value="FACEBOOK">Facebook Messenger</option>
                      <option value="PHONE">Phone Order</option>
                      <option value="WALK_IN">Walk-in Customer / Exhibition</option>
                      <option value="WEBSITE">Website Customer</option>
                      <option value="OTHER">Other Channel</option>
                    </select>
                  </div>

                  {/* Customer Name */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Customer Name (Optional)</label>
                    <input
                      type="text"
                      value={genCustomerName}
                      onChange={(e) => setGenCustomerName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-bloom-rose text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Mobile Number */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Mobile # (Optional)</label>
                      <input
                        type="tel"
                        value={genMobile}
                        onChange={(e) => setGenMobile(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-bloom-rose text-xs"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Email (Optional)</label>
                      <input
                        type="email"
                        value={genEmail}
                        onChange={(e) => setGenEmail(e.target.value)}
                        placeholder="priya@example.com"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-bloom-rose text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Order ID */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Order # / Ref (Optional)</label>
                      <input
                        type="text"
                        value={genOrderId}
                        onChange={(e) => {
                          setGenOrderId(e.target.value);
                          if (e.target.value) setGenType('DIRECT');
                        }}
                        placeholder="e.g. BB10025"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-bloom-rose text-xs"
                      />
                    </div>

                    {/* Product Name */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Product / Item (Optional)</label>
                      <input
                        type="text"
                        value={genProductName}
                        onChange={(e) => setGenProductName(e.target.value)}
                        placeholder="e.g. Name Bow"
                        className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-bloom-rose text-xs"
                      />
                    </div>
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <label className="block font-bold text-gray-700 mb-1">Internal Note (Optional)</label>
                    <input
                      type="text"
                      value={genNotes}
                      onChange={(e) => setGenNotes(e.target.value)}
                      placeholder="e.g. Requested customized pink font"
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-bloom-rose text-xs"
                    />
                  </div>

                  {/* Submit button */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={generating}
                      className="w-full py-3 bg-bloom-rose hover:bg-bloom-rose/90 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      {generating ? (
                        <>
                          <RefreshCw className="animate-spin" size={14} />
                          <span>Generating Unique Link...</span>
                        </>
                      ) : (
                        <>
                          <LinkIcon size={14} />
                          <span>Create Feedback Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Generated Link Result with 1-click shares */
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-2xl border border-green-200 text-center space-y-1">
                    <CheckCircle2 className="mx-auto text-green-600" size={28} />
                    <h4 className="font-bold text-green-900 text-sm">Feedback Link Ready!</h4>
                    <p className="text-[11px] text-green-700">
                      Share this unique link with {generatedResult.request.customer_name || 'your customer'}.
                    </p>
                  </div>

                  {/* URL Box */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-2">
                    <input 
                      type="text" 
                      readOnly 
                      value={generatedResult.feedbackUrl} 
                      className="w-full bg-transparent text-xs font-mono text-gray-700 outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => handleCopy(generatedResult.feedbackUrl)}
                      className="px-3 py-1.5 bg-bloom-rose text-white rounded-lg text-xs font-bold shrink-0 flex items-center gap-1 shadow-xs"
                    >
                      {copiedLink ? <Check size={12} /> : <Copy size={12} />}
                      <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  {/* 1-Click Share Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {/* WhatsApp */}
                    <a
                      href={`https://api.whatsapp.com/send?${
                        generatedResult.request.mobile_number ? `phone=${generatedResult.request.mobile_number.replace(/\D/g, '')}&` : ''
                      }text=${encodeURIComponent(
                        `Hi ${generatedResult.request.customer_name || 'there'}! 🌸 Thank you so much for choosing The Bloom & Blossom for your handcrafted hair accessories. We would love to hear your thoughts and experience: ${generatedResult.feedbackUrl}`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <MessageCircle size={15} />
                      <span>Share on WhatsApp</span>
                    </a>

                    {/* Email */}
                    <a
                      href={`mailto:${generatedResult.request.email_address || ''}?subject=${encodeURIComponent(
                        'How was your Bloom & Blossom experience? 🌸'
                      )}&body=${encodeURIComponent(
                        `Dear ${generatedResult.request.customer_name || 'Customer'},\n\nThank you for choosing The Bloom & Blossom! We would love to receive your valuable feedback:\n\n${generatedResult.feedbackUrl}\n\nWarm regards,\nThe Bloom & Blossom Team`
                      )}`}
                      className="p-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
                    >
                      <Mail size={15} />
                      <span>Send Email</span>
                    </a>
                  </div>

                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setGeneratedResult(null)}
                      className="text-xs text-bloom-rose font-bold hover:underline"
                    >
                      + Generate Another Link
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
