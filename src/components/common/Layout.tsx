import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { WhatsAppButton } from './WhatsAppButton';
import { ThemeSwitcher } from './ThemeSwitcher';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft } from 'lucide-react';

export function Layout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col selection:bg-bloom-rose/20">
      <Header />
      <main className="flex-grow relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {pathname !== '/' && (
              <div className="container mx-auto px-4 md:px-6 pt-6 -mb-6 relative z-10 flex border-0">
                <button 
                  onClick={() => navigate(-1)}
                  className="flex items-center space-x-2 text-sm text-gray-500 hover:text-bloom-rose transition-colors py-2 px-3 bg-gray-50 hover:bg-pink-50 rounded-full"
                >
                  <ArrowLeft size={16} />
                  <span>Back</span>
                </button>
              </div>
            )}
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <WhatsAppButton />
      <ThemeSwitcher />
    </div>
  );
}
