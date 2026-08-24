import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Loader2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

import { siteConfig } from '../config/site';

export function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const { user } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');
  const [emailStatus, setEmailStatus] = useState<'pending' | 'sending' | 'sent' | 'failed' | 'skipped'>('pending');
  const [orderDetails, setOrderDetails] = useState<any>(null);

  const queryCode = searchParams.get('code');

  useEffect(() => {
    let ignore = false;

    console.log("CheckoutSuccess useEffect triggered with:", { orderId, queryCode });

    async function verifyPayment() {
      console.log("verifyPayment called!");
      
      if (!orderId) {
        if (!ignore) {
          setStatus('failed');
          setMessage('Invalid order ID.');
        }
        return;
      }
      
      if (queryCode === 'PAYMENT_CANCELLED' || queryCode === 'CANCELLED') {
        if (!ignore) {
          setStatus('failed');
          setMessage('Payment was cancelled. Please try again.');
        }
        return;
      }

      if (queryCode === 'COMPLETED' || queryCode === 'SUCCESS' || queryCode === 'PAYMENT_SUCCESS' || queryCode === 'UPI_MANUAL') {
        try {
          // Immediately show success so the user isn't stuck
          if (!ignore) setStatus('success');

          console.log("Fetching order:", orderId);
          let dbOrderDetails: any = null;
          let emailToUse = '';

          try {
            const res = await fetch(`/api/orders/${orderId}`);
            console.log("Fetch finished with status:", res.status);
            if (res.ok) {
              const data = await res.json();
              console.log("Fetch data parsed:", data);
              const { order, items } = data;
                let shippingDataObj = order.shipping_address;
                if (typeof shippingDataObj === 'string') {
                  try {
                    shippingDataObj = JSON.parse(shippingDataObj);
                  } catch (e) {
                    console.warn("Failed to parse shipping_address string", e);
                  }
                }
                
              dbOrderDetails = {
                orderId: order.id,
                productNames: order.product_name,
                productCodes: order.product_code,
                cart: (items || []).map((i: any) => ({
                  id: i.product_id || i.id,
                  name: i.product_name,
                  price: i.price,
                  quantity: i.quantity,
                  customizationName: i.customization_name
                })),
                total: order.final_amount,
                shippingData: shippingDataObj,
              };
              emailToUse = order.guest_email || shippingDataObj?.email;
            } else {
               const textObj = await res.text();
               throw new Error(`API returned ${res.status}: ${textObj}`);
            }
          } catch(err: any) {
             console.warn("DB order fetch failed:", err);
             if (!ignore) {
                setMessage("DB order fetch failed: " + err.message);
             }
          }

          console.log("Setting order details! ignore:", ignore);
          if (!ignore) {
            if (dbOrderDetails) {
              setOrderDetails(dbOrderDetails);
            }
            try { clearCart(); } catch(e) { console.error("clearCart error", e); }
          }

          if (emailToUse && emailToUse !== 'youremail@example.com' && !emailToUse.includes('testcall')) {
              console.log("Initiating order confirmation to email: ", emailToUse);
              if (!ignore) setEmailStatus('sending');
              
              try {
                const r = await fetch('/api/contact/order-confirmation', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: emailToUse,
                    orderDetails: dbOrderDetails
                  })
                });
                if (!r.ok) {
                  console.error("Order confirmation failed:", await r.text());
                  if (!ignore) setEmailStatus('failed');
                } else {
                  if (!ignore) setEmailStatus('sent');
                }
              } catch (err) {
                 console.error("Order confirmation API catch error:", err);
                 if (!ignore) setEmailStatus('failed');
              }
          } else {
             console.warn("No valid email found, skipping confirmation");
             if (!ignore) setEmailStatus('skipped');
          }

          if (user && !user.user_metadata?.has_used_first_discount) {
               supabase.auth.updateUser({ 
                 data: { has_used_first_discount: true } 
               });
          }
        } catch (e: any) {
          console.error("Failed to sequence order success:", e);
          if (!ignore) {
             setStatus('success'); // Still show success even if order fetch fails
             setEmailStatus('failed');
             setMessage(e.message || "Unknown error occurred while fetching details.");
          }
        }
      } else if (queryCode === 'FAILED' || queryCode === 'PAYMENT_ERROR') {
        if (!ignore) {
          setStatus('failed');
          setMessage('Payment failed. Please try again.');
        }
      } else {
         if (!ignore) {
           setStatus('failed');
           setMessage('Payment could not be verified. Please contact support.');
         }
      }
    }
    
    verifyPayment();

    return () => {
       ignore = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, queryCode]);

  return (
    <div className="container min-h-screen pt-32 pb-20 flex flex-col items-center justify-center space-y-8 px-4">
      {status === 'loading' ? (
        <div className="space-y-6 flex flex-col items-center">
            <Loader2 size={64} className="animate-spin text-bloom-rose" />
            <h1 className="font-serif text-3xl font-bold">{message}</h1>
        </div>
      ) : status === 'success' ? (
        <>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center p-6 shadow-xl shadow-green-100/50"
          >
            <CheckCircle2 size={64} />
          </motion.div>
          <div className="space-y-4 text-center">
            <h1 className="font-serif text-5xl font-bold">Order Confirmed!</h1>
            <p className="text-gray-500 max-w-md mx-auto">
              Thank you for shopping with The Bloom & Blossom. Your order (ID: {orderId}) has been placed successfully and we'll start preparing it soon.
            </p>
            {message && message !== 'Verifying your payment...' && (
              <p className="text-sm text-red-500 font-bold bg-red-50 p-2 rounded">{message}</p>
            )}
            {emailStatus === 'sending' && <p className="text-sm text-blue-500">Sending confirmation email...</p>}
            {emailStatus === 'sent' && <p className="text-sm text-green-500">A confirmation email has been sent to {orderDetails?.shippingData?.email}</p>}
            {emailStatus === 'failed' && <p className="text-sm text-red-500">Failed to send confirmation email. Please check your order details below.</p>}
            {emailStatus === 'skipped' && <p className="text-sm text-gray-500">No email was provided, skipping confirmation email.</p>}
          </div>

          {orderDetails && (
             <div className="w-full max-w-2xl bg-white border border-gray-100 rounded-3xl p-8 mt-8 shadow-sm text-left">
               <h3 className="font-bold text-xl mb-6 font-serif">Order Summary</h3>
               
               <div className="space-y-4 mb-8 border-b border-gray-100 pb-6">
                 {orderDetails.productNames && (
                   <div className="mb-4 space-y-1 bg-bloom-rose/5 p-4 rounded-xl text-sm">
                     <p><span className="font-medium text-gray-900">Products:</span> {orderDetails.productNames}</p>
                     <p><span className="font-medium text-gray-900">Product Codes:</span> {orderDetails.productCodes}</p>
                   </div>
                 )}
                 {orderDetails.cart?.map((item: any) => (
                   <div key={item.id} className="flex justify-between items-center bg-gray-50 p-4 rounded-2xl">
                     <div className="flex flex-col">
                       <span className="font-medium text-gray-900">{item.name}</span>
                       {item.customizationName && <span className="text-xs text-gray-500">Custom: {item.customizationName}</span>}
                       <span className="text-sm text-gray-500">Qty: {item.quantity}</span>
                     </div>
                     <span className="font-bold text-bloom-rose">₹{item.price * item.quantity}</span>
                   </div>
                 ))}
                 
                 <div className="pt-4 mt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900 font-serif text-xl">Total Amount</span>
                      <span className="font-bold text-bloom-rose text-2xl">₹{orderDetails.total}</span>
                    </div>
                 </div>
               </div>
               
               <div className="pt-2">
                 <h4 className="font-bold mb-4 font-serif">Shipping Details</h4>
                 <div className="text-sm text-gray-600 space-y-2 bg-gray-50 p-6 rounded-2xl">
                   <p><span className="font-medium text-gray-900">Name:</span> {orderDetails.shippingData?.name}</p>
                   <p><span className="font-medium text-gray-900">Email:</span> {orderDetails.shippingData?.email}</p>
                   <p><span className="font-medium text-gray-900">Phone:</span> {orderDetails.shippingData?.phone}</p>
                   <p><span className="font-medium text-gray-900">Address:</span> {orderDetails.shippingData?.address}, {orderDetails.shippingData?.city}, {orderDetails.shippingData?.state} {orderDetails.shippingData?.pincode}</p>
                 </div>
               </div>
             </div>
          )}

          <div className="w-full max-w-md bg-pink-50/70 border border-bloom-pink/50 rounded-3xl p-5 text-center space-y-2 mt-4">
            <p className="text-xs font-bold text-bloom-rose uppercase tracking-wider">🌸 We Value Your Thoughts</p>
            <p className="text-sm text-gray-700">How was your ordering experience today?</p>
            <button
              onClick={() => navigate(`/feedback?order=${encodeURIComponent(orderId || '')}&source=WEBSITE`)}
              className="mt-2 inline-flex items-center justify-center px-6 py-2.5 bg-white hover:bg-pink-100 text-bloom-rose font-bold text-xs rounded-full border border-pink-200 transition shadow-xs cursor-pointer"
            >
              Share Quick Feedback ⭐
            </button>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => navigate('/')}
              className="px-12 py-4 bg-bloom-rose text-white rounded-full font-bold shadow-xl shadow-bloom-rose/20 hover:scale-105 transition-all"
            >
              Continue Shopping
            </button>
            {user && (
              <button 
                 onClick={() => navigate('/dashboard')}
                 className="px-12 py-4 bg-white text-gray-900 border border-gray-100 rounded-full font-bold hover:bg-gray-50 transition-all"
              >
                View in Dashboard
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center p-6 shadow-xl shadow-red-100/50"
          >
            <XCircle size={64} />
          </motion.div>
          <div className="space-y-4">
            <h1 className="font-serif text-5xl font-bold">Payment Error</h1>
            <p className="text-gray-500 max-w-md mx-auto">
              {message}
            </p>
          </div>
          <div className="pt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <button 
              onClick={() => navigate('/checkout')}
              className="px-12 py-4 bg-bloom-rose text-white rounded-full font-bold shadow-xl shadow-bloom-rose/20 hover:scale-105 transition-all"
            >
              Retry Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}
