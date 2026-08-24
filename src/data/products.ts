import { type Product, type Category, type ProductVariant } from '../types';
import productConfigRaw from '../config/config_product.json';

export const categories: string[] = [
  'Customised Name Bows',
  'Premium Doll Bows',
  'Jewelled Bows',
  'Alligator Clips',
  'Scrunchies',
  'Bows',
  'Headbands',
  'Hairbands',
  'Embroideries',
  'Crochet Clips',
  'Customised Name Sunglasses',
  'Customised Caps'
];

export const products: Product[] = [];
let autoId = 1000;
const processedLocations = new Set<string>();

// Build a Set of all available local images at compile time
const availableLocalImages = new Set<string>();
try {
  // Vite feature to get all files in a directory
  const localFiles = (import.meta as any).glob('../../public/images/**/*', { eager: true });
  for (const path of Object.keys(localFiles)) {
    // path looks like ../../public/images/collections/...
    // We store it as /images/collections/...
    const cleanPath = path.replace(/^.*\/public/, '');
    availableLocalImages.add(cleanPath);
  }
} catch (e) {
  console.warn('Could not read local images', e);
}

/**
 * Helper to safely parse string prices (e.g. "", "200") into stable numbers.
 */
function parsePrice(val: any, defaultPrice = 199): number {
  if (val === undefined || val === null || val === "") return defaultPrice;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? defaultPrice : parsed;
}

/**
 * Helper to resolve empty or placeholder local image paths into high-quality, professional fashion assets.
 */
export function resolveImageUrl(url: string): string {
  if (!url) return '';
  // Normalize path format so it always routes cleanly to /images/...
  let clean = url.replace(/^\/?public\//, '/');
  if (!clean.startsWith('/')) clean = '/' + clean;
  
  // Extract filename and parent folder
  const parts = clean.split('/');
  const filename = (parts.pop() || '').toLowerCase();
  const parentFolder = (parts.pop() || '').toLowerCase();

  // Curated direct mapping for missing fallback assets
  const curatedMap: Record<string, string> = {
    '/images/product_images/hairbands.jpg': 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/headbands.jpg': 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/jewelled_bows.jpg': 'https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/premium_doll_bows.jpg': 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/scrunchies.jpg': 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/alligator_clips.jpg': 'https://images.unsplash.com/photo-1605497746444-ac9db1340459?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/bows.jpg': 'https://images.unsplash.com/photo-1605497746444-ac9db1340459?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/embroideries.jpg': 'https://images.unsplash.com/photo-1605497746444-ac9db1340459?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/crochet_clips.jpg': 'https://images.unsplash.com/photo-1605497746444-ac9db1340459?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/customised_name_bows.jpg': 'https://images.unsplash.com/photo-1605497746444-ac9db1340459?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/customised_name_sunglasses.jpg': 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop',
    '/images/product_images/customised_caps.jpg': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop',
    '/images/home_images/hero.jpg': 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=1920&auto=format&fit=crop',
  };

  if (curatedMap[clean]) {
    return curatedMap[clean];
  }

  return clean;
}

/**
 * 1. Parse and map all fields from config_product.json
 * 
 * The JSON configuration uses a 2-level macro structure:
 * Top-level -> Category names (e.g. "Customised Name Bows")
 * Second-level -> 
 *   Case A: Image Path (e.g. "public/images/...") -> Standalone Product
 *   Case B: Product Name (e.g. "Scrunchies") -> Grouped Product with variations
 */
const collectionsObj = (productConfigRaw as any).Collections || productConfigRaw;

export const rawHomeImages = (productConfigRaw as any).home_images || {};
export const rawProductImages = (productConfigRaw as any).product_images || {};
export const rawLogoData = (productConfigRaw as any).logo || {};

for (const [macroCategory, macroCategoryObj] of Object.entries(collectionsObj)) {
  if (!macroCategoryObj || typeof macroCategoryObj !== 'object') continue;

  // Dynamically push any missing categories
  if (!categories.includes(macroCategory)) {
    categories.push(macroCategory);
  }

  for (const [subKey, subValue] of Object.entries(macroCategoryObj)) {
    if (!subValue || typeof subValue !== 'object') continue;

    if (subKey.startsWith('public/')) {
      // --- Case A: Standalone Product ---
      const location = subKey;
      const baseCleanUrl = location.startsWith('public') ? location.substring(6) : location;
      const cleanUrl = resolveImageUrl(baseCleanUrl);
      
      const configData = subValue as any;
      const parts = location.split('/');
      const filename = parts.pop() || '';
      
      // Auto-generate a friendly name from filename if not defined in JSON
      const friendlyProductName = filename.replace(/\.[^/.]+$/, "").replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      // Destructure and assign JSON strongly typed properties
      const name = configData.Name || friendlyProductName;
      const price = parsePrice(configData.Price);
      const code = configData.Code;
      const stockVal = configData.Stock ?? configData.stock;
      const ratingVal = configData.Rating ?? configData.rating;
      const customVal = configData.IsCustomizable ?? configData.isCustomizable;
      const bestVal = configData.IsBestSeller ?? configData.isBestSeller;

      const stock = stockVal !== undefined ? parseInt(String(stockVal), 10) : 50;
      const rating = ratingVal !== undefined ? parseFloat(String(ratingVal)) : 5.0;
      const isCustomizable = customVal !== undefined ? String(customVal).toLowerCase() === 'true' : false;
      const isBestSeller = bestVal !== undefined ? String(bestVal).toLowerCase() === 'true' : false;

      products.push({
        id: `prod_${autoId++}`,
        code,
        name,
        category: macroCategory as Category,
        price,
        description: `Premium ${macroCategory.toLowerCase()} designed to elevate your everyday style.`,
        images: [cleanUrl],
        stock,
        rating,
        isCustomizable,
        isBestSeller
      });

      processedLocations.add(baseCleanUrl);

    } else {
      // --- Case B: Grouped Product with Variants (The subKey is the Grouped Product Title) ---
      const productName = subKey;
      const variantsObj = subValue as Record<string, any>;
      
      const variants: ProductVariant[] = [];
      const images: string[] = [];
      let groupPrice = 199; // Fallback price
      let groupCustomizable = false;
      let groupBestSeller = true;
      let groupRating = 5.0;
      
      let isFirst = true;

      for (const [varLocation, varConfig] of Object.entries(variantsObj)) {
        if (!varLocation.startsWith('public/')) continue;
        
        const baseCleanUrl = varLocation.startsWith('public') ? varLocation.substring(6) : varLocation;
        const cleanUrl = resolveImageUrl(baseCleanUrl);
        images.push(cleanUrl);
        processedLocations.add(baseCleanUrl);

        const vPrice = parsePrice(varConfig.Price);
        const vStockVal = varConfig.Stock ?? varConfig.stock;
        const vRatingVal = varConfig.Rating ?? varConfig.rating;
        const vCustomVal = varConfig.IsCustomizable ?? varConfig.isCustomizable;
        const vBestVal = varConfig.IsBestSeller ?? varConfig.isBestSeller;

        const vStock = vStockVal !== undefined ? parseInt(String(vStockVal), 10) : 50;
        
        // Parent matches the price & fields of the first child variant parsed
        if (isFirst) {
          groupPrice = vPrice;
          groupCustomizable = vCustomVal !== undefined ? String(vCustomVal).toLowerCase() === 'true' : false;
          groupBestSeller = vBestVal !== undefined ? String(vBestVal).toLowerCase() === 'true' : false;
          groupRating = vRatingVal !== undefined ? parseFloat(String(vRatingVal)) : 5.0;
          isFirst = false;
        }

        variants.push({
          code: varConfig.Code,
          color: varConfig.Name || 'Standard',
          image: cleanUrl,
          price: vPrice,
          stock: vStock,
          rating: vRatingVal !== undefined ? parseFloat(String(vRatingVal)) : 5.0
        });
      }

      if (images.length > 0) {
        products.push({
          id: `prod_grp_${autoId++}`,
          name: productName,
          category: macroCategory as Category,
          price: groupPrice,
          description: `Premium ${productName.toLowerCase()} available in multiple variations designed to elevate your everyday style.`,
          images,
          variants,
          stock: variants.reduce((total, v) => total + (v.stock || 0), 0),
          rating: groupRating,
          isCustomizable: groupCustomizable,
          isBestSeller: groupBestSeller,
          options: [{
            name: 'Color',
            values: variants.map(v => v.color || 'Standard')
          }]
        });
      }
    }
  }
}

// 2. Fallback Auto-discovery Scanner
// Finds any unmapped images residing in collections on disk, ignoring .keep or generic root levels.
const diskImages = (import.meta as any).glob('/public/images/collections/**/*.{jpg,jpeg,png,webp}', { eager: true });

Object.keys(diskImages).forEach(path => {
    // Skip placeholder keep files
    if (path.endsWith('.keep')) return;

    const baseCleanUrl = path.startsWith('/public') ? path.substring(7) : path.startsWith('public') ? path.substring(6) : path;
    const cleanUrl = resolveImageUrl(baseCleanUrl);

    if (processedLocations.has(baseCleanUrl)) return; // Avoid duplicates

    const parts = path.split('/');
    const filename = parts.pop() || '';
    const folderName = parts.pop() || ''; // Folder maps to naive category
    
    // Ignore top structural folder
    if (folderName === 'collections') return;

    const categoryName = folderName.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    const friendlyProductName = filename.replace(/\.[^/.]+$/, "").replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    if (categoryName && !categories.includes(categoryName)) {
        categories.push(categoryName);
    }

    products.push({
        id: `auto_${autoId++}`,
        name: friendlyProductName,
        category: categoryName as Category,
        price: 199, // default fallback price
        description: `Premium ${categoryName.toLowerCase()} designed to elevate your everyday style.`,
        images: [cleanUrl],
        stock: 50,
        rating: 5.0,
        isCustomizable: false,
        isBestSeller: false
    });
});

