import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import hi from './locales/hi.json';

const savedLang = localStorage.getItem('gc_lang') || 'hi';

// index.html ships a static lang="en" while the app defaults to Hindi, so
// crawlers and screen readers were told the wrong language on every page.
// Keep <html lang> and og:locale pointed at whatever is actually rendered.
const applyDocumentLanguage = (lng) => {
  document.documentElement.lang = lng;
  const ogLocale = document.querySelector('meta[property="og:locale"]');
  if (ogLocale) ogLocale.setAttribute('content', lng === 'en' ? 'en_IN' : 'hi_IN');
};

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: savedLang,
  fallbackLng: 'hi',
  interpolation: { escapeValue: false },
});

applyDocumentLanguage(savedLang);

i18n.on('languageChanged', (lng) => {
  localStorage.setItem('gc_lang', lng);
  applyDocumentLanguage(lng);
});

export default i18n;
