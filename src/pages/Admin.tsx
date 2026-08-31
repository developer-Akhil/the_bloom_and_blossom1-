import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Settings, LogOut, Package, ShoppingBag, MessageSquare, HeartHandshake, Sparkles, Megaphone } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

export function Admin() {
  const { isAdminAuthenticated, logout } = useAdminAuth();

  // Check for admin privileges. Redirect to login if not authenticated.
  if (!isAdminAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: { pathname: '/admin' } }} replace />;
  }

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
                <h1 className="font-serif text-2xl md:text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-gray-500 text-sm">Welcome to the central control panel.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap pt-2 md:pt-0">
              <button 
                onClick={logout}
                className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest cursor-pointer"
              >
                <LogOut size={14} />
                <span>Secure Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <Link 
            to="/admin/announcements"
            className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-amber-50/40 via-white to-white rounded-3xl shadow-sm border border-amber-200/60 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="p-4 bg-amber-50 rounded-full group-hover:bg-amber-100 transition-colors mb-4 text-amber-600">
              <Megaphone size={40} />
            </div>
            <div className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
              <Sparkles size={10} />
              <span>Storefront Banner</span>
            </div>
            <h2 className="text-lg font-bold font-serif text-gray-900 mb-1 text-center">Top Announcements & Offers</h2>
            <p className="text-gray-500 text-center text-xs">Manage scrolling header messages, free shipping badges, and festive offers.</p>
          </Link>

          <Link 
            to="/admin/feedback"
            className="flex flex-col items-center justify-center p-8 bg-gradient-to-b from-rose-50/50 via-white to-white rounded-3xl shadow-sm border border-rose-200/60 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="p-4 bg-rose-50 rounded-full group-hover:bg-bloom-pink transition-colors mb-4 text-bloom-rose">
              <HeartHandshake size={40} />
            </div>
            <div className="inline-flex items-center gap-1 bg-rose-100 text-bloom-rose text-[10px] font-bold px-2 py-0.5 rounded-full mb-1">
              <Sparkles size={10} />
              <span>Omni-Channel</span>
            </div>
            <h2 className="text-lg font-bold font-serif text-gray-900 mb-1 text-center">Customer Feedback & Google Reviews</h2>
            <p className="text-gray-500 text-center text-xs">Collect social media & website feedback and track Google reviews.</p>
          </Link>

          <Link 
            to="/admin/products"
            className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="p-4 bg-gray-50 rounded-full group-hover:bg-bloom-pink transition-colors mb-4 text-gray-400 group-hover:text-bloom-rose">
              <ShoppingBag size={40} />
            </div>
            <h2 className="text-lg font-bold font-serif text-gray-900 mb-1 text-center">Manage Products</h2>
            <p className="text-gray-500 text-center text-xs">Update prices, stock, best sellers, and new arrivals.</p>
          </Link>

          <Link 
            to="/admin/orders"
            className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="p-4 bg-gray-50 rounded-full group-hover:bg-bloom-pink transition-colors mb-4 text-gray-400 group-hover:text-bloom-rose">
              <Package size={40} />
            </div>
            <h2 className="text-lg font-bold font-serif text-gray-900 mb-1 text-center">Manage Orders</h2>
            <p className="text-gray-500 text-center text-xs">View and fulfill customer orders and payments.</p>
          </Link>

          <Link 
            to="/admin/reviews"
            className="flex flex-col items-center justify-center p-8 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="p-4 bg-gray-50 rounded-full group-hover:bg-bloom-pink transition-colors mb-4 text-gray-400 group-hover:text-bloom-rose">
              <MessageSquare size={40} />
            </div>
            <h2 className="text-lg font-bold font-serif text-gray-900 mb-1 text-center">Product Reviews</h2>
            <p className="text-gray-500 text-center text-xs">Moderate ratings, reply to buyers, and view reports.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
