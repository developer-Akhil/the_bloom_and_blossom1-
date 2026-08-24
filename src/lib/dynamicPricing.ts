import { useProductContext } from '../context/ProductContext';

// Legacy hook wrapper for compatibility
export const useDynamicProducts = (_baseProducts?: any) => {
  const { products } = useProductContext();
  return products;
};

export const updateDynamicPricesBatch = async (updates: Record<string, number>) => {
  if (Object.keys(updates).length === 0) return;

  // 1. Instantly update local
  const dynamicPrices = JSON.parse(localStorage.getItem('bloom_dynamic_prices') || '{}');
  Object.entries(updates).forEach(([id, price]) => {
    dynamicPrices[id] = price;
  });
  localStorage.setItem('bloom_dynamic_prices', JSON.stringify(dynamicPrices));
  window.dispatchEvent(new Event('dynamic_price_updated'));

  // 2. Persist to Express backend which uses Service Role
  try {
    const response = await fetch('/api/admin/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to sync prices to DB:", errorData);
    }
  } catch (e) {
    console.error("Express sync exception:", e);
  }
};

export const updateDynamicPrice = async (productId: string, newPrice: number) => {
  return updateDynamicPricesBatch({ [productId]: newPrice });
};

export const updateAttributesBatch = async (updates: Record<string, {
   is_best_seller?: boolean;
   is_new_arrival?: boolean;
   is_on_sale?: boolean;
   is_festival?: boolean;
   original_price?: number;
   description?: string;
}>) => {
   if (Object.keys(updates).length === 0) return;
   
   try {
     const response = await fetch('/api/admin/attributes', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ updates })
     });
     if (!response.ok) {
        console.error("Failed to sync attributes to DB", await response.json());
     }
   } catch (e) {
     console.error("Express sync exception:", e);
   }
};

export const updateFestivalProducts = async (festivalIds: string[], allProductIds?: string[]) => {
  localStorage.setItem('bloom_festival_products', JSON.stringify(festivalIds));
  window.dispatchEvent(new Event('festival_products_updated'));
  
  if (allProductIds) {
     const updates: Record<string, any> = {};
     allProductIds.forEach(id => {
         updates[id] = { is_festival: festivalIds.includes(id) };
     });
     await updateAttributesBatch(updates);
  }
};

export const updateFestivalConfig = async (config: { enabled?: boolean; title?: string; subtitle?: string }) => {
  const current = JSON.parse(localStorage.getItem('bloom_festival_config') || '{"enabled":true,"title":"Festival / Occasion","subtitle":"Handcrafted festive hair accessories & special occasion drops."}');
  const updated = { ...current, ...config };
  localStorage.setItem('bloom_festival_config', JSON.stringify(updated));
  window.dispatchEvent(new Event('festival_config_updated'));

  try {
    const response = await fetch('/api/admin/festival-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated)
    });
    if (!response.ok) {
      console.error("Failed to sync festival config to DB", await response.json());
    }
  } catch (e) {
    console.error("Express sync festival config exception:", e);
  }
};

export const updateBestSellers = async (bestSellerIds: string[], allProductIds?: string[]) => {
  localStorage.setItem('bloom_best_sellers', JSON.stringify(bestSellerIds));
  window.dispatchEvent(new Event('best_sellers_updated'));
  
  if (allProductIds) {
     const updates: Record<string, any> = {};
     allProductIds.forEach(id => {
         updates[id] = { is_best_seller: bestSellerIds.includes(id) };
     });
     await updateAttributesBatch(updates);
  }
};

export const updateNewArrivals = async (newArrivalIds: string[], allProductIds?: string[]) => {
  localStorage.setItem('bloom_new_arrivals', JSON.stringify(newArrivalIds));
  window.dispatchEvent(new Event('new_arrivals_updated'));
  
  if (allProductIds) {
     const updates: Record<string, any> = {};
     allProductIds.forEach(id => {
         updates[id] = { is_new_arrival: newArrivalIds.includes(id) };
     });
     await updateAttributesBatch(updates);
  }
};

export const updateAvailabilityBatch = async (updates: Record<string, boolean>) => {
  if (Object.keys(updates).length === 0) return;

  // 1. Instantly update local
  const localAvailability = JSON.parse(localStorage.getItem('bloom_product_availability') || '{}');
  Object.entries(updates).forEach(([id, inStock]) => {
    localAvailability[id] = inStock;
  });
  localStorage.setItem('bloom_product_availability', JSON.stringify(localAvailability));
  window.dispatchEvent(new Event('availability_updated'));

  // 2. Persist to Express backend which uses Service Role
  try {
    const response = await fetch('/api/admin/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ updates })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("Failed to sync availability to DB:", errorData);
    }
  } catch (e) {
    console.error("Express sync exception:", e);
  }
};

export const updateOnSale = async (onSaleIds: string[], allProductIds?: string[]) => {
  localStorage.setItem('bloom_on_sale', JSON.stringify(onSaleIds));
  window.dispatchEvent(new Event('on_sale_updated'));

  if (allProductIds) {
     const updates: Record<string, any> = {};
     allProductIds.forEach(id => {
         updates[id] = { is_on_sale: onSaleIds.includes(id) };
     });
     await updateAttributesBatch(updates);
  }
};

export const updateOriginalPricesBatch = async (updates: Record<string, number>) => {
  if (Object.keys(updates).length === 0) return;

  const originalPrices = JSON.parse(localStorage.getItem('bloom_original_prices') || '{}');
  const dbUpdates: Record<string, any> = {};
  
  Object.entries(updates).forEach(([id, price]) => {
    originalPrices[id] = price;
    dbUpdates[id] = { original_price: price };
  });
  localStorage.setItem('bloom_original_prices', JSON.stringify(originalPrices));
  window.dispatchEvent(new Event('original_price_updated'));
  
  await updateAttributesBatch(dbUpdates);
};

export const updateDescriptionsBatch = async (updates: Record<string, string>) => {
  if (Object.keys(updates).length === 0) return;

  const descriptions = JSON.parse(localStorage.getItem('bloom_descriptions') || '{}');
  const dbUpdates: Record<string, any> = {};

  Object.entries(updates).forEach(([id, desc]) => {
    descriptions[id] = desc;
    dbUpdates[id] = { description: desc };
  });
  localStorage.setItem('bloom_descriptions', JSON.stringify(descriptions));
  window.dispatchEvent(new Event('descriptions_updated'));
  
  await updateAttributesBatch(dbUpdates);
};

