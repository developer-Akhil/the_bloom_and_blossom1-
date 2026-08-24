/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/common/Layout';
import { Home } from './pages/Home';
import { Collections } from './pages/Collections';
import { ProductDetail } from './pages/ProductDetail';
import { Cart } from './pages/Cart';
import { Checkout } from './pages/Checkout';
import { CheckoutSuccess } from './pages/CheckoutSuccess';
import { Auth } from './pages/Auth';
import { VerifyEmail } from './pages/VerifyEmail';
import { About } from './pages/About';
import { Dashboard } from './pages/Dashboard';
import { Contact } from './pages/Contact';
import { Returns } from './pages/Returns';
import { Privacy } from './pages/Privacy';
import { Terms } from './pages/Terms';
import { FAQ } from './pages/FAQ';
import { Admin } from './pages/Admin';
import { AdminProducts } from './pages/AdminProducts';
import { AdminOrders } from './pages/AdminOrders';
import { AdminOrderDetail } from './pages/AdminOrderDetail';
import { AdminLogin } from './pages/AdminLogin';
import { AdminReviews } from './pages/AdminReviews';
import { AdminFeedback } from './pages/AdminFeedback';
import { CustomerFeedback } from './pages/CustomerFeedback';
import { NewArrivals } from './pages/NewArrivals';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import { AdminAuthProvider } from './context/AdminAuthContext';
import { MediaProvider } from './context/MediaContext';
import { ProductProvider } from './context/ProductContext';
import { ThemeProvider } from './context/ThemeContext';


// Placeholder pages for now
const Wishlist = () => <div className="container py-20">Wishlist Page Coming Soon</div>;

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AdminAuthProvider>
          <MediaProvider>
            <ProductProvider>
              <CartProvider>
                <BrowserRouter>
                  <Routes>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Home />} />
                      <Route path="collections" element={<Collections />} />
                      <Route path="products/:id" element={<ProductDetail />} />
                      <Route path="cart" element={<Cart />} />
                      <Route path="checkout" element={<Checkout />} />
                      <Route path="checkout/success" element={<CheckoutSuccess />} />
                      <Route path="auth" element={<Auth />} />
                      <Route path="verify-email" element={<VerifyEmail />} />
                      <Route path="about" element={<About />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="contact" element={<Contact />} />
                      <Route path="returns" element={<Returns />} />
                      <Route path="privacy" element={<Privacy />} />
                      <Route path="terms" element={<Terms />} />
                      <Route path="faq" element={<FAQ />} />
                      <Route path="feedback" element={<CustomerFeedback />} />
                      <Route path="feedback/:token" element={<CustomerFeedback />} />
                      <Route path="admin" element={<Admin />} />
                      <Route path="admin/products" element={<AdminProducts />} />
                      <Route path="admin/orders" element={<AdminOrders />} />
                      <Route path="admin/orders/:id" element={<AdminOrderDetail />} />
                      <Route path="admin/reviews" element={<AdminReviews />} />
                      <Route path="admin/feedback" element={<AdminFeedback />} />
                      <Route path="admin/login" element={<AdminLogin />} />
                      <Route path="new-arrivals" element={<NewArrivals />} />
                      <Route path="wishlist" element={<Wishlist />} />
                    </Route>
                  </Routes>
                </BrowserRouter>
              </CartProvider>
            </ProductProvider>
          </MediaProvider>
        </AdminAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
