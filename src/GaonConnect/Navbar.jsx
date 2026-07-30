import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Sun, Moon, Languages } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onDownloadApp, scrollToSection }) => {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'hi' ? 'en' : 'hi');
  };

  // Sections live on the landing page; pages are dedicated routes (Rapido/Uber-style top nav)
  const navItems = [
    { key: 'home', id: 'home' },
    { key: 'services', id: 'services' },
    { key: 'about', id: 'about' },
    { key: 'safety', path: '/safety' },
    { key: 'careers', path: '/careers' },
    { key: 'blog', path: '/blog' },
    { key: 'press', path: '/press' },
    { key: 'contact', path: '/contact' },
  ];

  const handleNavClick = (item) => {
    setMenuOpen(false);

    if (item.path) {
      navigate(item.path);
      return;
    }

    if (item.id === 'home') {
      if (location.pathname === '/') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        navigate('/');
      }
      return;
    }

    if (location.pathname === '/' && scrollToSection) {
      scrollToSection(item.id);
    } else {
      navigate('/', { state: { scrollTo: item.id } });
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md shadow-sm dark:shadow-gray-800">
      <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between h-16">
        <div className="flex items-center gap-2 font-bold text-lg">
          <img src="/gaonconnect-icon.png" alt="GaonConnect" className="h-9 w-9" />
          <span>
            <span className="text-ink dark:text-white">Gaon</span><span className="text-saffron dark:text-orange-300">Connect</span>
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            item.path ? (
              <Link
                key={item.key}
                to={item.path}
                className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-saffron dark:hover:text-cta transition-colors"
              >
                {t(`nav.${item.key}`)}
              </Link>
            ) : (
              <button
                key={item.key}
                onClick={() => handleNavClick(item)}
                className="text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-saffron dark:hover:text-cta transition-colors"
              >
                {t(`nav.${item.key}`)}
              </button>
            )
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
            item.path ? (
              <Link
                key={item.key}
                to={item.path}
                onClick={() => setMenuOpen(false)}
                className="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-saffron dark:hover:text-cta transition-colors"
              >
                {t(`nav.${item.key}`)}
              </Link>
            ) : (
              <button
                key={item.key}
                onClick={() => handleNavClick(item)}
                className="text-left py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:text-saffron dark:hover:text-cta transition-colors"
              >
                {t(`nav.${item.key}`)}
              </button>
            )
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
