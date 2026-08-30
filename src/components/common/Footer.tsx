import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, Facebook, MapPin, Phone, Mail } from 'lucide-react';
import { OptimizedImage } from './OptimizedImage';
import { siteConfig } from '../../config/site';
import { useMediaContext } from '../../context/MediaContext';
import { rawLogoData } from '../../data/products';

export function Footer() {
  const { assets } = useMediaContext();

  const logoKeys = Object.keys(rawLogoData);
  const getLogoPath = () => {
    const customLogo = assets?.find((a: any) => a.folder_id === 'logo');
    if (customLogo) return customLogo.file_url;
    return logoKeys.length > 0 ? logoKeys[0].replace('public', '') : '/images/logo/logo.jpeg';
  };
  const logoPath = getLogoPath();

  return (
    <footer className="bg-white border-t pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-full overflow-hidden border border-bloom-rose/20 group-hover:border-bloom-rose transition-all">
                <OptimizedImage 
                  src={logoPath} 
                  alt={`${siteConfig.name} Logo`} 
                  className="w-full h-full object-cover" 
                />
              </div>
              <span className="font-serif text-2xl font-bold text-bloom-rose">
                {siteConfig.name}
              </span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
              {siteConfig.description}
            </p>
            <div className="flex space-x-4">
              <SocialIcon href={siteConfig.social.instagram} icon={<Instagram size={20} />} />
              <SocialIcon href={siteConfig.social.youtube} icon={<Youtube size={20} />} />
              <SocialIcon href={siteConfig.social.facebook} icon={<Facebook size={20} />} />
              <SocialIcon href={siteConfig.social.whatsapp} icon={<Phone size={20} />} />
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif text-lg font-bold mb-6">Explore</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><FooterLink to="/collections">All Collections</FooterLink></li>
              <li><FooterLink to="/collections?cat=Customised Name Bows">Customised Bows</FooterLink></li>
              <li><FooterLink to="/collections?cat=Scrunchies">Scrunchies</FooterLink></li>
              <li><FooterLink to="/new-arrivals">New Arrivals</FooterLink></li>
              <li><FooterLink to="/about">Our Story</FooterLink></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-serif text-lg font-bold mb-6">Reviews & Support</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li>
                <a 
                  href={siteConfig.social.googleReviewUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-bloom-rose transition-colors flex items-center space-x-1.5 font-medium text-gray-700"
                >
                  <span>⭐ Google Reviews (4.9/5)</span>
                </a>
              </li>
              <li><FooterLink to="/feedback">Customer Feedback Form</FooterLink></li>
              <li>
                <a 
                  href={siteConfig.social.trustpilotUrl} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="hover:text-bloom-rose transition-colors"
                >
                  Trustpilot Reviews
                </a>
              </li>
              <li><FooterLink to="/contact">Contact Us</FooterLink></li>
              <li><FooterLink to="/returns">Returns & Refunds</FooterLink></li>
              <li><FooterLink to="/faq">FAQs</FooterLink></li>
              <li><FooterLink to="/privacy">Privacy Policy</FooterLink></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-6">
            <h4 className="font-serif text-lg font-bold">Contact Info</h4>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 text-sm text-gray-500">
                <MapPin size={18} className="text-bloom-rose shrink-0" />
                <span>{siteConfig.contact.address.line1}<br/>{siteConfig.contact.address.line2}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <Phone size={18} className="text-bloom-rose shrink-0" />
                <span>{siteConfig.contact.phoneDisplay}</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <Mail size={18} className="text-bloom-rose shrink-0" />
                <span>{siteConfig.contact.email}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t text-center text-xs text-gray-400">
          <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a 
      href={href} 
      target="_blank" 
      rel="noopener noreferrer"
      className="p-2 rounded-full bg-bloom-pink text-bloom-rose hover:bg-bloom-rose hover:text-white transition-all"
    >
      {icon}
    </a>
  );
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="hover:text-bloom-rose hover:pl-2 transition-all block">
      {children}
    </Link>
  );
}
