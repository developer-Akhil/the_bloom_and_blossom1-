import React, { useState, useEffect, useCallback } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Plus, 
  Trash2, 
  Edit3, 
  Copy, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  Sparkles, 
  Tag, 
  Truck, 
  Flame, 
  Bell, 
  Calendar, 
  Clock, 
  ExternalLink, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  AlertCircle, 
  Save, 
  X,
  Layers,
  HelpCircle
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { AnnouncementItem, AnnouncementSettings, AnnouncementType } from '../types';

export function AdminAnnouncements() {
  const { isAdminAuthenticated } = useAdminAuth();

  const [settings, setSettings] = useState<AnnouncementSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formText, setFormText] = useState('');
  const [formType, setFormType] = useState<AnnouncementType>('offer');
  const [formBadgeText, setFormBadgeText] = useState('');
  const [formLinkUrl, setFormLinkUrl] = useState('');
  const [formLinkText, setFormLinkText] = useState('');
  const [formCouponCode, setFormCouponCode] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formDisplayOrder, setFormDisplayOrder] = useState<number>(1);
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');

  // Delete Confirmation Modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Check auth
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: { pathname: '/admin/announcements' } }} replace />;
  }

  const fetchAnnouncements = useCallback(async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/announcements');
      if (res.ok) {
        const json = await res.json();
        setSettings(json);
      } else {
        setErrorMessage('Failed to fetch announcements from server.');
      }
    } catch (err: any) {
      console.error('Error fetching announcements:', err);
      setErrorMessage('Network error fetching announcements.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const showSuccess = (msg: string) => {
    setSaveSuccessMessage(msg);
    setTimeout(() => setSaveSuccessMessage(null), 3500);
  };

  // Helper to format ISO date to local input datetime-local string (YYYY-MM-DDTHH:mm)
  const formatForInput = (isoDate?: string | null) => {
    if (!isoDate) return '';
    try {
      const date = new Date(isoDate);
      if (isNaN(date.getTime())) return '';
      const pad = (num: number) => String(num).padStart(2, '0');
      return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const openCreateModal = () => {
    setModalMode('create');
    setEditingId(null);
    setFormText('');
    setFormType('offer');
    setFormBadgeText('SPECIAL OFFER');
    setFormLinkUrl('/collections');
    setFormLinkText('Shop Now');
    setFormCouponCode('');
    setFormIsActive(true);
    const maxOrder = settings?.announcements?.reduce((max, a) => Math.max(max, a.displayOrder || 0), 0) || 0;
    setFormDisplayOrder(maxOrder + 1);
    setFormStartDate('');
    setFormEndDate('');
    setShowModal(true);
  };

  const openEditModal = (item: AnnouncementItem) => {
    setModalMode('edit');
    setEditingId(item.id);
    setFormText(item.text);
    setFormType(item.type || 'general');
    setFormBadgeText(item.badgeText || '');
    setFormLinkUrl(item.linkUrl || '');
    setFormLinkText(item.linkText || '');
    setFormCouponCode(item.couponCode || '');
    setFormIsActive(item.isActive);
    setFormDisplayOrder(item.displayOrder || 1);
    setFormStartDate(formatForInput(item.startDate));
    setFormEndDate(formatForInput(item.endDate));
    setShowModal(true);
  };

  const handleDuplicate = async (item: AnnouncementItem) => {
    try {
      const maxOrder = settings?.announcements?.reduce((max, a) => Math.max(max, a.displayOrder || 0), 0) || 0;
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: `${item.text} (Copy)`,
          type: item.type,
          badgeText: item.badgeText,
          linkUrl: item.linkUrl,
          linkText: item.linkText,
          couponCode: item.couponCode,
          isActive: false, // Created as disabled for review
          displayOrder: maxOrder + 1,
          startDate: item.startDate,
          endDate: item.endDate
        })
      });

      if (res.ok) {
        showSuccess('Announcement duplicated successfully!');
        fetchAnnouncements();
      }
    } catch (err) {
      console.error('Error duplicating announcement:', err);
    }
  };

  const handleToggleActive = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await fetch(`/api/announcements/toggle/${id}`, { method: 'PUT' });
      if (res.ok) {
        const json = await res.json();
        setSettings((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            announcements: prev.announcements.map((a) => (a.id === id ? json.item : a))
          };
        });
        showSuccess(`Announcement ${json.item.isActive ? 'activated' : 'disabled'}`);
      }
    } catch (err) {
      console.error('Error toggling announcement:', err);
    }
  };

  const handleToggleGlobalBanner = async () => {
    if (!settings) return;
    const newStatus = !settings.enabled;
    try {
      const res = await fetch('/api/announcements/config/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: newStatus })
      });
      if (res.ok) {
        setSettings((prev) => (prev ? { ...prev, enabled: newStatus } : prev));
        showSuccess(`Banner bar ${newStatus ? 'enabled' : 'hidden'} across storefront`);
      }
    } catch (err) {
      console.error('Error toggling global banner:', err);
    }
  };

  const handleMoveOrder = async (index: number, direction: 'up' | 'down') => {
    if (!settings) return;
    const announcements = [...settings.announcements];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= announcements.length) return;

    // Swap
    const temp = announcements[index];
    announcements[index] = announcements[targetIndex];
    announcements[targetIndex] = temp;

    const orderedIds = announcements.map((a) => a.id);

    try {
      const res = await fetch('/api/announcements/reorder/batch', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds })
      });

      if (res.ok) {
        const json = await res.json();
        setSettings((prev) => (prev ? { ...prev, announcements: json.announcements } : prev));
        showSuccess('Order updated');
      }
    } catch (err) {
      console.error('Error reordering announcements:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSettings((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            announcements: prev.announcements.filter((a) => a.id !== id)
          };
        });
        setDeleteConfirmId(null);
        showSuccess('Announcement deleted');
      }
    } catch (err) {
      console.error('Error deleting announcement:', err);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formText.trim()) {
      alert('Please enter message text.');
      return;
    }

    const payload = {
      text: formText.trim(),
      type: formType,
      badgeText: formBadgeText.trim() || undefined,
      linkUrl: formLinkUrl.trim() || undefined,
      linkText: formLinkText.trim() || undefined,
      couponCode: formCouponCode.trim() || undefined,
      isActive: formIsActive,
      displayOrder: Number(formDisplayOrder) || 1,
      startDate: formStartDate ? new Date(formStartDate).toISOString() : null,
      endDate: formEndDate ? new Date(formEndDate).toISOString() : null
    };

    try {
      let res;
      if (modalMode === 'create') {
        res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        res = await fetch(`/api/announcements/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setShowModal(false);
        showSuccess(modalMode === 'create' ? 'New announcement created!' : 'Announcement updated successfully!');
        fetchAnnouncements();
      } else {
        const errorJson = await res.json();
        alert(errorJson.error || 'Failed to save announcement');
      }
    } catch (err) {
      console.error('Error saving announcement:', err);
      alert('Network error saving announcement');
    }
  };

  // Helper function to evaluate status
  const getItemStatus = (item: AnnouncementItem) => {
    if (!item.isActive) {
      return { status: 'disabled', label: 'Disabled', colorClass: 'bg-gray-100 text-gray-600 border-gray-200' };
    }
    const now = new Date();
    if (item.startDate) {
      const start = new Date(item.startDate);
      if (!isNaN(start.getTime()) && now < start) {
        return { 
          status: 'scheduled', 
          label: `Scheduled (${start.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})`, 
          colorClass: 'bg-blue-50 text-blue-700 border-blue-200' 
        };
      }
    }
    if (item.endDate) {
      const end = new Date(item.endDate);
      if (!isNaN(end.getTime()) && now > end) {
        return { 
          status: 'expired', 
          label: `Expired (${end.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})`, 
          colorClass: 'bg-rose-50 text-rose-700 border-rose-200' 
        };
      }
    }
    return { status: 'active', label: 'Active Now', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  // Quick Preset Handlers
  const applyPreset = (presetType: 'shipping' | 'navratri' | 'discount' | 'new_arrivals') => {
    if (presetType === 'shipping') {
      setFormText('Free Shipping on Orders Above Rs 2000');
      setFormType('offer');
      setFormBadgeText('FREE SHIPPING');
      setFormLinkUrl('/collections');
      setFormLinkText('Shop Now');
    } else if (presetType === 'navratri') {
      setFormText('Check out our Navratri Special Collection');
      setFormType('festival');
      setFormBadgeText('NAVRATRI SPECIAL');
      setFormLinkUrl('/collections?festival=true');
      setFormLinkText('Explore Festive Bows');
    } else if (presetType === 'discount') {
      setFormText('Get Flat 10% OFF on all Festive Hair Accessories');
      setFormType('offer');
      setFormBadgeText('LIMITED TIME OFFER');
      setFormCouponCode('FESTIVE10');
      setFormLinkUrl('/collections');
      setFormLinkText('Claim 10% Off');
    } else if (presetType === 'new_arrivals') {
      setFormText('New Handmade Embroidered & Alligator Bows Just Dropped!');
      setFormType('general');
      setFormBadgeText('NEW ARRIVALS');
      setFormLinkUrl('/new-arrivals');
      setFormLinkText('View Drop');
    }
  };

  const announcements = settings?.announcements || [];
  const activeCount = announcements.filter((a) => getItemStatus(a).status === 'active').length;

  return (
    <div className="min-h-screen bg-gray-50/60 pb-24">
      {/* Header Bar */}
      <div className="bg-white border-b sticky top-0 z-30">
        <div className="container mx-auto px-4 md:px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <Link 
                to="/admin" 
                className="p-2 text-gray-500 hover:text-bloom-rose hover:bg-rose-50 rounded-full transition-colors"
                title="Back to Admin Dashboard"
              >
                <ArrowLeft size={20} />
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-serif text-xl md:text-2xl font-bold text-gray-900">
                    Top Announcement & Promo Banner
                  </h1>
                  <span className="bg-rose-100 text-bloom-rose text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                    Storefront Bar
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Manage scrolling alerts, free shipping notices, and festive promotional offers.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchAnnouncements}
                disabled={refreshing}
                className="p-2.5 text-gray-600 hover:text-bloom-rose hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
                title="Refresh from server"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
              </button>

              <button
                onClick={openCreateModal}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-bloom-rose text-white rounded-xl hover:bg-bloom-rose/90 font-medium text-xs md:text-sm shadow-sm transition-all cursor-pointer hover:shadow"
              >
                <Plus size={16} />
                <span>Add Message / Offer</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Notifications / Alerts */}
      <div className="container mx-auto px-4 md:px-6 pt-4">
        {saveSuccessMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 shadow-xs"
          >
            <Check size={16} className="text-emerald-600 shrink-0" />
            <span>{saveSuccessMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2 shadow-xs"
          >
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </div>

      {/* Main Container */}
      <div className="container mx-auto px-4 md:px-6 py-6 space-y-6">
        {/* Live Banner Preview Box */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-gray-900 text-sm md:text-base flex items-center gap-1.5">
                  <Sparkles size={16} className="text-amber-500" />
                  <span>Live Storefront Banner Preview</span>
                </h2>
                {settings?.enabled ? (
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    {activeCount} Active Message{activeCount !== 1 ? 's' : ''} Showing
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                    Banner Hidden on Storefront
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                This preview reflects the scrolling top bar seen by all website visitors.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 bg-gray-50 px-3 py-2 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors">
                <span>Display on Storefront</span>
                <input
                  type="checkbox"
                  checked={settings?.enabled !== false}
                  onChange={handleToggleGlobalBanner}
                  className="w-4 h-4 text-bloom-rose rounded focus:ring-bloom-rose cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Render Preview Bar */}
          <div className="mt-4 overflow-hidden rounded-xl border border-rose-900/30 shadow-inner bg-gradient-to-r from-[#4c0519] via-[#881337] to-[#4c0519] text-white p-2.5">
            {activeCount === 0 || !settings?.enabled ? (
              <div className="py-2 text-center text-xs text-white/70 italic flex items-center justify-center gap-2">
                <EyeOff size={14} />
                <span>No active messages currently visible. Add an active announcement or enable the banner.</span>
              </div>
            ) : (
              <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-1 px-2">
                {announcements
                  .filter((a) => getItemStatus(a).status === 'active')
                  .map((item, idx) => (
                    <div key={item.id} className="inline-flex items-center gap-2 shrink-0 text-xs md:text-sm font-medium">
                      <span className="text-white/40 font-mono text-[10px]">#{idx + 1}</span>
                      {item.badgeText && (
                        <span className="bg-white/20 text-amber-200 border border-white/20 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                          {item.badgeText}
                        </span>
                      )}
                      <span>{item.text}</span>
                      {item.couponCode && (
                        <span className="bg-amber-400/20 text-amber-200 border border-amber-400/30 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold">
                          {item.couponCode}
                        </span>
                      )}
                      {item.linkText && (
                        <span className="text-[11px] text-pink-200 underline">
                          {item.linkText} →
                        </span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Announcements Management List */}
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Layers size={18} className="text-bloom-rose" />
                <span>All Configured Announcements & Offers</span>
                <span className="text-xs font-normal text-gray-500">
                  ({announcements.length} Total)
                </span>
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Control individual message status, custom sequence order, offer badges, and schedule dates.
              </p>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-bloom-rose rounded-xl text-xs font-bold transition-all self-start sm:self-auto cursor-pointer"
            >
              <Plus size={14} />
              <span>New Announcement</span>
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-400">
              <RefreshCw className="animate-spin inline-block mb-2 text-bloom-rose" size={24} />
              <p className="text-xs">Loading announcements...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-12 h-12 bg-rose-50 text-bloom-rose rounded-full flex items-center justify-center mx-auto mb-3">
                <Bell size={24} />
              </div>
              <h3 className="text-sm font-bold text-gray-900 mb-1">No Announcements Created Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto mb-4">
                Add your first promotional message, shipping notice, or festival offer to appear on the top scrolling bar.
              </p>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-bloom-rose text-white text-xs font-semibold rounded-xl hover:bg-bloom-rose/90 shadow-sm"
              >
                Create First Announcement
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {announcements.map((item, index) => {
                const statusInfo = getItemStatus(item);
                return (
                  <div 
                    key={item.id} 
                    className={`p-4 md:p-5 hover:bg-gray-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      !item.isActive ? 'opacity-70 bg-gray-50/40' : ''
                    }`}
                  >
                    {/* Left: Sequence & Details */}
                    <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                      {/* Order Controls */}
                      <div className="flex flex-col items-center justify-center bg-gray-100/80 rounded-xl p-1 shrink-0">
                        <button
                          onClick={() => handleMoveOrder(index, 'up')}
                          disabled={index === 0}
                          title="Move up in display order"
                          className="p-1 text-gray-500 hover:text-bloom-rose disabled:opacity-20 transition-colors cursor-pointer"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <span className="text-[11px] font-bold font-mono text-gray-700 px-1" title="Display Order">
                          #{item.displayOrder || index + 1}
                        </span>
                        <button
                          onClick={() => handleMoveOrder(index, 'down')}
                          disabled={index === announcements.length - 1}
                          title="Move down in display order"
                          className="p-1 text-gray-500 hover:text-bloom-rose disabled:opacity-20 transition-colors cursor-pointer"
                        >
                          <ArrowDown size={14} />
                        </button>
                      </div>

                      {/* Content Info */}
                      <div className="space-y-1.5 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Status Pill */}
                          <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.colorClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              statusInfo.status === 'active' ? 'bg-emerald-500' :
                              statusInfo.status === 'scheduled' ? 'bg-blue-500' :
                              statusInfo.status === 'expired' ? 'bg-rose-500' : 'bg-gray-400'
                            }`} />
                            <span>{statusInfo.label}</span>
                          </span>

                          {/* Type Badge */}
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded">
                            {item.type}
                          </span>

                          {/* Custom Badge Text */}
                          {item.badgeText && (
                            <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                              Badge: {item.badgeText}
                            </span>
                          )}

                          {/* Coupon */}
                          {item.couponCode && (
                            <span className="text-[10px] font-mono font-bold text-purple-800 bg-purple-100 border border-purple-200 px-2 py-0.5 rounded">
                              Code: {item.couponCode}
                            </span>
                          )}
                        </div>

                        {/* Message Text */}
                        <p className="text-sm font-semibold text-gray-900 leading-snug">
                          {item.text}
                        </p>

                        {/* Link & Schedule Metadata */}
                        <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap pt-0.5">
                          {item.linkUrl && (
                            <span className="inline-flex items-center gap-1 text-gray-600">
                              <ExternalLink size={12} className="text-gray-400" />
                              <span className="font-mono text-[11px]">{item.linkUrl}</span>
                              {item.linkText && <span className="text-gray-400 font-sans">({item.linkText})</span>}
                            </span>
                          )}

                          {(item.startDate || item.endDate) && (
                            <span className="inline-flex items-center gap-1 text-gray-500 text-[11px]">
                              <Clock size={12} className="text-gray-400" />
                              {item.startDate && `From: ${new Date(item.startDate).toLocaleDateString('en-IN')}`}
                              {item.startDate && item.endDate && ' — '}
                              {item.endDate && `Until: ${new Date(item.endDate).toLocaleDateString('en-IN')}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3 self-end md:self-center shrink-0">
                      {/* Active Toggle */}
                      <button
                        onClick={(e) => handleToggleActive(item.id, e)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          item.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                        }`}
                        title={item.isActive ? 'Click to disable' : 'Click to enable'}
                      >
                        {item.isActive ? <Eye size={13} /> : <EyeOff size={13} />}
                        <span>{item.isActive ? 'Enabled' : 'Disabled'}</span>
                      </button>

                      {/* Duplicate */}
                      <button
                        onClick={() => handleDuplicate(item)}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                        title="Duplicate this message"
                      >
                        <Copy size={15} />
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(item)}
                        className="p-2 text-bloom-rose hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                        title="Edit announcement"
                      >
                        <Edit3 size={15} />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                        title="Delete announcement"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick Tips & Presets Card */}
        <div className="bg-rose-50/50 rounded-2xl p-5 border border-rose-100">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle size={16} className="text-bloom-rose" />
            <h3 className="font-bold text-gray-900 text-xs uppercase tracking-wider">
              Quick Presets & Ideas for Your Store
            </h3>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Click any preset below to quickly open the creation modal with pre-configured settings:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { openCreateModal(); applyPreset('shipping'); }}
              className="inline-flex items-center gap-1 text-xs bg-white hover:bg-rose-100/80 text-gray-800 border border-rose-200 px-3 py-1.5 rounded-xl font-medium transition-colors shadow-2xs"
            >
              <Truck size={13} className="text-bloom-rose" />
              <span>Free Shipping Above Rs 2000</span>
            </button>
            <button
              onClick={() => { openCreateModal(); applyPreset('navratri'); }}
              className="inline-flex items-center gap-1 text-xs bg-white hover:bg-rose-100/80 text-gray-800 border border-rose-200 px-3 py-1.5 rounded-xl font-medium transition-colors shadow-2xs"
            >
              <Sparkles size={13} className="text-amber-600" />
              <span>Navratri Festive Collection</span>
            </button>
            <button
              onClick={() => { openCreateModal(); applyPreset('discount'); }}
              className="inline-flex items-center gap-1 text-xs bg-white hover:bg-rose-100/80 text-gray-800 border border-rose-200 px-3 py-1.5 rounded-xl font-medium transition-colors shadow-2xs"
            >
              <Flame size={13} className="text-orange-500" />
              <span>10% Festive Discount Code</span>
            </button>
            <button
              onClick={() => { openCreateModal(); applyPreset('new_arrivals'); }}
              className="inline-flex items-center gap-1 text-xs bg-white hover:bg-rose-100/80 text-gray-800 border border-rose-200 px-3 py-1.5 rounded-xl font-medium transition-colors shadow-2xs"
            >
              <Tag size={13} className="text-purple-600" />
              <span>New Arrivals Drop</span>
            </button>
          </div>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 my-8"
            >
              <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-50 text-bloom-rose rounded-xl">
                    {modalMode === 'create' ? <Plus size={18} /> : <Edit3 size={18} />}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-gray-900">
                      {modalMode === 'create' ? 'Add New Announcement' : 'Edit Announcement'}
                    </h3>
                    <p className="text-xs text-gray-500">Configure message, badge, link, order and scheduling.</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveModal} className="space-y-4">
                {/* Message Text */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Announcement / Offer Text <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={formText}
                    onChange={(e) => setFormText(e.target.value)}
                    placeholder="e.g. Free Shipping on Orders Above Rs 2000"
                    className="w-full text-sm p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bloom-rose focus:border-transparent outline-hidden"
                  />
                  <div className="flex justify-between text-[11px] text-gray-400 mt-1">
                    <span>Keep it punchy and clear (recommended: 30-70 characters)</span>
                    <span>{formText.length} chars</span>
                  </div>
                </div>

                {/* Type & Badge */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Message Category
                    </label>
                    <select
                      value={formType}
                      onChange={(e) => setFormType(e.target.value as AnnouncementType)}
                      className="w-full text-sm p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bloom-rose outline-hidden font-medium"
                    >
                      <option value="offer">Special Offer / Promotion</option>
                      <option value="festival">Festival / Occasion Special</option>
                      <option value="general">General Notice / Shipping</option>
                      <option value="alert">Important Alert</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Badge Text (Optional)
                    </label>
                    <input
                      type="text"
                      value={formBadgeText}
                      onChange={(e) => setFormBadgeText(e.target.value)}
                      placeholder="e.g. FREE SHIPPING, OFFER, NAVRATRI"
                      className="w-full text-sm p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bloom-rose outline-hidden uppercase"
                    />
                  </div>
                </div>

                {/* Coupon & Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Coupon Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={formCouponCode}
                      onChange={(e) => setFormCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. FESTIVE10"
                      className="w-full text-sm p-2.5 border border-gray-200 rounded-xl font-mono uppercase focus:ring-2 focus:ring-bloom-rose outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Display Sequence Order
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formDisplayOrder}
                      onChange={(e) => setFormDisplayOrder(parseInt(e.target.value, 10) || 1)}
                      className="w-full text-sm p-2.5 border border-gray-200 rounded-xl font-mono focus:ring-2 focus:ring-bloom-rose outline-hidden"
                    />
                  </div>
                </div>

                {/* Link URL and Text */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Action Link URL (Optional)
                    </label>
                    <input
                      type="text"
                      value={formLinkUrl}
                      onChange={(e) => setFormLinkUrl(e.target.value)}
                      placeholder="e.g. /collections?festival=true"
                      className="w-full text-sm p-2.5 border border-gray-200 rounded-xl font-mono text-xs focus:ring-2 focus:ring-bloom-rose outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Link Button Label
                    </label>
                    <input
                      type="text"
                      value={formLinkText}
                      onChange={(e) => setFormLinkText(e.target.value)}
                      placeholder="e.g. Shop Now, Explore"
                      className="w-full text-sm p-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-bloom-rose outline-hidden"
                    />
                  </div>
                </div>

                {/* Date Scheduling */}
                <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-800">
                    <Calendar size={14} className="text-bloom-rose" />
                    <span>Offer Scheduling & Expiry (Optional)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        Start Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-bloom-rose outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                        End Date & Time (Auto-Expire)
                      </label>
                      <input
                        type="datetime-local"
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className="w-full text-xs p-2 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-bloom-rose outline-hidden"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Leave blank to show continuously whenever the message is enabled.
                  </p>
                </div>

                {/* Active Checkbox */}
                <div className="pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-gray-800">
                    <input
                      type="checkbox"
                      checked={formIsActive}
                      onChange={(e) => setFormIsActive(e.target.checked)}
                      className="w-4 h-4 text-bloom-rose rounded focus:ring-bloom-rose cursor-pointer"
                    />
                    <span>Enable this message immediately</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2.5 bg-bloom-rose text-white text-xs font-bold rounded-xl hover:bg-bloom-rose/90 transition-all shadow-sm"
                  >
                    <Save size={14} />
                    <span>{modalMode === 'create' ? 'Create Announcement' : 'Save Changes'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 text-center"
            >
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Trash2 size={24} />
              </div>
              <h3 className="font-serif text-lg font-bold text-gray-900 mb-1">Delete Announcement?</h3>
              <p className="text-xs text-gray-500 mb-5">
                Are you sure you want to delete this message? This action cannot be undone.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirmId)}
                  className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 shadow-sm"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
