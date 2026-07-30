import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { Settings, LogOut, Package, ShoppingBag, MessageSquare } from 'lucide-react';
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
                className="flex items-center space-x-2 px-4 py-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                <LogOut size={14} />
                <span>Secure Logout</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Link 
            to="/admin/products"
            className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="p-4 bg-gray-50 rounded-full group-hover:bg-bloom-pink transition-colors mb-4 text-gray-400 group-hover:text-bloom-rose">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-xl font-bold font-serif text-gray-900 mb-2">Manage Products</h2>
            <p className="text-gray-500 text-center text-sm">Update prices, stock, best sellers, and new arrivals.</p>
          </Link>

          <Link 
            to="/admin/orders"
            className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="p-4 bg-gray-50 rounded-full group-hover:bg-bloom-pink transition-colors mb-4 text-gray-400 group-hover:text-bloom-rose">
              <Package size={48} />
            </div>
            <h2 className="text-xl font-bold font-serif text-gray-900 mb-2">Manage Orders</h2>
            <p className="text-gray-500 text-center text-sm">View and fulfill customer orders and payments.</p>
          </Link>

          <Link 
            to="/admin/reviews"
            className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all group"
          >
            <div className="p-4 bg-gray-50 rounded-full group-hover:bg-bloom-pink transition-colors mb-4 text-gray-400 group-hover:text-bloom-rose">
              <MessageSquare size={48} />
            </div>
            <h2 className="text-xl font-bold font-serif text-gray-900 mb-2">Manage Reviews</h2>
            <p className="text-gray-500 text-center text-sm">Moderate ratings, reply to buyers, and view reports.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
