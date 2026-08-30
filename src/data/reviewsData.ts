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
    rating: 4.9,
    totalReviews: 34,
    badgeLabel: 'Verified Google Review',
    writeReviewUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,',
    viewAllUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,1,,,,',
    color: '#4285F4',
  },
  website: {
    id: 'website',
    name: 'Verified Customers',
    rating: 5.0,
    totalReviews: 48,
    badgeLabel: 'Verified Customer',
    writeReviewUrl: '/feedback',
    viewAllUrl: '/feedback',
    color: '#D47385',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram Love',
    rating: 5.0,
    totalReviews: 26,
    badgeLabel: 'Instagram Community',
    writeReviewUrl: 'https://www.instagram.com/bows_scrunchies.love/',
    viewAllUrl: 'https://www.instagram.com/bows_scrunchies.love/',
    color: '#E1306C',
  },
  trustpilot: {
    id: 'trustpilot',
    name: 'Trustpilot',
    rating: 4.8,
    totalReviews: 18,
    badgeLabel: 'Trustpilot Verified',
    writeReviewUrl: 'https://www.trustpilot.com/review/bloomandblossom.in',
    viewAllUrl: 'https://www.trustpilot.com/review/bloomandblossom.in',
    color: '#00B67A',
  },
};

export const FEATURED_REVIEWS: SocialReview[] = [
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
    date: 'Just now',
    productName: 'Handcrafted Clips Set',
    location: 'Haridwar',
    likesCount: 1
  },
  {
    id: 'fb_kavita_aug27',
    authorName: 'Kavita',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
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
  },
  {
    id: 'gr_1',
    authorName: 'KHUSHI P.',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    reviewText: 'Beautiful 😍 collection',
    source: 'google',
    sourceLabel: 'Google',
    sourceUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,',
    isVerified: true,
    date: '2 days ago',
    productName: 'Customised Name Bow',
    location: 'Delhi',
    likesCount: 6
  },
  {
    id: 'gr_2',
    authorName: 'rithika n.',
    avatarBg: 'bg-purple-600',
    avatarColor: 'text-white',
    rating: 5,
    reviewText: 'Beautiful 😍 collection',
    source: 'google',
    sourceLabel: 'Google',
    sourceUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,',
    isVerified: true,
    date: '3 days ago',
    productName: 'Satin Hair Scrunchies Set',
    location: 'Bengaluru',
    likesCount: 4
  },
  {
    id: 'gr_3',
    authorName: 'Faeza J.',
    authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    reviewText: 'It is fabulous as shown in picture...as I ordered so many of them and loved it 🥰',
    source: 'google',
    sourceLabel: 'Google',
    sourceUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,',
    isVerified: true,
    date: '1 week ago',
    productName: 'Pearl Organza Bows',
    location: 'Mumbai',
    likesCount: 11
  },
  {
    id: 'gr_4',
    authorName: 'Soma R.',
    avatarBg: 'bg-[#4A3B32]',
    avatarColor: 'text-white',
    rating: 5,
    reviewText: 'Lovely cute clips....good finishing....value for money. Very satisfied customer.',
    source: 'google',
    sourceLabel: 'Google',
    sourceUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,',
    isVerified: true,
    date: '1 week ago',
    productName: 'Alligator Clips Collection',
    location: 'Kolkata',
    likesCount: 9
  },
  {
    id: 'gr_5',
    authorName: 'Priya Sharma',
    authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    reviewText: 'Ordered custom name embroidered bows for my daughter’s birthday party. The craft and neatness exceeded expectations! ✨',
    source: 'website',
    sourceLabel: 'Verified Buyer',
    sourceUrl: '/feedback',
    isVerified: true,
    date: '2 weeks ago',
    productName: 'Pastel Rainbow Name Headband',
    location: 'Pune',
    likesCount: 14
  },
  {
    id: 'gr_6',
    authorName: 'Ananya V.',
    avatarBg: 'bg-rose-500',
    avatarColor: 'text-white',
    rating: 5,
    reviewText: 'The quality of silk scrunchies and festive alligator clips is premium. Doesn’t tug hair at all and looks super chic! 🌸',
    source: 'instagram',
    sourceLabel: 'Instagram DM',
    sourceUrl: 'https://www.instagram.com/bows_scrunchies.love/',
    isVerified: true,
    date: '2 weeks ago',
    productName: 'Pure Silk Scrunchies',
    location: 'Hyderabad',
    likesCount: 8
  },
  {
    id: 'gr_7',
    authorName: 'Meera Joshi',
    authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80',
    rating: 5,
    reviewText: 'Visited their offline pop-up in Haridwar and then ordered online. Gorgeous packaging with scented dried petals! 💖',
    source: 'google',
    sourceLabel: 'Google',
    sourceUrl: 'https://www.google.com/search?q=the+bloom+and+blossom#lrd=0x390947db0dc7d7db:0x55e61aac6cb14f5f,3,,,,',
    isVerified: true,
    date: '3 weeks ago',
    productName: 'Festive Shringar Set',
    location: 'Haridwar',
    likesCount: 12
  },
  {
    id: 'gr_8',
    authorName: 'Tanya Kapoor',
    avatarBg: 'bg-emerald-600',
    avatarColor: 'text-white',
    rating: 5,
    reviewText: 'Fast dispatch and prompt WhatsApp customer support. Customization was exactly as requested. Will order again! ⭐⭐⭐⭐⭐',
    source: 'trustpilot',
    sourceLabel: 'Trustpilot',
    sourceUrl: 'https://www.trustpilot.com/review/bloomandblossom.in',
    isVerified: true,
    date: '1 month ago',
    productName: 'Velvet Hairband with Crystals',
    location: 'Chandigarh',
    likesCount: 7
  }
];
