import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, ChevronDown, Phone, Mail, MapPin } from 'lucide-react';
import { FaFacebook, FaInstagram, FaTwitter, FaYoutube, FaLinkedin } from 'react-icons/fa';
import emailjs from '@emailjs/browser';
import Navbar from './Navbar';

const GaonConnectLanding = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);
  const contactFormRef = useRef(null);
  const [contactStatus, setContactStatus] = useState('idle'); // idle | sending | success | error

  // Service selection handler - redirects to auth page with service data
  const handleServiceSelect = (serviceName, basePrice) => {
    sessionStorage.setItem('selectedService', JSON.stringify({
      service: serviceName,
      price: basePrice
    }));
    navigate('/auth');
  };

  const handleDownloadApp = () => {
    alert(`🎉 ${t('download.comingSoon')}\n\n${t('download.promo')}`);
  };

  const handleBecomeDriver = () => {
    sessionStorage.setItem('registerAsDriver', 'true');
    navigate('/auth');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    setContactStatus('sending');

    const timeField = contactFormRef.current.querySelector('[name="time"]');
    if (timeField) {
      timeField.value = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    }

    emailjs
      .sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        contactFormRef.current,
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY }
      )
      .then(() => {
        setContactStatus('success');
        contactFormRef.current.reset();
      })
      .catch((error) => {
        console.error('EmailJS send failed:', error);
        setContactStatus('error');
      });
  };

  // Base prices kept separate since they drive booking logic, not translation
  const basePrices = [50, 30, 100, 400, 2000, 200, 150, 1000, 800, 1500];
  const services = t('services.items', { returnObjects: true });
  const features = t('features.items', { returnObjects: true });
  const steps = t('howItWorks.steps', { returnObjects: true });
  const benefits = t('benefits.items', { returnObjects: true });
  const reviews = t('reviews.items', { returnObjects: true });
  const faqItems = t('faqs.items', { returnObjects: true });

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:to-gray-900 transition-colors duration-300">
      <Navbar onDownloadApp={handleDownloadApp} scrollToSection={scrollToSection} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 1440 320">
            <path fill="currentColor" d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,101.3C1248,85,1344,75,1392,69.3L1440,64L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
          </svg>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
          <div className="text-7xl md:text-8xl mb-6 animate-bounce">🚜</div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">GaonConnect</h1>
          <p className="text-xl md:text-2xl mb-6 opacity-95">{t('hero.tagline')}</p>
          <p className="text-base md:text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            {t('hero.description')}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button
              onClick={handleDownloadApp}
              className="w-full sm:w-auto bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              📱 {t('hero.downloadCta')}
            </button>
            <button
              onClick={() => scrollToSection('how-it-works')}
              className="w-full sm:w-auto bg-transparent border-2 border-india-green text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-india-green hover:text-white transition-all duration-300"
            >
              🎯 {t('hero.howItWorksCta')}
            </button>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="py-16 md:py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-ink dark:text-white">
            🌟 {t('features.heading')}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('features.subheading')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="text-5xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-ink dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 md:py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-ink dark:text-white">
            📱 {t('howItWorks.heading')}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('howItWorks.subheading')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-ink dark:text-white">{step.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-20 px-6 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-ink dark:text-white">
            🚗 {t('services.heading')}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('services.subheading')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                onClick={() => handleServiceSelect(service.name, basePrices[index])}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h4 className="text-lg font-semibold mb-2 text-ink dark:text-white">{service.name}</h4>
                <div className="text-india-green dark:text-green-400 font-semibold">{service.price}</div>
                <div className="mt-3 text-sm text-saffron dark:text-orange-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {t('services.clickToSelect')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="py-16 md:py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6 text-ink dark:text-white">
            🌾 {t('about.heading')}
          </h2>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-12 max-w-3xl mx-auto">
            {t('about.vision')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="bg-orange-50 dark:bg-gray-800 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-2 text-saffron dark:text-orange-400">{t('about.point1Title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{t('about.point1')}</p>
            </div>
            <div className="bg-orange-50 dark:bg-gray-800 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-2 text-saffron dark:text-orange-400">{t('about.point2Title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{t('about.point2')}</p>
            </div>
            <div className="bg-orange-50 dark:bg-gray-800 p-6 rounded-2xl">
              <h3 className="text-lg font-semibold mb-2 text-saffron dark:text-orange-400">{t('about.point3Title')}</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{t('about.point3')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 md:py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-ink dark:text-white">
            ✨ {t('benefits.heading')}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('benefits.subheading')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex gap-4 items-start p-6 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-300"
              >
                <div className="text-4xl flex-shrink-0">{benefit.icon}</div>
                <div>
                  <h4 className="text-lg font-semibold mb-2 text-ink dark:text-white">{benefit.title}</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Download App Section */}
      <section className="py-16 md:py-20 px-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-ink dark:text-white">
            📲 {t('download.heading')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-2xl mx-auto">{t('download.subheading')}</p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-stretch mb-6">
            <button
              onClick={handleDownloadApp}
              className="relative flex-1 sm:flex-none sm:w-72 flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-xl transition-shadow rounded-2xl px-5 py-4 text-left"
            >
              <img src="/gaonconnect-icon.png" alt="GaonConnect" className="h-14 w-14 shrink-0" />
              <span>
                <span className="block font-bold text-ink dark:text-white text-lg">GaonConnect</span>
                <span className="block text-gray-500 dark:text-gray-400 text-sm">{t('download.customerTagline')}</span>
              </span>
              <span className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">{t('download.comingSoon')}</span>
            </button>

            <button
              onClick={handleBecomeDriver}
              className="relative flex-1 sm:flex-none sm:w-72 flex items-center gap-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 shadow-md hover:shadow-xl transition-shadow rounded-2xl px-5 py-4 text-left"
            >
              <img src="/gaonconnect-icon.png" alt="GaonConnect Driver" className="h-14 w-14 shrink-0" />
              <span>
                <span className="block font-bold text-ink dark:text-white text-lg leading-tight">GaonConnect <span className="block text-sm font-semibold text-orange-500">Driver</span></span>
                <span className="block text-gray-500 dark:text-gray-400 text-sm">{t('download.driverTagline')}</span>
              </span>
            </button>
          </div>
          <p className="text-saffron dark:text-orange-400 font-medium">{t('download.promo')}</p>
        </div>
      </section>

      {/* Become a Partner Section */}
      <section className="py-16 md:py-20 px-6 bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-ink dark:text-white">
              👨‍💼 {t('partner.heading')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t('partner.subheading')}</p>
            <ul className="space-y-2 text-gray-700 dark:text-gray-300 text-sm">
              <li>✅ {t('partner.point1')}</li>
              <li>✅ {t('partner.point2')}</li>
              <li>✅ {t('partner.point3')}</li>
            </ul>
          </div>
          <div className="text-center">
            <button
              onClick={handleBecomeDriver}
              className="bg-saffron hover:bg-cta text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              {t('partner.cta')}
            </button>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section id="reviews" className="py-16 md:py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-ink dark:text-white">
            💬 {t('reviews.heading')}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('reviews.subheading')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <div key={index} className="bg-gray-50 dark:bg-gray-800 p-6 rounded-2xl shadow-md">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < review.rating ? 'fill-orange-400 text-orange-400' : 'text-gray-300 dark:text-gray-600'}
                    />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-4">"{review.text}"</p>
                <div className="font-semibold text-ink dark:text-white text-sm">{review.name}</div>
                <div className="text-gray-500 dark:text-gray-500 text-xs">{review.location}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="faqs" className="py-16 md:py-20 px-6 bg-white dark:bg-gray-900">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-ink dark:text-white">
            ❓ {t('faqs.heading')}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('faqs.subheading')}
          </p>

          <div className="space-y-3">
            {faqItems.map((item, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between text-left px-6 py-4 font-medium text-ink dark:text-white"
                >
                  <span>{item.q}</span>
                  <ChevronDown
                    size={18}
                    className={`flex-shrink-0 transition-transform duration-300 ${openFaq === index ? 'rotate-180' : ''}`}
                  />
                </button>
                {openFaq === index && (
                  <div className="px-6 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact" className="py-16 md:py-20 px-6 bg-white dark:bg-gray-950">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-ink dark:text-white">
            📩 {t('contact.heading')}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('contact.subheading')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-gray-800 flex items-center justify-center text-saffron dark:text-orange-400">
                  <Phone size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">{t('contact.phone')}</div>
                  <a href="tel:+916260132613" className="font-medium text-navy dark:text-blue-300 hover:underline">+91 62601 32613</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-gray-800 flex items-center justify-center text-saffron dark:text-orange-400">
                  <Mail size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">{t('contact.email')}</div>
                  <a href="mailto:gaonconnect.in@gmail.com" className="font-medium text-navy dark:text-blue-300 hover:underline">gaonconnect.in@gmail.com</a>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-gray-800 flex items-center justify-center text-saffron dark:text-orange-400">
                  <MapPin size={20} />
                </div>
                <div>
                  <div className="text-sm text-gray-500 dark:text-gray-500">{t('contact.address')}</div>
                  <div className="font-medium text-ink dark:text-white">{t('contact.addressValue')}</div>
                </div>
              </div>
            </div>

            <form ref={contactFormRef} onSubmit={handleContactSubmit} className="space-y-4">
              <input type="hidden" name="title" value="New Contact Form Message" />
              <input type="hidden" name="time" />
              <input
                type="text"
                name="name"
                required
                placeholder={t('contact.formName')}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-saffron"
              />
              <input
                type="email"
                name="email"
                required
                placeholder={t('contact.formEmail')}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-saffron"
              />
              <textarea
                name="message"
                required
                rows={4}
                placeholder={t('contact.formMessage')}
                className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-saffron"
              />
              <button
                type="submit"
                disabled={contactStatus === 'sending'}
                className="w-full bg-saffron hover:bg-cta disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {contactStatus === 'sending' ? t('contact.formSending') : t('contact.formSubmit')}
              </button>
              {contactStatus === 'success' && (
                <p className="text-india-green text-sm font-medium">{t('contact.formSuccess')}</p>
              )}
              {contactStatus === 'error' && (
                <p className="text-red-600 text-sm font-medium">{t('contact.formError')}</p>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 text-white py-16 md:py-20 px-6 text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">🚀 {t('finalCta.heading')}</h2>
        <p className="text-lg md:text-xl mb-10 opacity-95">{t('finalCta.subheading')}</p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-2xl mx-auto">
          <button
            onClick={handleDownloadApp}
            className="w-full sm:w-auto bg-white text-orange-600 px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
          >
            📱 {t('finalCta.downloadCta')}
          </button>
          <button
            onClick={handleBecomeDriver}
            className="w-full sm:w-auto bg-transparent border-2 border-india-green text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-india-green hover:text-white transition-all duration-300"
          >
            👨‍💼 {t('finalCta.partnerCta')}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 dark:bg-black text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="text-2xl font-bold text-orange-400 mb-1">GaonConnect</div>
            <div className="text-gray-400 text-sm">gaon aur dehat ke liye transport app</div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 text-sm">
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
                <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('footer.home')}</button>
                <button onClick={() => scrollToSection('services')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('nav.services')}</button>
                <button onClick={() => scrollToSection('about')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('footer.about')}</button>
                <button onClick={() => scrollToSection('faqs')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('nav.faqs')}</button>
                <button onClick={() => scrollToSection('contact')} className="text-gray-400 hover:text-orange-400 transition-colors text-left">{t('footer.contact')}</button>
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
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-10 pt-6">
            <p className="text-center text-gray-400 text-sm mb-2">{t('footer.copyright')}</p>
            <p className="text-center text-gray-500 text-sm">{t('footer.tagline')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default GaonConnectLanding;
