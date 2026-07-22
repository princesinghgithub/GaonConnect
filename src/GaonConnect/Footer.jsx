import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube } from 'react-icons/fa';

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const handleDownloadApp = () => {
    alert(`🎉 ${t('download.comingSoon')}\n\n${t('download.promo')}`);
  };

  const handleBecomeDriver = () => {
    sessionStorage.setItem('registerAsDriver', 'true');
    navigate('/auth');
  };

  const goToSection = (id) => {
    if (location.pathname === '/') {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    } else {
      navigate('/', { state: { scrollTo: id } });
    }
  };

  return (
    <footer className="bg-green-950 dark:bg-black text-white py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 flex items-center gap-3">
          <img src="/gaonconnect-icon.png" alt="GaonConnect" className="h-10 w-10 shrink-0" />
          <div>
            <div className="text-2xl font-bold text-orange-400 leading-tight">GaonConnect</div>
            <div className="text-gray-400 text-sm">gaon aur dehat ke liye transport app</div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 text-sm">
          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.customerApp')}</h4>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleDownloadApp}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition-colors text-white px-3 py-2 rounded-lg"
              >
                <span className="text-lg">▶️</span>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] opacity-70">{t('download.comingSoon')}</span>
                  <span className="block text-xs font-semibold">{t('download.playStore')}</span>
                </span>
              </button>
              <button
                onClick={handleDownloadApp}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 transition-colors text-white px-3 py-2 rounded-lg"
              >
                <span className="text-lg">🍎</span>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] opacity-70">{t('download.comingSoon')}</span>
                  <span className="block text-xs font-semibold">{t('download.appStore')}</span>
                </span>
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.driverApp')}</h4>
            <button onClick={handleBecomeDriver} className="text-gray-400 hover:text-orange-400 transition-colors text-left">
              🚚 {t('footer.becomeDriver')}
            </button>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.quickLinks')}</h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => (location.pathname === '/' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate('/'))} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('footer.home')}</button>
              <button onClick={() => goToSection('services')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('nav.services')}</button>
              <button onClick={() => goToSection('faqs')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('nav.faqs')}</button>
              <button onClick={() => navigate('/contact')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('footer.contact')}</button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.company')}</h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => goToSection('about')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('footer.about')}</button>
              <button onClick={() => navigate('/safety')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('nav.safety')}</button>
              <button onClick={() => navigate('/careers')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('nav.careers')}</button>
              <button onClick={() => navigate('/blog')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('nav.blog')}</button>
              <button onClick={() => navigate('/press')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('nav.press')}</button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.legal')}</h4>
            <div className="flex flex-col gap-2">
              <button onClick={() => navigate('/privacy-policy')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('footer.privacy')}</button>
              <button onClick={() => navigate('/account-deletion')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('footer.accountDeletion')}</button>
              <button onClick={() => navigate('/data-deletion')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('footer.dataDeletion')}</button>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-3">{t('footer.followUs')}</h4>
            <div className="flex items-center gap-4">
              <a href="https://www.instagram.com/gaonconnect/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="text-gray-400 hover:text-white transition-colors">
                <FaInstagram size={20} />
              </a>
              <a href="https://facebook.com/profile.php?id=61591245161485" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="text-gray-400 hover:text-white transition-colors">
                <FaFacebook size={20} />
              </a>
              <a href="https://www.linkedin.com/company/133394201/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-gray-400 hover:text-white transition-colors">
                <FaLinkedin size={20} />
              </a>
              <a href="https://www.youtube.com/@Gaonconnenct" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="text-gray-400 hover:text-white transition-colors">
                <FaYoutube size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6">
          <p className="text-center text-gray-400 text-sm mb-2">{t('footer.copyright')}</p>
          <p className="text-center text-gray-500 text-sm">{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
