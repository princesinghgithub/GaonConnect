import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShieldCheck, MapPin, Phone, Users, Car, Siren } from 'lucide-react';
import Navbar from '../../GaonConnect/Navbar';
import Footer from '../../GaonConnect/Footer';
import { useAppDownload } from '../../context/AppDownloadContext';

const pointIcons = [ShieldCheck, MapPin, Siren, Users, Car, Phone];

const Safety = () => {
  const { t } = useTranslation();
  const safetyPoints = t('safetyPage.points', { returnObjects: true }).map((point, i) => ({
    ...point,
    icon: pointIcons[i],
  }));

  const { openAppDownload } = useAppDownload();
  const handleDownloadApp = openAppDownload;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar onDownloadApp={handleDownloadApp} />

      <section className="relative bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 text-white overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-20 text-center">
          <div className="text-6xl mb-4">🛡️</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{t('safetyPage.heroTitle')}</h1>
          <p className="text-base md:text-lg opacity-95 max-w-2xl mx-auto leading-relaxed">
            {t('safetyPage.heroSubtitle')}
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {safetyPoints.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-orange-100 dark:bg-gray-700 flex items-center justify-center text-saffron dark:text-orange-400 mb-5">
                <Icon size={26} />
              </div>
              <h3 className="text-xl font-semibold mb-3 text-ink dark:text-white">{title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 bg-orange-50 dark:bg-gray-900">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-ink dark:text-white">
            {t('safetyPage.concernHeading')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {t('safetyPage.concernText')}
          </p>
          <a
            href="https://wa.me/916260132613"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex bg-saffron hover:bg-cta text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            {t('safetyPage.whatsappCta')}
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Safety;
