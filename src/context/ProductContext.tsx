import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { type Product } from '../types';
import { products as baseProducts, categories as baseCategories } from '../data/products';
import { useMediaContext } from './MediaContext';
import { supabase } from '../lib/supabase';

interface ProductContextType {
  products: Product[];
  categories: string[];
  loading: boolean;
  refreshProducts: () => Promise<void>;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const { assets, allAssets, folders, loading: mediaLoading } = useMediaContext();

  const [priceOverrides, setPriceOverrides] = useState<Record<string, number>>(() => {
    try {
      const localPrices = localStorage.getItem('bloom_dynamic_prices');
      return localPrices ? JSON.parse(localPrices) : {};
    } catch {
      return {};
    }
  });

  const [bestSellersSet, setBestSellersSet] = useState<Set<string>>(() => {
    try {
      const localBestSellers = localStorage.getItem('bloom_best_sellers');
      return localBestSellers ? new Set(JSON.parse(localBestSellers)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [newArrivalsSet, setNewArrivalsSet] = useState<Set<string>>(() => {
    try {
      const localNewArrivals = localStorage.getItem('bloom_new_arrivals');
      return localNewArrivals ? new Set(JSON.parse(localNewArrivals)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>(() => {
    try {
      const localAvailability = localStorage.getItem('bloom_product_availability');
      return localAvailability ? JSON.parse(localAvailability) : {};
    } catch {
      return {};
    }
  });

  const [onSaleSet, setOnSaleSet] = useState<Set<string>>(() => {
    try {
      const localOnSale = localStorage.getItem('bloom_on_sale');
      return localOnSale ? new Set(JSON.parse(localOnSale)) : new Set();
    } catch {
      return new Set();
    }
  });

  const [originalPriceOverrides, setOriginalPriceOverrides] = useState<Record<string, number>>(() => {
    try {
      const localPrices = localStorage.getItem('bloom_original_prices');
      return localPrices ? JSON.parse(localPrices) : {};
    } catch {
      return {};
    }
  });

  const [descriptionOverrides, setDescriptionOverrides] = useState<Record<string, string>>(() => {
    try {
      const localDesc = localStorage.getItem('bloom_descriptions');
      return localDesc ? JSON.parse(localDesc) : {};
    } catch {
      return {};
    }
  });

  const [isServerLoaded, setIsServerLoaded] = useState(false);

  // Fetch product settings (availability, prices, attributes) from Server API (works across all devices)
  const fetchProductSettings = useCallback(async () => {
    try {
      // 1. Fetch from server API endpoint (persisted across all devices)
      const res = await fetch('/api/products/settings');
      if (res.ok) {
        const json = await res.json();
        if (json.settings) {
          const { 
            availability, 
            pricing, 
            original_prices, 
            best_sellers, 
            new_arrivals, 
            on_sale, 
            descriptions 
          } = json.settings;

          if (availability && typeof availability === 'object') {
            setAvailabilityMap(availability);
            localStorage.setItem('bloom_product_availability', JSON.stringify(availability));
          }

          if (pricing && typeof pricing === 'object') {
            setPriceOverrides(pricing);
            localStorage.setItem('bloom_dynamic_prices', JSON.stringify(pricing));
          }

          if (original_prices && typeof original_prices === 'object') {
            setOriginalPriceOverrides(original_prices);
            localStorage.setItem('bloom_original_prices', JSON.stringify(original_prices));
          }

          if (Array.isArray(best_sellers)) {
            setBestSellersSet(new Set(best_sellers));
            localStorage.setItem('bloom_best_sellers', JSON.stringify(best_sellers));
          }

          if (Array.isArray(new_arrivals)) {
            setNewArrivalsSet(new Set(new_arrivals));
            localStorage.setItem('bloom_new_arrivals', JSON.stringify(new_arrivals));
          }

          if (Array.isArray(on_sale)) {
            setOnSaleSet(new Set(on_sale));
            localStorage.setItem('bloom_on_sale', JSON.stringify(on_sale));
          }

          if (descriptions && typeof descriptions === 'object') {
            setDescriptionOverrides(descriptions);
            localStorage.setItem('bloom_descriptions', JSON.stringify(descriptions));
          }

          setIsServerLoaded(true);
        }
      }
    } catch (apiErr) {
      console.warn("Could not fetch /api/products/settings:", apiErr);
    }

    // 2. Fallback / Direct Supabase sync if configured
    try {
      const { data: availData, error: availError } = await supabase.from('product_availability').select('product_id, in_stock');
      if (!availError && availData && availData.length > 0) {
        setAvailabilityMap(prev => {
          const next = { ...prev };
          availData.forEach(item => { next[item.product_id] = item.in_stock; });
          localStorage.setItem('bloom_product_availability', JSON.stringify(next));
          return next;
        });
      }

      const { data: priceData, error: priceError } = await supabase.from('dynamic_prices').select('product_id, price');
      if (!priceError && priceData && priceData.length > 0) {
        setPriceOverrides(prev => {
          const next = { ...prev };
          priceData.forEach(item => { next[item.product_id] = item.price; });
          localStorage.setItem('bloom_dynamic_prices', JSON.stringify(next));
          return next;
        });
      }

      const { data: attrData, error: attrError } = await supabase.from('product_attributes').select('*');
      if (!attrError && attrData && attrData.length > 0) {
         const newBestSellers = new Set<string>();
         const newNewArrivals = new Set<string>();
         const newOnSale = new Set<string>();
         const newOriginalPrices: Record<string, number> = {};
         const newDescriptions: Record<string, string> = {};

         attrData.forEach(item => {
            if (item.is_best_seller) newBestSellers.add(item.product_id);
            if (item.is_new_arrival) newNewArrivals.add(item.product_id);
            if (item.is_on_sale) newOnSale.add(item.product_id);
            if (item.original_price !== null && item.original_price !== undefined) newOriginalPrices[item.product_id] = item.original_price;
            if (item.description !== null && item.description !== undefined) newDescriptions[item.product_id] = item.description;
         });

         if (newBestSellers.size > 0) {
           setBestSellersSet(newBestSellers);
           localStorage.setItem('bloom_best_sellers', JSON.stringify(Array.from(newBestSellers)));
         }
         if (newNewArrivals.size > 0) {
           setNewArrivalsSet(newNewArrivals);
           localStorage.setItem('bloom_new_arrivals', JSON.stringify(Array.from(newNewArrivals)));
         }
         if (newOnSale.size > 0) {
           setOnSaleSet(newOnSale);
           localStorage.setItem('bloom_on_sale', JSON.stringify(Array.from(newOnSale)));
         }
         if (Object.keys(newOriginalPrices).length > 0) {
           setOriginalPriceOverrides(prev => ({ ...prev, ...newOriginalPrices }));
           localStorage.setItem('bloom_original_prices', JSON.stringify(newOriginalPrices));
         }
         if (Object.keys(newDescriptions).length > 0) {
           setDescriptionOverrides(prev => ({ ...prev, ...newDescriptions }));
           localStorage.setItem('bloom_descriptions', JSON.stringify(newDescriptions));
         }
      }
    } catch (supabaseErr) {
      // Supabase is optional
    }
  }, []);

  useEffect(() => {
    fetchProductSettings();

    // Re-fetch when browser window/tab regains focus
    const onFocus = () => {
      fetchProductSettings();
    };
    window.addEventListener('focus', onFocus);

    const handleUpdate = () => {
      const localPrices = localStorage.getItem('bloom_dynamic_prices');
      if (localPrices) setPriceOverrides(JSON.parse(localPrices));
    };
    const handleBestSellersUpdate = () => {
      const localBestSellers = localStorage.getItem('bloom_best_sellers');
      if (localBestSellers) setBestSellersSet(new Set(JSON.parse(localBestSellers)));
    };
    const handleNewArrivalsUpdate = () => {
      const localNewArrivals = localStorage.getItem('bloom_new_arrivals');
      if (localNewArrivals) setNewArrivalsSet(new Set(JSON.parse(localNewArrivals)));
    };
    const handleAvailabilityUpdate = () => {
      const localAvailability = localStorage.getItem('bloom_product_availability');
      if (localAvailability) setAvailabilityMap(JSON.parse(localAvailability));
    };
    const handleOnSaleUpdate = () => {
      const localOnSale = localStorage.getItem('bloom_on_sale');
      if (localOnSale) setOnSaleSet(new Set(JSON.parse(localOnSale)));
    };
    const handleOriginalPricesUpdate = () => {
      const localPrices = localStorage.getItem('bloom_original_prices');
      if (localPrices) setOriginalPriceOverrides(JSON.parse(localPrices));
    };
    const handleDescriptionsUpdate = () => {
      const localDesc = localStorage.getItem('bloom_descriptions');
      if (localDesc) setDescriptionOverrides(JSON.parse(localDesc));
    };

    window.addEventListener('dynamic_price_updated', handleUpdate);
    window.addEventListener('best_sellers_updated', handleBestSellersUpdate);
    window.addEventListener('new_arrivals_updated', handleNewArrivalsUpdate);
    window.addEventListener('availability_updated', handleAvailabilityUpdate);
    window.addEventListener('on_sale_updated', handleOnSaleUpdate);
    window.addEventListener('original_price_updated', handleOriginalPricesUpdate);
    window.addEventListener('descriptions_updated', handleDescriptionsUpdate);

    return () => {
       window.removeEventListener('focus', onFocus);
       window.removeEventListener('dynamic_price_updated', handleUpdate);
       window.removeEventListener('best_sellers_updated', handleBestSellersUpdate);
       window.removeEventListener('new_arrivals_updated', handleNewArrivalsUpdate);
       window.removeEventListener('availability_updated', handleAvailabilityUpdate);
       window.removeEventListener('on_sale_updated', handleOnSaleUpdate);
       window.removeEventListener('original_price_updated', handleOriginalPricesUpdate);
       window.removeEventListener('descriptions_updated', handleDescriptionsUpdate);
    };
  }, [fetchProductSettings]);

  const mergedProducts = useMemo(() => {
    const consumedAssetIds = new Set<string>();

    let updatedProducts = baseProducts.map((product) => {
      let updatedProduct = { ...product };

      // 1. Dynamic Pricing Override
      if (priceOverrides[product.id] !== undefined && priceOverrides[product.id] > 0) {
        updatedProduct.price = priceOverrides[product.id];
      }
      
      // 2. Best Seller Status
      if (bestSellersSet.size > 0) {
        updatedProduct.isBestSeller = bestSellersSet.has(product.id);
      }

      // 3. New Arrival Status
      if (newArrivalsSet.size > 0) {
        updatedProduct.isNewArrival = newArrivalsSet.has(product.id);
      }

      // 4. On Sale Status
      if (onSaleSet.size > 0) {
        updatedProduct.isOnSale = onSaleSet.has(product.id);
      }

      // 5. Original Price Override
      if (originalPriceOverrides[product.id] !== undefined && originalPriceOverrides[product.id] > 0) {
        updatedProduct.originalPrice = originalPriceOverrides[product.id];
      }

      // 6. Description Override
      if (descriptionOverrides[product.id] !== undefined && descriptionOverrides[product.id].trim() !== '') {
        updatedProduct.description = descriptionOverrides[product.id];
      }

      // 7. Product Availability (In Stock / Out of Stock)
      // Check server availabilityMap first (keyed by product ID), fallback to base product inStock
      if (availabilityMap[product.id] !== undefined) {
        updatedProduct.inStock = availabilityMap[product.id] === true;
      } else if (product.inStock !== undefined) {
        updatedProduct.inStock = product.inStock;
      } else {
        updatedProduct.inStock = true;
      }

      const productAssets = allAssets.filter(a => a.id.startsWith(`builtin_${product.id}_`));
      updatedProduct.images = product.images.filter((_img, idx) => {
         const builtinMatch = productAssets.find(a => a.id === `builtin_${product.id}_${idx}`);
         return builtinMatch ? builtinMatch.is_active : true;
      });

      const slug = product.category.toLowerCase().replace(/\s+/g, '_');
      const customImages = assets
         .filter(a => a.folder_id === `collections/${slug}` || a.folder_id === 'our_best_sellers')
         .filter(a => {
            if (a.id.startsWith('builtin_')) { consumedAssetIds.add(a.id); return false; }
            const categoryWords = product.category.toLowerCase().split(' ');
            // Remove 's' from category words for singular matching (e.g. 'scrunchies' -> 'scrunchie')
            const singularCategoryWords = categoryWords.map(w => w.endsWith('s') ? w.slice(0, -1) : w);
            const ignoreWords = new Set([...categoryWords, ...singularCategoryWords]);
            
            const searchName = a.file_name.toLowerCase();
            const keywords = product.name.toLowerCase().split(' ')
                 .filter(k => !ignoreWords.has(k) && k.length > 2);
                 
            if (keywords.length > 0) {
               return keywords.some(k => searchName.includes(k));
            }
            return searchName.includes(product.name.toLowerCase());
         });

      if (customImages.length > 0) {
         customImages.forEach(a => consumedAssetIds.add(a.id));
         const mergedImageUrls = [...customImages.map(a => a.file_url).reverse(), ...updatedProduct.images];
         updatedProduct.images = Array.from(new Set(mergedImageUrls));
      }
      return updatedProduct;
    }).filter(p => p.images.length > 0);

    const newlyConstructedProducts: Product[] = [];
    assets.forEach((asset) => {
        if (asset.id.startsWith('builtin_') || consumedAssetIds.has(asset.id)) return;
        
        let categoryTitle = '';
        if (asset.folder_id.startsWith('collections/')) {
          const foundFolder = folders.find(f => f.id === asset.folder_id);
          categoryTitle = foundFolder ? foundFolder.name : asset.folder_id.replace('collections/', '');
        } else if (asset.folder_id === 'product_images') {
          categoryTitle = asset.file_name.replace(/\.[^/.]+$/, "").replace(/_/g, ' ');
        } else return;
        
        categoryTitle = categoryTitle.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        const productName = asset.file_name.replace(/\.[^/.]+$/, "").replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

        // Skip products where the name matches the category exactly (likely a category thumbnail)
        if (asset.folder_id === 'product_images' && productName.toLowerCase() === categoryTitle.toLowerCase()) return;

        const productId = `custom_${asset.id}`;
        const inStock = availabilityMap[productId] !== undefined ? availabilityMap[productId] === true : true;
        const isBestSeller = bestSellersSet.has(productId);
        const isNewArrival = newArrivalsSet.has(productId);
        const isOnSale = onSaleSet.has(productId);

        newlyConstructedProducts.push({
           id: productId,
           name: productName, 
           category: categoryTitle,
           price: priceOverrides[productId] || 149,
           originalPrice: originalPriceOverrides[productId],
           description: descriptionOverrides[productId] || `Beautifully handcrafted ${categoryTitle}.`,
           images: [asset.file_url],
           stock: inStock ? 10 : 0,
           inStock,
           isCustomizable: false,
           isBestSeller,
           isNewArrival,
           isOnSale,
           rating: 5.0
        });
    });

    return [...updatedProducts, ...newlyConstructedProducts];
  }, [
    baseProducts, 
    assets, 
    allAssets, 
    folders, 
    priceOverrides, 
    originalPriceOverrides, 
    descriptionOverrides, 
    bestSellersSet, 
    newArrivalsSet, 
    availabilityMap, 
    onSaleSet, 
    isServerLoaded
  ]);

  const mergedCategories = useMemo(() => {
    const adminFolders = folders
      .filter(f => f.parent === 'collections')
      .map(f => f.name.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    
    // Use relative path for production build consistency
    const diskImages = (import.meta as any).glob('../../public/images/product_images/*', { eager: true });
    const autoCategories = Object.keys(diskImages)
      .filter(path => !path.endsWith('.keep'))
      .map(path => {
        const filename = path.split('/').pop() || '';
        const slug = filename.replace(/\.[^/.]+$/, "");
        return slug.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      });

    return Array.from(new Set([...baseCategories, ...adminFolders, ...autoCategories]));
  }, [folders]);

  return (
    <ProductContext.Provider value={{ 
      products: mergedProducts, 
      categories: mergedCategories, 
      loading: mediaLoading, 
      refreshProducts: fetchProductSettings 
    }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) throw new Error('useProductContext must be used within a ProductProvider');
  return context;
}

// Keep the hook for backward compatibility but make it a wrapper
export const useDynamicProducts = (_incomingBaseProducts?: any) => {
  const { products } = useProductContext();
  return products;
};
