import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, ChevronDown, Phone, Mail, MapPin, CircleDot, Car, CheckCircle2, Flame, Loader2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import Navbar from './Navbar';
import Footer from './Footer';
import LocationSearchInput from '../tabs/LocationSearchInput';
import { locationAPI, rideAPI } from '../services/api';
import { HOURS_OPTIONS } from '../constants/tractorJcbServices';
import { trackEvent } from '../utils/analytics';
import { openDriverApp } from '../utils/appDownload';
import { useAppDownload } from '../context/AppDownloadContext';

// Same fare formula CustomerBooking.jsx uses once a real ride is booked —
// keeping the hero estimate consistent with what the app actually charges.
const FARE_FORMULAS = {
  bike: { base: 30, perKm: 8 },
  auto: { base: 50, perKm: 12 },
  car: { base: 80, perKm: 15 },
};

// Matches services.items order (en.json/hi.json): Auto, Bike, Car, Tractor,
// Wedding Car, Goods Transport, Tempo, JCB, Thresher, Harvester. Indexed
// instead of name-matched so it works regardless of active language.
const FARE_TYPE_BY_INDEX = ['auto', 'bike', 'car', null, null, null, null, null, null, null];

// Maps the same services list to the vehicle types BookRide.jsx actually
// supports post-login, so the hero selection can be carried forward.
const VEHICLE_TYPE_BY_INDEX = ['auto', 'bike', 'car', 'tractor', null, null, null, 'jcb', null, null];

const estimateFare = (serviceIndex, distanceKm) => {
  const type = FARE_TYPE_BY_INDEX[serviceIndex];
  if (!type || distanceKm == null) return null;
  const { base, perKm } = FARE_FORMULAS[type];
  return Math.round(base + perKm * distanceKm);
};

const SectionBadge = ({ children, inverted = false }) => (
  <span
    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide mb-4 ${
      inverted
        ? 'bg-white/10 text-white'
        : 'bg-india-green/10 dark:bg-green-400/10 text-india-green dark:text-green-400'
    }`}
  >
    {children}
  </span>
);

const GaonConnectLanding = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const [openFaq, setOpenFaq] = useState(null);
  const [heroServiceIndex, setHeroServiceIndex] = useState('');
  const [heroPickup, setHeroPickup] = useState(null);
  const [heroDrop, setHeroDrop] = useState(null);
  const [heroDistanceKm, setHeroDistanceKm] = useState(null);
  const [heroDistanceLoading, setHeroDistanceLoading] = useState(false);
  // Tractor/JCB need a service picked before they can auto-book too — see
  // handleServiceSelect below.
  const [heroCategory, setHeroCategory] = useState(null);
  const [heroSub, setHeroSub] = useState(null);
  const [heroHours, setHeroHours] = useState(2);
  const [heroServices, setHeroServices] = useState([]);
  const heroVehicleType = heroServiceIndex === '' ? null : VEHICLE_TYPE_BY_INDEX[Number(heroServiceIndex)];
  const heroIsTractorJcb = heroVehicleType === 'tractor' || heroVehicleType === 'jcb';
  const contactFormRef = useRef(null);
  const [contactStatus, setContactStatus] = useState('idle'); // idle | sending | success | error

  // Once both pickup and drop are picked, fetch the real route distance so
  // the service list below can show a live fare estimate, same as the app.
  useEffect(() => {
    if (!heroPickup || !heroDrop) {
      setHeroDistanceKm(null);
      return;
    }

    let cancelled = false;
    setHeroDistanceLoading(true);

    locationAPI
      .calculateDistance(heroPickup.location, heroDrop.location, 'car')
      .then((response) => {
        if (cancelled) return;
        const meters = response.data?.data?.distance?.value;
        setHeroDistanceKm(typeof meters === 'number' ? meters / 1000 : null);
      })
      .catch((error) => {
        console.error('Distance calculation error:', error);
        if (!cancelled) setHeroDistanceKm(null);
      })
      .finally(() => {
        if (!cancelled) setHeroDistanceLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [heroPickup, heroDrop]);

  // Default to the first category/sub whenever a Tractor/JCB service is
  // picked (or clear it when switching away) — the user can still change
  // the selection with the picker rendered below the service list. Rates
  // rate come from the backend (admin-editable), same as the app post-login.
  useEffect(() => {
    if (!heroIsTractorJcb) {
      setHeroServices([]);
      setHeroCategory(null);
      setHeroSub(null);
      return;
    }
    let cancelled = false;
    rideAPI.getServices(heroVehicleType)
      .then((res) => {
        if (cancelled) return;
        const svcs = res.data?.data || [];
        setHeroServices(svcs);
        setHeroCategory(svcs[0] || null);
        setHeroSub(svcs[0]?.sub?.[0] || null);
        setHeroHours(2);
      })
      .catch(() => {
        if (!cancelled) {
          setHeroServices([]);
          setHeroCategory(null);
          setHeroSub(null);
        }
      });
    return () => { cancelled = true; };
  }, [heroServiceIndex, heroIsTractorJcb, heroVehicleType]);

  // Service selection handler - already logged-in users go straight to
  // booking (Rapido-style, no redundant login screen); only signed-out
  // users get sent to /auth, and land on booking right after.
  const handleServiceSelect = (serviceName, basePrice, serviceIndex) => {
    const type = VEHICLE_TYPE_BY_INDEX[serviceIndex] ?? null;
    const isTJ = type === 'tractor' || type === 'jcb';
    trackEvent('service_selected', { service: serviceName, vehicle_type: type });
    sessionStorage.setItem('selectedService', JSON.stringify({
      service: serviceName,
      price: basePrice,
      vehicleType: type,
      pickup: heroPickup,
      drop: heroDrop,
      ...(isTJ ? {
        serviceCategory: heroCategory?.id,
        serviceType: heroSub?.id,
        estimatedHours: heroCategory?.pricingType === 'hourly' ? heroHours : 0,
      } : {}),
    }));
    navigate(localStorage.getItem('token') ? '/customer' : '/auth');
  };

  const { openAppDownload } = useAppDownload();
  const handleDownloadApp = openAppDownload;

  const handleBecomeDriver = () => {
    trackEvent('become_driver_click', { source: 'landing_page' });
    sessionStorage.setItem('registerAsDriver', 'true');
    navigate('/auth');
  };

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // When navigating here from another page (e.g. Navbar "About Us" while on /safety),
  // scroll to the requested section once the landing page has mounted.
  useEffect(() => {
    if (location.state?.scrollTo) {
      const id = location.state.scrollTo;
      const timer = setTimeout(() => scrollToSection(id), 100);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

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
  const stats = t('stats.items', { returnObjects: true });

  // FAQPage rich-result markup, kept in sync with the visible FAQ section
  // above so it matches Google's structured-data content requirements.
  useEffect(() => {
    const faqScript = document.createElement('script');
    faqScript.type = 'application/ld+json';
    faqScript.id = 'faq-jsonld';
    faqScript.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: t('faqs.items', { returnObjects: true }).map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
    document.head.appendChild(faqScript);
    return () => faqScript.remove();
  }, [i18n.language, t]);

  return (
    <div className="min-h-screen bg-white dark:bg-gradient-to-br dark:from-gray-950 dark:to-gray-900 transition-colors duration-300">
      <Navbar onDownloadApp={handleDownloadApp} scrollToSection={scrollToSection} />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-50 via-amber-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 md:py-24 grid grid-cols-1 lg:grid-cols-[0.85fr_1.3fr] gap-10 items-center">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-india-green/10 dark:bg-green-400/10 border border-india-green/30 dark:border-green-400/30 text-india-green dark:text-green-400 text-xs font-bold uppercase tracking-wide mb-4">
              <Car size={14} />
              {t('hero.overline')}
            </span>
            <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
              <span className="block text-ink dark:text-white">{t('hero.headlineLine1')}</span>
              <span className="block text-saffron dark:text-orange-400">{t('hero.headlineLine2')}</span>
            </h1>
            <p className="text-base md:text-lg text-gray-600 dark:text-gray-400 mb-8 max-w-xl leading-relaxed">
              {t('hero.description')}
            </p>

            <div className="max-w-md space-y-4">
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <MapPin size={18} className="text-saffron dark:text-orange-400 shrink-0" />
                <div className="flex-1">
                  <LocationSearchInput
                    placeholder={t('hero.pickupPlaceholder')}
                    onSelectLocation={(loc) => {
                      setHeroPickup(loc);
                      setHeroServiceIndex('');
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <CircleDot size={18} className="text-india-green dark:text-green-400 shrink-0" />
                <div className="flex-1">
                  <LocationSearchInput
                    placeholder={t('hero.dropPlaceholder')}
                    onSelectLocation={(loc) => {
                      setHeroDrop(loc);
                      setHeroServiceIndex('');
                    }}
                  />
                </div>
              </div>

              {heroPickup && heroDrop && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-2 max-h-64 overflow-y-auto">
                  <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {t('hero.servicePlaceholder')}
                  </div>
                  {heroDistanceLoading ? (
                    <div className="px-3 py-4 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Loader2 size={16} className="animate-spin" />
                      {t('hero.calculatingFare')}
                    </div>
                  ) : (
                    services.map((service, index) => {
                      const fare = estimateFare(index, heroDistanceKm);
                      const selected = heroServiceIndex === String(index);
                      return (
                        <button
                          key={service.name}
                          type="button"
                          onClick={() => setHeroServiceIndex(String(index))}
                          className={`w-full flex items-center justify-between gap-3 px-3 py-3 rounded-lg text-left transition-colors border ${
                            selected
                              ? 'bg-orange-50 dark:bg-gray-700 border-saffron dark:border-orange-400'
                              : 'border-transparent hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <span className="flex items-center gap-2 text-sm font-medium text-ink dark:text-white">
                            <span className="text-xl">{service.icon}</span> {service.name}
                          </span>
                          <span className="text-sm font-semibold text-india-green dark:text-green-400 shrink-0">
                            {fare ? `₹${fare}` : t('hero.quoteOnRequest')}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              )}

              {/* Tractor/JCB need a specific job picked before they can
                  auto-book too, same as Bike/Auto/Car — defaulting this
                  silently to "Ploughing" for someone who actually wanted
                  Spraying would book the wrong job. */}
              {heroIsTractorJcb && (
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm p-3 space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                      Kaam ka Prakar
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {heroServices.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => { setHeroCategory(cat); setHeroSub(cat.sub[0]); }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            heroCategory?.id === cat.id
                              ? 'bg-orange-50 dark:bg-gray-700 border-saffron dark:border-orange-400 text-ink dark:text-white'
                              : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {heroCategory && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Service
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {heroCategory.sub.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setHeroSub(sub)}
                            className={`text-left px-3 py-2 rounded-lg border text-xs transition ${
                              heroSub?.id === sub.id
                                ? 'border-saffron dark:border-orange-400 bg-orange-50 dark:bg-gray-700'
                                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <span className="block font-medium text-ink dark:text-white">{sub.label}</span>
                            <span className="text-india-green dark:text-green-400 font-semibold">
                              ₹{sub.rate}/{heroCategory.pricingType === 'hourly' ? 'hr' : 'km'}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {heroCategory?.pricingType === 'hourly' && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                        Kitne Ghante
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {HOURS_OPTIONS.map((h) => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHeroHours(h)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              heroHours === h
                                ? 'bg-saffron border-saffron text-white'
                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'
                            }`}
                          >
                            {h} {h === 1 ? 'Ghanta' : 'Ghante'}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="button"
                disabled={
                  !heroPickup || !heroDrop || heroServiceIndex === '' ||
                  (heroIsTractorJcb && (!heroCategory || !heroSub))
                }
                onClick={() => {
                  const fare = estimateFare(Number(heroServiceIndex), heroDistanceKm) ?? basePrices[heroServiceIndex];
                  handleServiceSelect(services[heroServiceIndex].name, fare, Number(heroServiceIndex));
                }}
                className="w-full bg-cta hover:bg-saffron disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-4 rounded-xl font-bold text-lg shadow-md hover:shadow-lg transition-all duration-300"
              >
                {t('hero.bookRideCta')}
              </button>
            </div>

            <button
              onClick={() => scrollToSection('how-it-works')}
              className="mt-5 text-sm font-semibold text-ink dark:text-white hover:text-saffron dark:hover:text-orange-400 transition-colors"
            >
              🎯 {t('hero.howItWorksCta')} →
            </button>
          </div>

          <div className="relative">
            <picture>
              <source srcSet="/gaonconnect_banner.webp" type="image/webp" />
              {/* .jpg fallback, not the 8 MB .png original: this is the LCP
                  image and width/height keep it from shifting the hero. */}
              <img
                src="/gaonconnect_banner.jpg"
                alt="GaonConnect - auto, bike aur car ek saath"
                width="1600"
                height="1108"
                className="relative rounded-[2rem] shadow-2xl w-full h-auto object-contain"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <span className="absolute top-4 left-16 sm:top-6 sm:left-20 inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-lg text-xs font-bold text-ink dark:text-white">
              <CheckCircle2 size={16} className="text-india-green dark:text-green-400 shrink-0" />
              {t('hero.badgeVerified')}
            </span>
            <span className="absolute bottom-20 right-4 sm:bottom-24 sm:right-6 inline-flex items-center gap-1.5 bg-white dark:bg-gray-800 px-3 py-2 rounded-full shadow-lg text-xs font-bold text-saffron dark:text-orange-400">
              <Flame size={16} className="shrink-0" />
              {t('hero.badgeFares')}
            </span>
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
      <section id="how-it-works" className="py-16 md:py-20 px-6 bg-india-green dark:bg-green-950">
        <div className="max-w-7xl mx-auto text-center">
          <SectionBadge inverted>{t('howItWorks.badge')}</SectionBadge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('howItWorks.heading')}
          </h2>
          <p className="text-green-100 mb-12 max-w-2xl mx-auto">
            {t('howItWorks.subheading')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div key={index} className="text-center">
                <div className="w-20 h-20 bg-cta text-white rounded-full flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-lg">
                  {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-3 text-white">{step.title}</h3>
                <p className="text-green-100 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 -mt-10 pb-4 relative z-10">
        <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 rounded-3xl shadow-xl px-6 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {stats.map((stat, index) => (
            <div key={index}>
              <div className="text-3xl md:text-4xl font-bold text-india-green dark:text-green-400 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-16 md:py-20 px-6 bg-gradient-to-b from-white to-orange-50 dark:from-gray-900 dark:to-gray-950">
        <div className="max-w-7xl mx-auto text-center">
          <SectionBadge>{t('services.badge')}</SectionBadge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-ink dark:text-white">
            {t('services.heading')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('services.subheading')}
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 text-left">
            {services.map((service, index) => (
              <div
                key={index}
                onClick={() => handleServiceSelect(service.name, basePrices[index], index)}
                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md hover:shadow-2xl transform hover:scale-105 transition-all duration-300 cursor-pointer group"
              >
                <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300">
                  {service.icon}
                </div>
                <h4 className="text-lg font-semibold mb-2 text-ink dark:text-white">{service.name}</h4>
                <div className="text-sm text-saffron dark:text-orange-400 font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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

          {/* Leadership */}
          <div className="mt-16">
            <h3 className="text-2xl md:text-3xl font-bold text-ink dark:text-white mb-2">{t('about.leadership')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{t('about.leadershipSub')}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {[
                {
                  img: '/gaonconnect_founder.jpg',
                  name: 'Prince Patel',
                  role: t('about.founderRole'),
                  bio: t('about.founderBio'),
                  imgPosition: 'object-center',
                },
                {
                  img: '/vipin.jpeg',
                  name: 'Vipin Patel',
                  role: t('about.cofounderRole'),
                  bio: t('about.cofounderBio'),
                  imgPosition: 'object-top',
                },
              ].map((person) => (
                <div
                  key={person.name}
                  className="bg-orange-50 dark:bg-gray-800 rounded-3xl shadow-sm p-8 md:p-10 flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left gap-6 transition-shadow duration-200 hover:shadow-lg"
                >
                  <img
                    src={person.img}
                    alt={`${person.name} - ${person.role}`}
                    loading="lazy"
                    decoding="async"
                    className={`w-32 h-32 md:w-36 md:h-36 shrink-0 rounded-2xl object-cover ${person.imgPosition} shadow-md ring-4 ring-white dark:ring-gray-700`}
                  />
                  <div>
                    <h4 className="text-xl md:text-2xl font-bold text-ink dark:text-white mb-1">{person.name}</h4>
                    <p className="text-saffron dark:text-orange-400 font-semibold mb-3">{person.role}</p>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm md:text-base">{person.bio}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="mt-10">
            <img
              src="/gaonconnect-team.jpg"
              alt="The GaonConnect team"
              loading="lazy"
              decoding="async"
              className="w-full rounded-3xl shadow-lg object-cover"
            />
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-3 text-center">
              The GaonConnect team — connecting villages, empowering rural India.
            </p>
          </div>

          {/* Milestones - kept in sync with the facts already published on /press */}
          <div className="mt-10 grid grid-cols-2 gap-6 max-w-md mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm text-center">
              <div className="text-2xl font-bold text-saffron dark:text-orange-400">2025</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Founded</div>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 shadow-sm text-center">
              <div className="text-2xl font-bold text-saffron dark:text-orange-400">20+</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Cities/Towns in MP</div>
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
      <section className="py-10 px-6">
        <div className="max-w-6xl mx-auto bg-gradient-to-br from-saffron to-cta rounded-3xl px-8 py-10 md:px-14 md:py-14 grid grid-cols-1 md:grid-cols-[1.3fr_auto] gap-8 items-center shadow-xl">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-2 text-white">
              {t('download.heading')}
            </h2>
            <p className="text-orange-50">{t('download.subheading')}</p>
            <p className="text-white/90 text-sm font-medium mt-2">{t('download.promo')}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleDownloadApp}
              className="relative flex items-center gap-3 bg-black hover:bg-gray-900 transition-colors rounded-xl px-5 py-3 text-left"
            >
              <img src="/gaonconnect-icon.png" alt="GaonConnect" className="h-10 w-10 shrink-0 rounded-lg" />
              <span>
                <span className="block text-white font-semibold text-sm">GaonConnect</span>
                <span className="block text-gray-300 text-xs">{t('download.customerTagline')}</span>
              </span>
            </button>

            <button
              onClick={openDriverApp}
              className="relative flex items-center gap-3 bg-black hover:bg-gray-900 transition-colors rounded-xl px-5 py-3 text-left"
            >
              <img src="/gaonconnect-icon.png" alt="GaonConnect Driver" className="h-10 w-10 shrink-0 rounded-lg" />
              <span>
                <span className="block text-white font-semibold text-sm">GaonConnect Driver</span>
                <span className="block text-gray-300 text-xs">{t('download.driverTagline')}</span>
              </span>
            </button>
          </div>
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
      <section id="reviews" className="py-16 md:py-20 px-6 bg-orange-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto text-center">
          <SectionBadge>{t('reviews.badge')}</SectionBadge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-ink dark:text-white">
            {t('reviews.heading')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto">
            {t('reviews.subheading')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            {reviews.map((review, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md">
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

      <Footer />
    </div>
  );
};

export default GaonConnectLanding;
