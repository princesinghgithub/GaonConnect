import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SITE_URL, DEFAULT_IMAGE, resolvePageMeta, buildPageSchemas } from '../constants/seoMeta';

// index.html ships one static <head> for every route (same canonical, title,
// and description), which made Google treat pages as duplicates of the
// homepage ("Alternative page with proper canonical tag") and leave others
// "Discovered - currently not indexed". Keep these in sync with the actual
// route on every navigation. The public routes also get these tags baked in
// at build time (vite.config.ts prerender) from the same src/constants/seoMeta.js.
const SeoCanonical = () => {
  const location = useLocation();

  useEffect(() => {
    const page = resolvePageMeta(location.pathname);
    const { meta } = page;
    const canonicalUrl = `${SITE_URL}${page.pathname}`;

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

    // Breadcrumb / BlogPosting / Service+FAQ JSON-LD: add, update or remove
    // each block so only the ones that belong to this route stay in <head>.
    Object.entries(buildPageSchemas(page)).forEach(([id, schema]) => {
      let script = document.getElementById(id);
      if (!schema) {
        if (script) script.remove();
        return;
      }
      if (!script) {
        script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = id;
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(schema);
    });
  }, [location.pathname]);

  return null;
};

export default SeoCanonical;
