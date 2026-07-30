import React, { useState, useEffect, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useProductContext } from '../context/ProductContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { ShieldCheck, ArrowLeft, QrCode, CheckCircle2, Loader2, CreditCard, Copy, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { OptimizedImage } from '../components/common/OptimizedImage';
import { supabase } from '../lib/supabase';
import { siteConfig } from '../config/site';
import QRCode from 'react-qr-code';

export function Checkout() {
  const { cart, cartTotal, clearCart } = useCart();
  const { products } = useProductContext();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'details' | 'payment' | 'success'>('details');
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

  const hasOutofStockItems = useMemo(() => {
    return cart.some(cartItem => {
       const p = products.find(prod => prod.id === cartItem.id);
       return p && p.inStock === false;
    });
  }, [cart, products]);

  if (hasOutofStockItems) {
    return <Navigate to="/cart" replace />;
  }
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi_qr'>('razorpay');
  const [shippingData, setShippingData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: ''
  });

  const [phoneError, setPhoneError] = useState('');
  const [zipError, setZipError] = useState('');
  const [paymentError, setPaymentError] = useState('');

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

  const validateIndianPhone = (phone: string) => {
    const indianPhoneRegex = /^(?:(?:\+|0{0,2})91[\s-]?)?(?:0[\s-]?)?[6789]\d{9}$/;
    return indianPhoneRegex.test(phone.trim());
  };

  const validateIndianPin = (pin: string) => {
    const indianPinRegex = /^[1-9][0-9]{5}$/;
    return indianPinRegex.test(pin.trim());
  };

  const handleDetailsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;
    if (!validateIndianPhone(shippingData.phone)) {
      setPhoneError('Please enter a valid 10-digit Indian mobile number');
      hasError = true;
    } else {
      setPhoneError('');
    }
    if (!validateIndianPin(shippingData.zip)) {
      setZipError('Please enter a valid 6-digit Indian PIN code (cannot start with 0)');
      hasError = true;
    } else {
      setZipError('');
    }

    if (hasError) return;
    setStep('payment');
  };

  const insertOrderToSupabase = async (paymentId: string | null = null, pStatus: string = 'pending') => {
    try {
      const newOrderId = crypto.randomUUID();
      
      const productNames = cart.map(item => {
        let name = item.name;
        if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
           name += ` - ${Object.values(item.selectedOptions).join(', ')}`;
        }
        if (item.customizationName) {
           name += ` [Custom: ${item.customizationName}]`;
        }
        return name;
      }).join(' | ');

      const productCodes = cart.map(item => {
         let code = item.code || '';
         if (!code && item.variants && item.variants.length > 0 && item.selectedOptions && item.selectedOptions['Color']) {
            const variantColor = item.selectedOptions['Color'];
            const variant = item.variants.find(v => v.color === variantColor);
            if (variant && variant.code) {
               code = variant.code;
            }
         }
         return code || 'N/A';
      }).join(' | ');

      const orderItems = cart.map(item => {
        let code = item.code || '';
        if (!code && item.variants && item.variants.length > 0 && item.selectedOptions && item.selectedOptions['Color']) {
           const variantColor = item.selectedOptions['Color'];
           const variant = item.variants.find(v => v.color === variantColor);
           if (variant && variant.code) {
              code = variant.code;
           }
        }
        let customParts = [];
        if (code) customParts.push(`Code: ${code}`);
        if (item.selectedOptions && Object.keys(item.selectedOptions).length > 0) {
           customParts.push(Object.values(item.selectedOptions).join(', '));
        }
        if (item.customizationName) {
           customParts.push(`Custom text: ${item.customizationName}`);
        }
        
        return {
          order_id: newOrderId,
          product_id: null,
          product_name: item.name,
          quantity: item.quantity,
          price: item.price,
          customization_name: customParts.length > 0 ? customParts.join(' | ') : null
        };
      });

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          newOrderId,
          guest_email: shippingData.email,
          guest_phone: shippingData.phone,
          total_amount: cartTotal,
          discount_applied: discountAmount,
          final_amount: finalTotal,
          shipping_address: shippingData,
          payment_status: pStatus,
          payment_id: paymentId,
          user_id: null,
          order_status: 'processing',
          product_name: productNames,
          product_code: productCodes,
          cartItems: orderItems
        })
      });

      if (!res.ok) {
        console.error("Order Insert Error");
        return null;
      }
      
      return newOrderId;
    } catch (e) {
      console.error("Failed to save order to Supabase", e);
      return null;
    }
  };

  const initiatePayment = async () => {
    setIsProcessing(true);
    setPaymentError('');
    try {
      const email = shippingData.email.trim().toLowerCase();
      const phone = shippingData.phone.trim();
      
      const payload = {
        amount: finalTotal,
        email: email,
        phone: phone,
        name: shippingData.name
      };

      console.log(`Initiating payment fetch to: ${siteConfig.api.payment.createOrder}`);
      const res = await fetch(siteConfig.api.payment.createOrder, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        let errText = 'Failed to initiate payment';
        try {
          const contentType = res.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errJson = await res.json();
            
            let descriptiveError = errJson.error || errText;
            if (errJson.details) {
               if (typeof errJson.details === 'object') {
                  descriptiveError += '\n' + JSON.stringify(errJson.details);
               } else {
                  descriptiveError += '\n' + errJson.details;
               }
            }
            errText = descriptiveError;
          } else {
            errText = await res.text();
          }
        } catch(e) {}
        throw new Error(errText);
      }
      
      const contentType = res.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        const text = await res.text();
        if (text.includes('<!doctype html>') || text.includes('<html')) {
           throw new Error('Received an HTML error page. The backend server might be restarting after an environment variable update or is temporarily unavailable. Please wait a moment and try again.');
        }
        throw new Error('Server returned an invalid response (not JSON).');
      }
      
      const data = await res.json();
      
      const options = {
        key: data.key_id, 
        amount: data.amount,
        currency: data.currency,
        name: siteConfig.name,
        description: "Order Checkout",
        order_id: data.order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(siteConfig.api.payment.verifyPayment, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
               const internalOrderId = await insertOrderToSupabase(response.razorpay_payment_id, 'paid');
               
               if (internalOrderId) {
                 window.location.href = `/checkout/success?orderId=${internalOrderId}&code=SUCCESS`;
               } else {
                 alert('Payment was successful, but there was an error saving your order. Please contact support.');
                 setIsProcessing(false);
               }
            } else {
               alert('Payment verification failed');
               setIsProcessing(false);
            }
          } catch(err) {
            alert('Payment verification error');
            setIsProcessing(false);
          }
        },
        prefill: {
          name: shippingData.name,
          email: email,
          contact: phone
        },
        theme: {
          color: "#ec4899"
        },
        modal: {
          ondismiss: function() {
            setIsProcessing(false);
          }
        }
      };
      
      const rzp1 = new (window as any).Razorpay(options);
      rzp1.on('payment.failed', function (response: any){
         setIsProcessing(false);
         const errorDesc = response.error?.description || '';
         if (errorDesc.toLowerCase().includes('3dsecure')) {
           setPaymentError('Your card does not support 3D Secure or it is not enabled. Please use a different card or UPI/Netbanking.');
         } else {
           setPaymentError(errorDesc || 'Payment failed. Please try again.');
         }
      });
      rzp1.open();

    } catch (e: any) {
      console.error('Payment initiation error', e);
      setIsProcessing(false);
      setPaymentError(e?.message || 'Failed to initiate payment. Please try again.');
    }
  };

  if (step === 'success') {
    return (
      <div className="container py-32 flex flex-col items-center justify-center space-y-8 text-center">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center p-6 shadow-xl shadow-green-100/50"
        >
          <CheckCircle2 size={64} />
        </motion.div>
        <div className="space-y-4">
          <h1 className="font-serif text-5xl font-bold">Order Confirmed!</h1>
          <p className="text-gray-500 max-w-md mx-auto">
            Thank you for shopping with The Bloom & Blossom. Your order has been placed successfully and we'll start preparing it soon.
          </p>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <button 
            onClick={() => navigate('/')}
            className="px-12 py-4 bg-bloom-rose text-white rounded-full font-bold shadow-xl shadow-bloom-rose/20 hover:scale-105 transition-all"
          >
            Back to Home
          </button>
          <button 
             onClick={() => navigate('/dashboard')}
             className="px-12 py-4 bg-white text-gray-900 border border-gray-100 rounded-full font-bold hover:bg-gray-50 transition-all"
          >
            View Order Status
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-12">
        <button 
          onClick={() => step === 'payment' ? setStep('details') : navigate('/cart')}
          className="inline-flex items-center text-sm font-bold text-gray-400 hover:text-bloom-rose transition-colors"
        >
          <ArrowLeft size={16} className="mr-2" />
          {step === 'payment' ? 'Back to Details' : 'Back to Cart'}
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20">
          {/* Form Side */}
          <div className="space-y-12">
            <h1 className="font-serif text-4xl font-bold">
              {step === 'details' ? 'Shipping Details' : 'Payment Integration'}
            </h1>

            {step === 'details' ? (
              <form onSubmit={handleDetailsSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="Full Name" value={shippingData.name} required onChange={v => setShippingData({...shippingData, name: v})} />
                  <Input label="Email Address" type="email" value={shippingData.email} required onChange={v => setShippingData({...shippingData, email: v})} />
                </div>
                <Input label="Phone Number" value={shippingData.phone} required error={phoneError} onChange={v => { setShippingData({...shippingData, phone: v}); setPhoneError(''); }} />
                <Input label="Apartment, Street Address" value={shippingData.address} required onChange={v => setShippingData({...shippingData, address: v})} />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <Input label="City" value={shippingData.city} required onChange={v => setShippingData({...shippingData, city: v})} />
                  <Input label="State" value={shippingData.state} required onChange={v => setShippingData({...shippingData, state: v})} />
                </div>
                <Input label="PIN Code" value={shippingData.zip} required error={zipError} onChange={v => { setShippingData({...shippingData, zip: v}); setZipError(''); }} />
                <button 
                  type="submit"
                  className="w-full h-16 bg-bloom-rose text-white rounded-full font-bold text-lg hover:bg-bloom-rose/90 transition-all shadow-xl shadow-bloom-rose/20"
                >
                  Continue to Payment
                </button>
              </form>
            ) : (
              <div className="space-y-8">
                <div className="flex bg-gray-50 p-1.5 rounded-2xl w-full mb-8">
                  <button
                    onClick={() => setPaymentMethod('razorpay')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${paymentMethod === 'razorpay' ? 'bg-white shadow-sm text-bloom-rose' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    <CreditCard size={18} />
                    <span>Pay with Card/UPI/Netbanking</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('upi_qr')}
                    className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-bold text-sm transition-all ${paymentMethod === 'upi_qr' ? 'bg-white shadow-sm text-bloom-rose' : 'text-gray-500 hover:text-gray-900'}`}
                  >
                    <QrCode size={18} />
                    <span>Direct UPI QR</span>
                  </button>
                </div>

                {paymentMethod === 'razorpay' ? (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    {paymentError && (
                      <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium flex items-start gap-3 text-left">
                        <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        <p>{paymentError}</p>
                      </div>
                    )}
                    <div className="p-8 bg-pink-50 rounded-[2.5rem] border-2 border-dashed border-bloom-rose/30 flex flex-col items-center text-center space-y-6">
                      <div className="space-y-2">
                        <h3 className="font-bold text-lg">Pay securely using Razorpay</h3>
                        <p className="text-sm text-gray-500">You can pay with all major credit cards, debit cards, UPI, and Netbanking options.</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-sm uppercase tracking-widest text-gray-400">Payment Steps</h4>
                      <ul className="space-y-3 text-sm text-gray-600">
                        <li className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-bloom-rose text-white flex items-center justify-center text-[10px] font-bold">1</div>
                          <span>Click 'Proceed to Payment' below.</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-bloom-rose text-white flex items-center justify-center text-[10px] font-bold">2</div>
                          <span>Complete the payment of ₹{finalTotal} on the secure payment pop-up.</span>
                        </li>
                        <li className="flex items-center space-x-3">
                          <div className="w-6 h-6 rounded-full bg-bloom-rose text-white flex items-center justify-center text-[10px] font-bold">3</div>
                          <span>Wait while we verify the payment. You will automatically be redirected.</span>
                        </li>
                      </ul>
                    </div>

                    <button 
                      onClick={initiatePayment}
                      disabled={isProcessing}
                      className="w-full h-16 bg-bloom-rose text-white rounded-full font-bold text-lg hover:bg-bloom-rose/90 transition-all flex items-center justify-center space-x-3 shadow-xl shadow-bloom-rose/20 disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          <span>Payment in Progress...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard size={24} />
                          <span>Proceed to Payment</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-gray-200 flex flex-col items-center text-center space-y-6">
                      <div className="space-y-2 mb-4">
                        <h3 className="font-bold text-lg">Scan to Pay via UPI</h3>
                        <p className="text-sm text-gray-500">Scan this code using Google Pay, PhonePe, Paytm, or any UPI app.</p>
                      </div>
                      
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-2">
                        <QRCode
                          value={`upi://pay?pa=rajputpriyanka70@okhdfcbank&pn=MyLittleCorner&am=${finalTotal}&cu=INR`}
                          size={180}
                          level="M"
                        />
                      </div>
                      
                      <div className="text-center w-full">
                        <p className="text-sm text-gray-500 font-medium mb-1">Amount to pay</p>
                        <p className="text-3xl font-mono font-bold text-bloom-rose">₹{finalTotal.toFixed(2)}</p>
                      </div>

                      <div className="w-full h-px bg-gray-200 my-2"></div>

                      <div className="space-y-4 w-full text-left">
                        <h4 className="font-bold text-sm uppercase tracking-widest text-gray-400">Next Steps</h4>
                        <ul className="space-y-3 text-sm text-gray-600">
                          <li className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-bloom-rose text-white flex items-center justify-center text-[10px] font-bold">1</div>
                            <span>Scan the QR code and complete the payment of ₹{finalTotal}.</span>
                          </li>
                          <li className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-bloom-rose text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</div>
                            <span>Take a screenshot of the successful payment.</span>
                          </li>
                          <li className="flex items-center space-x-3">
                            <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-[10px] font-bold shrink-0"><Smartphone size={12}/></div>
                            <span>Click the button below to share the screenshot on WhatsApp to confirm your order.</span>
                          </li>
                        </ul>
                      </div>
                      
                      <button 
                        onClick={async () => {
                          const internalOrderId = await insertOrderToSupabase(null, 'pending');
                          if (!internalOrderId) {
                            alert('An error occurred while creating your order. Please try again or contact support.');
                            return;
                          }
                          const waText = encodeURIComponent(`Hello, I've made the payment of Rs ${finalTotal} for my order using Manual UPI. Order ID: ${internalOrderId}. I am sharing the payment screenshot below.`);
                          
                          window.open(`https://wa.me/${siteConfig.contact.phone.replace(/\D/g, '')}?text=${waText}`, '_blank');
                          window.location.href = `/checkout/success?orderId=${internalOrderId}&code=UPI_MANUAL`;
                        }}
                        className="w-full h-16 bg-[#25D366] text-white rounded-full font-bold text-lg hover:bg-[#128C7E] transition-all flex items-center justify-center space-x-3 shadow-xl shadow-green-600/20"
                      >
                        <span>Confirm via WhatsApp</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Cart Summary Side */}
          <div className="bg-gray-50 rounded-[3rem] p-10 h-fit space-y-8 border border-white">
            <h3 className="font-serif text-2xl font-bold">Your Order</h3>
            <div className="space-y-6 max-h-[400px] overflow-auto pr-2">
              {cart.map((item, idx) => {
                let displayImage = item.images?.[0] || '';
                displayImage = displayImage.includes('unsplash.com') ? `${displayImage}&w=200` : displayImage;
                if (item.variants && item.selectedOptions && item.selectedOptions['Color']) {
                  const variant = item.variants.find(v => v.color === item.selectedOptions!['Color']);
                  if (variant?.image) {
                     displayImage = variant.image;
                  }
                }
                
                return (
                  <div key={`${item.id}-${idx}`} className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-white shrink-0">
                      <OptimizedImage src={displayImage} alt={item.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-grow min-w-0">
                    <h4 className="font-bold text-sm line-clamp-1">{item.name}</h4>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {item.customizationName && (
                        <span className="text-[9px] text-bloom-rose bg-bloom-pink/50 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                          {item.customizationName}
                        </span>
                      )}
                      {item.selectedOptions && Object.entries(item.selectedOptions).map(([key, value]) => (
                        <span key={key} className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                          {key}: {value}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                  </div>
                  <div className="font-bold text-sm text-bloom-rose">₹{item.price * item.quantity}</div>
                </div>
              );
            })}
            </div>
            
            <div className="h-px bg-gray-200" />
            
            <div className="space-y-4">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span>
                <span>₹{cartTotal}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-bloom-rose font-medium">
                  <span>{discountLabel}</span>
                  <span>-₹{discountAmount.toFixed(2)}</span>
                </div>
              )}
              {cartTotal > 0 && cartTotal < 2000 && (
                <div className="text-xs text-gray-400 bg-gray-100 p-2 rounded-lg">
                  Add ₹{2000 - cartTotal} more to get Free Shipping!
                </div>
              )}
              <div className="flex justify-between text-gray-500">
                <span>Shipping</span>
                <span className={shippingCost === 0 ? "text-green-600 font-medium" : ""}>
                   {shippingCost === 0 ? 'FREE' : `₹${shippingCost}`}
                </span>
              </div>
              <div className="flex justify-between text-xl font-bold pt-4">
                <span>Total</span>
                <span className="text-bloom-rose font-mono text-2xl">₹{finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-gray-100 flex items-center space-x-3">
               <ShieldCheck size={20} className="text-bloom-rose" />
               <p className="text-[10px] text-gray-400 font-medium uppercase tracking-widest leading-relaxed">
                  Your data is protected. All transactions are encrypted and secure.
               </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Input({ label, value, type="text", required=false, error, onChange }: { label: string, value: string, type?: string, required?: boolean, error?: string, onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">{label}</label>
      <input 
        type={type} 
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className={`w-full px-6 py-4 bg-white border ${error ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : 'border-gray-200 focus:ring-bloom-rose/20 focus:border-bloom-rose'} rounded-2xl focus:outline-none focus:ring-2 transition-all`}
      />
      {error && <p className="text-red-500 text-xs font-medium pl-2">{error}</p>}
    </div>
  );
}
