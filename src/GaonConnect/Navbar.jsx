import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, X, Sun, Moon, Languages } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onDownloadApp, scrollToSection }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'hi' ? 'en' : 'hi');
  };

  const navItems = [
    { key: 'services', id: 'services' },
    { key: 'howItWorks', id: 'how-it-works' },
    { key: 'whyUs', id: 'why-us' },
    { key: 'about', id: 'about' },
    { key: 'reviews', id: 'reviews' },
    { key: 'faqs', id: 'faqs' },
    { key: 'contact', id: 'contact' },
  ];

  const handleNavClick = (id) => {
    setMenuOpen(false);
    scrollToSection(id);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm dark:shadow-gray-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2 font-bold text-lg">
          <img src="/gaonconnect-icon.svg" alt="GaonConnect" className="h-9 w-9" />
          <span className="text-saffron dark:text-orange-300">GaonConnect</span>
        </div>

        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-saffron dark:hover:text-cta transition-colors"
            >
              {t(`nav.${item.key}`)}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleLanguage}
            aria-label="Toggle language"
            className="flex items-center gap-1 px-3 py-2 rounded-full text-sm font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Languages size={16} />
            {i18n.language === 'hi' ? 'EN' : 'हिं'}
          </button>

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          <button
            onClick={onDownloadApp}
            className="hidden sm:inline-flex bg-saffron hover:bg-cta text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            {t('nav.downloadApp')}
          </button>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="lg:hidden p-2 rounded-full text-gray-700 dark:text-gray-200"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="lg:hidden flex flex-col gap-1 px-4 pb-4 bg-white dark:bg-gray-900">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-saffron dark:hover:text-cta transition-colors"
            >
              {t(`nav.${item.key}`)}
            </button>
          ))}
          <button
            onClick={() => { setMenuOpen(false); onDownloadApp(); }}
            className="mt-2 bg-saffron hover:bg-cta text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors"
          >
            {t('nav.downloadApp')}
          </button>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
