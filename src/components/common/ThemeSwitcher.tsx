import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Palette, Check, RefreshCw } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Theme Toggle Button */}
      <div className="fixed bottom-6 left-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg border transition-all duration-300 ${
            theme === 'luxury' 
              ? 'bg-bloom-rose text-white border-bloom-rose/20 shadow-bloom-rose/30 hover:bg-bloom-rose/90' 
              : theme === 'sage'
              ? 'bg-[#556B2F] text-white border-[#556B2F]/20 shadow-[#556B2F]/30 hover:bg-[#556B2F]/90'
              : theme === 'dahlia'
              ? 'bg-[#D47A55] text-white border-[#D47A55]/20 shadow-[#D47A55]/30 hover:bg-[#D47A55]/90'
              : 'bg-white text-bloom-rose border-bloom-rose/20 hover:bg-bloom-cream'
          }`}
          aria-label="Customize Theme"
        >
          <Palette size={20} className={isOpen ? 'rotate-45 transition-transform duration-300' : 'transition-transform duration-300'} />
        </motion.button>

        {/* Customizer Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="absolute bottom-16 left-0 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-bloom-rose/10 p-5 space-y-4 z-50 overflow-hidden text-gray-900"
            >
              {/* Decorative top background */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-bloom-pink via-bloom-rose to-bloom-sage" />
              
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif text-lg font-bold tracking-tight flex items-center gap-1.5 text-gray-900">
                    Style Switcher
                  </h4>
                  <p className="text-xs font-light mt-0.5 text-gray-500">
                    Experience different moods of our boutique.
                  </p>
                </div>
                <div className="p-1 bg-bloom-pink/10 rounded-full">
                  <Sparkles size={16} className="text-bloom-rose animate-pulse" />
                </div>
              </div>

              <div className="luxury-divider opacity-40 my-1" />

              <div className="space-y-3">
                {/* Theme Options */}
                <button
                  onClick={() => setTheme('classic')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    theme === 'classic'
                      ? 'border-bloom-rose bg-bloom-pink/10 text-gray-900 font-medium'
                      : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-sm block font-serif text-gray-900">Classic Soft</span>
                    <span className="text-[11px] text-gray-400 font-light block">
                      The original comforting warm cream & natural gold look.
                    </span>
                  </div>
                  {theme === 'classic' && (
                    <motion.div layoutId="active-theme-check">
                      <Check size={16} className="text-bloom-rose" />
                    </motion.div>
                  )}
                </button>

                <button
                  onClick={() => setTheme('luxury')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    theme === 'luxury'
                      ? 'border-bloom-rose bg-bloom-pink/20 text-gray-900 font-semibold'
                      : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-sm block font-serif text-bloom-rose font-bold">Luxury Blossom</span>
                    <span className="text-[11px] text-gray-400 font-light block">
                      Romantic, soft artisanal theme with rich dusky rose & elegant typography.
                    </span>
                  </div>
                  {theme === 'luxury' && (
                    <motion.div layoutId="active-theme-check">
                      <Check size={16} className="text-bloom-rose" />
                    </motion.div>
                  )}
                </button>

                <button
                  onClick={() => setTheme('sage')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    theme === 'sage'
                      ? 'border-bloom-rose bg-bloom-pink/20 text-gray-900 font-semibold'
                      : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-sm block font-serif text-bloom-rose font-bold">Sage Meadow</span>
                    <span className="text-[11px] text-gray-400 font-light block">
                      Elegant botanical garden theme with fresh herbal sage & delicate olive gold.
                    </span>
                  </div>
                  {theme === 'sage' && (
                    <motion.div layoutId="active-theme-check">
                      <Check size={16} className="text-bloom-rose" />
                    </motion.div>
                  )}
                </button>

                <button
                  onClick={() => setTheme('dahlia')}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    theme === 'dahlia'
                      ? 'border-bloom-rose bg-bloom-pink/20 text-gray-900 font-semibold'
                      : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50 hover:border-gray-200 text-gray-600'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-sm block font-serif text-bloom-rose font-bold">Dahlia Glow</span>
                    <span className="text-[11px] text-gray-400 font-light block">
                      Warm glowing sunset vibe with rich terracotta dahlia & apricot peach hues.
                    </span>
                  </div>
                  {theme === 'dahlia' && (
                    <motion.div layoutId="active-theme-check">
                      <Check size={16} className="text-bloom-rose" />
                    </motion.div>
                  )}
                </button>
              </div>

              {/* Safety notice (reversibility) */}
              <div className="flex items-start gap-2 p-2.5 rounded-lg border text-[10px] font-light leading-relaxed bg-bloom-pink/5 border-bloom-rose/5 text-gray-500">
                <RefreshCw size={12} className="text-bloom-rose shrink-0 mt-0.5" />
                <span>
                  <strong>100% Reversible:</strong> You can toggle and compare all themes at any time without resetting your cart or session data.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
