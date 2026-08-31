import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { products as baseProducts } from '../data/products';
import { useDynamicProducts } from '../lib/dynamicPricing';
import { ProductCard } from './Home';
import { Package, Heart, Clock, Settings, LogOut, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function Dashboard() {
  const products = useDynamicProducts(baseProducts);
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'wishlist' | 'recent' | 'settings'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }
    if (user && activeTab === 'orders') {
      const fetchOrders = async () => {
        setIsLoadingOrders(true);
        try {
          const userEmail = (user?.email || (user?.user_metadata as any)?.email || '').toLowerCase().trim();
          const userPhone = (user?.phone || (user?.user_metadata as any)?.phone || '').trim();
          const userId = user?.id;
          
          let fetchedOrders: any[] = [];
          
          try {
            const res = await fetch('/api/orders');
            if (res.ok) {
              const resData = await res.json();
              if (Array.isArray(resData.orders)) {
                fetchedOrders = resData.orders.filter((o: any) => {
                  if (userId && o.user_id === userId) return true;
                  if (userEmail && o.guest_email && o.guest_email.toLowerCase().trim() === userEmail) return true;
                  if (userPhone && o.guest_phone && o.guest_phone.trim() === userPhone) return true;
                  return false;
                });
              }
            }
          } catch (apiErr) {
            console.warn("Could not load /api/orders:", apiErr);
          }
          
          // Also check local storage for prototype testing / offline orders
          try {
            const mockOrdersDB = JSON.parse(localStorage.getItem('bloom_db_orders') || '[]');
            const mockOrders = mockOrdersDB.filter((o: any) => 
                 (userId && o.userId === userId) || 
                 (userEmail && o.email?.toLowerCase() === userEmail) || 
                 (userPhone && o.phone === userPhone)
            ).map((o: any) => ({
               id: o.orderId || 'MANUAL-' + Math.random().toString(36).substr(2, 6),
               order_status: 'Processing',
               created_at: o.timestamp || new Date().toISOString(),
               final_amount: 'Pending'
            }));
            
            // Merge to avoid duplicates
            const existingIds = new Set(fetchedOrders.map(o => o.payment_id || o.id));
            mockOrders.forEach((mo: any) => {
              if (!existingIds.has(mo.id)) {
                fetchedOrders.push(mo);
              }
            });
          } catch(e) {}
          
          // Sort by date descending
          fetchedOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
          
          setOrders(fetchedOrders);
        } catch (err) {
          console.warn("Error fetching dashboard orders:", err);
        } finally {
          setIsLoadingOrders(false);
        }
      };
      fetchOrders();
    }
  }, [user, activeTab]);

  const name = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Beautiful User';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <div className="container mx-auto px-4 md:px-6 py-12">
      <div className="flex flex-col md:flex-row gap-12">
        {/* Sidebar */}
        <aside className="w-full md:w-64 space-y-8">
          <div className="flex items-center space-x-4 p-4">
            <div className="w-16 h-16 rounded-full bg-bloom-pink flex items-center justify-center text-bloom-rose font-serif text-2xl font-bold uppercase">
              {name[0]}
            </div>
            <div>
              <h3 className="font-bold text-lg">{name}</h3>
              <p className="text-xs text-gray-400">Blossom Member</p>
            </div>
          </div>

          <nav className="flex flex-col space-y-1">
            <SidebarLink icon={<Package size={18} />} title="Orders" active={activeTab === 'orders'} onClick={() => setActiveTab('orders')} />
            <SidebarLink icon={<Heart size={18} />} title="Wishlist" active={activeTab === 'wishlist'} onClick={() => setActiveTab('wishlist')} />
            <SidebarLink icon={<Clock size={18} />} title="Recently Viewed" active={activeTab === 'recent'} onClick={() => setActiveTab('recent')} />
            <SidebarLink icon={<Settings size={18} />} title="Settings" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
            
            <button 
              onClick={handleSignOut}
              className="w-full flex items-center space-x-3 px-4 py-3 text-sm font-medium text-red-400 hover:bg-red-50 rounded-xl transition-all mt-8"
            >
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-grow space-y-8">
          <div className="space-y-2">
            <h1 className="font-serif text-4xl font-bold capitalize">{activeTab}</h1>
            <p className="text-gray-400 text-sm">Manage your account and track your blooming collection.</p>
          </div>

          {activeTab === 'orders' && (
            <div className="space-y-6">
              {isLoadingOrders ? (
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bloom-rose"></div>
                </div>
              ) : orders.length > 0 ? (
                orders.map((order) => (
                  <OrderCard 
                    key={order.id} 
                    id={order.id.slice(0, 8).toUpperCase()} 
                    status={order.order_status || 'Processing'} 
                    date={new Date(order.created_at).toLocaleDateString()} 
                    total={`₹${order.final_amount}`} 
                  />
                ))
              ) : (
                <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-gray-50 rounded-2xl text-gray-400">
                    <Package size={32} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">No orders yet</h3>
                    <p className="text-gray-400 text-sm">When you place an order, it will appear here.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {(activeTab === 'wishlist' || activeTab === 'recent') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.slice(0, 3).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white rounded-[2.5rem] p-10 border border-gray-100 space-y-8">
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Display Name</label>
                   <input className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-bloom-rose/20" value={name} readOnly />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                   <input className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-bloom-rose/20" value={user?.email || ''} readOnly />
                 </div>
                 <div className="space-y-2">
                   <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Mobile Number</label>
                   <input className="w-full px-6 py-4 bg-gray-50 rounded-2xl border-none outline-none focus:ring-2 focus:ring-bloom-rose/20" value={user?.phone || user?.user_metadata?.phone || ''} readOnly />
                 </div>
               </div>
               <button className="px-8 py-4 bg-bloom-rose text-white rounded-full font-bold shadow-lg shadow-bloom-rose/20">
                 Save Changes
               </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function SidebarLink({ icon, title, active, onClick }: { icon: React.ReactNode, title: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
        active ? "bg-bloom-pink text-bloom-rose font-bold" : "text-gray-500 hover:bg-gray-50"
      )}
    >
      {icon}
      <span>{title}</span>
    </button>
  );
}

function OrderCard({ id, status, date, total }: { id: string, status: string, date: string, total: string }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-xl hover:shadow-bloom-pink/20 transition-all">
      <div className="flex items-center space-x-6">
        <div className="p-4 bg-gray-50 rounded-2xl text-gray-400">
          <Package size={24} />
        </div>
        <div className="space-y-1">
          <p className="font-bold text-gray-900">{id}</p>
          <p className="text-xs text-gray-400">Placed on {date}</p>
        </div>
      </div>
      
      <div className="flex items-center space-x-12">
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Total</p>
          <p className="font-bold text-bloom-rose">{total}</p>
        </div>
        <div className="text-right">
          <div className={cn(
            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider inline-block",
            status === 'Delivered' ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"
          )}>
            {status}
          </div>
        </div>
        <button className="p-2 text-gray-300 hover:text-bloom-rose transition-colors">
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
