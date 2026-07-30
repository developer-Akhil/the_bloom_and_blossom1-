export type Category = 
  | 'Customised Name Bows'
  | 'Scrunchies'
  | 'Printed Scrunchies'
  | 'Printed Bows'
  | 'Premium Doll Bows'
  | 'Jewelled Bows'
  | 'Hairbands'
  | 'Embroidery Bows'
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
