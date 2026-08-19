import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Clock, Users, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import Navbar from '../../GaonConnect/Navbar';
import Footer from '../../GaonConnect/Footer';
import { useAppDownload } from '../../context/AppDownloadContext';

const whyWorkIcons = [TrendingUp, Clock, Users];
// .webp versions of the same shots (already used by src/constants/blogPosts.js)
// — the .png originals are ~1.6 MB combined against ~141 KB here, which matters
// on the rural connections most of our users are on.
const galleryImages = ['/gaonconnect1.webp', '/gaonconnect2.webp', '/gaonconenct3.webp'];
const avatarColors = ['bg-saffron', 'bg-india-green', 'bg-amber-600'];

const Careers = () => {
  const { t } = useTranslation();
  const [testimonialIndex, setTestimonialIndex] = useState(0);

  const whyWork = t('careersPage.whyWork', { returnObjects: true }).map((item, i) => ({
    ...item,
    icon: whyWorkIcons[i],
  }));
  const testimonials = t('careersPage.testimonials', { returnObjects: true });
  const departments = t('careersPage.departments', { returnObjects: true });

  const visibleTestimonials = [
    testimonials[testimonialIndex % testimonials.length],
    testimonials[(testimonialIndex + 1) % testimonials.length],
  ];

  const { openAppDownload } = useAppDownload();
  const handleDownloadApp = openAppDownload;

  const nextTestimonial = () => setTestimonialIndex((i) => (i + 1) % testimonials.length);
  const prevTestimonial = () => setTestimonialIndex((i) => (i - 1 + testimonials.length) % testimonials.length);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar onDownloadApp={handleDownloadApp} />

      <section className="relative overflow-hidden py-16 md:py-24 px-6">
        <div aria-hidden className="hidden md:block absolute -left-24 top-0 bottom-0 w-72 bg-amber-400/20 dark:bg-amber-500/10 rounded-full blur-3xl" />
        <div aria-hidden className="hidden lg:block absolute -right-10 -top-10 w-72 h-72 bg-orange-300/30 dark:bg-orange-500/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-ink dark:text-white mb-5 leading-tight">
              {t('careersPage.heroTitle')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8 max-w-lg">
              {t('careersPage.heroSubtitle')}
            </p>
            <a
              href="#open-positions"
              className="inline-flex bg-india-green hover:bg-green-800 text-white px-7 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              {t('careersPage.openPositionsCta')}
            </a>
          </div>

          <div className="relative h-72 sm:h-80 md:h-96 max-w-md w-full mx-auto lg:mx-0 lg:ml-auto">
            <img
              src="/gaonconnect-icon.png"
              alt="GaonConnect"
              className="absolute left-0 top-0 w-24 h-24 object-contain bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-3 z-20"
            />
            <img
              src={galleryImages[0]}
              alt=""
              className="absolute left-6 top-14 w-44 sm:w-52 h-44 sm:h-52 object-cover rounded-3xl shadow-xl z-10"
            />
            <img
              src={galleryImages[2]}
              alt=""
              className="absolute right-0 bottom-0 w-52 sm:w-64 h-56 sm:h-72 object-cover rounded-3xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-ink dark:text-white mb-2">
            {t('careersPage.whyWorkHeading')}
          </h2>
          <div className="w-14 h-1 bg-amber-500 rounded-full mb-10" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-14">
            {whyWork.map(({ icon: Icon, title, description }) => (
              <div key={title}>
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-gray-800 shadow flex items-center justify-center text-india-green dark:text-green-400 mb-4">
                  <Icon size={22} />
                </div>
                <h3 className="font-semibold text-ink dark:text-white mb-1.5">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {galleryImages.map((src) => (
              <img
                key={src}
                src={src}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-48 object-cover rounded-2xl shadow-md"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 md:py-20 px-6 bg-india-green dark:bg-green-950">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-3xl font-bold text-white mb-10">
            {t('careersPage.testimonialsHeading')}
          </h2>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={prevTestimonial}
              aria-label="Previous testimonial"
              className="hidden sm:flex w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors shrink-0"
            >
              <ChevronLeft size={20} />
            </button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
              {visibleTestimonials.map((item, i) => (
                <div
                  key={`${testimonialIndex}-${i}`}
                  className="bg-white dark:bg-gray-900 rounded-2xl p-6 text-left shadow-lg"
                >
                  <p className="text-ink dark:text-gray-200 mb-4 leading-relaxed">"{item.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${avatarColors[(testimonialIndex + i) % avatarColors.length]} text-white flex items-center justify-center font-semibold text-sm shrink-0`}
                    >
                      {item.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-semibold text-ink dark:text-white text-sm">{item.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={nextTestimonial}
              aria-label="Next testimonial"
              className="hidden sm:flex w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white items-center justify-center transition-colors shrink-0"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIndex(i)}
                aria-label={`Go to testimonial ${i + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${i === testimonialIndex ? 'bg-amber-400' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      </section>

      <section id="open-positions" className="py-16 md:py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-4 text-ink dark:text-white">
            {t('careersPage.teamsHeading')}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto">
            {t('careersPage.teamsSubheading')}
          </p>

          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {departments.map((dept) => (
              <span
                key={dept}
                className="px-5 py-2 rounded-full bg-orange-50 dark:bg-gray-800 border border-orange-200 dark:border-gray-700 text-sm font-medium text-ink dark:text-white shadow-sm"
              >
                {dept}
              </span>
            ))}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 md:p-10 text-center border border-gray-100 dark:border-gray-700">
            <Mail className="mx-auto mb-4 text-saffron dark:text-orange-400" size={32} />
            <h3 className="text-xl font-semibold mb-2 text-ink dark:text-white">{t('careersPage.resumeHeading')}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('careersPage.resumeText')}
            </p>
            <a
              href="mailto:gaonconnect.in@gmail.com?subject=Career%20Interest%20-%20GaonConnect"
              className="inline-flex bg-saffron hover:bg-cta text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              {t('careersPage.resumeCta')}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Careers;
