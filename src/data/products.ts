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
  const localFiles = import.meta.glob('/public/images/**/*', { eager: true });
  for (const path of Object.keys(localFiles)) {
    // path looks like /public/images/collections/...
    // We store it as /images/collections/...
    availableLocalImages.add(path.replace('/public', ''));
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
  // Normalize path format
  const clean = url.startsWith('/') ? url : '/' + url;
  
  // Extract filename and parent folder to ensure laser-precision keyword matching without folder-name pollution
  const parts = clean.split('/');
  const filename = (parts.pop() || '').toLowerCase();
  const parentFolder = (parts.pop() || '').toLowerCase();

  // High-end curated direct mapping for exact known assets to ensure flawless premium storefront visuals
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

  // If the file actually exists in our local filesystem, use it!
  if (availableLocalImages.has(clean)) {
    return clean;
  }

  // A. Sunglasses Matching
  if (filename.includes('sunglasses') || parentFolder.includes('sunglasses')) {
    return 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop'; // Premium boutique sunglasses
  }

  // B. Cap / Hat Matching
  if (filename.includes('cap') || filename.includes('hat') || parentFolder.includes('cap') || parentFolder.includes('caps')) {
    return 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop'; // Clean minimalist fashion cap
  }

  // C. Headband & Hairband Matching
  if (filename.includes('headband') || filename.includes('hairband') || parentFolder.includes('headbands') || parentFolder.includes('hairbands')) {
    if (filename.includes('white') || filename.includes('pearl') || filename.includes('flower')) {
      return 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?q=80&w=800&auto=format&fit=crop'; // Exquisite white/cream fashion headband on model
    }
    return 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?q=80&w=800&auto=format&fit=crop'; // Golden-mustard headband style on model
  }

  // D. Scrunchie Matching
  if (filename.includes('scrunchie') || parentFolder.includes('scrunchies')) {
    return 'https://images.unsplash.com/photo-1601924994987-69e26d50dc26?q=80&w=800&auto=format&fit=crop'; // Luxurious silk accessories flatlay
  }

  // E. Crochet & Embroidery Matching
  if (filename.includes('crochet') || filename.includes('embroidery') || parentFolder.includes('crochet') || parentFolder.includes('embroidery')) {
    return 'https://images.unsplash.com/photo-1605497746444-ac9db1340459?q=80&w=800&auto=format&fit=crop'; // Premium handcrafted accessories
  }

  // F. Bows & Clips Color-Based Matching
  if (filename.includes('maroon') || filename.includes('red')) {
    return 'https://images.unsplash.com/photo-1576243345690-4e4b79b63288?q=80&w=800&auto=format&fit=crop'; // Crimson velvet bow in hair
  }
  if (filename.includes('black') || filename.includes('dark')) {
    return 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=800&auto=format&fit=crop'; // Dark premium hair bow aesthetic
  }
  if (filename.includes('silver') || filename.includes('sliver') || filename.includes('pearl') || filename.includes('crystal')) {
    return 'https://images.unsplash.com/photo-1632345031435-8797b2d58045?q=80&w=800&auto=format&fit=crop'; // Fine crystal pearl jewelry bow
  }
  if (filename.includes('gold') || filename.includes('yellow') || filename.includes('glitter')) {
    return 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop'; // Golden boutique hair embellishments
  }
  if (filename.includes('pink') || filename.includes('rose') || filename.includes('lavender') || filename.includes('purple') || filename.includes('peach') || filename.includes('candy') || filename.includes('daisy') || filename.includes('flower')) {
    return 'https://images.unsplash.com/photo-1605497746444-ac9db1340459?q=80&w=800&auto=format&fit=crop'; // Elegant pastel pink/peach clips
  }
  if (filename.includes('blue') || filename.includes('skyblue') || filename.includes('teal') || filename.includes('mint')) {
    return 'https://images.unsplash.com/photo-1605497746444-ac9db1340459?q=80&w=800&auto=format&fit=crop'; // High-end pastel styling
  }

  // G. General Bow Fallback
  if (filename.includes('clip') || filename.includes('bow') || parentFolder.includes('clips') || parentFolder.includes('bows')) {
    return 'https://images.unsplash.com/photo-1605497746444-ac9db1340459?q=80&w=800&auto=format&fit=crop'; // Elegant bow fallback
  }

  return url;
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
    if (path.endsWith('.keep')) return;
    
    // Clean public directory referencing
    const baseCleanUrl = path.replace('/public', '');
    const cleanUrl = resolveImageUrl(baseCleanUrl);
    
    // Skip if already mapped properly by JSON above
    if (processedLocations.has(baseCleanUrl)) return; 

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

console.log('PRODUCTS DUMP:', products.filter(p => p.name.includes('Pearl')));

