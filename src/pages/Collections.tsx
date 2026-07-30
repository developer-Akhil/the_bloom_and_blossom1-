import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProductContext } from '../context/ProductContext';
import { ProductCard } from './Home';
import { Filter, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { cn } from '../lib/utils';

export function Collections() {
  const { products, categories } = useProductContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSort, setActiveSort] = useState('latest');
  
  const currentCategory = searchParams.get('cat') || 'All';
  const searchQuery = searchParams.get('search') || '';

  const filteredProducts = useMemo(() => {
    let result = products;
    if (currentCategory !== 'All') {
      result = products.filter(p => p.category.toLowerCase() === currentCategory.toLowerCase());
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
  }, [currentCategory, activeSort, searchQuery, products]);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between space-y-4 md:space-y-0 pb-8 border-b">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-bold">
              {searchQuery ? `Search: "${searchQuery}"` : currentCategory}
            </h1>
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
              onClick={() => setSearchParams({})}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border shrink-0 shadow-sm",
                currentCategory === 'All'
                  ? "bg-bloom-rose text-white border-bloom-rose font-semibold"
                  : "bg-white text-gray-600 border-gray-200 hover:border-bloom-rose/30"
              )}
            >
              All Collections
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSearchParams({ cat })}
                className={cn(
                  "px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all border shrink-0 shadow-sm",
                  currentCategory === cat
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
                  active={currentCategory === 'All'} 
                  onClick={() => setSearchParams({})}
                />
                {categories.map(cat => (
                  <CategoryFilterLink 
                    key={cat}
                    title={cat}
                    active={currentCategory === cat}
                    onClick={() => setSearchParams({ cat })}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm uppercase tracking-widest text-gray-400">Price Range</h3>
              <div className="space-y-4">
                <input type="range" className="w-full accent-bloom-rose" min="0" max="5000" />
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>₹0</span>
                  <span>₹5,000+</span>
                </div>
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
                  onClick={() => setSearchParams({})}
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
