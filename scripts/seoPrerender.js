// Build step: one static HTML file per public route.
//
// The site is a SPA, so every URL used to be served the same dist/index.html
// — the homepage's title, description, canonical and OG image. Google fixes
// that only after rendering JS (and its first pass sees "/" as canonical);
// WhatsApp/Facebook link previews and Bing never do, so a shared
// /tractor-booking link showed the homepage card. After the bundle is written
// this copies dist/index.html to dist/<route>/index.html with that route's
// <head> (from src/constants/seoMeta.js, the same data SeoCanonical.jsx uses
// in the browser) and the page's own text in the <noscript> block. React then
// boots on top exactly as before.
import fs from 'node:fs';
import path from 'node:path';
import blogPosts from '../src/constants/blogPosts.js';
import servicePages from '../src/constants/servicePages.js';
import { SITE_URL, DEFAULT_IMAGE, PAGE_META, resolvePageMeta, buildPageSchemas } from '../src/constants/seoMeta.js';

const esc = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

// Pages that only exist as a client-side <Navigate> (see App.jsx) are skipped:
// a static file there would be served instead of the redirect.
const liveServicePages = servicePages.filter((page) => !page.redirectTo);

export const prerenderRoutes = () => [
  ...Object.keys(PAGE_META).filter((route) => route !== '/' && !PAGE_META[route].noindex),
  ...liveServicePages.map((page) => `/${page.slug}`),
  ...blogPosts.map((post) => `/blog/${post.slug}`),
];

// Internal links on every prerendered page, so a crawler that doesn't run JS
// can still reach the other service pages from any of them.
const siteLinks = () => `
  <nav>
    <h2>GaonConnect Services</h2>
    <ul>
      ${liveServicePages.filter((page) => !page.paused).map((page) => `<li><a href="/${page.slug}">${esc(page.heroTitle)}</a></li>`).join('\n      ')}
    </ul>
    <p><a href="/">GaonConnect Home</a> · <a href="/blog">Blog</a> · <a href="/safety">Safety</a> · <a href="/contact">Contact</a></p>
    <p>WhatsApp Support: +91 62601 32613 · <a href="mailto:gaonconnect.in@gmail.com">gaonconnect.in@gmail.com</a></p>
  </nav>`;

const paragraphs = (list) => list.map((text) => `<p>${esc(text)}</p>`).join('\n');

const servicePageBody = (page) => {
  const relatedPost = blogPosts.find((post) => post.slug === page.relatedBlogSlug);
  return `
  <h1>${esc(page.heroTitle)}</h1>
  <p>${esc(page.heroSubtitle)}</p>
  ${paragraphs(page.intro)}
  <h2>GaonConnect ${esc(page.heroTitle)} Kyun</h2>
  <ul>
    ${page.benefits.map((b) => `<li><strong>${esc(b.title)}</strong> - ${esc(b.description)}</li>`).join('\n    ')}
  </ul>
  <h2>Aksar Puchhe Jaane Wale Sawal</h2>
  ${page.faqs.map((faq) => `<h3>${esc(faq.question)}</h3>\n  <p>${esc(faq.answer)}</p>`).join('\n  ')}
  ${relatedPost ? `<p>Padhein: <a href="/blog/${relatedPost.slug}">${esc(relatedPost.title)}</a></p>` : ''}`;
};

const blogPostBody = (post) => `
  <article>
    <h1>${esc(post.title)}</h1>
    <p>${esc(post.author)} · <time datetime="${esc(post.publishDate)}">${esc(post.publishDate)}</time> · ${esc(post.readTime)}</p>
    <p>${esc(post.excerpt)}</p>
    ${post.sections.map((s) => `<h2>${esc(s.heading)}</h2>\n    ${paragraphs(s.paragraphs)}`).join('\n    ')}
  </article>
  <p><a href="/blog">Saare blog posts</a></p>`;

const blogIndexBody = (meta) => `
  <h1>GaonConnect Blog</h1>
  <p>${esc(meta.description)}</p>
  <ul>
    ${blogPosts.map((post) => `<li><a href="/blog/${post.slug}">${esc(post.title)}</a> - ${esc(post.excerpt)}</li>`).join('\n    ')}
  </ul>`;

const pageBody = (page) => {
  if (page.servicePage) return servicePageBody(page.servicePage);
  if (page.post) return blogPostBody(page.post);
  if (page.pathname === '/blog') return blogIndexBody(page.meta);
  return `
  <h1>${esc(page.meta.breadcrumb || page.meta.title)}</h1>
  <p>${esc(page.meta.description)}</p>`;
};

// Swap one attribute value in the template, failing the build if the tag has
// gone missing — a silent miss would ship the homepage's value on that page.
const replaceOrThrow = (html, pattern, replacement, label) => {
  if (!pattern.test(html)) {
    throw new Error(`[seo-prerender] index.html mein ${label} nahi mila — template badla hai to scripts/seoPrerender.js bhi badlein`);
  }
  return html.replace(pattern, replacement);
};

const setMeta = (html, attr, key, value) => replaceOrThrow(
  html,
  new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`),
  (_, open, close) => `${open}${esc(value)}${close}`,
  `<meta ${attr}="${key}">`,
);

const renderPage = (template, route) => {
  const page = resolvePageMeta(route);
  const { meta } = page;
  const canonicalUrl = `${SITE_URL}${page.pathname}`;
  const image = meta.image || DEFAULT_IMAGE;

  let html = replaceOrThrow(template, /<title>[\s\S]*?<\/title>/, () => `<title>${esc(meta.title)}</title>`, '<title>');
  html = replaceOrThrow(
    html,
    /(<link\s+rel="canonical"\s+href=")[^"]*(")/,
    (_, open, close) => `${open}${esc(canonicalUrl)}${close}`,
    '<link rel="canonical">',
  );
  html = setMeta(html, 'name', 'description', meta.description);
  if (meta.keywords) html = setMeta(html, 'name', 'keywords', meta.keywords);
  html = setMeta(html, 'name', 'robots', meta.noindex ? 'noindex, follow' : 'index, follow');
  html = setMeta(html, 'property', 'og:url', canonicalUrl);
  html = setMeta(html, 'property', 'og:title', meta.title);
  html = setMeta(html, 'property', 'og:description', meta.description);
  html = setMeta(html, 'property', 'og:image', image);
  html = setMeta(html, 'property', 'og:image:alt', meta.title);
  html = setMeta(html, 'name', 'twitter:title', meta.title);
  html = setMeta(html, 'name', 'twitter:description', meta.description);
  html = setMeta(html, 'name', 'twitter:image', image);
  // The template's 1200x630 belongs to the default share image only.
  if (image !== DEFAULT_IMAGE) html = html.replace(/\s*<meta\s+property="og:image:(?:width|height)"[^>]*>/g, '');

  const schemaTags = Object.entries(buildPageSchemas(page))
    .filter(([, schema]) => schema)
    .map(([id, schema]) => `<script type="application/ld+json" id="${id}">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`)
    .join('\n    ');
  if (schemaTags) html = html.replace('</head>', `    ${schemaTags}\n  </head>`);

  return replaceOrThrow(
    html,
    /<noscript>[\s\S]*?<\/noscript>/,
    () => `<noscript>\n      <div style="font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px;">${pageBody(page)}\n${siteLinks()}\n      </div>\n    </noscript>`,
    '<noscript>',
  );
};

export const seoPrerender = () => {
  let outDir;
  return {
    name: 'gaonconnect-seo-prerender',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir);
    },
    closeBundle() {
      const template = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8');
      const routes = prerenderRoutes();
      routes.forEach((route) => {
        const file = path.join(outDir, route, 'index.html');
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, renderPage(template, route));
      });

      // sitemap.xml is maintained by hand; flag indexable routes it forgot.
      const sitemap = fs.readFileSync(path.join(outDir, 'sitemap.xml'), 'utf8');
      const missing = routes.filter((route) => !resolvePageMeta(route).meta.noindex
        && !sitemap.includes(`<loc>${SITE_URL}${route}</loc>`));
      if (missing.length) console.warn(`[seo-prerender] public/sitemap.xml mein nahi hain: ${missing.join(', ')}`);

      console.log(`[seo-prerender] ${routes.length} pages ka static HTML bana`);
    },
  };
};
