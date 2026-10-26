// Per-route <head> data, shared by two consumers:
//   - src/components/SeoCanonical.jsx updates the tags in the browser on
//     every client-side navigation;
//   - the prerender step in vite.config.ts bakes the same tags into a
//     separate dist/<route>/index.html at build time, so crawlers and link
//     previews (WhatsApp, Facebook, Bing) that don't run JS see the right
//     title, canonical and schema instead of the homepage's.
// Keep this file free of React/DOM imports — vite.config.ts loads it in Node.
import { getBlogPostBySlug } from './blogPosts';
import { getServicePageBySlug } from './servicePages';

export const SITE_URL = 'https://www.gaonconnect.in';
export const DEFAULT_IMAGE = `${SITE_URL}/gaonconnect.jpg`;

// /blog/:slug pages are data-driven (src/constants/blogPosts.js) rather than
// hardcoded in PAGE_META, so each post gets its own title/description/
// keywords/image and a BlogPosting schema without a PAGE_META entry per post.
const buildBlogPostMeta = (post) => ({
  title: `${post.title} - GaonConnect Blog`,
  description: post.metaDescription,
  keywords: post.keywords,
  image: `${SITE_URL}${post.image}`,
  breadcrumbItems: [
    { name: 'Blog', path: '/blog' },
    { name: post.title, path: `/blog/${post.slug}` },
  ],
});

// Standalone commercial-intent landing pages (src/constants/servicePages.js),
// e.g. /tractor-booking, /jcb-rental — separate from the /blog articles.
const buildServicePageMeta = (page) => ({
  title: page.title,
  description: page.metaDescription,
  keywords: page.keywords,
  image: `${SITE_URL}${page.image}`,
  breadcrumbItems: [{ name: page.heroTitle, path: `/${page.slug}` }],
  // Jo service filhaal band hai uska page live rehta hai (purane links aur
  // bookmarks 404 na ho jaayein) par search se hat jaata hai — warna Google
  // aisi cheez bechta rehta jo hum abhi de nahi rahe. Sitemap se bhi nikala
  // gaya hai. Wapas chaalu karne ke liye servicePages.js se paused hata dena.
  noindex: Boolean(page.paused),
});

export const NOT_FOUND_META = {
  title: 'Page Not Found - GaonConnect',
  description: 'Ye page maujood nahi hai ya move ho gaya hai.',
  noindex: true,
};

// Signed-in app screens. They are noindex like the 404 fallback, but they are
// real pages - without an entry here they fell through to NOT_FOUND_META and a
// logged-in customer's browser tab read "Page Not Found" while they were
// booking a ride.
// /track/:token — family ke liye share kiya safar; niji, index nahi
const RIDE_TRACKING_PATH = /^\/(ride|track)\/[^/]+$/;
const RIDE_TRACKING_META = {
  title: 'Ride Tracking - GaonConnect',
  description: 'Apni ride live track karein.',
  noindex: true,
};

// Known public routes only. Anything not listed here (dead links, typos,
// protected dashboards) falls back to NOT_FOUND_META and is kept out of the
// index, so unmapped URLs never carry the homepage's indexable meta tags.
export const PAGE_META = {
  '/': {
    // index.html ke <title>/description jaisa hi rakhna — pehli load par wo,
    // page badalne par ye lagta hai
    title: 'GaonConnect - Tractor, JCB, Bike, Auto, Car Online Booking | Gaon ki Gaadi',
    description:
      'Gaon aur dehat ke liye online booking - bike, auto, car, tempo, tractor, JCB, thresher, harvester aur khet ke auzaar (cultivator, rotavator). Website ya app se book karein, kiraya pehle dekhein, driver live track karein. Poore MP mein.',
    keywords:
      'gaon connect, gaonconnect, online tractor booking, online gaadi booking, tractor book online, JCB book online, rural transport app, rural ride booking, village transport india, gaon ki gaadi, kisan gadi booking, tractor booking india, JCB booking, auto booking village, car booking rural india, tempo booking, pickup booking, thresher booking, harvester booking, jutai ke liye tractor, dehat transport, rural cab booking, gaon mein gaadi, MP rural transport, Rewa transport, Satna transport, Jabalpur rural transport, Bhopal rural gaadi, Indore rural transport, village cab service, kisan vehicle booking, har jagah gaadi booking, Tractor Rental, JCB Rental, Farm Equipment Rental, Agriculture Machinery, Village Transport, Agriculture Logistics, Tractor on Rent, JCB on Rent, Farm Services, Agricultural Equipment, Tractor Near Me, JCB Near Me',
  },
  '/auth': {
    title: 'Login - GaonConnect',
    description: 'Mobile number aur OTP se GaonConnect par login karein — naya number ho to account apne aap ban jaata hai.',
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
  '/customer': {
    title: 'Gaadi Book Karein - GaonConnect',
    description: 'Apni gaadi book karein - pickup aur drop chunkar.',
    noindex: true,
  },
  '/book-ride': {
    title: 'Book a Ride - GaonConnect',
    description: 'Apni gaadi book karein - pickup aur drop chunkar.',
    noindex: true,
  },
  '/driver': {
    title: 'Driver Dashboard - GaonConnect',
    description: 'GaonConnect driver partner dashboard.',
    noindex: true,
  },
};

const BLOG_POST_PATH = /^\/blog\/([^/]+)$/;

export const normalizePath = (pathname) => pathname.replace(/\/+$/, '') || '/';

// Which page a path is and the meta it carries. `post` / `servicePage` are set
// for the data-driven routes so callers can build their schema.
export const resolvePageMeta = (rawPathname) => {
  const pathname = normalizePath(rawPathname);
  const blogSlugMatch = pathname.match(BLOG_POST_PATH);
  if (blogSlugMatch) {
    const post = getBlogPostBySlug(blogSlugMatch[1]);
    return post
      ? { pathname, meta: buildBlogPostMeta(post), post }
      : { pathname, meta: NOT_FOUND_META };
  }
  if (PAGE_META[pathname]) return { pathname, meta: PAGE_META[pathname] };
  const servicePage = getServicePageBySlug(pathname.replace(/^\//, ''));
  if (servicePage) return { pathname, meta: buildServicePageMeta(servicePage), servicePage };
  if (RIDE_TRACKING_PATH.test(pathname)) return { pathname, meta: RIDE_TRACKING_META };
  return { pathname, meta: NOT_FOUND_META };
};

export const BREADCRUMB_SCRIPT_ID = 'breadcrumb-jsonld';
export const BLOG_POSTING_SCRIPT_ID = 'blogposting-jsonld';
export const SERVICE_SCHEMA_SCRIPT_ID = 'service-jsonld';

// JSON-LD blocks for a resolved page, keyed by the <script> id they live in.
// A null value means that block should not be on this page.
export const buildPageSchemas = ({ pathname, meta, post, servicePage }) => {
  const canonicalUrl = `${SITE_URL}${pathname}`;

  // Breadcrumb rich results for every indexable page below the homepage.
  // meta.breadcrumbItems (multi-level, e.g. blog posts) takes priority over
  // the older single-level meta.breadcrumb string.
  const trail = meta.breadcrumbItems || (meta.breadcrumb ? [{ name: meta.breadcrumb, path: pathname }] : null);
  const breadcrumb = trail && {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: `${SITE_URL}/` },
      ...trail.map((item, i) => ({
        '@type': 'ListItem',
        position: i + 2,
        name: item.name,
        item: `${SITE_URL}${item.path}`,
      })),
    ],
  };

  // BlogPosting rich results for individual blog articles only.
  const blogPosting = post && {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.metaDescription,
    image: `${SITE_URL}${post.image}`,
    datePublished: post.publishDate,
    inLanguage: 'hi-IN',
    author: { '@type': 'Organization', name: post.author, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: 'GaonConnect',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/gaonconnect-icon.png` },
    },
    mainEntityOfPage: canonicalUrl,
  };

  // Service + FAQPage rich results for the standalone service landing pages.
  const service = servicePage && {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        serviceType: servicePage.heroTitle,
        name: servicePage.heroTitle,
        description: servicePage.metaDescription,
        provider: { '@type': 'Organization', name: 'GaonConnect', url: SITE_URL },
        areaServed: { '@type': 'State', name: 'Madhya Pradesh' },
        url: canonicalUrl,
      },
      {
        '@type': 'FAQPage',
        mainEntity: servicePage.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: { '@type': 'Answer', text: faq.answer },
        })),
      },
    ],
  };

  return {
    [BREADCRUMB_SCRIPT_ID]: breadcrumb || null,
    [BLOG_POSTING_SCRIPT_ID]: blogPosting || null,
    [SERVICE_SCHEMA_SCRIPT_ID]: service || null,
  };
};
