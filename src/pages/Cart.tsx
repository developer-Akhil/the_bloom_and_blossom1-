import { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProductContext } from '../context/ProductContext';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight, Minus, Plus, ShieldCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { OptimizedImage } from '../components/common/OptimizedImage';

function CartItemComponent({ item }: { item: any }) {
  const { removeFromCart, updateQuantity, updateCustomizationName } = useCart();
  const { products } = useProductContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.customizationName || '');
  const [error, setError] = useState('');

  const currentProduct = products.find(p => p.id === item.id);
  const isItemOutofStock = currentProduct && currentProduct.inStock === false;

  const handleSave = () => {
    if (!editName.trim()) {
      setError('Required');
      return;
    }
    if (editName.length < 2 || editName.length > 20 || !/^[a-zA-Z0-9\s]+$/.test(editName)) {
      setError('Invalid name');
      return;
    }
    setError('');
    setIsEditing(false);
    updateCustomizationName(item.id, item.customizationName, editName, item.selectedOptions);
  };

  const getDisplayImage = () => {
    if (item.variants && item.selectedOptions && item.selectedOptions['Color']) {
        const variant = item.variants.find(v => v.color === item.selectedOptions!['Color']);
        if (variant?.image) return variant.image;
    }
    const img = item.images?.[0] || '';
    return img.includes('unsplash.com') ? `${img}&w=300` : img;
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn("flex items-center space-x-6 pb-8 border-b border-gray-100 group", isItemOutofStock && "opacity-60")}
    >
      <div className="w-24 sm:w-32 aspect-square rounded-2xl overflow-hidden bg-white flex-shrink-0">
        <OptimizedImage src={getDisplayImage()} alt={item.name} className="w-full h-full object-contain" />
      </div>
      
      <div className="flex-grow space-y-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg group-hover:text-bloom-rose transition-colors">{item.name}</h3>
            <p className="text-xs text-gray-400 capitalize">{item.category}</p>
            {isItemOutofStock && (
                <p className="text-xs font-bold text-red-500 mt-1 flex items-center">
                  <AlertTriangle size={12} className="mr-1" />
                  Out of Stock
                </p>
            )}
          </div>
          <p className="font-bold text-lg">₹{item.price * item.quantity}</p>
        </div>
        
        <div className="flex flex-wrap gap-2 items-center">
          {item.customizationName !== undefined && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className={cn("text-xs border rounded-md px-2 py-1", error ? "border-red-500" : "border-gray-300")}
                  />
                  <button onClick={handleSave} className="text-xs bg-bloom-rose text-white px-2 py-1 rounded-md">Save</button>
                  <button onClick={() => { setIsEditing(false); setEditName(item.customizationName || ''); setError(''); }} className="text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                  {error && <span className="text-[10px] text-red-500">{error}</span>}
                </div>
              ) : (
                <p className="text-[10px] text-bloom-rose bg-bloom-pink/50 flex items-center px-2 py-1 rounded-md">
                  Customised: <span className="font-bold ml-1">{item.customizationName}</span>
                  <button onClick={() => setIsEditing(true)} className="ml-2 text-bloom-rose underline hover:text-bloom-rose/70">Edit</button>
                </p>
              )}
            </div>
          )}
          {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, value]) => (
            <p key={key} className="text-[10px] text-gray-500 bg-gray-100 inline-block px-2 py-1 rounded-md">
              {key}: <span className="font-bold">{value as React.ReactNode}</span>
            </p>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center border border-gray-100 rounded-full h-12 px-5 bg-gray-50/50">
            <button 
              onClick={() => updateQuantity(item.id, item.quantity - 1, item.customizationName, item.selectedOptions)}
              className="p-1.5 hover:text-bloom-rose transition-colors"
            >
              <Minus size={16} />
            </button>
            <span className="w-10 text-center text-base font-bold">{item.quantity}</span>
            <button 
              onClick={() => updateQuantity(item.id, item.quantity + 1, item.customizationName, item.selectedOptions)}
              className="p-1.5 hover:text-bloom-rose transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <button 
            onClick={() => removeFromCart(item.id, item.customizationName, item.selectedOptions)}
            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

export function Cart() {
  const { cart, cartTotal, cartCount } = useCart();
  const { products } = useProductContext();
  const navigate = useNavigate();

  let discountAmount = 0;
  let shippingCost = 90; // Default shipping
  let discountLabel = "";
  
  if (cartTotal > 10000) {
    discountAmount = cartTotal * 0.30;
    shippingCost = 400;
    discountLabel = "Bulk Order Discount (30%)";
  } else if (cartTotal > 7000) {
    discountAmount = cartTotal * 0.20;
    shippingCost = 250;
    discountLabel = "Bulk Order Discount (20%)";
  } else if (cartTotal > 5000) {
    discountAmount = cartTotal * 0.15;
    shippingCost = 200;
    discountLabel = "Bulk Order Discount (15%)";
  } else {
    // Normal rules
    if (cartTotal > 2000) {
      shippingCost = 0;
    }
  }

  const finalTotal = cartTotal - discountAmount + shippingCost;

  const hasOutofStockItems = useMemo(() => {
    return cart.some(cartItem => {
       const p = products.find(prod => prod.id === cartItem.id);
       return p && p.inStock === false;
    });
  }, [cart, products]);

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 flex flex-col items-center justify-center space-y-8 text-center">
        <div className="p-8 bg-bloom-pink rounded-full text-bloom-rose">
          <ShoppingBag size={64} />
        </div>
        <h1 className="font-serif text-4xl font-bold">Your Bag is Empty</h1>
        <p className="text-gray-500 max-w-sm">Looks like you haven't added anything to your bag yet. Let's find something beautiful for you.</p>
        <Link to="/collections" className="px-8 py-4 bg-bloom-rose text-white rounded-full font-bold shadow-xl shadow-bloom-rose/20 hover:scale-105 transition-all">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <h1 className="font-serif text-4xl font-bold mb-12">Your Shopping Bag ({cartCount})</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence>
            {cart.map((item, idx) => (
              <CartItemComponent key={`${item.id}-${item.customizationName}-${JSON.stringify(item.selectedOptions)}-${idx}`} item={item} />
            ))}
          </AnimatePresence>
          
          <Link to="/collections" className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-bloom-rose transition-colors">
            <ShoppingBag size={18} className="mr-2" />
            Continue Shopping
          </Link>
        </div>

        {/* Summary */}
        <div className="lg:sticky lg:top-32 h-fit bg-gray-50 rounded-[2.5rem] p-10 space-y-8 border border-white">
          <h3 className="font-serif text-2xl font-bold">Order Summary</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="font-mono">₹{cartTotal}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-bloom-rose font-medium">
                <span>{discountLabel}</span>
                <span>-₹{discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Estimated Shipping</span>
              <span className={cn(shippingCost === 0 ? "text-green-600 font-medium" : "text-gray-500 font-mono")}>
                {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
              </span>
            </div>
            {shippingCost > 0 && (
              <p className="text-[10px] text-gray-400 italic">Free shipping on orders above ₹2,000</p>
            )}
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <span className="font-mono">₹0</span>
            </div>
            <div className="h-px bg-gray-200 mt-4" />
            <div className="flex justify-between text-xl font-bold pt-4">
              <span>Total</span>
              <span className="text-bloom-rose font-mono text-2xl">₹{finalTotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center space-x-3">
             <div className="p-2 bg-bloom-pink rounded-xl text-bloom-rose">
               <ShieldCheck size={20} />
             </div>
             <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest">
                Secure checkout via Razorpay
             </p>
          </div>

          <button 
            onClick={() => navigate('/checkout')}
            disabled={hasOutofStockItems}
            className={cn("w-full h-16 rounded-full font-bold text-lg transition-all flex items-center justify-center space-x-3 shadow-xl", 
               hasOutofStockItems 
                 ? "bg-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                 : "bg-bloom-rose text-white hover:bg-bloom-rose/90 shadow-bloom-rose/20"
            )}
          >
            <span>{hasOutofStockItems ? "Remove out of stock items" : "Proceed to Checkout"}</span>
            {!hasOutofStockItems && <ArrowRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
}
