import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export interface MediaFolder {
  id: string;
  name: string;
  parent: string | null;
  isSystem?: boolean;
}

export interface MediaAsset {
  id: string;
  folder_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
  is_active: boolean;
}

interface MediaContextType {
  folders: MediaFolder[];
  assets: MediaAsset[];
  allAssets: MediaAsset[];
  loading: boolean;
  createFolder: (name: string, parentId: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  uploadImage: (folderId: string, file: File) => Promise<void>;
  toggleImageActive: (assetId: string) => Promise<void>;
  forceDeleteImage: (assetId: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

export function MediaProvider({ children }: { children: React.ReactNode }) {
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize folders and assets from localStorage/Sync
  useEffect(() => {
    const savedFolders = localStorage.getItem('bloom_folders');
    const savedAssets = localStorage.getItem('bloom_assets');

    if (savedFolders) {
      let currentFolders: MediaFolder[] = JSON.parse(savedFolders);
      const staleFolders = ['plan_scrunchies', 'plain_scrunchies', 'printed_scrunchies', 'printed_bows'];
      let updatedFolders = currentFolders
        .filter(f => !staleFolders.includes(f.name))
        .map(f => {
          if (f.id === 'collections/embroidery_bows' || f.name === 'Embroidery Bows') {
            return { ...f, id: 'collections/embroideries', name: 'Embroideries' };
          }
          return f;
        });

      // Ensure 'collections/embroideries' exists in default system folders
      if (!updatedFolders.some(f => f.id === 'collections/embroideries')) {
        updatedFolders.push({ id: 'collections/embroideries', name: 'Embroideries', parent: 'collections', isSystem: true });
      }
      
      setFolders(updatedFolders);
      localStorage.setItem('bloom_folders', JSON.stringify(updatedFolders));
    } else {
      const defaultFolders: MediaFolder[] = [
        { id: 'collections', name: 'Collections', parent: null, isSystem: true },
        { id: 'home_images', name: 'Home Hero', parent: null, isSystem: true },
        { id: 'logo', name: 'Logo', parent: null, isSystem: true },
        { id: 'our_best_sellers', name: 'Best Sellers', parent: null, isSystem: true },
        { id: 'product_images', name: 'Product Images', parent: null, isSystem: true },
        { id: 'collections/customised_name_bows', name: 'Customised Name Bows', parent: 'collections', isSystem: true },
        { id: 'collections/scrunchies', name: 'Scrunchies', parent: 'collections', isSystem: true },
        { id: 'collections/premium_doll_bows', name: 'Premium Doll Bows', parent: 'collections', isSystem: true },
        { id: 'collections/jewelled_bows', name: 'Jewelled Bows', parent: 'collections', isSystem: true },
        { id: 'collections/hairbands', name: 'Hairbands', parent: 'collections', isSystem: true },
        { id: 'collections/embroideries', name: 'Embroideries', parent: 'collections', isSystem: true },
        { id: 'collections/crochet_clips', name: 'Crochet Clips', parent: 'collections', isSystem: true },
        { id: 'collections/alligator_clips', name: 'Alligator Clips', parent: 'collections', isSystem: true },
        { id: 'collections/customised_name_sunglasses', name: 'Customised Name Sunglasses', parent: 'collections', isSystem: true },
        { id: 'collections/headbands', name: 'Headbands', parent: 'collections', isSystem: true },
      ];
      setFolders(defaultFolders);
      localStorage.setItem('bloom_folders', JSON.stringify(defaultFolders));
    }

    if (savedAssets) {
      let currentAssets: MediaAsset[] = JSON.parse(savedAssets);
      let needsUpdate = false;

      // Migration: Robust media URL migration and normalization layer
      const updatedAssets = currentAssets.map(asset => {
        let newUrl = asset.file_url || '';
        let newFileName = asset.file_name || '';
        let newFolderId = asset.folder_id || '';

        // 1. Fix legacy 'chochet' typos
        if (newUrl.includes('chochet') || newFileName.includes('chochet') || newFolderId.includes('chochet')) {
          newUrl = newUrl.replace('chochet', 'crochet');
          newFileName = newFileName.replace('chochet', 'crochet');
          newFolderId = newFolderId.replace('chochet', 'crochet');
        }

        // 2. Normalize absolute same-origin URLs
        if (newUrl.startsWith('http')) {
          try {
            const parsed = new URL(newUrl);
            if (parsed.pathname.includes('/images/') || parsed.pathname.includes('/public/')) {
              newUrl = parsed.pathname;
            }
          } catch (e) {
             // Safe fallback for malformed URLs
          }
        }

        // 3. Fix malformed or relative path prefixes
        if (newUrl.includes('/public/images/')) {
          newUrl = newUrl.replace(/^.*\/public\/images\//, '/images/');
        }
        if (newUrl.includes('images/')) {
          const splitPoint = newUrl.indexOf('images/');
          if (splitPoint >= 0 && newUrl[splitPoint - 1] !== '/') {
            newUrl = '/' + newUrl.slice(splitPoint);
          } else if (newUrl.startsWith('../') || newUrl.startsWith('./')) {
            newUrl = '/' + newUrl.slice(newUrl.indexOf('images/'));
          }
        }

        // 4. Force lowercase on collection directories (case-sensitive safety)
        if (newUrl.includes('/images/collections/')) {
          const parts = newUrl.split('/');
          const colIndex = parts.indexOf('collections');
          if (colIndex !== -1 && parts.length > colIndex + 1) {
            parts[colIndex + 1] = parts[colIndex + 1].toLowerCase();
            newUrl = parts.join('/');
          }
        }

        // Normalize folder mapping case
        if (newFolderId.startsWith('collections/')) {
          newFolderId = newFolderId.toLowerCase();
        }

        if (
          newUrl !== asset.file_url || 
          newFileName !== asset.file_name || 
          newFolderId !== asset.folder_id
        ) {
          needsUpdate = true;
          return {
            ...asset,
            file_url: newUrl,
            file_name: newFileName,
            folder_id: newFolderId
          };
        }
        return asset;
      });

      if (needsUpdate) {
        setAssets(updatedAssets);
        localStorage.setItem('bloom_assets', JSON.stringify(updatedAssets));
      } else {
        setAssets(currentAssets);
      }
    } else {
      const defaultAssets: MediaAsset[] = [];
      // Use relative paths for better portability across build environments
      const diskFolders = (import.meta as any).glob('../../public/images/collections/**/*', { eager: true });
      const productImages = (import.meta as any).glob('../../public/images/product_images/*', { eager: true });
      const bestSellers = (import.meta as any).glob('../../public/images/our_best_sellers/*', { eager: true });
      const homeImages = (import.meta as any).glob('../../public/images/home_images/*', { eager: true });
      const logoImages = (import.meta as any).glob('../../public/images/logo/*', { eager: true });
      
      const allDisks = { ...diskFolders, ...productImages, ...bestSellers, ...homeImages, ...logoImages };
      
      Object.keys(allDisks).forEach((path, idx) => {
        if (path.endsWith('.keep')) return;
        
        // Normalize path to get the correct browser URL
        // From: ../../public/images/folder/file.jpg  To: /images/folder/file.jpg
        const url = path.replace(/^.*\/public/, '');
        const parts = path.split('/');
        const filename = parts.pop() || '';
        const folderName = parts.pop() || '';
        
        let folderId = 'product_images';
        if (path.includes('collections')) folderId = `collections/${folderName.toLowerCase()}`;
        if (path.includes('our_best_sellers')) folderId = 'our_best_sellers';
        if (path.includes('home_images')) folderId = 'home_images';
        if (path.includes('logo')) folderId = 'logo';

        defaultAssets.push({
          id: `builtin_${idx}`,
          folder_id: folderId,
          file_name: filename,
          file_url: url,
          created_at: new Date().toISOString(),
          is_active: true
        });
      });

      setAssets(defaultAssets);
      localStorage.setItem('bloom_assets', JSON.stringify(defaultAssets));
    }
    setLoading(false);
  }, []);

  const createFolder = useCallback(async (name: string, parentId: string) => {
    if (parentId !== 'collections') throw new Error(`Cannot create custom folders under ${parentId}.`);
    const newId = `${parentId}/${name.toLowerCase().replace(/\s+/g, '_')}`;
    if (folders.some(f => f.id === newId)) throw new Error('Folder already exists.');
    const newFolder: MediaFolder = { id: newId, name, parent: parentId, isSystem: false };
    const updatedFolders = [...folders, newFolder];
    setFolders(updatedFolders);
    localStorage.setItem('bloom_folders', JSON.stringify(updatedFolders));
    window.dispatchEvent(new Event('media_updated'));
  }, [folders]);

  const deleteFolder = useCallback(async (folderId: string) => {
    const target = folders.find(f => f.id === folderId);
    if (!target || target.isSystem) throw new Error('Cannot delete this folder.');
    if (assets.some(a => a.folder_id === folderId && a.is_active)) throw new Error('Delete inner images first.');
    const updatedFolders = folders.filter(f => f.id !== folderId);
    setFolders(updatedFolders);
    localStorage.setItem('bloom_folders', JSON.stringify(updatedFolders));
    window.dispatchEvent(new Event('media_updated'));
  }, [folders, assets]);

  const uploadImage = useCallback(async (folderId: string, file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const newAsset: MediaAsset = {
          id: `upload_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          folder_id: folderId,
          file_name: file.name,
          file_url: reader.result as string,
          created_at: new Date().toISOString(),
          is_active: true
        };
        const updated = [newAsset, ...assets];
        setAssets(updated);
        localStorage.setItem('bloom_assets', JSON.stringify(updated));
        window.dispatchEvent(new Event('media_updated'));
        resolve();
      };
      reader.onerror = () => reject(new Error("Failed to read image."));
      reader.readAsDataURL(file);
    });
  }, [assets]);

  const toggleImageActive = useCallback(async (assetId: string) => {
    const updated = assets.map(a => a.id === assetId ? { ...a, is_active: !a.is_active } : a);
    setAssets(updated);
    localStorage.setItem('bloom_assets', JSON.stringify(updated));
    window.dispatchEvent(new Event('media_updated'));
  }, [assets]);

  const forceDeleteImage = useCallback(async (assetId: string) => {
    await toggleImageActive(assetId);
  }, [toggleImageActive]);

  // Handle cross-tab or cross-component sync via custom event
  useEffect(() => {
    const handleRemoteUpdate = () => {
      const savedFolders = localStorage.getItem('bloom_folders');
      const savedAssets = localStorage.getItem('bloom_assets');
      if (savedFolders) setFolders(JSON.parse(savedFolders));
      if (savedAssets) setAssets(JSON.parse(savedAssets));
    };
    window.addEventListener('media_updated', handleRemoteUpdate);
    return () => window.removeEventListener('media_updated', handleRemoteUpdate);
  }, []);

  const memoizedAssets = useMemo(() => assets.filter(a => a.is_active), [assets]);
  
  const ctxValue = useMemo(() => ({
    folders,
    assets: memoizedAssets,
    allAssets: assets,
    loading,
    createFolder,
    deleteFolder,
    uploadImage,
    toggleImageActive,
    forceDeleteImage
  }), [folders, memoizedAssets, assets, loading, createFolder, deleteFolder, uploadImage, toggleImageActive, forceDeleteImage]);

  return (
    <MediaContext.Provider value={ctxValue}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMediaContext() {
  const context = useContext(MediaContext);
  if (!context) throw new Error('useMediaContext must be used within a MediaProvider');
  return context;
}
