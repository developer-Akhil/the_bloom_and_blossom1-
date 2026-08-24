import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { products as baseProducts } from '../data/products';
import { updateDynamicPrice, updateDynamicPricesBatch, useDynamicProducts, updateBestSellers, updateNewArrivals, updateAvailabilityBatch, updateOnSale, updateOriginalPricesBatch, updateDescriptionsBatch } from '../lib/dynamicPricing';
import { Settings, Save, CheckCircle2, ShieldAlert, IndianRupee, LogOut, Star, Sparkles, Package, PackageX, Tag } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useProductContext } from '../context/ProductContext';

export function AdminProducts() {
  const { isAdminAuthenticated, logout } = useAdminAuth();
  const { products: dynamicProducts, refreshProducts } = useProductContext();
  const [edits, setEdits] = useState<Record<string, number>>({});
  const [bestSellerEdits, setBestSellerEdits] = useState<Record<string, boolean>>({});
  const [newArrivalEdits, setNewArrivalEdits] = useState<Record<string, boolean>>({});
  const [availabilityEdits, setAvailabilityEdits] = useState<Record<string, boolean>>({});
  const [onSaleEdits, setOnSaleEdits] = useState<Record<string, boolean>>({});
  const [originalPriceEdits, setOriginalPriceEdits] = useState<Record<string, number>>({});
  const [descriptionEdits, setDescriptionEdits] = useState<Record<string, string>>({});
  const [showSaved, setShowSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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

  const hasUnsavedChanges = Object.keys(edits).length > 0 || Object.keys(bestSellerEdits).length > 0 || Object.keys(newArrivalEdits).length > 0 || Object.keys(availabilityEdits).length > 0 || Object.keys(onSaleEdits).length > 0 || Object.keys(originalPriceEdits).length > 0 || Object.keys(descriptionEdits).length > 0;

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
                <h1 className="font-serif text-2xl md:text-3xl font-bold">Manage Products</h1>
                <p className="text-gray-500 text-sm">Configure modules and control UI dynamically.</p>
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

        <div className="space-y-6">
          <div className="flex justify-end">
            <button 
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isSaving}
              className={`mt-4 md:mt-0 flex items-center space-x-2 px-6 py-3 rounded-full font-bold transition-all shadow-lg ${
                hasUnsavedChanges && !isSaving
                  ? 'bg-bloom-rose text-white hover:scale-105 shadow-bloom-rose/20' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
              }`}
            >
              {showSaved ? <CheckCircle2 size={18} /> : <Save size={18} />}
              <span>{isSaving ? 'Saving...' : showSaved ? 'Saved Successfully' : 'Apply Settings'}</span>
            </button>
          </div>

          <div className="bg-white border rounded-3xl shadow-sm overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold border-b">Product</th>
                  <th className="p-4 font-bold border-b">Category</th>
                  <th className="p-4 font-bold border-b w-64">Description</th>
                  <th className="p-4 font-bold border-b text-center w-24">Best Seller</th>
                  <th className="p-4 font-bold border-b text-center w-24">New Arrival</th>
                  <th className="p-4 font-bold border-b text-center w-24">On Sale</th>
                  <th className="p-4 font-bold border-b text-center w-32">Status</th>
                  <th className="p-4 font-bold border-b w-40">Original Price (₹)</th>
                  <th className="p-4 font-bold border-b w-40">Sale Price (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {dynamicProducts.map((product) => {
                  const isBestSeller = bestSellerEdits[product.id] !== undefined ? bestSellerEdits[product.id] : !!product.isBestSeller;
                  const isNewArrival = newArrivalEdits[product.id] !== undefined ? newArrivalEdits[product.id] : !!product.isNewArrival;
                  const inStock = availabilityEdits[product.id] !== undefined ? availabilityEdits[product.id] : product.inStock;
                  const isOnSale = onSaleEdits[product.id] !== undefined ? onSaleEdits[product.id] : !!product.isOnSale;
                  return (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <img src={product.images[0]} alt={product.name} className="w-12 h-12 object-cover rounded-xl shrink-0" />
                        <span className="font-bold text-gray-900 line-clamp-2">{product.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-500">{product.category}</td>
                    <td className="p-4">
                      <textarea
                        value={descriptionEdits[product.id] !== undefined ? descriptionEdits[product.id] : product.description}
                        onChange={(e) => handleDescriptionChange(product.id, e.target.value)}
                        className={`w-full p-2 border rounded-xl text-sm ${
                          descriptionEdits[product.id] !== undefined 
                            ? 'bg-blue-50 border-blue-200 text-blue-800' 
                            : 'bg-white border-gray-200 focus:border-blue-300 focus:ring-1 focus:ring-blue-300 outline-none text-gray-900'
                        }`}
                        rows={2}
                      />
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
                          className={`w-full pl-8 pr-2 py-2 border rounded-xl font-bold ${
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
                          className={`w-full pl-8 pr-2 py-2 border rounded-xl font-bold ${
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

