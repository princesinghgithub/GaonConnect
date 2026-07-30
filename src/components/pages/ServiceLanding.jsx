import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../GaonConnect/Navbar';
import Footer from '../../GaonConnect/Footer';
import NotFound from './NotFound';
import { getServicePageBySlug } from '../../constants/servicePages';
import { trackEvent } from '../../utils/analytics';

// Commercial-intent landing pages (distinct from the informational articles
// in BlogPost.jsx) — one component driven by servicePages.js, mounted at a
// handful of explicit top-level routes in App.jsx.
const ServiceLanding = ({ slugKey }) => {
  const page = getServicePageBySlug(slugKey);

  const handleDownloadApp = () => {
    alert('🎉 Coming soon! GaonConnect app jald hi Play Store par available hoga.');
  };

  if (!page) return <NotFound />;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar onDownloadApp={handleDownloadApp} />

      <section className="relative bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 text-white overflow-hidden">
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-20 text-center">
          <div className="text-6xl mb-4">{page.emoji}</div>
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{page.heroTitle}</h1>
          <p className="text-base md:text-lg opacity-95 max-w-2xl mx-auto leading-relaxed mb-8">
            {page.heroSubtitle}
          </p>
          <a
            href="https://wa.me/916260132613"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('whatsapp_click', { source: 'service_page_hero', service: page.slug })}
            className="inline-flex bg-white text-saffron hover:bg-gray-100 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            💬 Abhi Book Karein
          </a>
        </div>
      </section>

      <section className="py-14 md:py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <img
            src={page.image}
            alt={page.heroTitle}
            className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-md mb-10"
            loading="lazy"
          />
          {page.intro.map((para, i) => (
            <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
              {para}
            </p>
          ))}
        </div>
      </section>

      <section className="py-14 md:py-16 px-6 bg-orange-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 text-ink dark:text-white">
            Kyun Chunein GaonConnect
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {page.benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <h3 className="text-lg font-semibold mb-2 text-ink dark:text-white">{benefit.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-ink dark:text-white">
            Aksar Puchhe Jaane Waale Sawaal
          </h2>
          <div className="flex flex-col gap-4">
            {page.faqs.map((faq) => (
              <details
                key={faq.question}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 group"
              >
                <summary className="font-semibold text-ink dark:text-white cursor-pointer list-none flex items-center justify-between">
                  {faq.question}
                  <span className="text-saffron dark:text-orange-400 group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-gray-600 dark:text-gray-400 mt-3 leading-relaxed">{faq.answer}</p>
              </details>
            ))}
          </div>

          {page.relatedBlogSlug && (
            <p className="mt-8 text-gray-600 dark:text-gray-400">
              Aur padhein:{' '}
              <Link to={`/blog/${page.relatedBlogSlug}`} className="text-saffron dark:text-orange-400 font-medium hover:underline">
                humara detailed guide blog par
              </Link>
            </p>
          )}
        </div>
      </section>

      <section className="py-14 md:py-16 px-6 bg-orange-50 dark:bg-gray-900 text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-ink dark:text-white mb-4">
            Abhi {page.heroTitle} Book Karein
          </h2>
          <a
            href="https://wa.me/916260132613"
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackEvent('whatsapp_click', { source: 'service_page_footer_cta', service: page.slug })}
            className="inline-flex bg-saffron hover:bg-cta text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            💬 WhatsApp Par Booking Karein
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ServiceLanding;
