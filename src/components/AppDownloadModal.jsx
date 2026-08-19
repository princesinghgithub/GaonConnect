import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Car, X, ExternalLink } from 'lucide-react';
import { openUserApp, openDriverApp } from '../utils/appDownload';

// The customer app and the driver app are two separate Play Store listings,
// so a single "Download app" button can't know which one the visitor wants.
// This asks, instead of guessing the customer app the way we used to.
const AppDownloadModal = ({ open, onClose }) => {
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    // Stop the page behind the dialog from scrolling with it open.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  const choose = (openApp) => {
    openApp();
    onClose();
  };

  const options = [
    {
      key: 'user',
      icon: User,
      title: t('appModal.userTitle'),
      description: t('appModal.userDescription'),
      cta: t('appModal.userCta'),
      onClick: () => choose(openUserApp),
      accent: 'text-saffron dark:text-orange-400',
      ring: 'hover:border-saffron dark:hover:border-orange-400',
      button: 'bg-saffron hover:bg-orange-600',
    },
    {
      key: 'driver',
      icon: Car,
      title: t('appModal.driverTitle'),
      description: t('appModal.driverDescription'),
      cta: t('appModal.driverCta'),
      onClick: () => choose(openDriverApp),
      accent: 'text-india-green dark:text-green-400',
      ring: 'hover:border-india-green dark:hover:border-green-400',
      button: 'bg-india-green hover:bg-green-800',
    },
  ];

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-download-title"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 md:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label={t('appModal.close')}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-ink dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={20} />
        </button>

        <h2 id="app-download-title" className="text-xl md:text-2xl font-bold text-ink dark:text-white mb-1 pr-8">
          {t('appModal.heading')}
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{t('appModal.subheading')}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {options.map(({ key, icon: Icon, title, description, cta, onClick, accent, ring, button }) => (
            <button
              key={key}
              type="button"
              onClick={onClick}
              className={`text-left border-2 border-gray-200 dark:border-gray-700 rounded-2xl p-5 transition-colors ${ring}`}
            >
              <Icon size={28} className={`${accent} mb-3`} />
              <h3 className="font-bold text-ink dark:text-white mb-1">{title}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed mb-4">{description}</p>
              <span
                className={`inline-flex items-center gap-1.5 ${button} text-white text-sm font-semibold px-4 py-2 rounded-full transition-colors`}
              >
                {cta}
                <ExternalLink size={14} />
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AppDownloadModal;
