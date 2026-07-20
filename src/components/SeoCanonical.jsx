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
    keywords:
      'gaon connect, gaonconnect, rural transport app, rural ride booking, village transport india, gaon ki gaadi, kisan gadi booking, tractor booking india, JCB booking, auto booking village, bike taxi rural, car booking rural india, tempo booking, thresher booking, harvester booking, jutai ke liye tractor, shaadi ki gadi booking, dehat transport, rural cab booking, gaon mein gaadi, MP rural transport, Rewa transport, Satna transport, Jabalpur rural transport, Bhopal rural gaadi, Indore rural transport, village cab service, kisan vehicle booking, har jagah gaadi booking',
  },
  '/auth': {
    title: 'Login / Register - GaonConnect',
    description: 'Login ya register karein GaonConnect par.',
    keywords: 'gaonconnect login, gaonconnect register, gaon connect signup, rural transport app account, driver partner login',
    noindex: true,
  },
  '/privacy-policy': {
    title: 'Privacy Policy - GaonConnect',
    description: 'GaonConnect ki privacy policy - aapka data kaise use aur protect hota hai.',
    keywords: 'gaonconnect privacy policy, gaon connect data protection, user data policy rural app, gaonconnect terms',
    breadcrumb: 'Privacy Policy',
  },
  '/account-deletion': {
    title: 'Account Deletion - GaonConnect',
    description: 'Apna GaonConnect account delete karne ka tarika.',
    keywords: 'delete gaonconnect account, gaon connect account deletion, remove my gaonconnect account, account deletion request',
    breadcrumb: 'Account Deletion',
  },
  '/data-deletion': {
    title: 'Data Deletion - GaonConnect',
    description: 'Apna GaonConnect data delete karne ka tarika.',
    keywords: 'delete gaonconnect data, gaon connect data deletion, user data removal request, gaonconnect data privacy',
    breadcrumb: 'Data Deletion',
  },
  '/safety': {
    title: 'Safety - GaonConnect',
    description: 'GaonConnect par har ride surakshit banane ke liye hum kya karte hain - driver verification, live tracking, emergency support.',
    keywords: 'gaonconnect safety, ride safety rural india, driver verification gaon connect, live tracking safety, emergency support transport app, safe travel village',
    breadcrumb: 'Safety',
  },
  '/careers': {
    title: 'Careers - Join GaonConnect Team',
    description: 'GaonConnect team ke saath judein - grameen Bharat ke liye transport ko aasan banane ke mission mein shamil ho.',
    keywords: 'gaonconnect careers, jobs at gaonconnect, rural tech startup jobs india, transport startup careers, gaon connect hiring, work at gaonconnect',
    breadcrumb: 'Careers',
  },
  '/blog': {
    title: 'Blog - GaonConnect',
    description: 'Safety tips, kisano ki kahaniyan, aur rural transport se judi har update - GaonConnect blog par.',
    keywords: 'gaonconnect blog, rural transport tips, kisan stories india, village transport news, rural india travel safety tips, gaon connect updates',
    breadcrumb: 'Blog',
  },
  '/press': {
    title: 'Press & Media - GaonConnect',
    description: 'GaonConnect ke baare mein jaankari, brand assets aur media inquiries ke liye.',
    keywords: 'gaonconnect press, gaon connect media kit, gaonconnect news, brand assets download, media inquiries rural transport startup',
    breadcrumb: 'Press & Media',
  },
  '/contact': {
    title: 'Contact Us - GaonConnect',
    description: 'GaonConnect team se sampark karein - apni query ya feedback bhejein.',
    keywords: 'contact gaonconnect, gaonconnect support, gaonconnect helpline number, gaon connect customer care, gaonconnect whatsapp support',
    breadcrumb: 'Contact Us',
  },
};

const BREADCRUMB_SCRIPT_ID = 'breadcrumb-jsonld';

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
    if (meta.keywords) setMetaContent('meta[name="keywords"]', meta.keywords);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[property="og:title"]', meta.title);
    setMetaContent('meta[property="og:description"]', meta.description);
    setMetaContent('meta[name="twitter:title"]', meta.title);
    setMetaContent('meta[name="twitter:description"]', meta.description);
    setMetaContent('meta[name="robots"]', meta.noindex ? 'noindex, follow' : 'index, follow');

    // Breadcrumb rich results for every indexable page below the homepage.
    let breadcrumbScript = document.getElementById(BREADCRUMB_SCRIPT_ID);
    if (meta.breadcrumb) {
      if (!breadcrumbScript) {
        breadcrumbScript = document.createElement('script');
        breadcrumbScript.type = 'application/ld+json';
        breadcrumbScript.id = BREADCRUMB_SCRIPT_ID;
        document.head.appendChild(breadcrumbScript);
      }
      breadcrumbScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
          { '@type': 'ListItem', position: 2, name: meta.breadcrumb, item: canonicalUrl },
        ],
      });
    } else if (breadcrumbScript) {
      breadcrumbScript.remove();
    }
  }, [location.pathname]);

  return null;
};

export default SeoCanonical;
