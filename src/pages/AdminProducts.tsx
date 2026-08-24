import React, { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { products as baseProducts } from '../data/products';
import { 
  updateDynamicPrice, 
  updateDynamicPricesBatch, 
  useDynamicProducts, 
  updateBestSellers, 
  updateNewArrivals, 
  updateAvailabilityBatch, 
  updateOnSale, 
  updateOriginalPricesBatch, 
  updateDescriptionsBatch,
  updateFestivalProducts,
  updateFestivalConfig
} from '../lib/dynamicPricing';
import { 
  Settings, 
  Save, 
  CheckCircle2, 
  ShieldAlert, 
  IndianRupee, 
  LogOut, 
  Star, 
  Sparkles, 
  Package, 
  PackageX, 
  Tag, 
  PartyPopper, 
  Flame, 
  Eye, 
  SlidersHorizontal 
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useProductContext } from '../context/ProductContext';

export function AdminProducts() {
  const { isAdminAuthenticated, logout } = useAdminAuth();
  const { products: dynamicProducts, categories, festivalConfig, refreshProducts } = useProductContext();
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [filterSpecial, setFilterSpecial] = useState<'all' | 'festival' | 'bestseller' | 'new' | 'onsale'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [bestSellerEdits, setBestSellerEdits] = useState<Record<string, boolean>>({});
  const [newArrivalEdits, setNewArrivalEdits] = useState<Record<string, boolean>>({});
  const [festivalEdits, setFestivalEdits] = useState<Record<string, boolean>>({});
  const [festivalConfigState, setFestivalConfigState] = useState<{
    enabled: boolean;
    title: string;
    subtitle: string;
  }>({
    enabled: festivalConfig?.enabled !== false,
    title: festivalConfig?.title || "Festival / Occasion",
    subtitle: festivalConfig?.subtitle || "Handcrafted festive hair accessories & special occasion drops."
  });
  const [isConfigDirty, setIsConfigDirty] = useState(false);
  const [availabilityEdits, setAvailabilityEdits] = useState<Record<string, boolean>>({});
  const [onSaleEdits, setOnSaleEdits] = useState<Record<string, boolean>>({});
  const [originalPriceEdits, setOriginalPriceEdits] = useState<Record<string, number>>({});
  const [descriptionEdits, setDescriptionEdits] = useState<Record<string, string>>({});
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (festivalConfig && !isConfigDirty) {
      setFestivalConfigState({
        enabled: festivalConfig.enabled !== false,
        title: festivalConfig.title || "Festival / Occasion",
        subtitle: festivalConfig.subtitle || "Handcrafted festive hair accessories & special occasion drops."
      });
    }
  }, [festivalConfig, isConfigDirty]);

  // Check for admin privileges. Redirect to login if not authenticated.
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: { pathname: '/admin' } }} replace />;
  }

  const handlePriceChange = (id: string, value: string) => {
    if (value === '') {
      setEdits({ ...edits, [id]: 0 }); 
      return;
    }
    const num = Number(value);
    if (!isNaN(num)) {
      setEdits({ ...edits, [id]: num });
    }
  };

  const handleOriginalPriceChange = (id: string, value: string) => {
    if (value === '') {
      setOriginalPriceEdits({ ...originalPriceEdits, [id]: 0 }); 
      return;
    }
    const num = Number(value);
    if (!isNaN(num)) {
      setOriginalPriceEdits({ ...originalPriceEdits, [id]: num });
    }
  };

  const handleDescriptionChange = (id: string, value: string) => {
    setDescriptionEdits({ ...descriptionEdits, [id]: value });
  };

  const handleBestSellerToggle = (id: string, currentStatus: boolean) => {
    const isCurrentlyBestSeller = bestSellerEdits[id] !== undefined ? bestSellerEdits[id] : currentStatus;
    setBestSellerEdits({ ...bestSellerEdits, [id]: !isCurrentlyBestSeller });
  };

  const handleNewArrivalToggle = (id: string, currentStatus: boolean) => {
    const isCurrentlyNewArrival = newArrivalEdits[id] !== undefined ? newArrivalEdits[id] : currentStatus;
    setNewArrivalEdits({ ...newArrivalEdits, [id]: !isCurrentlyNewArrival });
  };

  const handleFestivalToggle = (id: string, currentStatus: boolean) => {
    const isCurrentlyFestival = festivalEdits[id] !== undefined ? festivalEdits[id] : currentStatus;
    setFestivalEdits({ ...festivalEdits, [id]: !isCurrentlyFestival });
  };

  const handleAvailabilityToggle = (id: string, currentStatus: boolean) => {
    const isCurrentlyInStock = availabilityEdits[id] !== undefined ? availabilityEdits[id] : currentStatus;
    setAvailabilityEdits({ ...availabilityEdits, [id]: !isCurrentlyInStock });
  };

  const handleOnSaleToggle = (id: string, currentStatus: boolean) => {
    const isCurrentlyOnSale = onSaleEdits[id] !== undefined ? onSaleEdits[id] : currentStatus;
    setOnSaleEdits({ ...onSaleEdits, [id]: !isCurrentlyOnSale });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      if (Object.keys(edits).length > 0) {
          await updateDynamicPricesBatch(edits);
      }
      
      if (Object.keys(bestSellerEdits).length > 0) {
          const finalBestSellers = dynamicProducts
              .filter(p => bestSellerEdits[p.id] !== undefined ? bestSellerEdits[p.id] : p.isBestSeller)
              .map(p => p.id);
          await updateBestSellers(finalBestSellers, dynamicProducts.map(p => p.id));
      }

      if (Object.keys(newArrivalEdits).length > 0) {
          const finalNewArrivals = dynamicProducts
              .filter(p => newArrivalEdits[p.id] !== undefined ? newArrivalEdits[p.id] : p.isNewArrival)
              .map(p => p.id);
          await updateNewArrivals(finalNewArrivals, dynamicProducts.map(p => p.id));
      }

      if (Object.keys(festivalEdits).length > 0) {
          const finalFestival = dynamicProducts
              .filter(p => festivalEdits[p.id] !== undefined ? festivalEdits[p.id] : p.isFestival)
              .map(p => p.id);
          await updateFestivalProducts(finalFestival, dynamicProducts.map(p => p.id));
      }

      if (isConfigDirty) {
          await updateFestivalConfig(festivalConfigState);
          setIsConfigDirty(false);
      }
      
      if (Object.keys(availabilityEdits).length > 0) {
          await updateAvailabilityBatch(availabilityEdits);
      }
      
      if (Object.keys(onSaleEdits).length > 0) {
          const finalOnSale = dynamicProducts
              .filter(p => onSaleEdits[p.id] !== undefined ? onSaleEdits[p.id] : p.isOnSale)
              .map(p => p.id);
          await updateOnSale(finalOnSale, dynamicProducts.map(p => p.id));
      }

      if (Object.keys(originalPriceEdits).length > 0) {
          await updateOriginalPricesBatch(originalPriceEdits);
      }
      
      if (Object.keys(descriptionEdits).length > 0) {
          await updateDescriptionsBatch(descriptionEdits);
      }
      
      await refreshProducts();
      
      setEdits({});
      setBestSellerEdits({});
      setNewArrivalEdits({});
      setFestivalEdits({});
      setAvailabilityEdits({});
      setOnSaleEdits({});
      setOriginalPriceEdits({});
      setDescriptionEdits({});
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 3000);
    } catch (err) {
      console.error("Failed to apply pricing updates:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const currentFestivalCount = dynamicProducts.filter(p => {
    if (festivalEdits[p.id] !== undefined) return festivalEdits[p.id];
    return !!p.isFestival;
  }).length;

  const hasUnsavedChanges = 
    Object.keys(edits).length > 0 || 
    Object.keys(bestSellerEdits).length > 0 || 
    Object.keys(newArrivalEdits).length > 0 || 
    Object.keys(festivalEdits).length > 0 || 
    isConfigDirty || 
    Object.keys(availabilityEdits).length > 0 || 
    Object.keys(onSaleEdits).length > 0 || 
    Object.keys(originalPriceEdits).length > 0 || 
    Object.keys(descriptionEdits).length > 0;

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b pb-6 gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between w-full gap-4 md:space-x-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-bloom-pink rounded-xl text-bloom-rose">
                <Settings size={28} />
              </div>
              <div>
                <h1 className="font-serif text-2xl md:text-3xl font-bold">Manage Products & Categories</h1>
                <p className="text-gray-500 text-sm">Control pricing, stock, categories, and the Admin Festival / Occasion hub.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap pt-2 md:pt-0">
              <Link 
                to="/admin"
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 font-bold text-gray-700 hover:bg-gray-200 transition-colors rounded-xl text-sm"
              >
                <span>Back to Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Festival / Occasion Admin Control Card */}
        <div className="bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 border border-amber-200/70 rounded-3xl p-6 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-amber-200/50">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-amber-500 text-white rounded-2xl shadow-sm">
                <PartyPopper size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-gray-900 font-serif">Special Category: Festival / Occasion</h2>
                  <span className="bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-0.5 rounded-full border border-amber-300/60">
                    Admin Controlled
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Tag any product to appear in this special category while keeping its original 9-category taxonomy intact.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center cursor-pointer gap-2 bg-white/80 backdrop-blur px-4 py-2 rounded-2xl border border-amber-200 shadow-sm">
                <span className="text-xs font-bold text-gray-700">Display in Navigation:</span>
                <input 
                  type="checkbox"
                  checked={festivalConfigState.enabled}
                  onChange={(e) => {
                    setFestivalConfigState({ ...festivalConfigState, enabled: e.target.checked });
                    setIsConfigDirty(true);
                  }}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <span className={`text-xs font-bold ${festivalConfigState.enabled ? 'text-green-600' : 'text-gray-400'}`}>
                  {festivalConfigState.enabled ? 'Active' : 'Hidden'}
                </span>
              </label>

              <Link 
                to="/collections?festival=true" 
                target="_blank"
                className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-amber-800 bg-amber-100/80 hover:bg-amber-200 rounded-xl transition-colors"
                title="Preview live Festival / Occasion hub"
              >
                <Eye size={14} />
                <span>Preview Hub ({currentFestivalCount})</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Category Display Title (e.g. "Festival / Occasion", "Diwali Special", "Navratri Drops"):
              </label>
              <input 
                type="text"
                value={festivalConfigState.title}
                onChange={(e) => {
                  setFestivalConfigState({ ...festivalConfigState, title: e.target.value });
                  setIsConfigDirty(true);
                }}
                placeholder="Festival / Occasion"
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Banner Subtitle / Promotional Tagline:
              </label>
              <input 
                type="text"
                value={festivalConfigState.subtitle}
                onChange={(e) => {
                  setFestivalConfigState({ ...festivalConfigState, subtitle: e.target.value });
                  setIsConfigDirty(true);
                }}
                placeholder="Handcrafted festive hair accessories & special occasion drops."
                className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Filters Bar */}
          <div className="bg-white border rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="flex flex-wrap items-center gap-3 flex-grow">
              <input 
                type="text" 
                placeholder="Search products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 bg-gray-50 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-bloom-rose/30 w-full sm:w-60"
              />

              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-gray-50 border rounded-xl text-sm font-medium text-gray-700 focus:outline-none"
              >
                <option value="All">All 9 Standard Categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <div className="flex items-center gap-1.5 bg-gray-50 p-1 rounded-xl border text-xs">
                <button
                  onClick={() => setFilterSpecial('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${filterSpecial === 'all' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterSpecial('festival')}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1 transition-all ${filterSpecial === 'festival' ? 'bg-amber-500 text-white shadow' : 'text-amber-700 hover:bg-amber-50'}`}
                >
                  <PartyPopper size={12} />
                  <span>Festival ({currentFestivalCount})</span>
                </button>
                <button
                  onClick={() => setFilterSpecial('bestseller')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${filterSpecial === 'bestseller' ? 'bg-orange-500 text-white shadow' : 'text-orange-600 hover:bg-orange-50'}`}
                >
                  Best Sellers
                </button>
                <button
                  onClick={() => setFilterSpecial('new')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${filterSpecial === 'new' ? 'bg-bloom-rose text-white shadow' : 'text-bloom-rose hover:bg-pink-50'}`}
                >
                  New Arrivals
                </button>
                <button
                  onClick={() => setFilterSpecial('onsale')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all ${filterSpecial === 'onsale' ? 'bg-red-500 text-white shadow' : 'text-red-600 hover:bg-red-50'}`}
                >
                  On Sale
                </button>
              </div>
            </div>

            <button 
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-bold transition-all shadow-md text-sm ${
                hasUnsavedChanges && !isSaving
                  ? 'bg-bloom-rose text-white hover:scale-105 shadow-bloom-rose/20' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {showSaved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              <span>{isSaving ? 'Saving...' : showSaved ? 'Saved Successfully' : 'Apply Settings'}</span>
            </button>
          </div>

          <div className="bg-white border rounded-3xl shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold border-b">Product</th>
                  <th className="p-4 font-bold border-b">Category</th>
                  <th className="p-4 font-bold border-b w-56">Description</th>
                  <th className="p-4 font-bold border-b text-center w-28 bg-amber-50/60 text-amber-900 border-amber-200">Festival / Occasion</th>
                  <th className="p-4 font-bold border-b text-center w-24">Best Seller</th>
                  <th className="p-4 font-bold border-b text-center w-24">New Arrival</th>
                  <th className="p-4 font-bold border-b text-center w-24">On Sale</th>
                  <th className="p-4 font-bold border-b text-center w-28">Status</th>
                  <th className="p-4 font-bold border-b w-36">Org. Price (₹)</th>
                  <th className="p-4 font-bold border-b w-36">Sale Price (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dynamicProducts
                  .filter(product => {
                    if (selectedCategory !== 'All' && product.category !== selectedCategory) return false;
                    
                    const isFest = festivalEdits[product.id] !== undefined ? festivalEdits[product.id] : !!product.isFestival;
                    const isBest = bestSellerEdits[product.id] !== undefined ? bestSellerEdits[product.id] : !!product.isBestSeller;
                    const isNew = newArrivalEdits[product.id] !== undefined ? newArrivalEdits[product.id] : !!product.isNewArrival;
                    const isOnSale = onSaleEdits[product.id] !== undefined ? onSaleEdits[product.id] : !!product.isOnSale;

                    if (filterSpecial === 'festival' && !isFest) return false;
                    if (filterSpecial === 'bestseller' && !isBest) return false;
                    if (filterSpecial === 'new' && !isNew) return false;
                    if (filterSpecial === 'onsale' && !isOnSale) return false;

                    if (searchTerm) {
                      const q = searchTerm.toLowerCase();
                      return product.name.toLowerCase().includes(q);
                    }
                    return true;
                  })
                  .map((product) => {
                  const isFest = festivalEdits[product.id] !== undefined ? festivalEdits[product.id] : !!product.isFestival;
                  const isBestSeller = bestSellerEdits[product.id] !== undefined ? bestSellerEdits[product.id] : !!product.isBestSeller;
                  const isNewArrival = newArrivalEdits[product.id] !== undefined ? newArrivalEdits[product.id] : !!product.isNewArrival;
                  const inStock = availabilityEdits[product.id] !== undefined ? availabilityEdits[product.id] : product.inStock;
                  const isOnSale = onSaleEdits[product.id] !== undefined ? onSaleEdits[product.id] : !!product.isOnSale;
                  
                  return (
                  <tr key={product.id} className={`hover:bg-gray-50/50 transition-colors ${isFest ? 'bg-amber-50/20' : ''}`}>
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded-xl shrink-0 border" />
                        <div>
                          <span className="font-bold text-gray-900 line-clamp-2">{product.name}</span>
                          {isFest && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full mt-0.5">
                              <PartyPopper size={10} />
                              <span>Festival Tagged</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs font-semibold text-gray-600">{product.category}</td>
                    <td className="p-4">
                      <textarea
                        value={descriptionEdits[product.id] !== undefined ? descriptionEdits[product.id] : product.description}
                        onChange={(e) => handleDescriptionChange(product.id, e.target.value)}
                        className={`w-full p-2 border rounded-xl text-xs ${
                          descriptionEdits[product.id] !== undefined 
                            ? 'bg-blue-50 border-blue-200 text-blue-800' 
                            : 'bg-white border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300 outline-none text-gray-900'
                        }`}
                        rows={2}
                      />
                    </td>
                    <td className="p-4 text-center bg-amber-50/30">
                       <button
                         onClick={() => handleFestivalToggle(product.id, !!product.isFestival)}
                         title={isFest ? "Remove from Festival / Occasion" : "Add to Festival / Occasion"}
                         className={`p-2.5 rounded-2xl transition-all shadow-xs ${
                           isFest 
                             ? 'bg-amber-500 text-white hover:bg-amber-600 scale-105 shadow-amber-200' 
                             : 'bg-gray-100 text-gray-400 hover:bg-amber-100 hover:text-amber-700'
                         }`}
                       >
                         <PartyPopper size={18} className={isFest ? 'fill-current' : ''} />
                       </button>
                    </td>
                    <td className="p-4 text-center">
                       <button
                         onClick={() => handleBestSellerToggle(product.id, !!product.isBestSeller)}
                         title={isBestSeller ? "Remove from Best Sellers" : "Mark as Best Seller"}
                         className={`p-2 rounded-full transition-colors ${isBestSeller ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                       >
                         <Star size={18} className={isBestSeller ? 'fill-orange-500' : ''} />
                       </button>
                    </td>
                    <td className="p-4 text-center">
                       <button
                         onClick={() => handleNewArrivalToggle(product.id, !!product.isNewArrival)}
                         title={isNewArrival ? "Remove from New Arrivals" : "Mark as New Arrival"}
                         className={`p-2 rounded-full transition-colors ${isNewArrival ? 'bg-bloom-pink/30 text-bloom-rose' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                       >
                         <Sparkles size={18} className={isNewArrival ? 'fill-bloom-rose' : ''} />
                       </button>
                    </td>
                    <td className="p-4 text-center">
                       <button
                         onClick={() => handleOnSaleToggle(product.id, !!product.isOnSale)}
                         title={isOnSale ? "Remove from Sale" : "Mark as On Sale"}
                         className={`p-2 rounded-full transition-colors ${isOnSale ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                       >
                         <Tag size={18} className={isOnSale ? 'fill-orange-500 text-orange-500' : ''} />
                       </button>
                    </td>
                    <td className="p-4 text-center">
                       <button
                         onClick={() => handleAvailabilityToggle(product.id, !!product.inStock)}
                         title={inStock ? "Mark Out of Stock" : "Mark In Stock"}
                         className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center space-x-1 mx-auto whitespace-nowrap ${inStock ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}
                       >
                         {inStock ? <Package size={14}/> : <PackageX size={14}/>}
                         <span>{inStock ? 'In Stock' : 'Out of Stock'}</span>
                       </button>
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                        <input 
                          type="number"
                          value={originalPriceEdits[product.id] !== undefined ? originalPriceEdits[product.id] : (product.originalPrice || '')}
                          onChange={(e) => handleOriginalPriceChange(product.id, e.target.value)}
                          placeholder="Org."
                          className={`w-full pl-8 pr-2 py-2 border rounded-xl font-bold text-sm ${
                            originalPriceEdits[product.id] !== undefined 
                              ? 'bg-blue-50 border-blue-200 text-blue-600' 
                              : 'bg-white border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300 outline-none text-gray-900'
                          }`}
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">₹</span>
                        <input 
                          type="number"
                          value={edits[product.id] !== undefined ? edits[product.id] : product.price}
                          onChange={(e) => handlePriceChange(product.id, e.target.value)}
                          className={`w-full pl-8 pr-2 py-2 border rounded-xl font-bold text-sm ${
                            edits[product.id] !== undefined 
                              ? 'bg-bloom-pink/20 border-bloom-rose/50 text-bloom-rose' 
                              : 'bg-white border-gray-200 focus:border-bloom-rose focus:ring-1 focus:ring-bloom-rose outline-none text-gray-900'
                          }`}
                        />
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}


