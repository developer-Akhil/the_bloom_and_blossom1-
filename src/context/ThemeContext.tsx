import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeType = 'classic' | 'luxury' | 'sage' | 'dahlia';

interface ThemeContextType {
  theme: ThemeType;
  setTheme: (theme: ThemeType) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    // Check if theme was stored previously
    const savedTheme = localStorage.getItem('app-theme');
    return (savedTheme === 'luxury' || savedTheme === 'classic' || savedTheme === 'sage' || savedTheme === 'dahlia') ? (savedTheme as ThemeType) : 'classic';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-luxury', 'theme-midnight', 'theme-sage', 'theme-dahlia');
    
    if (theme === 'luxury') {
      root.classList.add('theme-luxury');
    } else if (theme === 'sage') {
      root.classList.add('theme-sage');
    } else if (theme === 'dahlia') {
      root.classList.add('theme-dahlia');
    }
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => {
      if (prev === 'classic') return 'luxury';
      if (prev === 'luxury') return 'sage';
      if (prev === 'sage') return 'dahlia';
      return 'classic';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
