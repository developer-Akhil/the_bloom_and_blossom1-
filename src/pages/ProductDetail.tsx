import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { products as baseProducts } from '../data/products';
import { useProductContext } from '../context/ProductContext';
import { useCart } from '../context/CartContext';
import { Star, ShieldCheck, Truck, Heart, ShoppingBag, ChevronRight, ChevronLeft, Minus, Plus, Share2, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { ProductCard } from './Home';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { ProductReviews } from '../components/ProductReviews';

export function ProductDetail() {
  const { products, festivalConfig } = useProductContext();
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [customName, setCustomName] = useState('');
  const [customNameError, setCustomNameError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [isAdded, setIsAdded] = useState(false);

  const product = useMemo(() => products.find(p => p.id === id), [id, products]);

  // Synchronize activeImage changes with selected color variants
  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      const currentImageUrl = product.images[activeImage];
      if (currentImageUrl) {
        const matchingVariant = product.variants.find(v => v.image === currentImageUrl);
        if (matchingVariant) {
          setSelectedOptions(prev => {
            if (prev['Color'] !== matchingVariant.color) {
              setIsAdded(false);
              return { ...prev, 'Color': matchingVariant.color || '' };
            }
            return prev;
          });
        }
      }
    }
  }, [activeImage, product]);

  const handleCustomNameChange = (val: string) => {
    setCustomName(val);
    setIsAdded(false);
    if (!val.trim()) {
      setCustomNameError('Custom name is required');
    } else if (val.length < 2) {
      setCustomNameError('Name must be at least 2 characters');
    } else if (val.length > 20) {
      setCustomNameError('Name must be less than 20 characters');
    } else if (!/^[a-zA-Z0-9\s]+$/.test(val)) {
      setCustomNameError('Only alphanumeric characters and spaces are allowed');
    } else {
      setCustomNameError('');
    }
  };

  const isFormValid = product?.isCustomizable ? (customName.trim().length > 0 && customNameError === '') : true;

  useEffect(() => {
    if (product) {
      const initial: Record<string, string> = {};
      if (product.options) {
        product.options.forEach(opt => {
          initial[opt.name] = opt.values[0];
        });
      }
      if (product.variants && product.variants.length > 0) {
        initial['Color'] = product.variants[0].color || '';
      }
      
      // Multi-layer stability guard: only trigger state update if options actually change
      setSelectedOptions(prev => {
        const hasDiff = Object.keys(initial).some(key => prev[key] !== initial[key]);
        const lengthDiff = Object.keys(prev).length !== Object.keys(initial).length;
        if (!hasDiff && !lengthDiff) return prev;
        return initial;
      });
    }
  }, [product]);

  if (!product) {
    return (
      <div className="container py-40 text-center">
        <h2 className="font-serif text-3xl font-bold mb-4">Product Not Found</h2>
        <Link to="/collections" className="text-bloom-rose hover:underline">Return to Collections</Link>
      </div>
    );
  }

  const relatedProducts = products.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      {/* Breadcrumbs */}
      <nav className="flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-gray-400 mb-12">
        <Link to="/" className="hover:text-bloom-rose transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link to="/collections" className="hover:text-bloom-rose transition-colors">Collections</Link>
        <ChevronRight size={12} />
        <Link to={`/collections?cat=${encodeURIComponent(product.category)}`} className="hover:text-bloom-rose transition-colors">{product.category}</Link>
        <ChevronRight size={12} />
        <span className="text-gray-900 line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        {/* Image Gallery */}
        <div className="space-y-6">
          <div className="group relative aspect-square rounded-[2.5rem] overflow-hidden bg-white border border-gray-100 shadow-sm">
            <OptimizedImage 
              src={product.images[activeImage]} 
              alt={product.name} 
              className="w-full h-full object-contain" 
            />
            
            {product.images.length > 1 && (
              <>
                <button 
                  onClick={() => setActiveImage((activeImage - 1 + product.images.length) % product.images.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-gray-500 hover:text-bloom-rose z-10"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setActiveImage((activeImage + 1) % product.images.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 shadow-lg rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all text-gray-500 hover:text-bloom-rose z-10"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
          <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
            {product.images.map((img, idx) => (
              <button 
                key={idx}
                onClick={() => setActiveImage(idx)}
                className={cn(
                  "w-24 h-24 rounded-2xl overflow-hidden border-2 transition-all min-w-[6rem] bg-white",
                  activeImage === idx ? "border-bloom-rose" : "border-transparent opacity-60 hover:opacity-100"
                )}
              >
                <OptimizedImage src={img} alt={`${product.name} ${idx}`} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="flex flex-col space-y-8">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Link 
                to={`/collections?cat=${encodeURIComponent(product.category)}`}
                className="px-3 py-1 bg-bloom-pink text-bloom-rose text-[10px] font-bold uppercase rounded-full tracking-widest hover:opacity-80 transition-opacity"
              >
                {product.category}
              </Link>
              {product.isFestival && (
                <Link
                  to="/collections?festival=true"
                  className="px-3 py-1 bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[10px] shadow-sm font-bold uppercase rounded-full tracking-widest hover:opacity-90 transition-opacity inline-flex items-center gap-1"
                >
                  <Sparkles size={10} className="fill-white" />
                  <span>{festivalConfig?.title || 'Festive'}</span>
                </Link>
              )}
              {product.isOnSale && (
                <span className="px-3 py-1 bg-orange-500 text-white text-[10px] shadow-sm font-bold uppercase rounded-full">Sale</span>
              )}
              <div className="flex items-center text-amber-500 text-sm font-bold ml-auto">
                <Star size={16} className="fill-current mr-1" />
                <span>{product.rating}</span>
                <span className="text-gray-300 ml-2 font-normal">(48 Reviews)</span>
              </div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight">{product.name}</h1>
            <div className="flex items-center space-x-3">
               <p className="text-3xl font-bold text-bloom-rose">₹{product.price}</p>
               {product.isOnSale && product.originalPrice && product.originalPrice > product.price && (
                 <>
                   <p className="text-xl text-gray-400 line-through font-medium">₹{product.originalPrice}</p>
                   <p className="text-lg text-orange-500 font-bold">
                     ({Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF)
                   </p>
                 </>
               )}
            </div>
          </div>

          <p className="text-gray-500 leading-relaxed font-light">
            {product.description}
          </p>          {/* Options Selection */}
          {product.options?.filter(option => !(option.name.toLowerCase() === 'color' && product.variants && product.variants.length > 0)).map((option) => (
            <div key={option.name} className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                {option.name}: <span className="text-gray-900">{selectedOptions[option.name]}</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {option.values.map((value) => {
                  const isColor = option.name.toLowerCase().includes('color');
                  return (
                    <button
                      key={value}
                      onClick={() => {
                        setSelectedOptions(prev => ({ ...prev, [option.name]: value }));
                        setIsAdded(false);
                      }}
                      className={cn(
                        "transition-all",
                        isColor 
                          ? cn(
                              "w-11 h-11 rounded-full border-2",
                              selectedOptions[option.name] === value ? "border-bloom-rose scale-110 shadow-md" : "border-gray-100"
                            )
                          : cn(
                              "px-7 py-3 rounded-full border text-sm font-medium min-w-[3.5rem]",
                              selectedOptions[option.name] === value ? "bg-bloom-rose text-white border-bloom-rose" : "bg-white text-gray-600 border-gray-100 hover:border-gray-200"
                            )
                      )}
                      style={isColor ? { backgroundColor: value.toLowerCase() } : {}}
                      title={value}
                    >
                      {!isColor && value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Variant Selection */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-4">
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">
                Color: <span className="text-gray-900">{selectedOptions['Color']}</span>
              </label>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((variant, idx) => (
                  <button
                    key={variant.color || idx}
                    onClick={() => {
                      setSelectedOptions(prev => ({ ...prev, 'Color': variant.color || '' }));
                      setIsAdded(false);
                      if (variant.image) {
                        const imgIdx = product.images.findIndex(img => img === variant.image);
                        if (imgIdx !== -1) setActiveImage(imgIdx);
                      }
                    }}
                    className={cn(
                      "transition-all w-11 h-11 rounded-full border-2 overflow-hidden",
                      selectedOptions['Color'] === variant.color ? "border-bloom-rose scale-110 shadow-md" : "border-gray-100 hover:border-gray-200"
                    )}
                    title={variant.color}
                  >
                    {variant.image ? (
                        <OptimizedImage src={variant.image} alt={variant.color || 'Color'} className="w-full h-full object-contain" />
                    ) : (
                        <div className="w-full h-full" style={{ backgroundColor: variant.color?.toLowerCase() }} />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!product.inStock ? (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-center space-x-4">
              <div className="p-3 bg-red-100 rounded-full text-red-500">
                <Minus size={24} />
              </div>
              <div>
                <h3 className="font-bold text-red-700">Out of Stock</h3>
                <p className="text-sm text-red-500">This product is currently unavailable.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Stock Indicator */}
              {product.stock < 20 && (
                <div className="space-y-2">
                  <p className="text-sm font-bold text-red-600">
                    Hurry up! Only {product.stock} left
                  </p>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(product.stock / 20) * 100}%` }}
                      className="h-full bg-gradient-to-r from-red-500 to-green-500"
                    />
                  </div>
                </div>
              )}

              <div className="h-px bg-gray-100 w-full" />

              {/* Customization */}
              {product.isCustomizable && (
                <div className="space-y-4">
                  <label className="block text-sm font-bold text-gray-700 uppercase tracking-widest">
                    Enter Custom Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={customName}
                    onChange={(e) => handleCustomNameChange(e.target.value)}
                    placeholder="e.g. Blossom"
                    className={cn(
                       "w-full px-6 py-4 bg-white border rounded-2xl focus:outline-none focus:ring-2 transition-all",
                       customNameError ? "border-red-500 focus:ring-red-200" : "border-gray-200 focus:ring-bloom-rose/20 focus:border-bloom-rose"
                    )}
                  />
                  {customNameError ? (
                    <p className="text-sm font-bold text-red-500">{customNameError}</p>
                  ) : (
                    <p className="text-[10px] text-gray-400">Please double check spelling. Customised orders are non-refundable.</p>
                  )}
                </div>
              )}

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center border border-gray-200 rounded-full h-16 w-full sm:w-auto px-6">
                  <button 
                    onClick={() => { setQuantity(Math.max(1, quantity - 1)); setIsAdded(false); }}
                    className="p-1 hover:text-bloom-rose transition-colors"
                  >
                    <Minus size={20} />
                  </button>
                  <span className="w-12 text-center font-bold text-lg">{quantity}</span>
                  <button 
                    onClick={() => { setQuantity(quantity + 1); setIsAdded(false); }}
                    className="p-1 hover:text-bloom-rose transition-colors"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                
                {isAdded ? (
                  <Link 
                    to="/cart"
                    className="flex-grow h-16 bg-white text-bloom-rose border-2 border-bloom-rose rounded-full font-bold text-lg hover:bg-bloom-pink transition-all flex items-center justify-center space-x-3 shadow-xl shadow-bloom-rose/10"
                  >
                    <ShoppingBag size={20} />
                    <span>Go to Bag</span>
                  </Link>
                ) : (
                  <button 
                    disabled={!isFormValid}
                    onClick={() => {
                      addToCart(product, customName, selectedOptions, quantity);
                      setIsAdded(true);
                    }}
                    className={cn(
                       "flex-grow h-16 rounded-full font-bold text-lg transition-all flex items-center justify-center space-x-3 shadow-xl",
                       !isFormValid 
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none" 
                          : "bg-bloom-rose text-white hover:bg-bloom-rose/90 shadow-bloom-rose/20"
                    )}
                  >
                    <ShoppingBag size={20} />
                    <span>Add to Bag</span>
                  </button>
                )}
                
                <div className="flex space-x-2 text-bloom-rose">
                  <button className="h-16 w-16 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 transition-all text-gray-500 hover:text-bloom-rose">
                    <Heart size={24} />
                  </button>
                  <button className="h-16 w-16 flex items-center justify-center border border-gray-200 rounded-full hover:bg-gray-50 transition-all text-gray-500 hover:text-bloom-rose">
                    <Share2 size={24} />
                  </button>
                </div>
              </div>

              <button 
                disabled={!isFormValid}
                onClick={() => {
                  addToCart(product, customName, selectedOptions, quantity);
                  navigate('/checkout');
                }}
                className={cn(
                  "w-full h-16 rounded-full font-bold text-lg transition-all flex items-center justify-center shadow-lg",
                  !isFormValid
                    ? "bg-gray-100 text-gray-400 border-2 border-gray-200 cursor-not-allowed shadow-none"
                    : "bg-white text-bloom-rose border-2 border-bloom-rose hover:bg-bloom-pink"
                )}
              >
                Buy
              </button>
            </>
          )}

          {/* Trust Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t">
            <TrustBadge icon={<Truck size={20} />} title="Free Delivery" desc="On orders above ₹2000" />
            <TrustBadge icon={<ShieldCheck size={20} />} title="Secure Payment" desc="via Razorpay" />
          </div>
        </div>
      </div>

      {/* Product Review System */}
      <ProductReviews productId={product.id} productName={product.name} />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="mt-40 space-y-12">
          <div className="flex flex-col items-center text-center space-y-2">
            <h2 className="font-serif text-3xl font-bold tracking-tight">You May Also Like</h2>
            <div className="w-20 h-1 bg-bloom-rose/20 rounded-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function TrustBadge({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-center space-x-3">
      <div className="p-3 bg-bloom-pink rounded-2xl text-bloom-rose">
        {icon}
      </div>
      <div>
        <h4 className="text-xs font-bold uppercase tracking-widest">{title}</h4>
        <p className="text-[10px] text-gray-400">{desc}</p>
      </div>
    </div>
  );
}
