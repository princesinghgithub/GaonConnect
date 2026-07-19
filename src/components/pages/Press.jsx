import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Mail } from 'lucide-react';
import Navbar from '../../GaonConnect/Navbar';
import Footer from '../../GaonConnect/Footer';

const Press = () => {
  const { t } = useTranslation();
  const facts = t('pressPage.facts', { returnObjects: true });

  const handleDownloadApp = () => {
    alert(`🎉 ${t('download.comingSoon')}\n\n${t('download.promo')}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar onDownloadApp={handleDownloadApp} />

      <section className="relative bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 text-white overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-20 text-center">
          <div className="text-6xl mb-4">📣</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('pressPage.heroTitle')}</h1>
          <p className="text-base md:text-lg opacity-95 max-w-2xl mx-auto leading-relaxed">
            {t('pressPage.heroSubtitle')}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-ink dark:text-white">
            {t('pressPage.factsHeading')}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {facts.map((fact) => (
              <div key={fact.label} className="bg-orange-50 dark:bg-gray-800 rounded-2xl p-6">
                <div className="text-sm font-semibold text-saffron dark:text-orange-400 mb-1">{fact.label}</div>
                <div className="text-ink dark:text-white font-medium">{fact.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center">
            <Download className="mx-auto mb-4 text-saffron dark:text-orange-400" size={32} />
            <h3 className="text-lg font-semibold mb-2 text-ink dark:text-white">{t('pressPage.mediaKitTitle')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">
              {t('pressPage.mediaKitText')}
            </p>
            <a
              href="/gaonconnect-icon.png"
              download
              className="inline-flex bg-saffron hover:bg-cta text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-colors"
            >
              {t('pressPage.mediaKitCta')}
            </a>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-8 text-center">
            <Mail className="mx-auto mb-4 text-saffron dark:text-orange-400" size={32} />
            <h3 className="text-lg font-semibold mb-2 text-ink dark:text-white">{t('pressPage.inquiryTitle')}</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm mb-5">
              {t('pressPage.inquiryText')}
            </p>
            <a
              href="mailto:gaonconnect.in@gmail.com?subject=Press%20Inquiry%20-%20GaonConnect"
              className="inline-flex bg-saffron hover:bg-cta text-white px-6 py-2.5 rounded-full font-semibold text-sm transition-colors"
            >
              gaonconnect.in@gmail.com
            </a>
          </div>
        </div>

        <p className="text-center text-gray-500 dark:text-gray-500 text-sm mt-10">
          {t('pressPage.footerNote')}
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default Press;
