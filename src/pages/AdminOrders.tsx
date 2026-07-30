import { useState, useEffect } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ExternalLink, Mail, Phone, Loader2, ArrowLeft } from 'lucide-react';

export function AdminOrders() {
  const { isAdminAuthenticated } = useAdminAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const res = await fetch('/api/orders');
        if (res.ok) {
          const data = await res.json();
          setOrders(data.orders || []);
        } else {
          console.error('Failed to fetch orders');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    if (isAdminAuthenticated) {
      fetchOrders();
    }
  }, [isAdminAuthenticated]);

  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: { pathname: '/admin/orders' } }} replace />;
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_status: status })
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => o.id === orderId ? { ...o, order_status: status } : o));
      } else {
        alert('Failed to update status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  if (loading) {
     return (
       <div className="min-h-screen flex items-center justify-center">
         <Loader2 className="animate-spin text-bloom-rose" size={48} />
       </div>
     );
  }

  return (
    <div className="container mx-auto px-4 py-32">
      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center space-x-4">
           <Link to="/admin" className="p-2 border border-gray-200 rounded-full hover:bg-gray-50 transition-colors">
              <ArrowLeft size={20} className="text-gray-600" />
           </Link>
           <div>
             <h1 className="font-serif text-3xl font-bold">Manage Orders</h1>
             <p className="text-gray-500">View and update customer orders.</p>
           </div>
         </div>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
              <th className="p-4 border-b font-bold">Order ID</th>
              <th className="p-4 border-b font-bold">Date</th>
              <th className="p-4 border-b font-bold">Customer</th>
              <th className="p-4 border-b font-bold">Products</th>
              <th className="p-4 border-b font-bold">Status</th>
              <th className="p-4 border-b font-bold">Payment</th>
              <th className="p-4 border-b font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-gray-400">No orders found.</td>
              </tr>
            ) : null}
            {orders.map((order) => {
              const customerName = order.shipping_address?.name || 'Customer';
              const phone = order.shipping_address?.phone || order.guest_phone || '';
              const email = order.shipping_address?.email || order.guest_email || '';
              const orderDate = new Date(order.created_at).toLocaleDateString() + ' ' + new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
              
              return (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-4">
                    <Link to={`/admin/orders/${order.id}`} className="font-mono text-sm text-bloom-rose font-bold hover:underline flex items-center">
                      <span className="w-24 truncate" title={order.id}>{order.id}</span>
                      <ExternalLink size={14} className="ml-1" />
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-gray-600">{orderDate}</td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900">{customerName}</p>
                    <p className="text-xs text-gray-500 truncate w-32" title={email}>{email}</p>
                  </td>
                  <td className="p-4">
                    <p className="text-sm text-gray-900 line-clamp-2 w-48" title={order.product_name}>{order.product_name || 'N/A'}</p>
                    <p className="text-xs text-gray-500 font-mono">Code: {order.product_code || 'N/A'}</p>
                  </td>
                  <td className="p-4">
                    <select
                      value={order.order_status || 'processing'}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`text-xs font-bold px-2 py-1.5 rounded-xl border appearance-none cursor-pointer outline-none transition-colors
                        ${order.order_status === 'delivered' ? 'bg-green-50 text-green-700 border-green-200 focus:ring-green-500' :
                        order.order_status === 'shipped' || order.order_status === 'dispatched' ? 'bg-blue-50 text-blue-700 border-blue-200 focus:ring-blue-500' :
                        order.order_status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200 focus:ring-red-500' :
                        'bg-orange-50 text-orange-700 border-orange-200 focus:ring-orange-500'}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="processing">Processing</option>
                      <option value="dispatched">Dispatched</option>
                      <option value="shipped">Shipped</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-gray-900 w-24 truncate flex items-center flex-col items-start space-y-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${order.payment_status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {order.payment_status?.toUpperCase() || 'UNPAID'}
                      </span>
                    </p>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end space-x-2">
                       {email && (
                          <a href={`mailto:${email}`} title="Send Email" className="p-2 bg-gray-100 text-gray-500 hover:bg-bloom-rose hover:text-white rounded-full transition-colors">
                            <Mail size={16} />
                          </a>
                       )}
                       {phone && (
                          <a href={`https://wa.me/${phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" title="WhatsApp Customer" className="p-2 bg-gray-100 text-gray-500 hover:bg-[#25D366] hover:text-white rounded-full transition-colors">
                            <Phone size={16} />
                          </a>
                       )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
