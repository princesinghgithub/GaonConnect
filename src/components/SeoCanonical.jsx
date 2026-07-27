import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { getBlogPostBySlug } from '../constants/blogPosts';
import { getServicePageBySlug } from '../constants/servicePages';

const SITE_URL = 'https://www.gaonconnect.in';
const DEFAULT_IMAGE = `${SITE_URL}/gaonconnect.jpg`;

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
});

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
      'gaon connect, gaonconnect, rural transport app, rural ride booking, village transport india, gaon ki gaadi, kisan gadi booking, tractor booking india, JCB booking, auto booking village, bike taxi rural, car booking rural india, tempo booking, thresher booking, harvester booking, jutai ke liye tractor, shaadi ki gadi booking, dehat transport, rural cab booking, gaon mein gaadi, MP rural transport, Rewa transport, Satna transport, Jabalpur rural transport, Bhopal rural gaadi, Indore rural transport, village cab service, kisan vehicle booking, har jagah gaadi booking, Tractor Rental, JCB Rental, Farm Equipment Rental, Agriculture Machinery, Village Transport, Agriculture Logistics, Tractor on Rent, JCB on Rent, Farm Services, Agricultural Equipment, Tractor Near Me, JCB Near Me',
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
const BLOG_POSTING_SCRIPT_ID = 'blogposting-jsonld';
const SERVICE_SCHEMA_SCRIPT_ID = 'service-jsonld';
const BLOG_POST_PATH = /^\/blog\/([^/]+)$/;

// index.html ships one static <head> for every route (same canonical, title,
// and description), which made Google treat pages as duplicates of the
// homepage ("Alternative page with proper canonical tag") and leave others
// "Discovered - currently not indexed". Keep these in sync with the actual
// route on every navigation.
const SeoCanonical = () => {
  const location = useLocation();

  useEffect(() => {
    const pathname = location.pathname.replace(/\/+$/, '') || '/';
    const blogSlugMatch = pathname.match(BLOG_POST_PATH);
    const servicePage = !blogSlugMatch && !PAGE_META[pathname]
      ? getServicePageBySlug(pathname.replace(/^\//, ''))
      : null;
    let meta;
    if (blogSlugMatch) {
      const post = getBlogPostBySlug(blogSlugMatch[1]);
      meta = post ? buildBlogPostMeta(post) : NOT_FOUND_META;
    } else if (servicePage) {
      meta = buildServicePageMeta(servicePage);
    } else {
      meta = PAGE_META[pathname] || NOT_FOUND_META;
    }
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
    setMetaContent('meta[property="og:image"]', meta.image || DEFAULT_IMAGE);
    setMetaContent('meta[name="twitter:image"]', meta.image || DEFAULT_IMAGE);

    // Breadcrumb rich results for every indexable page below the homepage.
    // meta.breadcrumbItems (multi-level, e.g. blog posts) takes priority over
    // the older single-level meta.breadcrumb string.
    let breadcrumbScript = document.getElementById(BREADCRUMB_SCRIPT_ID);
    const trail = meta.breadcrumbItems || (meta.breadcrumb ? [{ name: meta.breadcrumb, path: pathname }] : null);
    if (trail) {
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
          ...trail.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 2,
            name: item.name,
            item: `${SITE_URL}${item.path}`,
          })),
        ],
      });
    } else if (breadcrumbScript) {
      breadcrumbScript.remove();
    }

    // BlogPosting rich results for individual blog articles only.
    let blogPostingScript = document.getElementById(BLOG_POSTING_SCRIPT_ID);
    if (blogSlugMatch && meta !== NOT_FOUND_META) {
      const post = getBlogPostBySlug(blogSlugMatch[1]);
      if (!blogPostingScript) {
        blogPostingScript = document.createElement('script');
        blogPostingScript.type = 'application/ld+json';
        blogPostingScript.id = BLOG_POSTING_SCRIPT_ID;
        document.head.appendChild(blogPostingScript);
      }
      blogPostingScript.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.metaDescription,
        image: `${SITE_URL}${post.image}`,
        datePublished: post.publishDate,
        author: { '@type': 'Organization', name: post.author },
        publisher: {
          '@type': 'Organization',
          name: 'GaonConnect',
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/gaonconnect-icon.png` },
        },
        mainEntityOfPage: canonicalUrl,
      });
    } else if (blogPostingScript) {
      blogPostingScript.remove();
    }

    // Service + FAQPage rich results for the standalone service landing pages.
    let serviceSchemaScript = document.getElementById(SERVICE_SCHEMA_SCRIPT_ID);
    if (servicePage) {
      if (!serviceSchemaScript) {
        serviceSchemaScript = document.createElement('script');
        serviceSchemaScript.type = 'application/ld+json';
        serviceSchemaScript.id = SERVICE_SCHEMA_SCRIPT_ID;
        document.head.appendChild(serviceSchemaScript);
      }
      serviceSchemaScript.textContent = JSON.stringify({
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
      });
    } else if (serviceSchemaScript) {
      serviceSchemaScript.remove();
    }
  }, [location.pathname]);

  return null;
};

export default SeoCanonical;
