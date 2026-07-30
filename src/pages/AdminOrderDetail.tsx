import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ArrowLeft, Mail, Phone, Loader2, MapPin, Package, Clock, CreditCard, ExternalLink } from 'lucide-react';
import { products } from '../data/products';

export function AdminOrderDetail() {
  const { id } = useParams();
  const { isAdminAuthenticated } = useAdminAuth();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrderDetail() {
      try {
        const res = await fetch(`/api/orders/${id}`);
        if (res.ok) {
          const data = await res.json();
          setOrderDetails(data);
        } else {
          console.error("Failed to fetch order detail");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (isAdminAuthenticated && id) {
      fetchOrderDetail();
    }
  }, [isAdminAuthenticated, id]);

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: { pathname: `/admin/orders/${id}` } }} replace />;
  }

  if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="animate-spin text-bloom-rose" size={48} />
       </div>
     );
  }

  if (!orderDetails || !orderDetails.order) {
     return (
       <div className="container mx-auto px-4 py-32 text-center">
         <h1 className="text-2xl font-bold mb-4">Order Not Found</h1>
         <Link to="/admin/orders" className="text-bloom-rose border-b border-bloom-rose pb-1">Wait, take me back</Link>
       </div>
     );
  }

  const { order, items } = orderDetails;
  const shippingData = order.shipping_address || {};
  const customerName = shippingData.name || 'Customer';
  const email = shippingData.email || order.guest_email || '';
  const phone = shippingData.phone || order.guest_phone || '';
  const orderDate = new Date(order.created_at).toLocaleDateString() + ' ' + new Date(order.created_at).toLocaleTimeString();

  return (
    <div className="container mx-auto px-4 py-32 max-w-4xl">
      <div className="flex items-center space-x-4 mb-8">
        <Link to="/admin/orders" className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="font-serif text-3xl font-bold flex items-center space-x-3">
             <span>Order Details</span>
          </h1>
          <p className="text-gray-500 font-mono text-sm mt-1">{order.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Customer & Shipping Info */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] -z-10"></div>
             <h3 className="font-serif text-xl font-bold mb-4 flex items-center text-gray-900">
               <Phone className="mr-2 text-blue-500" size={20}/> Contact Information
             </h3>
             <div className="space-y-2 text-gray-600 text-sm">
                <p><strong className="text-gray-900">Name:</strong> {customerName}</p>
                <p><strong className="text-gray-900">Email:</strong> {email}</p>
                <p><strong className="text-gray-900">Phone:</strong> {phone}</p>
             </div>
             
             <div className="mt-6 flex space-x-3">
                {email && (
                  <a href={`mailto:${email}`} className="flex-1 flex items-center justify-center space-x-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-xl font-bold hover:bg-blue-100 transition-colors">
                    <Mail size={16}/> <span>Email Customer</span>
                  </a>
                )}
                {phone && (
                  <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 flex items-center justify-center space-x-2 bg-[#25D366]/10 text-[#128C7E] px-4 py-2 rounded-xl font-bold hover:bg-[#25D366]/20 transition-colors">
                    <Phone size={16}/> <span>WhatsApp</span>
                  </a>
                )}
             </div>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-[100px] -z-10"></div>
             <h3 className="font-serif text-xl font-bold mb-4 flex items-center text-gray-900">
               <MapPin className="mr-2 text-orange-500" size={20}/> Shipping Address
             </h3>
             <div className="space-y-2 text-gray-600 text-sm">
                <p>{shippingData.address}</p>
                <p>{shippingData.city}, {shippingData.state} {shippingData.zip}</p>
             </div>
           </div>
        </div>

        {/* Order Info & Items */}
        <div className="space-y-6">
           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <h3 className="font-serif text-xl font-bold mb-4 flex items-center text-gray-900">
               <Package className="mr-2 text-bloom-rose" size={20}/> Order Status
             </h3>
             <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500 flex items-center"><Clock className="mr-1" size={14}/> Date</span>
                   <span className="font-medium text-gray-900">{orderDate}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                   <span className="text-gray-500 flex items-center"><CreditCard className="mr-1" size={14}/> Payment</span>
                   <span className="font-mono">{order.payment_id || 'N/A'}</span>
                </div>
                
                <div className="pt-4 border-t border-gray-100">
                   <div className="flex justify-between items-center text-sm mb-2">
                       <span className="text-gray-500">Status</span>
                       <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${order.order_status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.order_status === 'shipped' || order.order_status === 'dispatched' ? 'bg-blue-100 text-blue-700' :
                        order.order_status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'}`}>
                         {order.order_status}
                       </span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                       <span className="text-gray-500">Payment Status</span>
                       <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                         {order.payment_status || 'UNPAID'}
                       </span>
                   </div>
                </div>
             </div>
           </div>

           <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
             <h3 className="font-serif text-xl font-bold mb-4 text-gray-900">Items Ordered</h3>
             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {items && items.length > 0 ? items.map((item: any) => {
                 const matchedProduct = products.find(p => p.name.toLowerCase() === item.product_name.toLowerCase().trim() || (p.code && p.code.toLowerCase() === item.product_name.toLowerCase().trim()));
                 
                 // Attempt to extract variant information from customization_name if we don't have it natively
                 let variantColor = '';
                 let customNameDisplay = item.customization_name;
                 
                 // If the customization string is formatted from our updated checkout logic: 'Code: XYZ | Color | Custom'
                 if (customNameDisplay && customNameDisplay.includes('Code:')) {
                    // It's already formatted well, just display as is
                 } else if (customNameDisplay) {
                    customNameDisplay = `Custom: ${customNameDisplay}`;
                 }

                 let displayedCode = matchedProduct?.code || 'N/A';
                 if (!matchedProduct?.code && matchedProduct?.variants && matchedProduct.variants.length > 0) {
                    // fallback to finding variant code via order.product_code string matching or looking at item properties
                    if (order && order.product_code) {
                         const codes = order.product_code.split('|').map((c: string) => c.trim());
                         // Very naive mapping, but better than nothing for past orders
                         const possibleVariant = matchedProduct.variants.find(v => v.code && codes.includes(v.code));
                         if (possibleVariant) {
                           displayedCode = possibleVariant.code || 'N/A';
                         }
                    }
                 }
                 // If we have an intelligently formatted customNameDisplay (from updated checkout), it already has the Code, so we only append if not present.
                 const hasCodeInCustom = customNameDisplay && customNameDisplay.includes('Code:');

                 return (
                 <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl text-sm">
                   <div className="flex items-center space-x-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{item.product_name}</span>
                        {!hasCodeInCustom && displayedCode !== 'N/A' && <span className="text-xs text-gray-600 font-mono">Code: {displayedCode}</span>}
                        {customNameDisplay && <span className="text-xs text-gray-500">{customNameDisplay}</span>}
                        <span className="text-gray-500">Qty: {item.quantity}</span>
                        {matchedProduct && (
                          <Link to={`/products/${matchedProduct.id}`} target="_blank" className="text-blue-500 hover:text-blue-700 hover:underline inline-flex items-center text-xs mt-1">
                            Product Link <ExternalLink size={10} className="ml-1" />
                          </Link>
                        )}
                      </div>
                   </div>
                   <span className="font-bold text-bloom-rose">₹{item.price * item.quantity}</span>
                 </div>
               )}) : (
                 <p className="text-gray-500 text-sm">No individual items found for this order.</p>
               )}
             </div>
             
             <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                 <span className="font-serif font-bold text-gray-900 text-lg">Total</span>
                 <span className="font-bold text-2xl text-bloom-rose">₹{order.final_amount || order.total_amount}</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}
