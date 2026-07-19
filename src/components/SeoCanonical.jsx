import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const SITE_URL = 'https://www.gaonconnect.in';

const NOT_FOUND_META = {
  title: 'Page Not Found - GaonConnect',
  description: 'Ye page maujood nahi hai ya move ho gaya hai.',
  noindex: true,
};

// Known public routes only. Anything not listed here (dead links, typos,
// protected dashboards) falls back to NOT_FOUND_META and is kept out of the
// index, so unmapped URLs never carry the homepage's indexable meta tags.
const PAGE_META = {
  '/': {
    title: 'GaonConnect - Gaon Connect | Rural Transport App | Tractor Auto Car Booking',
    description:
      'GaonConnect - Madhya Pradesh ka rural transport app. Rewa, Mauganj, Satna, Maihar, Pithampur, Sidhi, Singrauli, Jabalpur, Katni, Shahdol, Sagar, Bhopal, Indore mein auto, bike, car, tractor, JCB, tempo, thresher, harvester booking. Jahan bhi zarurat ho, GaonConnect.',
  },
  '/auth': { title: 'Login / Register - GaonConnect', description: 'Login ya register karein GaonConnect par.', noindex: true },
  '/privacy-policy': { title: 'Privacy Policy - GaonConnect', description: 'GaonConnect ki privacy policy - aapka data kaise use aur protect hota hai.' },
  '/account-deletion': { title: 'Account Deletion - GaonConnect', description: 'Apna GaonConnect account delete karne ka tarika.' },
  '/data-deletion': { title: 'Data Deletion - GaonConnect', description: 'Apna GaonConnect data delete karne ka tarika.' },
  '/safety': { title: 'Safety - GaonConnect', description: 'GaonConnect par har ride surakshit banane ke liye hum kya karte hain - driver verification, live tracking, emergency support.' },
  '/careers': { title: 'Careers - Join GaonConnect Team', description: 'GaonConnect team ke saath judein - grameen Bharat ke liye transport ko aasan banane ke mission mein shamil ho.' },
  '/blog': { title: 'Blog - GaonConnect', description: 'Safety tips, kisano ki kahaniyan, aur rural transport se judi har update - GaonConnect blog par.' },
  '/press': { title: 'Press & Media - GaonConnect', description: 'GaonConnect ke baare mein jaankari, brand assets aur media inquiries ke liye.' },
  '/contact': { title: 'Contact Us - GaonConnect', description: 'GaonConnect team se sampark karein - apni query ya feedback bhejein.' },
};

// index.html ships one static <head> for every route (same canonical, title,
// and description), which made Google treat pages as duplicates of the
// homepage ("Alternative page with proper canonical tag") and leave others
// "Discovered - currently not indexed". Keep these in sync with the actual
// route on every navigation.
const SeoCanonical = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.replace(/\/+$/, '') || '/';
    const meta = PAGE_META[pathname] || NOT_FOUND_META;
    const canonicalUrl = `${SITE_URL}${pathname}`;

    document.title = meta.title;

    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    const setMetaContent = (selector, content) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', content);
    };

    setMetaContent('meta[name="description"]', meta.description);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[property="og:title"]', meta.title);
    setMetaContent('meta[property="og:description"]', meta.description);
    setMetaContent('meta[name="twitter:title"]', meta.title);
    setMetaContent('meta[name="twitter:description"]', meta.description);
    setMetaContent('meta[name="robots"]', meta.noindex ? 'noindex, follow' : 'index, follow');
  }, [location.pathname]);

  return null;
};

export default SeoCanonical;
