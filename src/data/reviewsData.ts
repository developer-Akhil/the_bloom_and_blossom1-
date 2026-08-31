export type ReviewSource = 'google' | 'website' | 'instagram' | 'trustpilot';

export interface SocialReview {
  id: string;
  authorName: string;
  authorAvatar?: string;
  avatarBg?: string;
  avatarColor?: string;
  rating: number;
  reviewText: string;
  source: ReviewSource;
  sourceLabel: string;
  sourceUrl?: string;
  isVerified: boolean;
  date: string;
  productName?: string;
  location?: string;
  likesCount?: number;
}

export interface ReviewSourceConfig {
  id: ReviewSource;
  name: string;
  rating: number;
  totalReviews: number;
  badgeLabel: string;
  writeReviewUrl: string;
  viewAllUrl: string;
  color: string;
}

export const REVIEW_SOURCES_CONFIG: Record<ReviewSource, ReviewSourceConfig> = {
  google: {
    id: 'google',
    name: 'Google Reviews',
    rating: 4.5,
    totalReviews: 2,
    badgeLabel: 'Verified Google Review',
    writeReviewUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,',
    viewAllUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,1,,,,',
    color: '#4285F4',
  },
  website: {
    id: 'website',
    name: 'Verified Customers',
    rating: 5.0,
    totalReviews: 1,
    badgeLabel: 'Verified Customer',
    writeReviewUrl: '/feedback',
    viewAllUrl: '/feedback',
    color: '#D47385',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram Love',
    rating: 5.0,
    totalReviews: 0,
    badgeLabel: 'Instagram Community',
    writeReviewUrl: 'https://www.instagram.com/bows_scrunchies.love/',
    viewAllUrl: 'https://www.instagram.com/bows_scrunchies.love/',
    color: '#E1306C',
  },
  trustpilot: {
    id: 'trustpilot',
    name: 'Trustpilot',
    rating: 5.0,
    totalReviews: 0,
    badgeLabel: 'Trustpilot Verified',
    writeReviewUrl: 'https://www.trustpilot.com/review/bloomandblossom.in',
    viewAllUrl: 'https://www.trustpilot.com/review/bloomandblossom.in',
    color: '#00B67A',
  },
};

export const FEATURED_REVIEWS: SocialReview[] = [
  {
    id: 'gr_laxmi_google',
    authorName: 'Laxmi Chand',
    avatarBg: 'bg-[#5C4033]',
    avatarColor: 'text-white',
    rating: 4,
    reviewText: "I bought customized name bows for my granddaughter, and they are absolutely beautiful. The quality is very good, and I'm really happy with my purchase.",
    source: 'google',
    sourceLabel: 'Google',
    sourceUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,',
    isVerified: true,
    date: 'Yesterday',
    productName: 'Customized Name Bows',
    location: 'Google Review',
    likesCount: 3
  },
  {
    id: 'gr_akhil_google',
    authorName: 'Akhil',
    avatarBg: 'bg-[#7E6A5B]',
    avatarColor: 'text-white',
    rating: 5,
    reviewText: 'I ordered some clips for my Daughter. All were so pretty and eye catching. Good quality and quick delivery.',
    source: 'google',
    sourceLabel: 'Google',
    sourceUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,',
    isVerified: true,
    date: 'Recently',
    productName: 'Handcrafted Clips Set',
    location: 'Haridwar',
    likesCount: 5
  },
  {
    id: 'fb_kavita_aug27',
    authorName: 'Kavita',
    avatarBg: 'bg-[#9C4153]',
    avatarColor: 'text-white',
    rating: 5,
    reviewText: 'My personal experience is very good i m very happy with this product n delivery bhi time se pahele mil gai',
    source: 'website',
    sourceLabel: 'Verified Customer',
    sourceUrl: '/feedback',
    isVerified: true,
    date: 'Aug 27, 2026',
    productName: 'Name Bows',
    location: 'Verified Buyer',
    likesCount: 9
  }
];
