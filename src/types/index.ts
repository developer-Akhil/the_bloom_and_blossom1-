export type Category = 
  | 'Customised Name Bows'
  | 'Scrunchies'
  | 'Printed Scrunchies'
  | 'Printed Bows'
  | 'Premium Doll Bows'
  | 'Jewelled Bows'
  | 'Hairbands'
  | 'Embroideries'
  | 'Crochet Clips'
  | 'Alligator Clips'
  | 'Alligator Bows'
  | 'Headbands'
  | 'Customised Name Sunglasses'
  | string;

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ProductVariant {
  code?: string;
  color?: string;
  size?: string;
  image?: string;
  stock?: number;
  rating?: number;
  price?: number;
}

export interface FestivalSettings {
  enabled: boolean;
  title: string;
  subtitle?: string;
}

export interface Product {
  id: string;
  code?: string;
  name: string;
  category: Category;
  price: number;
  description: string;
  images: string[];
  stock: number;
  inStock?: boolean;
  isCustomizable: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isOnSale?: boolean;
  isFestival?: boolean;
  originalPrice?: number;
  rating?: number;
  reviews?: Review[];
  options?: ProductOption[];
  variants?: ProductVariant[];
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface CartItem extends Product {
  quantity: number;
  customizationName?: string;
  selectedOptions?: Record<string, string>;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
}

export type FeedbackType = 'DIRECT' | 'INDIRECT';

export type FeedbackSource = 
  | 'WEBSITE' 
  | 'INSTAGRAM' 
  | 'FACEBOOK' 
  | 'WHATSAPP' 
  | 'PHONE' 
  | 'WALK_IN' 
  | 'OTHER';

export type GoogleReviewStatus = 'submitted' | 'not_submitted' | 'unknown' | 'clicked' | 'skipped';

export interface FeedbackRequest {
  feedback_request_id: string;
  customer_id?: string | null;
  order_id?: string | null;
  source: FeedbackSource;
  feedback_type: FeedbackType;
  product_id?: string | null;
  product_name?: string | null;
  customer_name?: string | null;
  mobile_number?: string | null;
  email_address?: string | null;
  notes?: string | null;
  request_status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
  feedback_link_token: string;
  sent_at?: string | null;
  created_at: string;
}

export interface CustomerFeedback {
  feedback_id: string;
  feedback_request_id?: string | null;
  customer_id?: string | null;
  order_id?: string | null;
  feedback_type: FeedbackType;
  source: FeedbackSource;
  rating: number;
  comments?: string;
  customer_name?: string | null;
  mobile_number?: string | null;
  email_address?: string | null;
  product_name?: string | null;
  submitted_at: string;
  status: 'ACTIVE' | 'ARCHIVED';
  google_review_status?: GoogleReviewStatus;
  google_review_notes?: string | null;
}

export interface GoogleReviewRecord {
  google_review_id: string;
  feedback_id?: string | null;
  feedback_request_id?: string | null;
  google_review_reference?: string | null;
  rating?: number | null;
  review_text?: string | null;
  status: GoogleReviewStatus;
  review_date?: string | null;
  created_at: string;
  updated_at: string;
}
