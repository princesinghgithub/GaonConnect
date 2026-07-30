import React from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '../../GaonConnect/Navbar';
import Footer from '../../GaonConnect/Footer';
import NotFound from './NotFound';
import blogPosts, { getBlogPostBySlug } from '../../constants/blogPosts';
import { trackEvent } from '../../utils/analytics';
import { openUserApp } from '../../utils/appDownload';

const BlogPost = () => {
  const { slug } = useParams();
  const post = getBlogPostBySlug(slug);

  const handleDownloadApp = openUserApp;

  if (!post) return <NotFound />;

  const relatedPosts = blogPosts.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 transition-colors duration-300">
      <Navbar onDownloadApp={handleDownloadApp} />

      <section className="relative bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-700 dark:to-orange-800 text-white overflow-hidden">
        <div className="relative z-10 max-w-3xl mx-auto px-6 py-14 md:py-20">
          <nav className="text-sm opacity-90 mb-6" aria-label="Breadcrumb">
            <Link to="/" className="hover:underline">Home</Link>
            <span className="mx-2">/</span>
            <Link to="/blog" className="hover:underline">Blog</Link>
            <span className="mx-2">/</span>
            <span className="opacity-80">{post.title}</span>
          </nav>
          <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-white/20 mb-4">
            {post.tag}
          </span>
          <h1 className="text-2xl md:text-4xl font-bold mb-4 leading-snug">{post.title}</h1>
          <p className="text-sm opacity-90">
            {post.author} &middot;{' '}
            {new Date(post.publishDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' '}&middot; {post.readTime}
          </p>
        </div>
      </section>

      <article className="py-14 md:py-16 px-6">
        <div className="max-w-3xl mx-auto">
          <img
            src={post.image}
            alt={post.title}
            className="w-full h-64 md:h-80 object-cover rounded-2xl shadow-md mb-10"
            loading="lazy"
          />

          {post.sections.map((section) => (
            <div key={section.heading} className="mb-8">
              <h2 className="text-xl md:text-2xl font-semibold text-ink dark:text-white mb-3">
                {section.heading}
              </h2>
              {section.paragraphs.map((para, i) => (
                <p key={i} className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  {para}
                </p>
              ))}
            </div>
          ))}

          <div className="mt-12 p-8 rounded-2xl bg-orange-50 dark:bg-gray-900 text-center">
            <h3 className="text-xl font-semibold text-ink dark:text-white mb-3">
              GaonConnect par abhi booking karein
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Auto, bike, car, tractor, JCB, tempo, thresher, harvester — jo bhi zarurat ho, ek hi app se book karein.
            </p>
            <a
              href="https://wa.me/916260132613"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackEvent('whatsapp_click', { source: 'blog_post_cta', post: post.slug })}
              className="inline-flex bg-saffron hover:bg-cta text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
            >
              💬 WhatsApp par Support Se Baat Karein
            </a>
          </div>
        </div>
      </article>

      {relatedPosts.length > 0 && (
        <section className="py-14 md:py-16 px-6 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-xl md:text-2xl font-bold text-ink dark:text-white mb-8">
              Aur Padhein
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((p) => (
                <Link
                  key={p.slug}
                  to={`/blog/${p.slug}`}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-md hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 overflow-hidden flex flex-col"
                >
                  <img src={p.image} alt={p.title} className="w-full h-40 object-cover" loading="lazy" />
                  <div className="p-5 flex flex-col flex-1">
                    <span className="inline-block w-fit text-xs font-semibold px-3 py-1 rounded-full bg-orange-100 dark:bg-gray-700 text-saffron dark:text-orange-400 mb-3">
                      {p.tag}
                    </span>
                    <h3 className="text-base font-semibold text-ink dark:text-white leading-snug">{p.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
};

export default BlogPost;
