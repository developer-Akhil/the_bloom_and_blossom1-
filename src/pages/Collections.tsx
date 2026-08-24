import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProductContext } from '../context/ProductContext';
import { ProductCard } from './Home';
import { Filter, ChevronDown, SlidersHorizontal, Sparkles, PartyPopper } from 'lucide-react';
import { cn } from '../lib/utils';

export function Collections() {
  const { products, categories, festivalConfig, festivalProducts } = useProductContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSort, setActiveSort] = useState('latest');
  
  const currentCategory = searchParams.get('cat') || 'All';
  const searchQuery = searchParams.get('search') || '';
  const isFestival = searchParams.get('festival') === 'true';

  const isFestivalEnabled = festivalConfig?.enabled !== false && festivalProducts.length > 0;
  const festivalTitle = festivalConfig?.title || "Festival / Occasion";
  const festivalSubtitle = festivalConfig?.subtitle || "Special handcrafted drops & celebratory hair accessories.";

  const filteredProducts = useMemo(() => {
    let result = products;

    if (isFestival) {
      result = result.filter(p => !!p.isFestival);
    } else if (currentCategory !== 'All') {
      result = result.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
    }
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerQuery) || 
        p.description.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Simple sort
    if (activeSort === 'price-low') result = [...result].sort((a, b) => a.price - b.price);
    if (activeSort === 'price-high') result = [...result].sort((a, b) => b.price - a.price);
    
    return result;
  }, [currentCategory, isFestival, activeSort, searchQuery, products]);

  const handleSelectCategory = (cat: string) => {
    const params: Record<string, string> = {};
    if (cat !== 'All') params.cat = cat;
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params);
  };

  const handleSelectFestival = () => {
    const params: Record<string, string> = { festival: 'true' };
    if (searchQuery) params.search = searchQuery;
    setSearchParams(params);
  };

  const clearAllFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col space-y-8">
        {/* Festive Banner when on festival view */}
        {isFestival && (
          <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 rounded-3xl p-6 md:p-10 text-white shadow-lg relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider">
                <Sparkles size={14} className="text-amber-200 fill-amber-200 animate-bounce" />
                <span>Special Occasion Spotlight</span>
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold tracking-tight text-white">
                {festivalTitle}
              </h1>
              <p className="text-white/90 text-sm md:text-base font-light">
                {festivalSubtitle}
              </p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0 pb-8 border-b">
          <div className="space-y-2">
            {!isFestival && (
              <h1 className="font-serif text-4xl font-bold">
                {searchQuery ? `Search: "${searchQuery}"` : currentCategory}
              </h1>
            )}
            <p className="text-gray-400 text-sm">Showing {filteredProducts.length} results</p>
          </div>
          
          <div className="flex items-center space-x-4">
             <div className="relative group">
               <button className="flex items-center space-x-2 text-sm font-medium border rounded-full px-5 py-2.5 hover:bg-gray-50 transition-all">
                 <SlidersHorizontal size={16} />
                 <span>Sort: {activeSort === 'latest' ? 'Latest' : activeSort === 'price-low' ? 'Price: Low to High' : 'Price: High to Low'}</span>
                 <ChevronDown size={16} className="text-gray-400" />
               </button>
               
               <div className="absolute right-0 top-full mt-2 w-48 bg-white border rounded-2xl shadow-xl p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
                 <SortOption onClick={() => setActiveSort('latest')} active={activeSort === 'latest'}>Latest Arrivals</SortOption>
                 <SortOption onClick={() => setActiveSort('price-low')} active={activeSort === 'price-low'}>Price: Low to High</SortOption>
                 <SortOption onClick={() => setActiveSort('price-high')} active={activeSort === 'price-high'}>Price: High to Low</SortOption>
               </div>
             </div>
          </div>
        </div>

        {/* Mobile Categories Scroll */}
        <div className="lg:hidden flex flex-col space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-widest text-gray-400">Categories</h3>
          <div className="flex overflow-x-auto pb-3 -mx-4 px-4 space-x-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button
              onClick={() => handleSelectCategory('All')}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border shrink-0 shadow-sm",
                !isFestival && currentCategory === 'All'
                  ? "bg-bloom-rose text-white border-bloom-rose font-semibold"
                  : "bg-white text-gray-600 border-gray-200 hover:border-bloom-rose/30"
              )}
            >
              All Collections
            </button>

            {isFestivalEnabled && (
              <button
                onClick={handleSelectFestival}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all border shrink-0 shadow-sm flex items-center gap-1.5",
                  isFestival
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-md"
                    : "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100/80"
                )}
              >
                <Sparkles size={14} className={isFestival ? "fill-white" : "fill-amber-500 text-amber-600"} />
                <span>{festivalTitle}</span>
              </button>
            )}

            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => handleSelectCategory(cat)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border shrink-0 shadow-sm",
                  !isFestival && currentCategory === cat
                    ? "bg-bloom-rose text-white border-bloom-rose font-semibold"
                    : "bg-white text-gray-600 border-gray-200 hover:border-bloom-rose/30"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Sidebar Filters */}
          <aside className="hidden lg:block space-y-10">
            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Categories</h3>
              <div className="flex flex-col space-y-3">
                <CategoryFilterLink 
                  title="All Collections" 
                  active={!isFestival && currentCategory === 'All'} 
                  onClick={() => handleSelectCategory('All')}
                />

                {isFestivalEnabled && (
                  <button 
                    onClick={handleSelectFestival}
                    className={cn(
                      "text-left text-sm transition-all py-2 px-3 rounded-xl border flex items-center justify-between font-bold",
                      isFestival 
                        ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-sm" 
                        : "bg-amber-50/70 border-amber-200 text-amber-900 hover:bg-amber-100/80"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles size={14} className={isFestival ? "fill-white" : "fill-amber-500 text-amber-600"} />
                      <span>{festivalTitle}</span>
                    </span>
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-md font-mono">{festivalProducts.length}</span>
                  </button>
                )}

                {categories.map(cat => (
                  <CategoryFilterLink 
                    key={cat}
                    title={cat}
                    active={!isFestival && currentCategory === cat}
                    onClick={() => handleSelectCategory(cat)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Special Occasions</h3>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50/50 border border-amber-100 rounded-2xl text-xs text-amber-900 space-y-2">
                <p className="font-bold flex items-center gap-1">
                  <PartyPopper size={14} className="text-amber-600" />
                  Curated Festival Collection
                </p>
                <p className="text-amber-800/80 leading-relaxed">
                  Every festive item belongs to its authentic craft category (scrunchies, clips, bows, etc.) while spotlighted here for special events!
                </p>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="lg:col-span-3">
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="p-6 bg-gray-50 rounded-full">
                  <Filter size={48} className="text-gray-300" />
                </div>
                <h3 className="font-serif text-2xl font-bold">Products coming soon!</h3>
                <p className="text-gray-400">We are currently updating our collection. Stay tuned for beautiful new accessories.</p>
                <button 
                  onClick={clearAllFilters}
                  className="text-bloom-rose font-bold hover:underline"
                >
                  View all collections
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategoryFilterLink({ title, active, onClick }: { title: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "text-left text-sm transition-all hover:text-bloom-rose py-1.5 border-l-2 pl-4",
        active ? "border-bloom-rose text-bloom-rose font-bold" : "border-transparent text-gray-500 hover:border-bloom-rose/30"
      )}
    >
      {title}
    </button>
  );
}

function SortOption({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full text-left px-4 py-2 text-sm rounded-lg transition-colors",
        active ? "bg-bloom-pink text-bloom-rose font-bold" : "text-gray-600 hover:bg-gray-50"
      )}
    >
      {children}
    </button>
  );
}

