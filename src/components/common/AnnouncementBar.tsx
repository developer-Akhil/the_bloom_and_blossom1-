import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Truck, Tag, Flame, ArrowRight, Copy, Check, ChevronLeft, ChevronRight, Bell } from 'lucide-react';
import { AnnouncementItem, AnnouncementSettings } from '../../types';

// Safe default fallback banner in case network is initialising or offline
const DEFAULT_ANNOUNCEMENTS: AnnouncementSettings = {
  enabled: true,
  scrollSpeed: 'normal',
  pauseOnHover: true,
  updatedAt: new Date().toISOString(),
  announcements: [
    {
      id: 'default_announcement_1',
      text: '🌸 Free Shipping on all orders above ₹499 across India!',
      badgeText: 'Free Shipping',
      type: 'general',
      isActive: true,
      displayOrder: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'default_announcement_2',
      text: '✨ Handcrafted with love • Use code BLOOM10 for 10% off',
      badgeText: 'Special Offer',
      type: 'offer',
      couponCode: 'BLOOM10',
      isActive: true,
      displayOrder: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'default_announcement_3',
      text: '🎀 Check out our new Korean Silk scrunchies & bows collection!',
      badgeText: 'New Arrivals',
      type: 'general',
      linkUrl: '/products',
      linkText: 'Shop Collection',
      isActive: true,
      displayOrder: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

export function AnnouncementBar() {
  const [data, setData] = useState<AnnouncementSettings>(DEFAULT_ANNOUNCEMENTS);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/announcements/active');
        if (res.ok) {
          const json = await res.json();
          if (isMounted && json && Array.isArray(json.announcements)) {
            setData(json);
          }
        }
      } catch (err) {
        // Fallback is already active, silent fallback for seamless user experience
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAnnouncements();

    // Re-check periodically (e.g. every 60s) to respect date/time expiration
    const interval = setInterval(fetchAnnouncements, 60000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const announcements = data?.announcements || [];

  // Auto-advance for compact mode or focus navigation
  useEffect(() => {
    if (announcements.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [announcements.length, isPaused]);

  if (loading || !data?.enabled || announcements.length === 0) {
    return null;
  }

  const handleCopyCode = (e: React.MouseEvent, code: string) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const getBadgeIcon = (type: string, badgeText?: string) => {
    const text = (badgeText || '').toLowerCase();
    if (text.includes('shipping') || text.includes('delivery')) {
      return <Truck size={12} className="shrink-0 text-amber-300" />;
    }
    if (type === 'festival' || text.includes('navratri') || text.includes('special')) {
      return <Sparkles size={12} className="shrink-0 text-amber-300 animate-pulse" />;
    }
    if (type === 'offer' || text.includes('sale') || text.includes('off')) {
      return <Flame size={12} className="shrink-0 text-orange-300" />;
    }
    return <Tag size={12} className="shrink-0 text-pink-300" />;
  };

  const renderAnnouncementContent = (item: AnnouncementItem, isCompact = false) => {
    const content = (
      <div className="inline-flex items-center gap-2 md:gap-3 py-1.5 px-3 whitespace-nowrap text-xs md:text-sm font-medium tracking-wide">
        {/* Badge */}
        {item.badgeText ? (
          <span className="inline-flex items-center gap-1 bg-white/15 text-amber-200 border border-white/20 px-2 py-0.5 rounded-full text-[10px] md:text-[11px] font-bold tracking-wider uppercase backdrop-blur-xs shadow-xs">
            {getBadgeIcon(item.type, item.badgeText)}
            <span>{item.badgeText}</span>
          </span>
        ) : (
          <span className="text-amber-300">
            {getBadgeIcon(item.type)}
          </span>
        )}

        {/* Message Text */}
        <span className="font-medium text-white drop-shadow-xs">
          {item.text}
        </span>

        {/* Coupon Code Pill */}
        {item.couponCode && (
          <button
            onClick={(e) => handleCopyCode(e, item.couponCode!)}
            className="inline-flex items-center gap-1 bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 hover:text-white border border-amber-400/40 px-2 py-0.5 rounded-md text-[10px] md:text-xs font-mono font-bold transition-all cursor-pointer shadow-xs active:scale-95"
            title="Click to copy coupon code"
          >
            <span>{item.couponCode}</span>
            {copiedCode === item.couponCode ? (
              <span className="flex items-center gap-0.5 text-green-300">
                <Check size={11} />
                <span className="text-[9px]">Copied!</span>
              </span>
            ) : (
              <Copy size={10} className="opacity-75" />
            )}
          </button>
        )}

        {/* Link / CTA */}
        {item.linkUrl && (
          <span className="inline-flex items-center gap-1 text-[11px] md:text-xs font-semibold text-pink-200 hover:text-white underline decoration-pink-300/60 underline-offset-2 transition-colors">
            <span>{item.linkText || 'Explore'}</span>
            <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
          </span>
        )}
      </div>
    );

    if (item.linkUrl) {
      const isExternal = item.linkUrl.startsWith('http');
      if (isExternal) {
        return (
          <a
            key={item.id}
            href={item.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center hover:opacity-95 transition-opacity"
          >
            {content}
          </a>
        );
      }
      return (
        <Link
          key={item.id}
          to={item.linkUrl}
          className="group inline-flex items-center hover:opacity-95 transition-opacity"
        >
          {content}
        </Link>
      );
    }

    return (
      <div key={item.id} className="inline-flex items-center">
        {content}
      </div>
    );
  };

  // Determine marquee animation speed
  const speedClass = 
    data.scrollSpeed === 'slow' ? 'animate-marquee-slow' :
    data.scrollSpeed === 'fast' ? 'animate-marquee-fast' : 'animate-marquee';

  return (
    <aside 
      aria-label="Announcements and special offers"
      className="relative z-50 w-full overflow-hidden bg-gradient-to-r from-[#4c0519] via-[#881337] to-[#4c0519] text-white shadow-xs border-b border-rose-900/40 select-none"
      onMouseEnter={() => data.pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => data.pauseOnHover && setIsPaused(false)}
      ref={containerRef}
    >
      {/* Desktop / Tablet Continuous Marquee Scroll */}
      <div className="hidden sm:flex relative items-center overflow-hidden py-1.5">
        <div 
          className={`flex shrink-0 items-center gap-8 ${isPaused ? '' : speedClass}`}
          style={{ willChange: 'transform' }}
        >
          {/* Render duplicated list for seamless infinite loop */}
          {announcements.map((item) => renderAnnouncementContent(item))}
          {announcements.map((item) => renderAnnouncementContent(item))}
          {announcements.map((item) => renderAnnouncementContent(item))}
          {announcements.map((item) => renderAnnouncementContent(item))}
        </div>
      </div>

      {/* Mobile Optimized View: Single Item with Navigation & Slide */}
      <div className="flex sm:hidden items-center justify-between px-2 py-1.5">
        {announcements.length > 1 && (
          <button
            onClick={() => setActiveIndex((prev) => (prev - 1 + announcements.length) % announcements.length)}
            aria-label="Previous announcement"
            className="p-1 text-white/70 hover:text-white rounded-full transition-colors active:scale-90"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        <div className="flex-1 overflow-hidden text-center flex justify-center">
          {renderAnnouncementContent(announcements[activeIndex], true)}
        </div>

        {announcements.length > 1 && (
          <button
            onClick={() => setActiveIndex((prev) => (prev + 1) % announcements.length)}
            aria-label="Next announcement"
            className="p-1 text-white/70 hover:text-white rounded-full transition-colors active:scale-90"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>
    </aside>
  );
}
