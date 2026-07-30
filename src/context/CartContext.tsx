import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { type CartItem, type Product } from '../types';
import { useProductContext } from './ProductContext';

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: Product, customizationName?: string, selectedOptions?: Record<string, string>, quantity?: number) => void;
  removeFromCart: (itemId: string, customizationName?: string, selectedOptions?: Record<string, string>) => void;
  updateQuantity: (itemId: string, quantity: number, customizationName?: string, selectedOptions?: Record<string, string>) => void;
  updateCustomizationName: (itemId: string, oldName: string | undefined, newName: string, selectedOptions?: Record<string, string>) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { products: dynamicProducts } = useProductContext();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('bloom_cart');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('bloom_cart', JSON.stringify(cart));
  }, [cart]);

  const isSameItem = (item: CartItem, id: string, customizationName?: string, selectedOptions?: Record<string, string>) => {
    if (item.id !== id) return false;
    if (item.customizationName !== customizationName) return false;
    
    const itemOptions = item.selectedOptions || {};
    const compareOptions = selectedOptions || {};
    const itemKeys = Object.keys(itemOptions);
    const compareKeys = Object.keys(compareOptions);
    
    if (itemKeys.length !== compareKeys.length) return false;
    return itemKeys.every(key => itemOptions[key] === compareOptions[key]);
  };

  const addToCart = useCallback((product: Product, customizationName?: string, selectedOptions?: Record<string, string>, quantity = 1) => {
    setCart((prev) => {
      const existing = prev.find((item) => isSameItem(item, product.id, customizationName, selectedOptions));
      if (existing) {
        return prev.map((item) => 
          isSameItem(item, product.id, customizationName, selectedOptions)
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { ...product, quantity, customizationName, selectedOptions }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string, customizationName?: string, selectedOptions?: Record<string, string>) => {
    setCart((prev) => prev.filter((item) => !isSameItem(item, productId, customizationName, selectedOptions)));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number, customizationName?: string, selectedOptions?: Record<string, string>) => {
    if (quantity < 1) return;
    setCart((prev) => prev.map((item) => 
      isSameItem(item, productId, customizationName, selectedOptions) ? { ...item, quantity } : item
    ));
  }, []);

  const updateCustomizationName = useCallback((productId: string, oldName: string | undefined, newName: string, selectedOptions?: Record<string, string>) => {
    setCart((prev) => prev.map((item) => 
      isSameItem(item, productId, oldName, selectedOptions) ? { ...item, customizationName: newName } : item
    ));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  // Compute total and map cart to have synced prices using dynamic data
  const syncedCart = useMemo(() => {
    return cart.map(item => {
      const latestProduct = dynamicProducts.find(p => p.id === item.id);
      return latestProduct ? { ...item, price: latestProduct.price } : item;
    });
  }, [cart, dynamicProducts]);

  const cartTotal = useMemo(() => syncedCart.reduce((total, item) => total + item.price * item.quantity, 0), [syncedCart]);
  const cartCount = useMemo(() => syncedCart.reduce((count, item) => count + item.quantity, 0), [syncedCart]);

  const contextValue = useMemo(() => ({
    cart: syncedCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateCustomizationName,
    clearCart,
    cartTotal,
    cartCount
  }), [syncedCart, addToCart, removeFromCart, updateQuantity, updateCustomizationName, clearCart, cartTotal, cartCount]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
