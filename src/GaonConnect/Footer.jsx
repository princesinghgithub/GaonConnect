import React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaFacebook, FaInstagram, FaLinkedin, FaYoutube, FaGooglePlay, FaApple, FaTruck } from 'react-icons/fa';
import { trackEvent } from '../utils/analytics';
import { openDriverApp } from '../utils/appDownload';
import { useAppDownload } from '../context/AppDownloadContext';

const SERVICE_LINKS = [
  { to: '/auto-rickshaw-booking', label: 'Auto Rickshaw Booking' },
  { to: '/bike-taxi-booking', label: 'Bike Taxi Booking' },
  { to: '/car-booking', label: 'Car Booking' },
  { to: '/tractor-booking', label: 'Tractor Booking' },
  { to: '/jcb-rental', label: 'JCB Rental' },
  { to: '/wedding-car-booking', label: 'Wedding Car Booking' },
  { to: '/goods-transport-booking', label: 'Goods Transport / Tempo' },
  { to: '/farm-equipment', label: 'Farm Equipment Rental' },
  { to: '/village-transport', label: 'Village Transport' },
  { to: '/agriculture-logistics', label: 'Agriculture Logistics' },
];

const linkClass = 'text-gray-400 hover:text-orange-400 transition-colors text-left';

// Play/App Store badge. The small line is the verb ("Get it on"), the big one
// is the store name — store names are brands, so they stay untranslated.
const StoreBadge = ({ icon: Icon, caption, store, onClick, muted = false }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-3 w-full sm:w-auto px-4 py-2.5 rounded-xl border transition-colors ${
      muted
        ? 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
        : 'border-white/15 bg-white/10 text-white hover:bg-white/20'
    }`}
  >
    <Icon size={22} className="shrink-0" />
    <span className="text-left leading-tight">
      <span className="block text-[10px] uppercase tracking-wide opacity-70">{caption}</span>
      <span className="block text-sm font-semibold">{store}</span>
    </span>
  </button>
);

const FooterColumn = ({ title, children, className = '' }) => (
  <div className={className}>
    <h4 className="font-semibold text-white mb-4">{title}</h4>
    {children}
  </div>
);

const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const { openAppDownload } = useAppDownload();
  const handleDownloadApp = openAppDownload;

  const handleAppleDownload = () => {
    alert(`🎉 ${t('download.comingSoon')}\n\n${t('download.promo')}`);
  };

  const handleBecomeDriver = () => {
    trackEvent('become_driver_click', { source: 'footer' });
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

  const socials = [
    { href: 'https://www.instagram.com/gaonconnect/', label: 'Instagram', icon: FaInstagram },
    { href: 'https://facebook.com/profile.php?id=61591245161485', label: 'Facebook', icon: FaFacebook },
    { href: 'https://www.linkedin.com/company/133394201/', label: 'LinkedIn', icon: FaLinkedin },
    { href: 'https://www.youtube.com/@Gaonconnenct', label: 'YouTube', icon: FaYoutube },
  ];

  return (
    <footer className="bg-green-950 dark:bg-black text-white px-6">
      <div className="max-w-7xl mx-auto">
        <div className="py-8 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="/gaonconnect-icon.png" alt="GaonConnect" className="h-11 w-11 shrink-0" />
            <div>
              <div className="text-2xl font-bold text-orange-400 leading-tight">GaonConnect</div>
              <div className="text-gray-400 text-sm">gaon aur dehat ke liye transport app</div>
            </div>
          </div>
        </div>

        {/* The app badges sit in the column grid rather than opposite the
            brand — pinned to the far edge they left a dead gap across the
            middle of a wide screen. Services is by far the longest list, so
            it runs two-up instead of making the footer ten rows tall. */}
        <div className="py-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-10 text-sm">
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <h4 className="font-semibold text-white mb-4">{t('footer.customerApp')}</h4>
            <div className="flex flex-col gap-2.5">
              <StoreBadge
                icon={FaGooglePlay}
                caption={t('download.getItOn')}
                store="Google Play"
                onClick={handleDownloadApp}
              />
              <StoreBadge
                icon={FaApple}
                caption={t('download.comingSoon')}
                store="App Store"
                onClick={handleAppleDownload}
                muted
              />
            </div>

            <h4 className="font-semibold text-white mb-4 mt-7">{t('footer.driverApp')}</h4>
            <div className="flex flex-col gap-2.5 items-start">
              <StoreBadge
                icon={FaGooglePlay}
                caption={t('download.getItOn')}
                store="Google Play"
                onClick={openDriverApp}
              />
              <button
                onClick={handleBecomeDriver}
                className="flex items-center gap-2 text-gray-400 hover:text-orange-400 transition-colors px-1"
              >
                <FaTruck size={15} className="shrink-0" />
                {t('footer.becomeDriver')}
              </button>
            </div>
          </div>

          <FooterColumn title={t('nav.services')} className="col-span-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5">
              {SERVICE_LINKS.map(({ to, label }) => (
                <Link key={to} to={to} className={linkClass}>
                  {label}
                </Link>
              ))}
            </div>
          </FooterColumn>

          <FooterColumn title={t('footer.quickLinks')}>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => (location.pathname === '/' ? window.scrollTo({ top: 0, behavior: 'smooth' }) : navigate('/'))}
                className={linkClass}
              >
                {t('footer.home')}
              </button>
              <button onClick={() => goToSection('services')} className={linkClass}>{t('nav.services')}</button>
              <button onClick={() => goToSection('faqs')} className={linkClass}>{t('nav.faqs')}</button>
              <button onClick={() => navigate('/contact')} className={linkClass}>{t('footer.contact')}</button>
            </div>
          </FooterColumn>

          <FooterColumn title={t('footer.company')}>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => goToSection('about')} className={linkClass}>{t('footer.about')}</button>
              <button onClick={() => navigate('/safety')} className={linkClass}>{t('nav.safety')}</button>
              <button onClick={() => navigate('/careers')} className={linkClass}>{t('nav.careers')}</button>
              <button onClick={() => navigate('/blog')} className={linkClass}>{t('nav.blog')}</button>
              <button onClick={() => navigate('/press')} className={linkClass}>{t('nav.press')}</button>
            </div>
          </FooterColumn>

          <FooterColumn title={t('footer.legal')}>
            <div className="flex flex-col gap-2.5">
              <button onClick={() => navigate('/privacy-policy')} className={linkClass}>{t('footer.privacy')}</button>
              <button onClick={() => navigate('/account-deletion')} className={linkClass}>{t('footer.accountDeletion')}</button>
              <button onClick={() => navigate('/data-deletion')} className={linkClass}>{t('footer.dataDeletion')}</button>
            </div>
          </FooterColumn>
        </div>

        {/* Socials sit with the copyright rather than in a column of their
            own, which left a near-empty seventh column in the grid. The
            padding keeps them clear of the fixed WhatsApp button, which
            parks itself in this exact corner: sideways on a wide screen,
            and below the stacked row on a narrow one. */}
        <div className="border-t border-white/10 pt-6 pb-24 sm:pb-6 sm:pr-24 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="text-gray-400 text-sm">{t('footer.copyright')}</p>
            <p className="text-gray-500 text-sm">{t('footer.tagline')}</p>
          </div>

          <div className="flex items-center gap-3">
            {socials.map(({ href, label, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-orange-500 text-gray-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <Icon size={17} />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
