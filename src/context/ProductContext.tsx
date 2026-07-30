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
    const localPrices = localStorage.getItem('bloom_dynamic_prices');
    return localPrices ? JSON.parse(localPrices) : {};
  });
  const [bestSellersSet, setBestSellersSet] = useState<Set<string>>(() => {
    const localBestSellers = localStorage.getItem('bloom_best_sellers');
    return localBestSellers ? new Set(JSON.parse(localBestSellers)) : new Set();
  });
  const [newArrivalsSet, setNewArrivalsSet] = useState<Set<string>>(() => {
    const localNewArrivals = localStorage.getItem('bloom_new_arrivals');
    return localNewArrivals ? new Set(JSON.parse(localNewArrivals)) : new Set();
  });
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, boolean>>(() => {
    const localAvailability = localStorage.getItem('bloom_product_availability');
    return localAvailability ? JSON.parse(localAvailability) : {};
  });
  const [onSaleSet, setOnSaleSet] = useState<Set<string>>(() => {
    const localOnSale = localStorage.getItem('bloom_on_sale');
    return localOnSale ? new Set(JSON.parse(localOnSale)) : new Set();
  });
  const [originalPriceOverrides, setOriginalPriceOverrides] = useState<Record<string, number>>(() => {
    const localPrices = localStorage.getItem('bloom_original_prices');
    return localPrices ? JSON.parse(localPrices) : {};
  });
  const [descriptionOverrides, setDescriptionOverrides] = useState<Record<string, string>>(() => {
    const localDesc = localStorage.getItem('bloom_descriptions');
    return localDesc ? JSON.parse(localDesc) : {};
  });

  const fetchSupabaseData = useCallback(async () => {
    try {
      const { data: priceData, error: priceError } = await supabase.from('dynamic_prices').select('product_id, price');
      if (!priceError && priceData && priceData.length > 0) {
        const newMap = JSON.parse(localStorage.getItem('bloom_dynamic_prices') || '{}');
        priceData.forEach(item => { newMap[item.product_id] = item.price; });
        localStorage.setItem('bloom_dynamic_prices', JSON.stringify(newMap));
        setPriceOverrides(newMap);
      }

      const { data: availData, error: availError } = await supabase.from('product_availability').select('product_id, in_stock');
      if (!availError && availData && availData.length > 0) {
        const availMap = JSON.parse(localStorage.getItem('bloom_product_availability') || '{}');
        availData.forEach(item => { availMap[item.product_id] = item.in_stock; });
        localStorage.setItem('bloom_product_availability', JSON.stringify(availMap));
        setAvailabilityMap(availMap);
      }

      const { data: attrData, error: attrError } = await supabase.from('product_attributes').select('*');
      if (!attrError && attrData && attrData.length > 0) {
         const newBestSellers = new Set<string>(JSON.parse(localStorage.getItem('bloom_best_sellers') || '[]'));
         const newNewArrivals = new Set<string>(JSON.parse(localStorage.getItem('bloom_new_arrivals') || '[]'));
         const newOnSale = new Set<string>(JSON.parse(localStorage.getItem('bloom_on_sale') || '[]'));
         const newOriginalPrices = JSON.parse(localStorage.getItem('bloom_original_prices') || '{}');
         const newDescriptions = JSON.parse(localStorage.getItem('bloom_descriptions') || '{}');

         attrData.forEach(item => {
            if (item.is_best_seller) newBestSellers.add(item.product_id); else newBestSellers.delete(item.product_id);
            if (item.is_new_arrival) newNewArrivals.add(item.product_id); else newNewArrivals.delete(item.product_id);
            if (item.is_on_sale) newOnSale.add(item.product_id); else newOnSale.delete(item.product_id);
            if (item.original_price !== null) newOriginalPrices[item.product_id] = item.original_price;
            if (item.description !== null) newDescriptions[item.product_id] = item.description;
         });

         localStorage.setItem('bloom_best_sellers', JSON.stringify(Array.from(newBestSellers)));
         localStorage.setItem('bloom_new_arrivals', JSON.stringify(Array.from(newNewArrivals)));
         localStorage.setItem('bloom_on_sale', JSON.stringify(Array.from(newOnSale)));
         localStorage.setItem('bloom_original_prices', JSON.stringify(newOriginalPrices));
         localStorage.setItem('bloom_descriptions', JSON.stringify(newDescriptions));

         setBestSellersSet(newBestSellers);
         setNewArrivalsSet(newNewArrivals);
         setOnSaleSet(newOnSale);
         setOriginalPriceOverrides(newOriginalPrices);
         setDescriptionOverrides(newDescriptions);
      }
    } catch (e) {
      console.error("Supabase sync Error:", e);
    }
  }, []);

  useEffect(() => {
    fetchSupabaseData();
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
       window.removeEventListener('dynamic_price_updated', handleUpdate);
       window.removeEventListener('best_sellers_updated', handleBestSellersUpdate);
       window.removeEventListener('new_arrivals_updated', handleNewArrivalsUpdate);
       window.removeEventListener('availability_updated', handleAvailabilityUpdate);
       window.removeEventListener('on_sale_updated', handleOnSaleUpdate);
       window.removeEventListener('original_price_updated', handleOriginalPricesUpdate);
       window.removeEventListener('descriptions_updated', handleDescriptionsUpdate);
    };
  }, [fetchSupabaseData]);

  const mergedProducts = useMemo(() => {
    const consumedAssetIds = new Set<string>();

    let updatedProducts = baseProducts.map((product) => {
      let updatedProduct = { ...product };
      if (priceOverrides[product.id]) updatedProduct.price = priceOverrides[product.id];
      
      const adminBestSellersStr = localStorage.getItem('bloom_best_sellers');
      if (adminBestSellersStr) {
          updatedProduct.isBestSeller = bestSellersSet.has(product.id);
      }

      const adminNewArrivalsStr = localStorage.getItem('bloom_new_arrivals');
      if (adminNewArrivalsStr) {
          updatedProduct.isNewArrival = newArrivalsSet.has(product.id);
      }

      const adminOnSaleStr = localStorage.getItem('bloom_on_sale');
      if (adminOnSaleStr) {
          updatedProduct.isOnSale = onSaleSet.has(product.id);
      }

      if (originalPriceOverrides[product.id]) {
          updatedProduct.originalPrice = originalPriceOverrides[product.id];
      }
      if (descriptionOverrides[product.id]) {
          updatedProduct.description = descriptionOverrides[product.id];
      }

      const adminAvailStr = localStorage.getItem('bloom_product_availability');
      if (adminAvailStr) {
          updatedProduct.inStock = availabilityMap[product.id] !== false;
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
                 
            // If we successfully filtered it down to distinguishing words, use those. 
            // If it's empty (e.g. the product name is just "Scrunchies"), fallback to just requiring the name.
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
        let isBestSeller = false;
        let isNewArrival = false;
        let inStock = true;
        const adminBestSellersStr = localStorage.getItem('bloom_best_sellers');
        if (adminBestSellersStr) {
           isBestSeller = bestSellersSet.has(productId);
        }
        const adminNewArrivalsStr = localStorage.getItem('bloom_new_arrivals');
        if (adminNewArrivalsStr) {
           isNewArrival = newArrivalsSet.has(productId);
        }
        const adminAvailStr = localStorage.getItem('bloom_product_availability');
        if (adminAvailStr) {
           inStock = availabilityMap[productId] !== false;
        }

        newlyConstructedProducts.push({
           id: productId,
           name: productName, 
           category: categoryTitle,
           price: priceOverrides[productId] || 149,
           description: descriptionOverrides[productId] || `Beautifully handcrafted ${categoryTitle}.`,
           images: [asset.file_url],
           stock: 10,
           inStock,
           isCustomizable: false,
           isBestSeller,
           isNewArrival,
           rating: 5.0
        });
    });

    return [...updatedProducts, ...newlyConstructedProducts];
  }, [baseProducts, assets, allAssets, folders, priceOverrides, originalPriceOverrides, descriptionOverrides, bestSellersSet, newArrivalsSet, availabilityMap, onSaleSet]);

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
    <ProductContext.Provider value={{ products: mergedProducts, categories: mergedCategories, loading: mediaLoading, refreshProducts: fetchSupabaseData }}>
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
