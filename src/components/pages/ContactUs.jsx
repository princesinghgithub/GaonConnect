import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Phone, Mail, MapPin } from 'lucide-react';
import emailjs from '@emailjs/browser';
import Navbar from '../../GaonConnect/Navbar';
import Footer from '../../GaonConnect/Footer';
import { useAppDownload } from '../../context/AppDownloadContext';

const ContactUs = () => {
  const { t } = useTranslation();
  const formRef = useRef(null);
  const [status, setStatus] = useState('idle'); // idle | sending | success | error

  const { openAppDownload } = useAppDownload();
  const handleDownloadApp = openAppDownload;

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');

    const timeField = formRef.current.querySelector('[name="time"]');
    if (timeField) {
      timeField.value = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
    }

    emailjs
      .sendForm(
        import.meta.env.VITE_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
        formRef.current,
        { publicKey: import.meta.env.VITE_EMAILJS_PUBLIC_KEY }
      )
      .then(() => {
        setStatus('success');
        formRef.current.reset();
      })
      .catch((error) => {
        console.error('EmailJS send failed:', error);
        setStatus('error');
      });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar onDownloadApp={handleDownloadApp} />

      <section className="py-16 md:py-20 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 text-ink dark:text-white">
              {t('contactPage.heading')}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-10">
              {t('contactPage.subheading')}
            </p>

            <form ref={formRef} onSubmit={handleSubmit} className="space-y-5 max-w-md">
              <input type="hidden" name="title" value="New Contact Us Page Message" />
              <input type="hidden" name="time" />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('contactPage.nameLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder={t('contactPage.namePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('contactPage.emailLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder={t('contactPage.emailPlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('contactPage.mobileLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  required
                  pattern="[0-9]{10}"
                  placeholder={t('contactPage.mobilePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('contactPage.userTypeLabel')} <span className="text-red-500">*</span>
                </label>
                <select
                  name="userType"
                  required
                  defaultValue=""
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-saffron"
                >
                  <option value="" disabled>{t('contactPage.selectOption')}</option>
                  <option value="customer">{t('contactPage.customerOption')}</option>
                  <option value="driver">{t('contactPage.driverOption')}</option>
                  <option value="other">{t('contactPage.otherOption')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  {t('contactPage.messageLabel')}
                </label>
                <textarea
                  name="message"
                  rows={4}
                  placeholder={t('contactPage.messagePlaceholder')}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-saffron"
                />
              </div>

              <button
                type="submit"
                disabled={status === 'sending'}
                className="w-full bg-saffron hover:bg-cta disabled:opacity-60 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                {status === 'sending' ? t('contactPage.sendingBtn') : t('contactPage.submitBtn')}
              </button>
              {status === 'success' && (
                <p className="text-india-green text-sm font-medium">{t('contactPage.successMsg')}</p>
              )}
              {status === 'error' && (
                <p className="text-red-600 text-sm font-medium">{t('contactPage.errorMsg')}</p>
              )}
            </form>
          </div>

          <div className="bg-orange-50 dark:bg-gray-900 rounded-3xl p-8 md:p-10 space-y-8">
            <div>
              <h3 className="font-semibold text-ink dark:text-white mb-2">{t('contactPage.officeTitle')}</h3>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                {t('contactPage.officeValue')}
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-saffron dark:text-orange-400 shadow">
                <Phone size={20} />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('contactPage.phoneLabel')}</div>
                <a href="tel:+916260132613" className="font-medium text-navy dark:text-blue-300 hover:underline">+91 62601 32613</a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-saffron dark:text-orange-400 shadow">
                <Mail size={20} />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('contactPage.emailLabel2')}</div>
                <a href="mailto:gaonconnect.in@gmail.com" className="font-medium text-navy dark:text-blue-300 hover:underline">gaonconnect.in@gmail.com</a>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-saffron dark:text-orange-400 shadow">
                <MapPin size={20} />
              </div>
              <div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{t('contactPage.serviceAreaLabel')}</div>
                <div className="font-medium text-ink dark:text-white">{t('contactPage.serviceAreaValue')}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default ContactUs;
